/* eslint-disable camelcase */
require([
    'app/Video',

    'dojo/dom-construct'
], function (
    WidgetUnderTest,

    domConstruct
) {
    describe('app/Video', function () {
        window.alert = () => {};
        var widget;
        var destroy = function (destroyWidget) {
            destroyWidget.destroyRecursive();
            destroyWidget = null;
        };

        beforeEach(function () {
            widget = new WidgetUnderTest({
                attributes: {
                    GPX_Name: 'RD090050',
                    Youtube_URL: 'https://youtu.be/4VLg3nhoOBY'
                }
            }, domConstruct.create('div', null, document.body));
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a Video', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });

        describe('getIDFromUrl', function () {
            it('handles both types of URLs', function () {
                expect(widget.getIDFromUrl('https://youtu.be/4VLg3nhoOBY')).toEqual('4VLg3nhoOBY');
                expect(widget.getIDFromUrl('https://www.youtube.com/watch?v=FpZG97zHsX4')).toEqual('FpZG97zHsX4');
            });
        });

        describe('parsePoints', function () {
            it('calculates the duration seconds from the datetime', function () {
                const points = [{
                    attributes: {
                        DateTimeS: '2016-09-17T21:42:28.999Z'
                    },
                    geometry: 1
                }, {
                    attributes: {
                        DateTimeS: '2016-09-17T21:42:38.999Z'
                    },
                    geometry: 2
                }, {
                    attributes: {
                        DateTimeS: '2016-09-17T21:42:41.999Z'
                    },
                    geometry: 3
                }, {
                    attributes: {
                        DateTimeS: '2016-09-17T21:43:41.999Z'
                    },
                    geometry: 4
                }];
                const lookup = widget.parsePoints(points);

                expect(lookup[0]).toEqual(1);
                expect(lookup[10]).toEqual(2);
                expect(lookup[13]).toEqual(3);
                expect(lookup[73]).toEqual(4);
            });
        });
    });
});
