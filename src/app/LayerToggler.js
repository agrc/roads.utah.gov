define([
    'dijit/form/CheckBox',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/text!app/templates/LayerToggler.html',
    'dojo/_base/declare'
], function (
    CheckBox,
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    template,
    declare
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //      provides a checkbox to turn a mapservice or layer within a mapservice on and off

        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'LayerToggler',


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

        constructor: function () {
            // summary:
            //    Constructor method
            // params: Object
            //    Parameters to pass into the widget. Required values include:
            // div: String|DomNode
            //    A reference to the div that you want the widget to be created in.
            console.log('app/LayerToggler:constructor', arguments);
        },
        postCreate: function () {
            // summary:
            //    Overrides method of same name in dijit._Widget.
            // tags:
            //    private
            console.log('app/LayerToggler:postCreate', arguments);

            this.checkbox.set('checked', this.layer.visible);

            this._wireEvents();
        },
        _wireEvents: function () {
            // summary:
            //    Wires events.
            // tags:
            //    private
            console.log('app/LayerToggler:_wireEvents', arguments);

            this.connect(this.checkbox, 'onClick', this.toggle);
        },
        toggle: function () {
            // summary:
            //      description
            console.log('app/LayerToggler:toggle', arguments);

            if (this.layerId) {
                // toggle layer within map service
                this.layer.setVisibleLayers([this.layerId]);
            } else {
                // toggle map service
                this.layer.setVisibility(this.checkbox.get('checked'));
            }
        }
    });
});
