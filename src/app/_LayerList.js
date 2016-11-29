define([
    'app/CheckBoxTree',
    'app/_CheckBoxTreeNode',

    'dijit/tree/ForestStoreModel',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/data/ItemFileWriteStore',
    'dojo/text!app/templates/_LayerListTemplate.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    CheckBoxTree,
    _CheckBoxTreeNode,

    ForestStoreModel,
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    ItemFileWriteStore,
    template,
    topic,
    declare,
    lang
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //        **Summary**:
        //        <p>
        //        **Owner(s)**: Steve Gourley, Scott Davis, Barry Biediger
        //        </p>
        //        <p>
        //        </p>
        //        <p>
        //        **Description**:
        //
        //        </p>
        //        <p>
        //        **Published Channels/Events**:
        //        </p>
        //        <ul><li>None</li></ul>
        //        <p>
        //            **Exceptions**:
        //        </p>
        //        <ul><li>None</li></ul>
        //        <p>
        //        **Required Files**:
        //        </p>
        //        <ul><li>None</li></ul>
        //        <p>
        //        **TODO**:
        //        <ul><li>Make layers work as an []</li>
        //        <li>Try to refactor out web service call</li>
        //        <li>Create google map wrapper</li></ul>
        //        </p>
        // example:
        // |

        baseClass: 'agrc',
        widgetsInTemplate: true,
        templateString: template,

        // _layerListNode: dojoattachpoint
        //      An attachpoint for the toc node

        // _store: Object
        //      The store that is aiding the layer list
        _store: null,

        // _url: String
        //      the url to the webservice
        _url: null,

        // _visibleLayerIds: []
        //      a temporary place for building the visible layer id's array
        _visibleLayerIds: null,

        // Parameters passed in via the constructor

        // layer: esri.Layer || gmaps.ags.MapOverlay
        //      The layer to build the layer list from
        layer: null,

        // rootName: String
        //        The label of the root node on the tree
        rootName: 'Map Service',

        // showRoot: Boolean
        //        If true then the root node of the tree is show and wired to
        //        toggle the visibility of the map service.
        showRoot: false,

        // excludedLayerNodes: []
        //      A string array of excluded checkbox node names to remove from the LayerList.
        //      Make sure to encode \ like \\ etc.
        excludedLayerNodes: null,

        // includedLayerNodes: []
        //      A string array ofcheckbox layer nodes names to include in the LayerList.
        //      Make sure to encode \ like \\ etc.
        includedLayerNodes: null,

        constructor: function () {
            // summary:
            //        Constructor function for object.
            // args: Object
            //        The parameters that you want to pass into the object.
            //        Includes: layer. Optionally: rootName, showRoot.
            // layer: esri.Layer || gmaps.ags.MapOverlay
            //        The ArcGISDynamicMapServiceLayer to build the layer list from
            //        (For GoogleToc this needs to be a Google gmaps.ags.MapOverlay)
            console.log('app/_LayerList:constructor', arguments);

            this._visibleLayerIds = [];
            this.excludedLayerNodes = [];
            this.includedLayerNodes = [];
        },
        postCreate: function () {
            // summary:
            //        Sets up the widget
            // description:
            //
            console.log('app/_LayerList:postCreate', arguments);

            this.setupSubscriptions();

            this._buildLayerList(this.layer);
            this.inherited(arguments);
        },
        setupSubscriptions: function () {
            // summary:
            //      where all the pub sub goes on
            // description:
            //      by default pub sub the clicking on a checkbox to set visibility or to close map layers
            // tags:
            //      public
            console.log('app/_LayerList:setupSubscriptions', arguments);

            this.subscribe('_CheckboxTreeNode' + this.id + '_tree.Changed',
            lang.hitch(this, '_refreshLayerVisibilty'));

            this.subscribe('_CheckboxTreeNode' + this.id + '_tree.RootChanged',
            lang.hitch(this, 'toggleMapServiceLayerVisibility'));
        },
        _buildLayerList: function (layer) {
            // summary:
            //      formats the layer infos into store format
            // tags:
            //      private
            console.log('app/_LayerList:_buildLayerList', arguments);

            var data = {
                identifier: 'id',
                label: 'name',
                items: []
            };

            layer.layerInfos.forEach(function (info) {
                var showNode = false;
                if (this.excludedLayerNodes.indexOf(info.name) === -1) {
                    showNode = true;
                }

                if (this.includedLayerNodes.length > 0) {
                    showNode = this.includedLayerNodes.indexOf(info.name) > -1;
                }

                if (showNode) {
                    var visible = layer.visibleLayers.indexOf(info.id) > -1;

                    var item = {
                        name: info.name,
                        id: info.id,
                        children: null,
                        defaultVisibility: info.defaultVisibility,
                        visible: visible,
                        parentLayerId: info.parentLayerId
                    };

                    if (item.parentLayerId === -1) {
                        data.items.push(item);
                    } else {
                        data.items.some(function (matchItem) {
                            if (matchItem.id === item.parentLayerId) {
                                if (matchItem.children === null) {
                                    matchItem.children = [];
                                }

                                matchItem.children.push(item);

                                return true;
                            }

                            return false;
                        }, this);
                    }
                }
            }, this);

            this._store = new ItemFileWriteStore({
                data: data
            });

            this._store.fetch({
                onItem: lang.hitch(this, '_updateStoreWithActualValues'),
                onComplete: lang.hitch(this._store, 'save'),
                queryOptions: {
                    deep: true
                }
            });

            var model = new ForestStoreModel({
                store: this._store,
                labelAttr: 'name',
                childrenAttr: 'children',
                layoutAllign: 'right',
                deferItemLoadingUntilExpand: false,
                rootLabel: this.rootName
            });

            lang.mixin(model, {
                mayHaveChildren: function (item) {
                    return Array.isArray(item.children) && !!item.children[0];
                }
            });

            var tree = new CheckBoxTree({
                model: model,
                persist: false,
                showRoot: this.showRoot,
                openOnClick: true,
                id: this.id + '_tree',
                mapServiceVisible: layer.visible
            }, this._layerListNode);

            tree.startup();

            topic.publish('_CheckboxTreeNode' + this.id + '_tree.Changed');
        },
        errorFunc: function (e) {
            // summary:
            //      error handler
            // description:
            //      error publisher
            // tags:
            //      public
            console.log('app/_LayerList:mayHaveChildren', arguments);

            topic.publish('_LayerList' + this.id + '.Error', [e]);
        },
        _updateStoreWithActualValues: function (item) {
            // summary:
            //      adds the layer vis from the layer itself not the mxd
            // description:
            //      update visibility param from the layer passed in not the default value
            // tags:
            //      private
            // returns:
            //      Object
            console.log('app/_LayerList:_updateStoreWithActualValues', arguments);

            this._store.setValue(item, 'defaultVisibility', this._getLayerVisibility(item));
        },
        toggleMapServiceLayerVisibility: function (visible) {
            // summary:
            //        Turns on or off the map service visibility
            // visible: Boolean
            console.log('app/_LayerList:toggleMapServiceLayerVisibility', arguments);

            this.layer.setVisibility(visible);
        }
    });
});
