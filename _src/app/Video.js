define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/text!app/templates/Video.html',
    'dojo/topic',
    'dojo/_base/declare',

    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

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

            if (event.data === YT.PlayerState.PLAYING) {
                this.intervalId = window.setInterval(() => {
                    const position = this.pointsLookup[Math.round(this.player.getCurrentTime())];
                    if (position) {
                        topic.publish(config.topics.updateVideoPosition, position);
                        console.debug(Math.round(this.player.getCurrentTime()));
                        console.debug('position', position);
                    }
                }, 500);
            } else {
                window.clearInterval(this.intervalId);
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
        }
    });
});

//
        // popupVideo() {
        //     this.popupWindow = window.open(null, 'roadsVideo', 'width=600,height=350,location=0');
        //
        //     this.popupWindow.document.addEventListener('DOMContentLoaded', () => {
        //         console.log('POPUP: dom loaded');
        //     });
        //
        //     /* eslint-disable no-use-before-define */
        //     var playerDiv = domConstruct.create('div', {
        //         innerHTML: 'test'
        //     }, this.popupWindow.document.body);
        //     var player = new YT.Player(playerDiv, {
        //         height: '200',
        //         width: '300',
        //         videoId: 'bYIEzemMsIQ',
        //         events: {
        //             onReady: onPlayerReady
        //         }
        //     });
        //
        //     const positions = {};
        //
        //     const onPlayerReady = function () {
        //         console.log('ready');
        //         player.playVideo();
        //
        //         window.setInterval(() => {
        //             const pos = positions[Math.round(player.getCurrentTime())];
        //             if (pos) {
        //                 console.log(pos);
        //                 // var newGraphic = graphic.clone();
        //                 // newGraphic.set('geometry', new Point({
        //                 //     longitude: pos.long,
        //                 //     latitude: pos.lat
        //                 // }));
        //                 // view.graphics.remove(graphic);
        //                 // view.graphics.add(newGraphic);
        //                 // graphic = newGraphic;
        //                 // view.goTo({
        //                 //     target: graphic,
        //                 //     scale: 5000
        //                 // });
        //                 // console.log(graphic);
        //             }
        //         }, 1000);
        //     };
        //
        //     window.setTimeout(onPlayerReady, 2000);
        //
        //     console.log('POPUP: window created');
        // },
