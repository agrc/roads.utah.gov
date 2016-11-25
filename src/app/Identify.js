/*global dojo, esri, console, plpco, plpcoglobal, plpcoapp, dijit, alert*/
/*jslint sub:true*/
dojo.provide("plpco.Identify");

dojo['require']("esri.dijit.Popup");
dojo.require("plpco._GetSubLayersMixin");

dojo.declare("plpco.Identify", [plpco._GetSubLayersMixin], {
    // summary:
    //      Controls the identify functionality for the road segments

    // popup: esri.dijit.Popup
    popup: null,

    // query: esri.tasks.Query
    //      Used with qTaskB and qTaskD
    query: null,

    // qTaskB: esri.tasks.QueryTask
    //      Used for querying the secured B road sections
    qTaskB: null,

    // qTaskD: esri.tasks.QueryTask
    //      Used for querying the secrured D road sections
    qTaskD: null,

    // iParams: esri.tasks.IdentifyParameters
    iParams: null,

    // iTask: esri.tasks.IdentifyTask
    iTask: null,

    // toc: plpco.RoadsToc
    toc: null,

    // roadSymbol: esri.symbol.SimpleLineSymbol
    roadSymbol: null,

    // photoSymbol: esri.symbol.SimpleMarkerSymbol
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

    // roadsPane: esri.TitlePane
    roadsPane: null,

    // roadsPanePlaceHolderText: String
    roadsPanePlaceHolderText: "<div>Please click on a road to see its attributes.</div>",

    // parameters passed in via the constructor

    constructor: function() {
        // summary:
        //      creates the query and query task
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.roadsPane = dijit.byId('roads-identify-pane');
        this.roadsPane.set('content', this.roadsPanePlaceHolderText);

        this.roadSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([255, 255, 0]), 5);
        this.photoSymbol = new esri.symbol.SimpleMarkerSymbol().setSize(10).setColor(new dojo.Color([255, 255, 0]));
        this.photosTemplate = new esri.InfoTemplate('${PHOTO_NAME}', dojo.cache('plpco', 'html/PhotosTemplate.html'));

        var template;
        if (this.isSecuredRole()) {
            this.query = new esri.tasks.Query();
            var flds = [];
            for (var f in plpcoglobal.fields.roads) {
                if (plpcoglobal.fields.roads.hasOwnProperty(f)) {
                    flds.push(plpcoglobal.fields.roads[f][0]);
                }
            }
            this.query.outFields = flds;
            this.query.returnGeometry = false;

            template = dojo.cache('plpco', 'html/RoadsTemplateSecure.html');
        } else {
            template = dojo.cache('plpco', 'html/RoadsTemplateGeneral.html');
        }

        this.iParams = new esri.tasks.IdentifyParameters();
        this.iParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
        this.iParams.returnGeometry = true;
        this.iParams.tolerance = 5;

        this.iTask = new esri.tasks.IdentifyTask(plpcoglobal.urls.roadsUrl);

        this.roadsTemplate = new esri.InfoTemplate('${' + plpcoglobal.fields.roads.S_NAME[0] + '}', template);

        this.wireEvents();
    },
    wireEvents: function(){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        dojo.connect(this.iTask, "onError", this, 'onTaskError');
        dojo.connect(this.iTask, "onComplete", this, 'onIdentifyTaskComplete');
    },
    selectCounty: function(county){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        function addLayerIdToUrl(id){
            return plpcoglobal.urls.roadsSecureUrl.replace('MapServer', 'MapServer/' + id);
        }

        if (this.isSecuredRole()) {
            // set layer for _GetSubLayersMixin
            this.getSubLayersRoadsLayer = plpco.secureLayer;

            var subLayerIds = this.getSubLayers(county);
            if (!subLayerIds) { return ; }
            this.BLayerId = subLayerIds[0];
            this.DLayerId = subLayerIds[1];

            this.qTaskB = new esri.tasks.QueryTask(addLayerIdToUrl(this.BLayerId));
            this.qTaskD = new esri.tasks.QueryTask(addLayerIdToUrl(this.DLayerId));

            dojo.connect(this.qTaskB, 'onError', this, 'onTaskError');
            dojo.connect(this.qTaskB, 'onComplete', this, 'onQueryTaskComplete');
            dojo.connect(this.qTaskD, 'onError', this, 'onTaskError');
            dojo.connect(this.qTaskD, 'onComplete', this, 'onQueryTaskComplete');
        }
    },
    getPopup: function(){
        // summary:
        //      creates a popup and returns it
        // returns: esri.dijit.Popup
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.popup = new esri.dijit.Popup(null, dojo.create('div'));
        this.popup.resize(400, 325);
        dojo.connect(this.popup, "onHide", this, 'onPopupHide');
        return this.popup;
    },
    onMapClick: function(clickEvt){
        // summary:
        //      description
        // clickEvt: {}
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        this.mapClickPoint = clickEvt.mapPoint;

        plpcoapp.map.graphics.clear();

        if (!this.gLayer) {
            this.gLayer = new esri.layers.GraphicsLayer();
            plpcoapp.map.addLayer(this.gLayer);
        }

        this.popup.hide();
        this.gLayer.clear();
        plpcoapp.map.showLoader();

        // var lyrIds = [];
        // lyrIds.push(this.toc.subLayerIds[0]);
        // lyrIds.push(this.toc.subLayerIds[2]);
        var lyrIds = this.toc.layer.visibleLayers;
        if (!this.toc.photoLayerIds || plpcoapp.map.getLevel() <= 7) {
            // remove photo layers we are zoomed too far out
            dojo.forEach(this.toc.photoLayerIds, function (id) {
                var i = lyrIds.indexOf(id);
                if (i !== -1) {
                    lyrIds.splice(i, 1);
                }
            });
        }
        this.iParams.layerIds = lyrIds;
        this.iParams.width = plpcoapp.map.width;
        this.iParams.height = plpcoapp.map.height;
        this.iParams.geometry = clickEvt.mapPoint;
        this.iParams.mapExtent = plpcoapp.map.extent;
        this.iParams.layerDefinitions = this.toc.layer.layerDefinitions;
        this.iTask.execute(this.iParams);
    },
    onTaskError: function(er){
        // summary:
        //      fires when the query task returns an error
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        alert('There was an error with the roads identify task');

        plpco.errorLogger.log(er, 'Error with roads identify task', true);

        plpcoapp.map.hideLoader();
    },
    onIdentifyTaskComplete: function(iResults){
        // summary:
        //      displays graphic on map and fires query task if appropriate
        // iResults: esri.tasks.IdentifyResult[]
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.roadsPane.set('content', this.roadsPanePlaceHolderText);

        if (iResults.length > 0) {
            // give preference to photos
            var pointGraphic;
            if (dojo.some(iResults, function(result){
                if (result.feature.geometry.type === 'point') {
                    pointGraphic = result.feature;
                    return true;
                } else {
                    return false;
                }
            })) {
                pointGraphic.setSymbol(this.photoSymbol);

                // reformat url to photo
                var link = pointGraphic.attributes[plpcoglobal.fields.photos.HOTLINK];
                link = link.replace('R:', plpcoglobal.urls.photosBase);
                link = link.replace(/\\/g, "/");
                pointGraphic.attributes[plpcoglobal.fields.photos.HOTLINK] = link;

                this.showPopup(pointGraphic, this.photosTemplate);

                this.gLayer.add(pointGraphic);
            } else {
                this.showRoad(iResults[0].feature, iResults[0].layerName, this.mapClickPoint);
            }
        }

        plpcoapp.map.hideLoader();
    },
    showRoad: function(graphic, roadClass){
        // summary:
        //      shows popup with appropriate attributes
        // graphic: esri.Graphic
        // roadClass: String ('Class B' | 'Class D')
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.dissolveGraphic = graphic;
        this.dissolveGraphic.setSymbol(this.roadSymbol);
        this.gLayer.add(this.dissolveGraphic);

        if (this.isSecuredRole()) {
            this.fireQueryTask(roadClass, graphic);
        } else {
            this.showRoadPane(graphic, this.roadsTemplate);
        }
    },
    fireQueryTask: function(lName, g){
        // summary:
        //      description
        // lName: String
        //      The name of the layer that was found in the roads service
        // g: esri.Graphic
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var rd_id = plpcoglobal.fields.roads.RD_ID[0];
        this.query.where = rd_id + " = '" + g.attributes[rd_id] + "'";

        if (lName.indexOf('Class B') !== -1) {
            this.qTaskB.execute(this.query);
        } else {
            this.qTaskD.execute(this.query);
        }
    },
    onQueryTaskComplete: function(fSet){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        if (fSet.features.length === 0) {
            throw new Error('No matching road sections found! ' + this.query.where);
        } else {
            dojo.mixin(this.dissolveGraphic.attributes, fSet.features[0].attributes);
            this.showRoadPane(this.dissolveGraphic, this.roadsTemplate);
        }

        plpcoapp.map.hideLoader();
    },
    isSecuredRole: function(){
        // summary:
        //      checks to see this this is a secured user
        // returns: Boolean (true if Secured or Admin, false if General or no role)
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        if (!plpco.role) {
            throw new Error('There is no role defined!');
        } else {
            return plpco.role !== plpcoglobal.roleNames.plpcoGeneral;
        }
    },
    showPopup: function(g, template){
        // summary:
        //      sets the infotemplate, populates the popup and shows it
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        g.setInfoTemplate(template);
        this.popup.setTitle(g.getTitle());
        this.popup.setContent(g.getContent());
        this.popup.show(this.mapClickPoint);
    },
    onPopupHide: function(){
        // summary:
        //      clears the graphics when the popup is closed
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.gLayer.clear();
    },
    showRoadPane: function (graphic, template) {
        // summary:
        //      opens the sidebar pane, if needed and displays
        //      the data for the selected road
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        // open pane, if needed
        if (!this.roadsPane.get('open')) {
            this.roadsPane.toggle();
        }

        graphic.setInfoTemplate(template);
        this.roadsPane.set('content', graphic.getContent());
    }
});