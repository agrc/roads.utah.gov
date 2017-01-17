define([
    'agrc/widgets/map/BaseMap',

    'app/config',
    'app/CountyZoomer',
    'app/Identify',
    'app/RoadsToc',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/dom',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/text!app/templates/App.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/dijit/Legend',
    'esri/geometry/Extent',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/layers/ImageParameters',
    'esri/layers/VectorTileLayer',
    'esri/layers/WebTiledLayer',

    'ijit/widgets/authentication/LoginRegister',
    'ijit/widgets/layout/PaneStack',
    'ijit/widgets/layout/SideBarToggler',

    'layer-selector/LayerSelector',

    'sherlock/providers/MapService',
    'sherlock/providers/WebAPI',
    'sherlock/Sherlock',

    'dojo/domReady!'
], function (
    BaseMap,

    config,
    CountyZoomer,
    Identify,
    RoadsToc,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    dom,
    domConstruct,
    domStyle,
    template,
    topic,
    declare,
    lang,

    Legend,
    Extent,
    ArcGISDynamicMapServiceLayer,
    ArcGISTiledMapServiceLayer,
    ImageParameters,
    VectorTileLayer,
    WebTiledLayer,

    LoginRegister,
    PaneStack,
    SideBarToggler,

    LayerSelector,

    MapService,
    WebAPI,
    Sherlock
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        baseClass: 'app',
        widgetsInTemplate: true,
        templateString: template,

        // identify: plpco.Identify
        identify: null,

        // map: agrc.widgets.map.Basemap
        map: null,

        // roadsToc: plpco.RoadsToc
        roadsToc: null,

        // sherlocks: plpco.MagicZoom[]
        sherlocks: [],

        // overlaysLyr: ArcGISDynamicMapServiceLayer
        overlaysLyr: null,

        // backgroundLyrsLyr: ArcGISDynamicMapServiceLayer
        backgroundLyrsLyr: null,

        // leg: esri.dijit.Legend
        leg: null,

        postCreate: function () {
            // summary:
            //      description
            console.log('app/App:postCreate', arguments);

            // global reference
            config.app = this;

            this.version.innerHTML = config.version;

            var paneStack = new PaneStack(null, 'pane-stack');
            paneStack.startup();

            this.initMap();

            var sb = new SideBarToggler({
                sidebar: this.sideBar,
                map: this.map,
                centerContainer: this.centerContainer
            }, this.sidebarToggle);
            sb.startup();

            this.login = new LoginRegister({
                appName: config.appName,
                logoutDiv: this.logoutDiv,
                showOnLoad: false,
                securedServicesBaseUrl: config.urls.localBase
            });
            this.login.startup();
            this.own(this.login);
            this.login.on('remember-me-unsuccessful', lang.hitch(this, 'initLayerSelector'));

            topic.subscribe(this.login.topics.signInSuccess, lang.hitch(this, 'afterLogInSuccessful'));
        },
        afterLogInSuccessful: function (loginResult) {
            // summary:
            //      Fires after the user has successfully logged in
            console.log('app/App:afterLogInSuccessful', arguments);

            config.user = loginResult.user;

            // rebuild layer selector with secure layers...
            this.initLayerSelector();

            this.roadsToc.login();
            this.identify.login();
        },
        initMap: function () {
            // summary:
            //      description
            console.log('app/App:initMap', arguments);

            this.identify = new Identify();

            this.map = new BaseMap(this.mapDiv, {
                useDefaultBaseMap: false,
                infoWindow: this.identify.getPopup(),
                extent: new Extent({
                    xmax: -11762120.612131765,
                    xmin: -13074391.513731329,
                    ymax: 5225035.106177688,
                    ymin: 4373832.359194187,
                    spatialReference: {
                        wkid: 3857
                    }
                })
            });

            var lyrs = [];

            // Roads
            var roadsLyr = new ArcGISDynamicMapServiceLayer(config.urls.roadsUrl, {
                visible: true
            });
            lyrs.push(roadsLyr);
            this.map.addLoaderToLayer(roadsLyr);
            this.roadsToc = new RoadsToc({
                layer: roadsLyr,
                map: this.map
            }, 'roads-layers-toc');
            this.identify.toc = this.roadsToc;

            this.map.addLayers(lyrs);
            this.map.on('layers-add-result', lang.hitch(this, 'afterMapLoaded'));

            // city search
            var muni = new Sherlock({
                provider: new WebAPI(config.apiKey, config.featureClassNames.cities, 'NAME'),
                map: this.map,
                placeHolder: 'Municipality'
            }, this.citySherlockDiv);
            muni.startup();
            domStyle.set(muni.domNode, 'z-index', 19);

            // gnis search
            var place = new Sherlock({
                provider: new WebAPI(config.apiKey, config.featureClassNames.gnis, 'NAME'),
                map: this.map,
                placeHolder: 'Place Name'
            }, this.placeSherlockDiv);
            place.startup();
            domStyle.set(place.domNode, 'z-index', 20);
        },
        initLayerSelector: function () {
            // summary:
            //      init layer selector adding secure layers if user is logged in
            console.log('app/App:initLayerSelector', arguments);

            if (this.layerSelector) {
                this.layerSelector.destroyRecursive();
            }

            var loUrl = LayerSelector.prototype._applianceLayers.Lite.urlPattern.replace('{quad}', config.quadWord);
            var baseLayers = [
                {
                    Factory: WebTiledLayer,
                    url: loUrl,
                    id: 'Lite',
                    linked: ['Land Ownership']
                },
                'Hybrid',
                'Terrain',
                'Topo'
            ];

            if (config.user) {
                baseLayers = baseLayers.concat([
                    {
                    //     id: 'Historic 15',
                    //     Factory: ArcGISDynamicMapServiceLayer,
                    //     url: config.urls.historic15
                    // }, {
                    //     id: 'Historic 7.5 Historic Imagery',
                    //     Factory: ArcGISDynamicMapServiceLayer,
                    //     url: config.urls.historic75
                    // }, {
                    //     id: 'UDOT Historic Maps',
                    //     Factory: ArcGISDynamicMapServiceLayer,
                    //     url: config.urls.udotHistoricMaps
                    // }, {
                    //     id: 'UDOT Historic D',
                    //     Factory: ArcGISDynamicMapServiceLayer,
                    //     url: config.urls.udotHistoricD
                    // }, {
                        id: '76 Imagery',
                        Factory: ArcGISDynamicMapServiceLayer,
                        url: config.urls.imagery76
                    }
                ]);
            }

            this.layerSelector = new LayerSelector({
                map: this.map,
                quadWord: config.quadWord,
                baseLayers: baseLayers,
                overlays: [
                    {
                        id: 'Land Ownership',
                        Factory: ArcGISDynamicMapServiceLayer,
                        url: config.urls.landOwnership,
                        opacity: 0.6
                    }, {
                        id: 'Utah PLSS',
                        Factory: VectorTileLayer,
                        url: config.urls.plss
                    }
                ]
            });
            this.layerSelector.startup();
            this.own(this.layerSelector);
        },
        afterMapLoaded: function () {
            // summary:
            //      fires after the map and layers have loaded
            console.log('app/App:afterMapLoaded', arguments);

            this.countyZoomer = new CountyZoomer({ map: this.map }, this.countyZoomerDiv);

            this.wireEvents();

            this.leg = new Legend({
                map: this.map,
                layerInfos: [
                    {
                        layer: new ArcGISDynamicMapServiceLayer(config.urls.landOwnership),
                        title: ''
                    }
                ]
            }, 'legend');
            this.leg.startup();
        },
        wireEvents: function () {
            // summary:
            //      description
            console.log('app/App:wireEvents', arguments);

            this.countyZoomer.on('zoomed', lang.hitch(this, 'onZoomToCounty'));
            this.map.on('click', lang.hitch(this.identify, 'onMapClick'));
        },
        onZoomToCounty: function (county) {
            // summary:
            //      description
            console.log('app/App:onZoomToCounty', arguments);

            this.countyName.innerHTML = county;

            this.roadsToc.selectCounty(county);
            this.initSherlocks(county);
            this.identify.selectCounty(county);
        },
        onSelectCounty: function () {
            // summary:
            //      description
            console.log('app/App:onSelectCounty', arguments);

            this.map.infoWindow.hide();

            this.countyZoomer.show();
        },
        initSherlocks: function (county) {
            // summary:
            //      description
            // county: string
            console.log('app/App:initSherlocks', arguments);

            var that = this;
            function onZoom(graphic) {
                that.identify.popup.hide();
                that.identify.gLayer.clear();
                that.sherlocks.forEach(function (zoom) {
                    zoom._graphicsLayer.clear();
                });
                function showPopup(g) {
                    that.identify.showRoad(g,
                        g.attributes[config.fields.sherlockData.ROAD_CLASS]);
                }
                setTimeout(function () {
                    showPopup(graphic);
                }, 1500);
            }

            if (this.sherlocks) {
                this.sherlocks.forEach(function (zoom) {
                    zoom.destroyRecursive();
                });
                this.sherlocks = [];
            }

            var layerIndex = config.counties.indexOf(county);
            var getPlaceHolder = function (field) {
                return field[1] + ' (' + field[0] + ')';
            };
            var buildWidget = function (fieldInfo) {
                var mapServiceProvider = new MapService(
                    config.urls.sherlockData + '/' + layerIndex,
                    fieldInfo[0],
                    {
                        outFields: [
                            config.fields.sherlockData.ROAD_CLASS,
                            config.fields.roads.CO_UNIQUE[0],
                            config.fields.roads.S_NAME[0],
                            fieldInfo[0]
                        ],
                        token: config.token
                    }
                );
                var sherlock = new Sherlock({
                    provider: mapServiceProvider,
                    map: this.map,
                    placeHolder: getPlaceHolder(fieldInfo)
                }, domConstruct.create('div', {}, this.sherlocksContainer));
                sherlock.startup();
                sherlock.on('zoomed', onZoom);
                this.sherlocks.push(sherlock);
                var z = domStyle.get(sherlock.domNode, 'z-index');
                domStyle.set(sherlock.domNode, 'z-index', z - this.sherlocks.length);
            }.bind(this);

            buildWidget(config.fields.roads.RD_ID);
            buildWidget(config.fields.roads.CO_UNIQUE);
            buildWidget(config.fields.roads.S_NAME);
        }
    });
});
