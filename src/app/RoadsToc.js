define([
    'app/AttributeTable',
    'app/config',
    'app/_GetSubLayersMixin',

    'dijit/form/Select',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/dom-class',
    'dojo/query',
    'dojo/request/xhr',
    'dojo/text!app/templates/RoadsToc.html',
    'dojo/_base/declare',

    'esri/layers/ArcGISDynamicMapServiceLayer'
], function (
    AttributeTable,
    config,
    _GetSubLayersMixin,

    Select,
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    domClass,
    query,
    xhr,
    template,
    declare,

    ArcGISDynamicMapServiceLayer
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _GetSubLayersMixin], {
        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'roads-toc',

        // subLayerIds: Number[]
        //      An array of id's of the roads layers under the group layer.
        //      Layer Order: B (0), D (1)
        subLayerIds: null,

        // bTable: plpco.AttributeTable
        bTable: null,

        // dTable: plpco.AttributeTable
        dTable: null,

        // county: String
        //      The currently selected county
        county: null,

        // Params passed in via constructor

        // layer: esri.ArcGISDynamicMapServiceLayer
        layer: null,

        // map: Map
        map: null,

        constructor: function (params) {
            // set layer for _GetSubLayersMixin
            this.getSubLayersRoadsLayer = params.layer;
        },
        postCreate: function () {
            // summary:
            //      description
            console.log('app/RoadsToc:constructor', arguments);

            this.wireEvents();

            this.setLegend();
        },
        login: function () {
            // summary:
            //      description
            // param or return
            console.log('app/RoadsToc:login', arguments);

            domClass.remove(this.openTableB, 'hidden');
            domClass.remove(this.openTableD, 'hidden');
            domClass.remove(this.photoContainer, 'hidden');
            this.togglePhotos();

            // get photos legend
            xhr(config.urls.roadsSecureUrl + '/legend', {
                handleAs: 'json',
                query: {
                    f: 'json',
                    token: config.user.token
                }
            }).then(function (data) {
                var photos = data.layers[0].legend[0].imageData;
                this.legendPhotos.src = 'data:image/png;base64,' + photos;
            }.bind(this));
        },
        wireEvents: function () {
            // summary:
            //      description
            console.log('app/RoadsToc:wireEvents', arguments);

            this.connect(this.bCheckbox, 'onClick', this.refreshVisibility);
            this.connect(this.dCheckbox, 'onClick', this.refreshVisibility);
            this.connect(this.photoCheckbox, 'onClick', this.togglePhotos);
        },
        togglePhotos: function () {
            // summary:
            //      description
            // param or return
            console.log('app/RoadsToc:togglePhotos', arguments);

            if (!this.photosLayer) {
                var url = config.urls.roadsSecureUrl + '?token=' + config.user.token;
                this.photosLayer = new ArcGISDynamicMapServiceLayer(url);
                this.photosLayer.setVisibleLayers([0], true);
                this.map.addLayer(this.photosLayer);
                this.map.addLoaderToLayer(this.photosLayer);
            }

            if (this.photoCheckbox.checked) {
                this.photosLayer.show();
            } else {
                this.photosLayer.hide();
            }
        },
        setLegend: function () {
            // summary:
            //      sets the image data for the legend images
            console.log('app/RoadsToc:setLegend', arguments);

            var that = this;
            xhr(config.urls.roadsUrl + '/legend', {
                handleAs: 'json',
                query: {
                    f: 'json'
                }
            }).then(function (data) {
                var b = data.layers[2].legend[0].imageData;
                that.legendB.src = 'data:image/png;base64,' + b;
                var d = data.layers[3].legend[0].imageData;
                that.legendD.src = 'data:image/png;base64,' + d;
            });
        },
        selectCounty: function (county) {
            // summary:
            //      description
            // county: String
            console.log('app/RoadsToc:selectCounty', arguments);

            var subLayerIds = this.getSubLayers(county);

            if (!subLayerIds) {
                return;
            }

            this.county = county;

            // get roads ids
            this.subLayerIds = subLayerIds;

            this.refreshVisibility();

            if (this.bTable) {
                this.bTable.destroy();
                this.bTable = null;
            }
            if (this.dTable) {
                this.dTable.destroy();
                this.dTable = null;
            }
        },
        refreshVisibility: function () {
            // summary:
            //      description
            console.log('app/RoadsToc:refreshVisibility', arguments);

            var visibleLayers = [];
            if (this.bCheckbox.checked) {
                visibleLayers.push(this.subLayerIds[0]);
            }
            if (this.dCheckbox.checked) {
                visibleLayers.push(this.subLayerIds[1]);
            }
            if (visibleLayers.length === 0) {
                this.layer.hide();

                return;
            }

            if (this.layer.visible === false) {
                this.layer.show();
            }
            this.layer.setVisibleLayers(visibleLayers);
        },
        onOpenTableClick: function (evt) {
            // summary:
            //      handles the user clicking on the open table links
            console.log('app/RoadsToc:onOpenTableClick', arguments);

            evt.preventDefault();
            evt.stopPropagation();

            this.openAttributeTable(evt.target);
        },
        openAttributeTable: function (node) {
            // summary:
            //      creates a new attributes table object if needed and then opens it.
            console.log('app/RoadsToc:openAttributeTable', arguments);

            if (node === this.openTableB) {
                if (this.bTable) {
                    this.bTable.show();
                } else {
                    this.bTable = new AttributeTable(this.county, 'B');
                }
            } else if (this.dTable) {
                this.dTable.show();
            } else {
                this.dTable = new AttributeTable(this.county, 'D');
            }
        }
    });
});
