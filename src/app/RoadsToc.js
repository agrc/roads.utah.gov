/*global dojo, plpco, plpcoglobal, console, dijit, plpcoapp*/
dojo.provide("plpco.RoadsToc");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.Select");
dojo.require("plpco._GetSubLayersMixin");
dojo.require("plpco.AttributeTable");

dojo.declare("plpco.RoadsToc", [dijit._Widget, dijit._Templated, plpco._GetSubLayersMixin], {
    // widgetsInTemplate: [private] Boolean
    //      Specific to dijit._Templated.
    widgetsInTemplate: true,

    // templatePath: [private] String
    //      Path to template. See dijit._Templated
    templatePath: dojo.moduleUrl("plpco", "templates/RoadsToc.html"),

    // baseClass: [private] String
    //    The css class that is applied to the base div of the widget markup
    baseClass: "roads-toc",

    // subLayerIds: Number[]
    //      An array of id's of the roads layers under the group layer.
    //      Not the photo layers. See photoLayerIds below.
    //      Layer Order: B Dissolve(0), D Dissolve Queries(1), D Dissolve(2)
    subLayerIds: null,

    // photoLayerIds: Number[]
    //      An array of id's of the photo layers, if any.
    photoLayerIds: null,

    // lengthQueries: {}
    lengthQueries: {
        0: '"' + plpcoglobal.fields.roads.Miles[0] + '" < .5',
        1: '"' + plpcoglobal.fields.roads.Miles[0] + '" < 1'
    },

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

    constructor: function(params) {
        // set layer for _GetSubLayersMixin
        this.getSubLayersRoadsLayer = params.layer;
    },
    postCreate: function() {
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.wireEvents();

        this.setLegend();

        // hide open table links if general role
        if (plpco.role === plpcoglobal.roleNames.plpcoGeneral) {
            dojo.query('.roads-toc .open-table-container').style('display', 'none');
        }
    },
    wireEvents: function() {
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.connect(this.bCheckbox, 'onClick', this.refreshVisibility);
        this.connect(this.dCheckbox, 'onClick', this.refreshVisibility);
        this.connect(this.dDissolvedCheckbox, 'onClick', this.refreshVisibility);
        this.connect(this.querySelect, 'onchange', this.changeQuery);
        this.connect(this.photoCheckbox, 'onClick', this.refreshVisibility);
        dojo.query('.roads-toc .open-table').onclick(dojo.hitch(this, this.onOpenTableClick));
    },
    setLegend: function(){
        // summary:
        //      sets the image data for the legend images
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var that = this;
        dojo.xhrGet({
            url: plpcoglobal.urls.roadsLegend,
            handleAs: 'json',
            content: {
                f: 'json',
                token: plpco.token
            },
            load: function(data){
                if (dojo.isIE === 7) {
                    // base64 doesn't work in IE7. Just hide images. Not worth the time
                    // to make them work with an old browser.
                    dojo.style(that.legendB, 'display', 'none');
                    dojo.style(that.legendD, 'display', 'none');
                    dojo.style(that.legendDQueries, 'display', 'none');
                } else {
                    var b = data.layers[1].legend[0].imageData;
                    that.legendB.src = 'data:image/png;base64,' + b;
                    var d = data.layers[3].legend[0].imageData;
                    that.legendD.src = 'data:image/png;base64,' + d;
                    var queries = data.layers[2].legend[0].imageData;
                    that.legendDQueries.src = 'data:image/png;base64,' + queries;
                    var photos = data.layers[0].legend[0].imageData;
                    that.legendPhotos.src = 'data:image/png;base64,' + photos;
                }
            }
        });
    },
    selectCounty: function(county) {
        // summary:
        //      description
        // county: String
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var subLayerIds = this.getSubLayers(county);

        if (!subLayerIds) {
            return;
        }

        this.county = county;

        // get roads ids
        var len = subLayerIds.length;
        this.subLayerIds = subLayerIds.slice(-3);

        this.refreshVisibility();

        // set layer definitions if general role
        if (plpcoapp.lDialog.role === plpcoglobal.roleNames.plpcoGeneral) {
            var layerDefs = [];
            dojo.forEach(this.subLayerIds, function(id) {
                layerDefs[id] = plpcoglobal.requestDefQuery;
            });
            this.layer.setLayerDefinitions(layerDefs);
        }

        if (this.bTable) {
            this.bTable.destroy();
            this.bTable = null;
        }
        if (this.dTable) {
            this.dTable.destroy();
            this.dTable = null;
        }
    },
    refreshVisibility: function(){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var visibleLayers = [];
        if (this.bCheckbox.get('checked')) {
            visibleLayers.push(this.subLayerIds[0]);
        }
        if (this.dCheckbox.get('checked')){
            visibleLayers.push(this.subLayerIds[2]);
        }
        if (this.dDissolvedCheckbox.get('checked')) {
            visibleLayers.push(this.subLayerIds[1]);
        }
        if (this.photoCheckbox.get('checked')) {
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
        this.changeQuery();
    },
    changeQuery: function(){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var defs = this.layer.layerDefinitions || [];
        defs[this.subLayerIds[1]] = this.lengthQueries[this.querySelect.value];

        this.layer.setLayerDefinitions(defs);
    },
    onOpenTableClick: function(evt){
        // summary:
        //      handles the user clicking on the open table links
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        dojo.stopEvent(evt);

        this.openAttributeTable(evt.target);
    },
    openAttributeTable: function(node){
        // summary:
        //      creates a new attributes table object if needed and then opens it.
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        if (node === this.openTableB) {
            if (!this.bTable) {
                this.bTable = new plpco.AttributeTable(this.county, 'B');
            } else {
                this.bTable.show();
            }
        } else {
            if (!this.dTable) {
                this.dTable = new plpco.AttributeTable(this.county, 'D');
            } else {
                this.dTable.show();
            }
        }
    }
});