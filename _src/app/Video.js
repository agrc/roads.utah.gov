define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-construct',
    'dojo/text!app/templates/Video.html',
    'dojo/topic',
    'dojo/_base/declare',

    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    domConstruct,
    template,
    topic,
    declare,

    Query,
    QueryTask
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      display a youtube video for a road (segment)
        templateString: template,
        baseClass: 'video',

        // Properties to be sent into constructor

        // attributes: Object
        //      attributes from log record including:
        //      RD_ID, GPX_Name, Youtube_URL
        attributes: null,

        postCreate() {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.Video::postCreate', arguments);

            const videoRoutesTask = new QueryTask(config.urls.videoRoutes);
            const query = new Query();
            query.outFields = ['*'];
            query.returnGeometry = true;
            const field = config.fields.videos.GPX_Name;
            query.where = `${field} = '${this.attributes[field]}'`;

            videoRoutesTask.execute(query).then((response) => {
                if (response.features.length > 0) {
                    this.initVideo();
                    this.pointsLookup = this.parsePoints(response.features);
                }
            }, () => {
                window.alert('There was an error getting the video points!');
            });

            window.addEventListener('unload', () => {
                if (this.popupWindow) {
                    this.popupWindow.close();
                }
            });

            this.inherited(arguments);
        },
        parsePoints(points) {
            // summary:
            //      parse point datetimes, into seconds and put into lookup object
            // points: Graphic[]
            console.log('app.Video:parsePoints', arguments);

            const lookup = {};
            let start;
            points.forEach(point => {
                const date = new Date(point.attributes[config.fields.videos.DateTimeS]);
                const seconds = Math.round(date.getTime() / 1000);
                if (start) {
                    lookup[seconds - start] = point.geometry;
                } else {
                    start = seconds;
                    this.dateSpan.innerHTML = date.toDateString();
                    lookup[0] = point.geometry;
                }
            });

            return lookup;
        },
        initVideo() {
            // summary:
            //      sets up the youtube video
            console.log('app.Video:initVideo', arguments);

            this.player = new YT.Player(this.playerDiv, {
                height: '200',
                width: '100%',
                videoId: this.getIDFromUrl(this.attributes[config.fields.videos.Youtube_URL]),
                events: {
                    onStateChange: this.onPlayerStateChange.bind(this)
                }
            });
        },
        onPlayerStateChange(event) {
            // summary:
            //      fires when the player is started or stopped amoung other events
            // event: Event Object (data property holds reference to state)
            console.log('app.Video:onPlayerStateChange', arguments);

            if (this.intervalId) {
                window.clearInterval(this.intervalId);
            }

            if (event.data === YT.PlayerState.PLAYING) {
                const player = event.target;
                this.intervalId = window.setInterval(() => {
                    const position = this.pointsLookup[Math.round(player.getCurrentTime())];
                    if (position) {
                        topic.publish(config.topics.updateVideoPosition, position);
                    }
                }, 1000);
            }
        },
        getIDFromUrl(url) {
            // summary:
            //      gets the video id from the youtube url
            // url: String
            console.log('app.Video:getIDFromURL', arguments);

            if (url.indexOf('=') > 0) {
                return url.split('=').pop();
            }

            return url.split('/').pop();
        },
        popout() {
            // summary:
            //      pops out the video into a separate window
            console.log('app.Video:popout', arguments);

            this.player.pauseVideo();

            this.popupWindow = window.open('', 'roadsVideo', 'width=640,height=390,location=0');
            this.popupWindow.document.body.style.margin = 0;
            this.popupWindow.addEventListener('unload', () => {
                window.clearInterval(this.intervalId);
            });

            const id = this.getIDFromUrl(this.attributes[config.fields.videos.Youtube_URL]);
            const iframe = domConstruct.create('iframe', {
                width: 640,
                height: 390,
                frameborder: 0,
                src: `https://www.youtube.com/embed/${id}?enablejsapi=1`
            }, this.popupWindow.document.body);

            /* eslint-disable no-new */
            new YT.Player(iframe, {
                events: {
                    onStateChange: this.onPlayerStateChange.bind(this),
                    onReady: (event) => {
                        event.target.seekTo(this.player.getCurrentTime(), true);
                    }
                }
            });
            /* eslint-enable no-new */

            // need to wait a bit for the window to finish laying out
            // otherwise the iframe has 0 height
            window.setTimeout(() => {
                iframe.width = '100%';
                iframe.height = '100%';
            }, 500);
        }
    });
});
