/*global dojo, console, dijit*/

// provide namespace
dojo.provide("plpco.LayerToggler");

// dojo widget requires
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

// other dojo requires
dojo.require("dijit.form.CheckBox");

dojo.declare("plpco.LayerToggler", [dijit._Widget, dijit._Templated], {
    // description:
    //      provides a checkbox to turn a mapservice or layer within a mapservice on and off
    
    // widgetsInTemplate: [private] Boolean
    //      Specific to dijit._Templated.
    widgetsInTemplate: true,
    
    // templatePath: [private] String
    //      Path to template. See dijit._Templated
    templatePath: dojo.moduleUrl("plpco", "templates/LayerToggler.html"),
    
    // baseClass: [private] String
    //    The css class that is applied to the base div of the widget markup
    baseClass: "LayerToggler",
    
    // Parameters to constructor
    
    // layer: esri.layer
    layer: null,
    
    // name: String
    name: null,
    
    // layerId: String [optional]
    //      If this is passed in then the checkbox turns off this layer within
    //      the mapservice instead of the entire map service
    //      Note: I didn't end up using this in this project, but I thought that
    //      I would leave it in here because it might be useful in the future.
    layerId: null,
    
    constructor: function(params, div) {
        // summary:
        //    Constructor method
        // params: Object
        //    Parameters to pass into the widget. Required values include:
        // div: String|DomNode
        //    A reference to the div that you want the widget to be created in.
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
    },
    postCreate: function() {
        // summary:
        //    Overrides method of same name in dijit._Widget.
        // tags:
        //    private
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
    
        this.checkbox.set('checked', this.layer.visible);
        
        this._wireEvents();
    },
    _wireEvents: function() {
        // summary:
        //    Wires events.
        // tags:
        //    private
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        this.connect(this.checkbox, 'onClick', this.toggle);
    },
    toggle: function(evt){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        if (!this.layerId) {
            // toggle map service
            this.layer.setVisibility(this.checkbox.get('checked'));
        } else {
            // toggle layer within map service
            this.layer.setVisibleLayers([this.layerId]);
        }
    }
});