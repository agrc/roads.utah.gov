define([
    'app/config',
    'app/_GetSubLayersMixin',
    'app/_QueryTaskMixin',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/registry',

    'dojo/dom-geometry',
    'dojo/string',
    'dojo/text!./templates/AttributeTable.html',
    'dojo/_base/Color',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'dgrid1/OnDemandGrid',
    'dgrid1/extensions/ColumnResizer',
    'dgrid1/Selection',
    'dstore/Memory',

    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/symbols/SimpleLineSymbol',
    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (
    config,
    _GetSubLayersMixin,
    _QueryTaskMixin,

    _TemplatedMixin,
    _WidgetBase,
    registry,

    domGeometry,
    dojoString,
    template,
    Color,
    declare,
    lang,

    Grid,
    ColumnResizer,
    Selection,
    Memory,

    ArcGISDynamicMapServiceLayer,
    SimpleLineSymbol,
    Query,
    QueryTask
) {
    return declare([_WidgetBase, _TemplatedMixin, _GetSubLayersMixin, _QueryTaskMixin], {
        // description:
        //      displays the attribute table of the passed in layer
        templateString: template,

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


        // attributes passed in via constructor

        // county: String
        county: null,

        // roadType: String
        roadType: null,

        // getSubLayersRoadsLayer: Layer
        getSubLayersRoadsLayer: null,


        postCreate() {
            console.log('app/AttributeTable:postCreate', arguments);

            // query for data that will populate data grid
            var i = (this.roadType === 'B') ? 0 : 1;
            this.url = dojoString.substitute(config.urls.roadsSecureUrl + '/${0}', [this.getSubLayers(this.county)[i]]);

            this.executeQueryTask();

            this.setUpQueryTask(this.url, {
                returnGeometry: true
            });

            this.symbolLine = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 255, 0]), 5);

            $(this.dialog).on('shown.bs.modal', () => {
                this.shown = true;
            });

            this.show();
        },
        executeQueryTask() {
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
        buildDialog(rows) {
            // summary:
            //      creates the dialog and grid
            console.log('app/AttributeTable:buildDialog', arguments);

            const columns = Object.values(config.fields.roads).map(fieldInfo => {
                const [field, label, width] = fieldInfo;

                return {
                    label,
                    field,
                    width,
                    sortable: true
                };
            });

            const CustomGrid = declare([Grid, ColumnResizer, Selection]);

            this.grid = new CustomGrid({
                selectionMode: 'single',
                columns,
                collection: new Memory({
                    idProperty: config.fields.OBJECTID,
                    data: rows
                })
            }, this.gridDiv);

            if (this.shown) {
                console.log('shown, starting up');
                this.grid.startup();
            } else {
                const intervalID = window.setInterval(() => {
                    if (this.shown) {
                        console.log('set interval shown, starting up');
                        this.grid.startup();
                        window.clearInterval(intervalID);
                    }
                }, 100);
            }
        },
        onTaskComplete(result) {
            // summary:
            //      updates the data store for the grid
            console.log('app/AttributeTable:onTaskComplete', arguments);

            var fSet = result.featureSet;
            var rows = fSet.features.map(f => f.attributes);

            this.buildDialog(rows);
        },
        onQueryTaskError() {
            // summary:
            //      handles error returned by query task
            console.log('app/AttributeTable:onQueryTaskError', arguments);

            window.alert('There was an error with the attribute table query!');
        },
        show() {
            // summary:
            //      displays the dialog
            console.log('app/AttributeTable:show', arguments);

            $(this.dialog).modal('show');
        },
        hide() {
            // summary:
            //      hides the dialog
            console.log('app/AttributeTable:hide', arguments);

            $(this.dialog).modal('hide');
        },
        destroy() {
            // summary:
            //      destroys the dialog and grid
            console.log('app/AttributeTable:destroy', arguments);

            this.dialog.destroyRecursive();
        },
        onZoomClick() {
            // summary:
            //      Fires when the user clicks the "Zoom To Selected Road" button
            console.log('app/AttributeTable:onZoomClick', arguments);

            // get selected row
            var id = Object.keys(this.grid.selection)[0];
            this.query.where = `${config.fields.OBJECTID} = ${id}`;
            this.qTask.execute(this.query);
            this.hide();
        },
        onQueryTaskComplete(result) {
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
