define([
    'app/AttributeTable',
    'app/config',
    'app/_GetSubLayersMixin',

    'dijit/form/Select',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/query',
    'dojo/request/xhr',
    'dojo/text!app/templates/RoadsToc.html',
    'dojo/_base/declare'
], function (
    AttributeTable,
    config,
    _GetSubLayersMixin,

    Select,
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    query,
    xhr,
    template,
    declare
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _GetSubLayersMixin], {
        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'roads-toc',

        // subLayerIds: Number[]
        //      An array of id's of the roads layers under the group layer.
        //      Not the photo layers. See photoLayerIds below.
        //      Layer Order: B Dissolve(0), D Dissolve Queries(1), D Dissolve(2)
        subLayerIds: null,

        // photoLayerIds: Number[]
        //      An array of id's of the photo layers, if any.
        photoLayerIds: null,

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

            // hide open table links if general role
            if (config.role === config.roleNames.plpcoGeneral) {
                query('.roads-toc .open-table-container').style('display', 'none');
            }
        },
        wireEvents: function () {
            // summary:
            //      description
            console.log('app/RoadsToc:wireEvents', arguments);

            this.connect(this.bCheckbox, 'onClick', this.refreshVisibility);
            this.connect(this.dCheckbox, 'onClick', this.refreshVisibility);
            this.connect(this.photoCheckbox, 'onClick', this.refreshVisibility);
        },
        setLegend: function () {
            // summary:
            //      sets the image data for the legend images
            console.log('app/RoadsToc:setLegend', arguments);

            var that = this;
            xhr(config.urls.roadsLegend, {
                handleAs: 'json',
                query: {
                    f: 'json',
                    token: config.token
                }
            }).then(function (data) {
                var b = data.layers[1].legend[0].imageData;
                that.legendB.src = 'data:image/png;base64,' + b;
                var d = data.layers[3].legend[0].imageData;
                that.legendD.src = 'data:image/png;base64,' + d;
                var photos = data.layers[0].legend[0].imageData;
                that.legendPhotos.src = 'data:image/png;base64,' + photos;
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
            if (this.photoCheckbox.checked) {
                visibleLayers.push(0);
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
