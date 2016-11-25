/*global dojo, console, esri, plpco, plpcoglobal, dijit*/
dojo.provide("plpco.CountyZoomer");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.Dialog");

dojo.declare("plpco.CountyZoomer", [dijit._Widget, dijit._Templated], {
    // widgetsInTemplate: [private] Boolean
    //      Specific to dijit._Templated.
    widgetsInTemplate: true,
    
    // templatePath: [private] String
    //      Path to template. See dijit._Templated
    templatePath: dojo.moduleUrl("plpco", "templates/CountyZoomer.html"),
    
    // baseClass: [private] String
    //    The css class that is applied to the base div of the widget markup
    baseClass: "county-zoomer",
    
    // query: esri.tasks.Query
    query: null,
    
    // qTask: esri.tasks.QueryTask
    qTask: null,
    
    // maskTask: esri.tasks.QueryTask
    maskTask: null,
    
    // maskSymbol: esri.symbol.SimpleFillSymbol
    maskSymbol: new esri.symbol.SimpleFillSymbol(
        esri.symbol.SimpleFillSymbol.STYLE_SOLID,
        null, new dojo.Color([0, 0, 0, 0.5])),
        
    // gLayer: esri.layers.GraphicsLayer
    //      The graphics layer that the mask graphic is put into
    gLayer: null,
    
    // Params passed in via the constructor
    
    // map: esri.Map
    map: null,
    
    constructor: function(params) {
        this.buildQueryTasks();
        
        // create new graphics layer and add to map
        // using a separate graphics layer so that I don't interfere with other stuff
        this.gLayer = new esri.layers.GraphicsLayer();
        params.map.addLayer(this.gLayer);
    },
    postCreate: function(){
        this.dialog.show();
        this.wireEvents();
    },
    wireEvents: function(){
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        dojo.query('.county-zoomer-dialog td').onclick(this, this.onCountyClick);
    },
    buildQueryTasks: function(){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        this.query = new esri.tasks.Query();
        this.query.outFields = [];
        this.query.returnGeometry = true;
        
        // let arcgis server generalize the geometry so that it will be less to send back
        // no big deal since i'm just using this geometry to zoom the map to the extent
        this.query.maxAllowableOffset = 50;
        
        this.qTask = new esri.tasks.QueryTask(plpcoglobal.urls.countyQueryTaskUrl);
        this.maskTask = new esri.tasks.QueryTask(plpcoglobal.urls.maskQueryTaskUrl);
        
        dojo.connect(this.qTask, "onComplete", this, 'onQueryComplete');
        dojo.connect(this.qTask, "onError", this, 'onError');
        dojo.connect(this.maskTask, "onComplete", this, 'onMaskComplete');
        dojo.connect(this.maskTask, "onError", this, 'onError');
    },
    onQueryComplete: function(fSet){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        if (fSet.features.length > 0) {
            this.map.setExtent(fSet.features[0].geometry.getExtent(), true);
        } else {
            alert('No features found for query: ' + this.query.where);
        }
    },
    onError: function(er){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        alert('There was an error with the county query!');
        
        plpco.errorLogger.log(er, 'Error with county query task', true);
    },
    zoom: function(countyName){
        // summary:
        //      zooms to the county
        // countyName: String
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        this.query.where = plpcoglobal.fields.counties.NAME + " = '" + countyName.toUpperCase() + "'";
        this.qTask.execute(this.query);
        this.maskTask.execute(this.query);
        
        this.gLayer.clear();
    },
    onCountyClick: function(evt){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        var county = evt.target.innerHTML;
        
        this.zoom(county);
        
        this.dialog.hide();
    },
    onMaskComplete: function(fSet){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        if (fSet.features.length > 0) {
            var g = fSet.features[0];
            g.setSymbol(this.maskSymbol);
            this.gLayer.add(g);
        } else {
            alert('No mask feature found for: ' + this.query.where);
        }
    }
});
