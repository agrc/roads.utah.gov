define([
    'app/config',
    'app/_GetSubLayersMixin',

    'dijit/registry',

    'dojo/dom-construct',
    'dojo/text!app/html/PhotosTemplate.html',
    'dojo/text!app/html/RoadsTemplateGeneral.html',
    'dojo/text!app/html/RoadsTemplateSecure.html',
    'dojo/_base/Color',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/dijit/Popup',
    'esri/InfoTemplate',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/GraphicsLayer',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/tasks/IdentifyParameters',
    'esri/tasks/IdentifyTask',
    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (
    config,
    _GetSubLayersMixin,

    registry,

    domConstruct,
    photosTemplate,
    roadsTemplateGeneral,
    roadsTemplateSecure,
    Color,
    declare,
    lang,

    Popup,
    InfoTemplate,
    ArcGISDynamicMapServiceLayer,
    GraphicsLayer,
    SimpleLineSymbol,
    SimpleMarkerSymbol,
    IdentifyParameters,
    IdentifyTask,
    Query,
    QueryTask
) {
    return declare([_GetSubLayersMixin], {
        // summary:
        //      Controls the identify functionality for the road segments

        // popup: esri.dijit.Popup
        popup: null,

        // query: Query
        //      Used with qTaskB and qTaskD
        query: null,

        // qTaskB: QueryTask
        //      Used for querying the secured B road sections
        qTaskB: null,

        // qTaskD: QueryTask
        //      Used for querying the secrured D road sections
        qTaskD: null,

        // iParams: IdentifyParameters
        iParams: null,

        // iTask: IdentifyTask
        iTask: null,

        // toc: plpco.RoadsToc
        toc: null,

        // roadSymbol: SimpleLineSymbol
        roadSymbol: null,

        // photoSymbol: SimpleMarkerSymbol
        photoSymbol: null,

        // BLayerId: Number
        BLayerId: null,

        // DLayerId: Number
        DLayerId: null,

        // gLayer: esri.layers.GraphicLayer
        glayer: null,

        // dissolveGraphic: esri.Graphic
        dissolveGraphic: null,

        // mapClickPoint: esri.geometry
        //      The map point where the user clicked
        mapClickPoint: null,

        // roadsTemplate: esri.InfoTemplate
        roadsTemplate: null,

        // photosTemplate: esri.InfoTemplate
        photosTemplate: null,

        // roadsPanePlaceHolderText: String
        roadsPanePlaceHolderText: '<p>Please click on a road or photo to see its attributes.</p>',

        // roadsPane: esri.TitlePane
        roadsPane: null,


        // parameters passed in via the constructor

        constructor: function () {
            // summary:
            //      creates the query and query task
            console.log('app/Identify:constructor', arguments);

            this.getSubLayersRoadsLayer = new ArcGISDynamicMapServiceLayer(config.urls.roadsUrl);

            this.roadsPane = registry.byId('roads-identify-pane');
            this.roadsPane.set('content', this.roadsPanePlaceHolderText);

            this.roadSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 255, 0]), 5);
            this.photoSymbol = new SimpleMarkerSymbol().setSize(10).setColor(new Color([255, 255, 0]));
            this.photosTemplate = new InfoTemplate('${PHOTO_NAME}', photosTemplate);

            this.iParams = new IdentifyParameters();
            this.iParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
            this.iParams.returnGeometry = true;
            this.iParams.tolerance = 5;

            this.initIdentifyTask(config.urls.roadsUrl);

            this.roadsTemplate = new InfoTemplate('${' + config.fields.roads.S_NAME[0] + '}', roadsTemplateGeneral);
        },
        initIdentifyTask: function (url) {
            // summary:
            //      sets up the identify task
            // param or return
            console.log('module.id:initIdentifyTask', arguments);

            this.iTask = new IdentifyTask(url);

            this.iTask.on('error', lang.hitch(this, this.onTaskError));
            this.iTask.on('complete', lang.hitch(this, this.onIdentifyTaskComplete));
        },
        selectCounty: function (county) {
            // summary:
            //      description
            console.log('app/Identify:selectCounty', arguments);

            this.currentCounty = county;

            var addLayerIdToUrl = function (id) {
                return config.urls.roadsSecureUrl.replace('MapServer', 'MapServer/' + id);
            };

            var subLayerIds = this.getSubLayers(county);
            if (!subLayerIds) {
                return;
            }
            this.BLayerId = subLayerIds[0];
            this.DLayerId = subLayerIds[1];

            this.qTaskB = new QueryTask(addLayerIdToUrl(this.BLayerId));
            this.qTaskD = new QueryTask(addLayerIdToUrl(this.DLayerId));

            this.qTaskB.on('error', lang.hitch(this, this.onTaskError));
            this.qTaskB.on('complete', lang.hitch(this, this.onQueryTaskComplete));
            this.qTaskD.on('error', lang.hitch(this, this.onTaskError));
            this.qTaskD.on('complete', lang.hitch(this, this.onQueryTaskComplete));
        },
        getPopup: function () {
            // summary:
            //      creates a popup and returns it
            // returns: esri.dijit.Popup
            console.log('app/Identify:getPopup', arguments);

            this.popup = new Popup(null, domConstruct.create('div'));
            this.popup.resize(400, 407);
            this.popup.on('hide', lang.hitch(this, this.onPopupHide));

            return this.popup;
        },
        onMapClick: function (clickEvt) {
            // summary:
            //      description
            // clickEvt: {}
            console.log('app/Identify:onMapClick', arguments);

            this.mapClickPoint = clickEvt.mapPoint;

            config.app.map.graphics.clear();

            if (!this.gLayer) {
                this.gLayer = new GraphicsLayer();
                config.app.map.addLayer(this.gLayer);
            }

            this.popup.hide();
            this.gLayer.clear();
            config.app.map.showLoader();

            var lyrIds = this.toc.layer.visibleLayers;
            if (config.user && config.app.map.getLevel() >= 12) {
                // add photos layer
                lyrIds.push(0);
            }
            this.iParams.layerIds = lyrIds;
            this.iParams.width = config.app.map.width;
            this.iParams.height = config.app.map.height;
            this.iParams.geometry = clickEvt.mapPoint;
            this.iParams.mapExtent = config.app.map.extent;
            this.iTask.execute(this.iParams);
        },
        onTaskError: function () {
            // summary:
            //      fires when the query task returns an error
            console.log('app/Identify:onTaskError', arguments);

            window.alert('There was an error with the roads identify task');

            config.app.map.hideLoader();
        },
        onIdentifyTaskComplete: function (response) {
            // summary:
            //      displays graphic on map and fires query task if appropriate
            // iResults: IdentifyResult[]
            console.log('app/Identify:onIdentifyTaskComplete', arguments);

            this.roadsPane.set('content', this.roadsPanePlaceHolderText);

            var iResults = response.results;
            if (iResults.length > 0) {
                // give preference to photos
                var pointGraphic;
                if (iResults.some(function (result) {
                    if (result.feature.geometry.type === 'point') {
                        pointGraphic = result.feature;

                        return true;
                    }
                })) {
                    pointGraphic.setSymbol(this.photoSymbol);

                    // reformat url to photo
                    var link = pointGraphic.attributes[config.fields.photos.HOTLINK];
                    link = link.replace('R:', config.urls.photosBase);
                    link = link.replace(/\\/g, '/');
                    pointGraphic.attributes[config.fields.photos.HOTLINK] = link;

                    this.showPopup(pointGraphic, this.photosTemplate);

                    this.gLayer.add(pointGraphic);
                } else {
                    this.showRoad(iResults[0].feature, iResults[0].layerName, this.mapClickPoint);
                }
            }

            config.app.map.hideLoader();
        },
        showRoad: function (graphic, roadClass) {
            // summary:
            //      shows popup with appropriate attributes
            // graphic: esri.Graphic
            // roadClass: String ('Class B' | 'Class D')
            console.log('app/Identify:showRoad', arguments);

            this.dissolveGraphic = graphic;
            this.dissolveGraphic.setSymbol(this.roadSymbol);
            this.gLayer.add(this.dissolveGraphic);

            if (config.user) {
                this.fireQueryTask(roadClass, graphic);
            } else {
                this.showRoadPane(graphic, this.roadsTemplate);
            }
        },
        fireQueryTask: function (lName, g) {
            // summary:
            //      description
            // lName: String
            //      The name of the layer that was found in the roads service
            // g: esri.Graphic
            console.log('app/Identify:fireQueryTask', arguments);

            var rdId = config.fields.roads.RD_ID[0];
            this.query.where = rdId + " = '" + g.attributes[rdId] + "'";

            if (lName === 'Class B') {
                this.qTaskB.execute(this.query);
            } else {
                this.qTaskD.execute(this.query);
            }
        },
        onQueryTaskComplete: function (result) {
            // summary:
            //      description
            console.log('app/Identify:onQueryTaskComplete', arguments);

            var fSet = result.featureSet;
            if (fSet.features.length === 0) {
                throw new Error('No matching road sections found! ' + this.query.where);
            } else {
                lang.mixin(this.dissolveGraphic.attributes, fSet.features[0].attributes);
                this.showRoadPane(this.dissolveGraphic, this.roadsTemplate);
            }

            config.app.map.hideLoader();
        },
        login: function () {
            // summary:
            //      description
            // param or return
            console.log('app/Identify:login', arguments);

            this.query = new Query();
            var flds = [];
            for (var f in config.fields.roads) {
                if (config.fields.roads.hasOwnProperty(f)) {
                    flds.push(config.fields.roads[f][0]);
                }
            }
            this.query.outFields = flds;
            this.query.returnGeometry = false;

            this.roadsTemplate = new InfoTemplate('${' + config.fields.roads.S_NAME[0] + '}', roadsTemplateSecure);
            this.initIdentifyTask(config.urls.roadsSecureUrl);

            this.getSubLayersRoadsLayer = new ArcGISDynamicMapServiceLayer(config.urls.roadsSecureUrl);

            this.selectCounty(this.currentCounty);
        },
        showPopup: function (g, template) {
            // summary:
            //      sets the infotemplate, populates the popup and shows it
            console.log('app/Identify:showPopup', arguments);

            g.setInfoTemplate(template);
            this.popup.setTitle(g.getTitle());
            this.popup.setContent(g.getContent());
            this.popup.show(this.mapClickPoint);
        },
        onPopupHide: function () {
            // summary:
            //      clears the graphics when the popup is closed
            console.log('app/Identify:onPopupHide', arguments);

            this.gLayer.clear();
        },
        showRoadPane: function (graphic, template) {
            // summary:
            //      opens the sidebar pane, if needed and displays
            //      the data for the selected road
            console.log('app/Identify:showRoadPane', arguments);

            // open pane, if needed
            if (!this.roadsPane.get('open')) {
                this.roadsPane.toggle();
            }

            graphic.setInfoTemplate(template);
            this.roadsPane.set('content', graphic.getContent());
        }
    });
});
