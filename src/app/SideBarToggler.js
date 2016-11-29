define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/fx',
    'dojo/text!app/templates/SideBarToggler.html',
    'dojo/_base/declare',
    'dojo/_base/fx'
], function (
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    domClass,
    domStyle,
    coreFx,
    template,
    declare,
    baseFx
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //

        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'side-bar-toggler',

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

        constructor: function (params) {
            // summary:
            //    Constructor method
            // params: Object
            //    Parameters to pass into the widget. Required values include:
            console.log('app/SideBarToggler:constructor', arguments);

            this.openWidth = domStyle.get(params.sidebar, 'width');
        },
        postCreate: function () {
            // summary:
            //    Overrides method of same name in dijit._Widget.
            // tags:
            //    private
            console.log('app/SideBarToggler:postCreate', arguments);

            this._wireEvents();
        },
        _wireEvents: function () {
            // summary:
            //    Wires events.
            // tags:
            //    private
            console.log('app/SideBarToggler:_wireEvents', arguments);

            this.connect(this.domNode, 'onclick', this.onClick);
        },
        onClick: function () {
            // summary:
            //      description
            console.log('app/SideBarToggler:onClick', arguments);

            // adjust sidebar width
            var width = (this.open) ? 0 : this.openWidth;
            var centerWidth = (this.open) ? this.openWidth : -this.openWidth;
            var that = this;
            var sidebarAni = baseFx.animateProperty({
                node: this.sidebar,
                properties: {
                    width: width
                },
                onEnd: function () {
                    that.mainContainer.layout();
                    that.map.resize();
                },
                duration: 200
            });
            var mainAni = baseFx.animateProperty({
                node: this.centerContainer,
                properties: {
                    width: domStyle.get(this.centerContainer, 'width') + centerWidth,
                    left: domStyle.get(this.centerContainer, 'left') - centerWidth
                },
                duration: 200
            });
            coreFx.combine([sidebarAni, mainAni]).play();

            // flip arrow
            domClass.toggle(this.arrowImg, 'closed');

            this.open = !this.open;
        }
    });
});
