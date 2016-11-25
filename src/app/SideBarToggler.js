/*global dojo, console, dijit*/

// provide namespace
dojo.provide("plpco.SideBarToggler");

// dojo widget requires
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

// other dojo requires
dojo.require("dojo.fx");

dojo.declare("plpco.SideBarToggler", [dijit._Widget, dijit._Templated], {
    // description:
    //      
    
    // widgetsInTemplate: [private] Boolean
    //      Specific to dijit._Templated.
    widgetsInTemplate: true,
    
    // templatePath: [private] String
    //      Path to template. See dijit._Templated
    templatePath: dojo.moduleUrl("plpco", "templates/SideBarToggler.html"),
    
    // baseClass: [private] String
    //    The css class that is applied to the base div of the widget markup
    baseClass: "side-bar-toggler",
    
    // open: Boolean
    open: true,
    
    // openWidth: Number
    //      The width of the sidebar when it's open
    openWidth: 0,
    
    // Parameters to constructor
    
    // sidebar: domNode
    sidebar: null,
    
    // mainContainer: dijit.layout.BorderContainer
    mainContainer: null,
    
    // map: agrc.widgets.map.BaseMap
    map: null,
    
    // centerContainer: dijit.layout.ContentPane
    //      The center region of the border container
    centerContainer: null,
    
    constructor: function(params, div) {
        // summary:
        //    Constructor method
        // params: Object
        //    Parameters to pass into the widget. Required values include:
        // div: String|DomNode
        //    A reference to the div that you want the widget to be created in.
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        this.openWidth = dojo.style(params.sidebar, 'width');
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
        
        this.connect(this.domNode, 'onclick', this.onClick);
    },
    onClick: function(params){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        // adjust sidebar width
        var width = (this.open) ? 0 : this.openWidth;
        var centerWidth = (this.open) ? this.openWidth : -this.openWidth;
        var that = this;
        var sidebarAni = dojo.animateProperty({
            node: this.sidebar,
            properties: {
                width: width
            },
            onEnd: function(){
                that.mainContainer.layout();
                that.map.resize();
            },
            duration: 200
        });
        var mainAni = dojo.animateProperty({
            node: this.centerContainer,
            properties: {
                width: dojo.style(this.centerContainer, 'width') + centerWidth,
                left: dojo.style(this.centerContainer, 'left') - centerWidth
            },
            duration: 200
        });
        dojo.fx.combine([sidebarAni, mainAni]).play();
        
        // flip arrow
        dojo.toggleClass(this.arrowImg, 'closed');
        
        this.open = !this.open;
    }
});