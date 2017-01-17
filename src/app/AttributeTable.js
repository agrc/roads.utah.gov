define([
    'app/config',
    'app/_GetSubLayersMixin',
    'app/_QueryTaskMixin',

    'dijit/Dialog',
    'dijit/registry',

    'dojo/data/ItemFileReadStore',
    'dojo/dom-geometry',
    'dojo/string',
    'dojo/text!app/html/AttributeTableDialogContent.html',
    'dojo/_base/Color',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'dojox/grid/DataGrid',

    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/symbols/SimpleLineSymbol',
    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (
    config,
    _GetSubLayersMixin,
    _QueryTaskMixin,

    Dialog,
    registry,

    ItemFileReadStore,
    domGeometry,
    dojoString,
    attributeTableDialogContent,
    Color,
    declare,
    lang,

    DataGrid,

    ArcGISDynamicMapServiceLayer,
    SimpleLineSymbol,
    Query,
    QueryTask
) {
    return declare([_GetSubLayersMixin, _QueryTaskMixin], {
        // description:
        //      displays the attribute table of the passed in layer

        // dialog: dijit.Dialog
        dialog: null,

        // grid: dojox.grid.DataGrid
        grid: null,

        // url: String
        //      The url that points to the correct layer for the query tasks
        url: null,

        // symbolLine: SimpleLineSymbol
        //      The symbol used to symbolize the zoomed to road
        symbolLine: null,

        // from _QueryTaskMixin
        // query: esri.tasks.Query
        // qTask: esri.tasks.QueryTask

        // Parameters to constructor

        // county: String
        county: null,

        // roadType: String
        roadType: null,


        constructor: function (county, roadType) {
            // summary:
            //    Constructor method
            // county: String
            // roadType: String
            //      B or D
            console.log('app/AttributeTable:constructor', arguments);

            this.county = county;
            this.roadType = roadType;

            // set layer for _GetSubLayersMixin
            this.getSubLayersRoadsLayer = new ArcGISDynamicMapServiceLayer(config.urls.roadsSecureUrl);

            // query for data that will populate data grid
            var i = (this.roadType === 'B') ? 0 : 1;
            this.url = dojoString.substitute(config.urls.attributeTableUrl, [this.getSubLayers(this.county)[i]]);

            this.executeQueryTask();

            this.buildDialog();

            this.setUpQueryTask(this.url, {
                returnGeometry: true
            });

            this.symbolLine = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 255, 0]), 5);
        },
        executeQueryTask: function () {
            // summary:
            //      sets up and executes the query task pointing to the correct layer it
            console.log('app/AttributeTable:executeQueryTask', arguments);

            var task = new QueryTask(this.url);
            task.on('complete', lang.hitch(this, 'onTaskComplete'));
            task.on('error', lang.hitch(this, 'onQueryTaskError'));

            var query = new Query();
            query.returnGeometry = false;
            query.where = '1 = 1';
            var fields = [config.fields.OBJECTID];
            for (var fld in config.fields.roads) {
                if (config.fields.roads.hasOwnProperty(fld)) {
                    fields.push(config.fields.roads[fld][0]);
                }
            }
            query.outFields = fields;

            task.execute(query);
        },
        buildDialog: function () {
            // summary:
            //      creates the dialog and grid
            console.log('app/AttributeTable:buildDialog', arguments);

            // create dialog
            var id = this.county + this.roadType + '-attribute-dialog-grid';
            var btnId = id + '_zoomBtn';
            this.dialog = new Dialog({
                title: dojoString.substitute('${0} ${1} Roads Attribute Table', [this.county, this.roadType]),
                content: dojoString.substitute(attributeTableDialogContent, [id, btnId]),
                class: 'attribute-table-dialog'
            });
            registry.byId(btnId).on('click', lang.hitch(this, 'onZoomClick'));
            this.dialog.show();

            // create grid
            var noscrollFlds = [];
            var flds = [];
            var i = 0;
            for (var fld in config.fields.roads) {
                if (config.fields.roads.hasOwnProperty(fld)) {
                    i++;
                    var f = config.fields.roads[fld][0];
                    var desc = config.fields.roads[fld][1];
                    var w = config.fields.roads[fld][2] + 'px';
                    var gridFld = {
                        name: desc,
                        field: f,
                        width: w
                    };
                    if (i < 2) {
                        noscrollFlds.push(gridFld);
                    } else {
                        flds.push(gridFld);
                    }
                }
            }
            this.grid = new DataGrid({
                structure: [
                    {
                        noscroll: true,
                        cells: noscrollFlds
                    }, {
                        cells: flds
                    }
                ],
                style: 'height: ' + (domGeometry.getContentBox(this.dialog.domNode).h - 83) + 'px;'
            }, id);
            this.grid.startup();
        },
        onTaskComplete: function (result) {
            // summary:
            //      updates the data store for the grid
            console.log('app/AttributeTable:onTaskComplete', arguments);

            var fSet = result.featureSet;
            var rows = fSet.features.map(function (f) {
                return f.attributes;
            });

            var oid = config.fields.OBJECTID;
            var data = {
                identifier: oid,
                label: oid,
                items: rows
            };

            var store = new ItemFileReadStore({ data: data });
            this.grid.setStore(store);
        },
        onQueryTaskError: function () {
            // summary:
            //      handles error returned by query task
            console.log('app/AttributeTable:onQueryTaskError', arguments);

            window.alert('There was an error with the attribute table query!');
        },
        show: function () {
            // summary:
            //      displays the dialog
            console.log('app/AttributeTable:show', arguments);

            this.dialog.show();
        },
        destroy: function () {
            // summary:
            //      destroys the dialog and grid
            console.log('app/AttributeTable:destroy', arguments);

            this.dialog.destroyRecursive();
        },
        onZoomClick: function () {
            // summary:
            //      Fires when the user clicks the "Zoom To Selected Road" button
            console.log('app/AttributeTable:onZoomClick', arguments);

            // get selected row
            var row = this.grid.selection.getSelected()[0];
            var rdid = row[config.fields.roads.RD_ID[0]];
            this.query.where = config.fields.roads.RD_ID[0] + " = '" + rdid + "'";
            this.qTask.execute(this.query);
        },
        onQueryTaskComplete: function (result) {
            // summary:
            //      Callback for query task to zoom to road
            console.log('app/AttributeTable:onQueryTaskComplete', arguments);

            var fSet = result.featureSet;
            if (fSet.features.length > 0) {
                var map = config.app.map;
                map.graphics.clear();

                var g = fSet.features[0];
                map.setExtent(g.geometry.getExtent(), true);
                g.setSymbol(this.symbolLine);
                map.graphics.add(g);
            }
        }
    });
});
