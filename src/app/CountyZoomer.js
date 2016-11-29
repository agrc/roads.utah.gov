define([
    'app/config',

    'dijit/Dialog',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/query',
    'dojo/text!app/templates/CountyZoomer.html',
    'dojo/_base/Color',
    'dojo/_base/declare',

    'esri/layers/GraphicsLayer',
    'esri/symbols/SimpleFillSymbol',
    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (
    config,

    Dialog,
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    query,
    template,
    Color,
    declare,

    GraphicsLayer,
    SimpleFillSymbol,
    Query,
    QueryTask
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // widgetsInTemplate: [private] Boolean
        //      Specific to dijit._Templated.
        widgetsInTemplate: true,

        templateString: template,

        // baseClass: [private] String
        //    The css class that is applied to the base div of the widget markup
        baseClass: 'county-zoomer',

        // query: Query
        query: null,

        // qTask: QueryTask
        qTask: null,

        // maskTask: QueryTask
        maskTask: null,

        // maskSymbol: SimpleFillSymbol
        maskSymbol: new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            null, new Color([0, 0, 0, 0.5])),

        // gLayer: GraphicsLayer
        //      The graphics layer that the mask graphic is put into
        gLayer: null,

        // Params passed in via the constructor

        // map: esri.Map
        map: null,

        constructor: function (params) {
            console.log('app/CountyZoomer:constructor', arguments);

            this.buildQueryTasks();

            // create new graphics layer and add to map
            // using a separate graphics layer so that I don't interfere with other stuff
            this.gLayer = new GraphicsLayer();
            params.map.addLayer(this.gLayer);
        },
        postCreate: function () {
            console.log('app/CountyZoomer:postCreate', arguments);

            this.dialog.show();
            this.wireEvents();
        },
        wireEvents: function () {
            console.log('app/CountyZoomer:wireEvents', arguments);

            query('.county-zoomer-dialog td').onclick(this, this.onCountyClick);
        },
        buildQueryTasks: function () {
            // summary:
            //      description
            console.log('app/CountyZoomer:buildQueryTasks', arguments);

            this.query = new Query();
            this.query.outFields = [];
            this.query.returnGeometry = true;

            // let arcgis server generalize the geometry so that it will be less to send back
            // no big deal since i'm just using this geometry to zoom the map to the extent
            this.query.maxAllowableOffset = 50;

            this.qTask = new QueryTask(config.urls.countyQueryTaskUrl);
            this.maskTask = new QueryTask(config.urls.maskQueryTaskUrl);

            this.connect(this.qTask, 'onComplete', this, 'onQueryComplete');
            this.connect(this.qTask, 'onError', this, 'onError');
            this.connect(this.maskTask, 'onComplete', this, 'onMaskComplete');
            this.connect(this.maskTask, 'onError', this, 'onError');
        },
        onQueryComplete: function (fSet) {
            // summary:
            //      description
            console.log('app/CountyZoomer:onQueryComplete', arguments);

            if (fSet.features.length > 0) {
                this.map.setExtent(fSet.features[0].geometry.getExtent(), true);
            } else {
                window.alert('No features found for query: ' + this.query.where);
            }
        },
        onError: function () {
            // summary:
            //      description
            console.log('app/CountyZoomer:onError', arguments);

            window.alert('There was an error with the county query!');
        },
        zoom: function (countyName) {
            // summary:
            //      zooms to the county
            // countyName: String
            console.log('app/CountyZoomer:zoom', arguments);

            this.query.where = config.fields.counties.NAME + ' = \'' + countyName.toUpperCase() + '\'';
            this.qTask.execute(this.query);
            this.maskTask.execute(this.query);

            this.gLayer.clear();
        },
        onCountyClick: function (evt) {
            // summary:
            //      description
            console.log('app/CountyZoomer:onCountyClick', arguments);

            var county = evt.target.innerHTML;

            this.zoom(county);

            this.dialog.hide();
        },
        onMaskComplete: function (fSet) {
            // summary:
            //      description
            console.log('app/CountyZoomer:onMaskComplete', arguments);

            if (fSet.features.length > 0) {
                var g = fSet.features[0];
                g.setSymbol(this.maskSymbol);
                this.gLayer.add(g);
            } else {
                window.alert('No mask feature found for: ' + this.query.where);
            }
        }
    });
});
