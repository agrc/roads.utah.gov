/*global dojo, console, dijit*/

// provide namespace
dojo.provide("plpco.UserMenu");

// dojo widget requires
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

// other dojo requires
dojo.require("dijit.form.Button");

dojo.declare("plpco.UserMenu", [dijit._Widget, dijit._Templated], {
    // description:
    //      summary
    
    // widgetsInTemplate: [private] Boolean
    //      Specific to dijit._Templated.
    widgetsInTemplate: true,
    
    // templatePath: [private] String
    //      Path to template. See dijit._Templated
    templatePath: dojo.moduleUrl("plpco", "templates/UserMenu.html"),
    
    // baseClass: [private] String
    //    The css class that is applied to the base div of the widget markup
    baseClass: "user-menu",
    
    // Parameters to constructor
    
    // email: String
    email: '',
    
    // role: String
    role: '',
    
    constructor: function(params, div) {
        // summary:
        //    Constructor method
        // params: Object
        //    Parameters to pass into the widget. Required values include:
        // div: String|DomNode
        //    A reference to the div that you want the widget to be created in.
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        // get rid of 'PLPCO_' prefix to role
        params.role = params.role.slice(6);
    },
    postCreate: function() {
        // summary:
        //    Overrides method of same name in dijit._Widget.
        // tags:
        //    private
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        this._wireEvents();
    },
    _wireEvents: function() {
        // summary:
        //    Wires events.
        // tags:
        //    private
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        this.connect(this.logOutBtn, 'onClick', 'onLogOut');
    },
    onLogOut: function(evt){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
    }
});
