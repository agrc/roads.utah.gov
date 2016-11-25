/*global dojo, console, dijit, esri, plpcoglobal, plpco, dojox, ijit, plpcoapp, window*/
dojo.provide("plpco.AttributeTable");

dojo.require("dojox.grid.DataGrid");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("plpco._GetSubLayersMixin");
dojo.require("dijit.Dialog");
dojo.require("ijit.modules._QueryTaskMixin");

dojo.declare("plpco.AttributeTable", [plpco._GetSubLayersMixin, ijit.modules._QueryTaskMixin], {
    // description:
    //      displays the attribute table of the passed in layer
    
    // dialog: dijit.Dialog
    dialog: null,
    
    // grid: dojox.grid.DataGrid
    grid: null,
    
    // url: String
    //      The url that points to the correct layer for the query tasks
    url: null,
    
    // symbolLine: esri.symbol.SimpleLineSymbol
    //      The symbol used to symbolize the zoomed to road
    symbolLine: null,
    
    // from _QueryTaskMixin
    //query: esri.tasks.Query
    //qTask: esri.tasks.QueryTask
    
    // Parameters to constructor
    
    // county: String
    county: null,
    
    // roadType: String
    roadType: null,
    
        
    constructor: function(county, roadType) {
        // summary:
        //    Constructor method
        // county: String
        // roadType: String
        //      B or D
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        this.county = county;
        this.roadType = roadType;
        
        // set layer for _GetSubLayersMixin
        this.getSubLayersRoadsLayer = plpco.secureLayer;
        
        // query for data that will populate data grid
        var i = (this.roadType === 'B') ? 0 : 1;
        this.url = dojo.string.substitute(plpcoglobal.urls.attributeTableUrl, [this.getSubLayers(this.county)[i]]);
        
        this.executeQueryTask();
        
        this.buildDialog();
        
        this.setUpQueryTask(this.url, {
            returnGeometry: true
        });
        
        this.symbolLine = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, 
            new dojo.Color([255, 255, 0]), 5);
    },
    executeQueryTask: function(){
        // summary:
        //      sets up and executes the query task pointing to the correct layer it
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        var task = new esri.tasks.QueryTask(this.url);
        dojo.connect(task, "onComplete", this, 'onTaskComplete');
        dojo.connect(task, 'onError', this, 'onQueryTaskError');
        
        var query = new esri.tasks.Query();
        query.returnGeometry = false;
        query.where = '1 = 1';
        var fields = [plpcoglobal.fields.OBJECTID];
        for (var fld in plpcoglobal.fields.roads) { 
            if (plpcoglobal.fields.roads.hasOwnProperty(fld)){
                fields.push(plpcoglobal.fields.roads[fld][0]);
            }
        }
        query.outFields = fields;
        
        task.execute(query);
    },
    buildDialog: function(){
        // summary:
        //      creates the dialog and grid
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        // create dialog
        var id = this.county + this.roadType + '-attribute-dialog-grid';
        var btnId = id + '_zoomBtn';
        this.dialog = new dijit.Dialog({
            title: dojo.string.substitute('${0} ${1} Roads Attribute Table', [this.county, this.roadType]),
            content: dojo.string.substitute(dojo.cache('plpco', 'html/AttributeTableDialogContent.html'), [id, btnId]),
            'class': 'attribute-table-dialog'
        });
        dojo.connect(dijit.byId(btnId), "onClick", this, 'onZoomClick');
        this.dialog.show();
        
        // create grid
        var noscrollFlds = [], flds = [], i = 0;
        for (var fld in plpcoglobal.fields.roads) { 
            if (plpcoglobal.fields.roads.hasOwnProperty(fld)){
                i++;
                var f = plpcoglobal.fields.roads[fld][0];
                var desc = plpcoglobal.fields.roads[fld][1];
                var w = plpcoglobal.fields.roads[fld][2] + 'px';
                var gridFld = {name: desc, field: f, width: w};
                if (i < 2){
                    noscrollFlds.push(gridFld);
                } else {
                    flds.push(gridFld);
                }
            }
        }
        this.grid = new dojox.grid.DataGrid({
            structure: [
                {
                    noscroll: true,
                    cells: noscrollFlds
                },{
                    cells: flds
                }
            ],
            style: 'height: ' + (dojo.contentBox(this.dialog.domNode).h - 83) + 'px;'
        }, id);
        this.grid.startup();
    },
    onTaskComplete: function(fSet){
        // summary:
        //      updates the data store for the grid
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        var rows = dojo.map(fSet.features, function(f){
            return f.attributes;
        });
        
        var oid = plpcoglobal.fields.OBJECTID;
        var data = {
            identifier: oid,
            label: oid,
            items: rows
        };
            
        var store = new dojo.data.ItemFileReadStore({data: data});
        this.grid.setStore(store);
    },
    onQueryTaskError: function(er){
        // summary:
        //      handles error returned by query task
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        alert('There was an error with the attribute table query!');
        
        plpco.errorLogger.log(er, 'AttributeTable Query Task Error');
    },
    show: function(){
        // summary:
        //      displays the dialog
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        this.dialog.show();
    },
    destroy: function(){
        // summary:
        //      destroys the dialog and grid
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        this.dialog.destroyRecursive();
    },
    onZoomClick: function(){
        // summary:
        //      Fires when the user clicks the "Zoom To Selected Road" button
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        // get selected row
        var row = this.grid.selection.getSelected()[0];
        var rdid = row[plpcoglobal.fields.roads.RD_ID[0]];
        this.query.where = plpcoglobal.fields.roads.RD_ID[0] + " = '" + rdid + "'";
        this.qTask.execute(this.query);
    },
    onQueryTaskComplete: function(fSet){
        // summary:
        //      Callback for query task to zoom to road
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        if (fSet.features.length > 0) {            
            var map = plpcoapp.map;
            map.graphics.clear();
            
            var g = fSet.features[0];
            map.setExtent(g.geometry.getExtent(), true);
            g.setSymbol(this.symbolLine);
            map.graphics.add(g);
            
            // IE 8 (not 7) automatically hide dialog and threw an error if you call this method
            // Wierd, I know. It's totally freakin' me out, but at least it's working now. :)
            if (!dojo.isIE || dojo.isIE != 8) { 
                this.dialog.hide();
            }
        }
    }
});