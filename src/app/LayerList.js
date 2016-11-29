define([
    'app/_LayerList',

    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    _LayerList,

    declare,
    lang
) {
    return declare([_LayerList], {
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
        //        <ul><li>LayerList.css</li></ul>
        // example:
        // |

        _pushVisibleLayerId: function (item) {
            // summary:
            //      adds the visible layer id to the array of visible layers
            // description:
            //      pushes the visible layer to the array if its parent is visible or if its not a leaf
            // tags:
            //      private
            console.log('app/LayerList:_pushVisibleLayerId', arguments);

            // skip group layers - we are only concerned about non-group layers
            // TODO: may not work with a group within a group
            if (item.children[0] !== null) {
                return;
            }

            var parentId = this._store.getValue(item, 'parentLayerId');
            var isParentVisible;

            this._store.fetch({
                query: { id: parentId },
                queryOptions: {
                    deep: true
                },
                onItem: lang.hitch(this, function (parent) {
                    isParentVisible = this._store.getValue(parent, 'defaultVisibility');
                })
            });

            if (isParentVisible || parentId === -1) {
                this._visibleLayerIds.push(this._store.getValue(item, 'id'));
            }
        },
        _refreshLayerVisibilty: function () {
            // summary:
            //      shows the visible layers in the map
            // description:
            //      builds the array from the store.fetch and applies it to the map
            // tags:
            //      private
            console.log('app/LayerList:_refreshLayerVisibilty', arguments);

            this._store.fetch({
                query: {
                    defaultVisibility: true
                },
                onItem: lang.hitch(this, '_pushVisibleLayerId'),
                onComplete: lang.hitch(this, '_applyLayerVisibility'),
                queryOptions: {
                    deep: true
                }
            });
        },
        _getLayerVisibility: function (item) {
            // summary:
            //      gets the layer visibility
            // description:
            //      this method is basically to show the state of the checkbox. see comments below
            // tags:
            //      private
            // returns:
            //      Boolean
            console.log('app/LayerList:_getLayerVisibility', arguments);

            var id;
            var parentId;
            var parentVisibile;
            var isVisible;

            id = this._store.getValue(item, 'id');
            parentId = this._store.getValue(item, 'parentLayerId');

            this._store.fetch({
                query: { id: parentId },
                queryOptions: {
                    deep: true
                },
                onItem: lang.hitch(this, function (parent) {
                    parentVisibile = this._store.getValue(parent, 'defaultVisibility');
                })
            });

            if (!parentVisibile && parentId > -1) {
                // return default vis of leaf items of a group layer
                this.layer.layerInfos.some(function (layerInfo) {
                    var match = layerInfo.id === id;
                    if (match) {
                        isVisible = layerInfo.defaultVisibility;
                    }

                    return match;
                }, this);
            } else {
                // return if the id is in the visible layers of the map layer
                return this.layer.visibleLayers.indexOf(id) > -1;
            }

            return isVisible;
        },
        _applyLayerVisibility: function () {
            // summary:
            //      applies visible layers to map
            // description:
            //      pushes the visible layer id's to the esri layer and refreshes the map
            // tags:
            //      private
            console.log('app/LayerList:_applyLayerVisibility', arguments);

            if (this._visibleLayerIds.length > 0) {
                this.layer.setVisibleLayers(this._visibleLayerIds);
            } else {
                this.layer.setVisibleLayers([-1]);
            }

            this._visibleLayerIds = [];
        }
    });
});
