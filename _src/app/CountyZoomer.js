define([
    'agrc/modules/WebAPI',

    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/dom-construct',
    'dojo/Evented',
    'dojo/on',
    'dojo/query',
    'dojo/text!app/templates/CountyZoomer.html',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/Color',
    'esri/geometry/Polygon',
    'esri/layers/GraphicsLayer',
    'esri/symbols/SimpleFillSymbol',
    'esri/tasks/query',
    'esri/tasks/QueryTask',

    'bootstrap'
], function (
    WebAPI,

    config,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    domConstruct,
    Evented,
    on,
    query,
    template,
    declare,
    lang,

    Color,
    Polygon,
    GraphicsLayer,
    SimpleFillSymbol,
    Query,
    QueryTask
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'county-zoomer',

        // maskTask: QueryTask
        maskTask: null,

        // maskSymbol: SimpleFillSymbol
        maskSymbol: new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            null,
            new Color([0, 0, 0, 0.7])
        ),

        // gLayer: GraphicsLayer
        //      The graphics layer that the mask graphic is put into
        gLayer: null,

        // currentCountyKey: String
        //      key used with local storage
        currentCountyKey: 'currentCounty',


        // Params passed in via the constructor

        // map: esri.Map
        map: null,

        constructor: function (params) {
            console.log('app/CountyZoomer:constructor', arguments);

            // create new graphics layer and add to map
            // using a separate graphics layer so that I don't interfere with other stuff
            this.gLayer = new GraphicsLayer();
            params.map.addLayer(this.gLayer);
        },
        postCreate: function () {
            console.log('app/CountyZoomer:postCreate', arguments);

            var currentCounty = window.localStorage.getItem(this.currentCountyKey);

            // build buttons
            config.counties.forEach(function buildButton(county) {
                var btn = domConstruct.create('button', {
                    className: 'btn btn-primary',
                    type: 'button',
                    innerHTML: county
                }, this.body);
                on(btn, 'click', lang.hitch(this, 'onCountyClick'));
            }, this);

            $(this.dialog).modal({
                show: currentCounty === null
            });

            this.webapi = new WebAPI({
                apiKey: config.apiKey
            });

            this.maskTask = new QueryTask(config.urls.maskQueryTaskUrl);
            this.maskTask.on('complete', lang.hitch(this, 'onMaskComplete'));

            if (config.counties.length === 1) {
                this.zoom(config.counties[0], false);
            } else if (currentCounty) {
                this.zoom(currentCounty);
            }
        },
        show: function () {
            // summary:
            //      shows the dialog
            console.log('app/CountyZoomer:show', arguments);

            $(this.dialog).modal('show');
        },
        hide: function () {
            // summary:
            //      hides the dialog
            // param or return
            console.log('app/CountyZoomer:hide', arguments);

            $(this.dialog).modal('hide');
        },
        onQueryComplete: function (features) {
            // summary:
            //      description
            console.log('app/CountyZoomer:onQueryComplete', arguments);

            if (features.length > 0) {
                this.map.setExtent(new Polygon(features[0].geometry).getExtent(), true);

                this.emit('zoomed', this.countyName);
            } else {
                window.alert('No features found for query: ' + this.where);
            }
        },
        onError: function () {
            // summary:
            //      description
            console.log('app/CountyZoomer:onError', arguments);

            window.alert('There was an error with the county query!');
        },
        zoom: function (countyName, updateLocalStorage = true) {
            // summary:
            //      zooms to the county
            // countyName: String
            console.log('app/CountyZoomer:zoom', arguments);

            if (updateLocalStorage) {
                window.localStorage.setItem(this.currentCountyKey, countyName);
            }

            this.gLayer.clear();

            this.where = config.fields.counties.NAME + ' = \'' + countyName.toUpperCase() + '\'';
            this.webapi.search(config.featureClassNames.counties, ['shape@envelope'], {
                predicate: this.where,
                spatialReference: 3857
            }).then(lang.hitch(this, 'onQueryComplete'), lang.hitch(this, 'onError'));

            this.countyName = countyName;

            var queryParams = new Query();
            queryParams.where = this.where;
            queryParams.outFields = [];
            queryParams.returnGeometry = true;
            queryParams.maxAllowableOffset = 50;
            this.maskTask.execute(queryParams);
        },
        onCountyClick: function (evt) {
            // summary:
            //      fires off the webapi request
            console.log('app/CountyZoomer:onCountyClick', arguments);

            this.zoom(evt.target.innerHTML);

            this.hide();
        },
        onMaskComplete: function (evt) {
            // summary:
            //      description
            console.log('app/CountyZoomer:onMaskComplete', arguments);

            var fSet = evt.featureSet;
            if (fSet.features.length > 0) {
                var g = fSet.features[0];
                g.setSymbol(this.maskSymbol);
                this.gLayer.add(g);
            }
        }
    });
});
