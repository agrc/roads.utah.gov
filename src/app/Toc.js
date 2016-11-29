define([
    'app/CheckBoxTree',
    'app/LayerList',
    'app/_CheckBoxTreeNode',

    'dijit/form/CheckBox',
    'dijit/tree/ForestStoreModel',

    'dojo/data/ItemFileWriteStore',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    CheckBoxTree,
    LayerList,
    _CheckBoxTreeNode,

    CheckBox,
    ForestStoreModel,

    ItemFileWriteStore,
    topic,
    declare,
    lang
) {
    return declare([LayerList], {
        // summary:
        //        Toc implementation to allow a root node on the tree.

        baseClass: 'toc-widget',

        // Parameters to constructor
        _buildLayerList: function () {
            // summary:
            //      overriden
            // tags:
            //      private
            console.log('app/Toc:_buildLayerList', arguments);

            var data = {
                identifier: 'id',
                label: 'name',
                items: []
            };

            this.layer.layerInfos.forEach(function (info) {
                if (this.excludedLayerNodes.indexOf(info.name) === -1) {
                    var visible = (this.layer.visibleLayers.indexOf(info.id) !== -1);
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
                    }
                }
            }, this);

            console.dir(data);

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
                    // TODO: use store to get children getValues
                    return Array.isArray(item.children) && !!item.children[0];
                }
            });

            // this is the only change in this function. switched to use the uplan.CheckBoxTree class
            var tree = new CheckBoxTree({
                model: model,
                persist: false,
                showRoot: this.showRoot,
                openOnClick: true,
                id: this.id + '_tree',
                mapServiceVisible: this.layer.visible
            }, this._layerListNode);
            tree.startup();

            topic.publish('_CheckboxTreeNode' + this.id + '.Changed');
        }
    });
});
