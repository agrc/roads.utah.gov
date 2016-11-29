define([
    'dijit/form/CheckBox',
    'dijit/registry',
    'dijit/Tree',

    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    CheckBox,
    registry,
    Tree,

    topic,
    declare,
    lang
) {
    return declare([Tree._TreeNode], {
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
        //        <ul><li>_CheckboxTreeNode.Changed - fired when checkbox is clicked on</li></ul>
        //        <p>
        //            **Exceptions**:
        //        </p>
        //        <ul><li>None</li></ul>
        //        <p>
        //        **Required Files**:
        //        </p>
        //        <ul><li>None</li></ul>
        // example:
        // |
        _checkbox: null,

        // _store: dojo.data.ItemFileWriteStore
        //      a reference to the parent store
        _store: null,

        // _treeId: String
        //        The unique (hopefully) id of the tree. Used to provide a unique id for the node.
        _treeId: '',

        // _mapServiceVisible: Boolean
        _mapServiceVisible: null,

        constructor: function () {
            // summary:
            //        Constructor function for object.
            // args: Object?
            //        The parameters that you want to pass into the object.
            //        Includes: _store, _treeId, _mapServiceVisible
            console.log('app/_CheckBoxTreeNode:constructor', arguments);
        },
        postCreate: function () {
            // summary:
            //      creates the checkbox next to the tree label
            // description:
            //      creates the checkbox with its intial checked value based on the item file read store.
            //        the store queried the web service then was updated by the layer since we don't always
            //        want to show the default visibility. This also sets the disabled attribute on the checkbox
            //        if a child of a group layer node is unchecked.
            // tags:
            //      private
            console.log('app/_CheckBoxTreeNode:postCreate', arguments);

            this.inherited(arguments);

            this._checkbox = new CheckBox({
                id: this.item.root ? null : this._treeId + '_CheckboxTreeNode' +
                    '_' + this._store.getValue(this.item, 'id'),
                checked: this.item.root ? this._mapServiceVisible : this._store.getValue(this.item, 'defaultVisibility')
            }).placeAt(this.expandoNode, 'after');

            if (!this.item.root) {
                var parentId = this._store.getValue(this.item, 'parentLayerId');

                if (parentId > -1) {
                    this._store.fetch({
                        query: { id: parentId },
                        queryOptions: {
                            deep: true
                        },
                        onItem: lang.hitch(this, function (parent) {
                            var vis = this._store.getValue(parent, 'defaultVisibility');
                            this._checkbox.set('disabled', !vis);
                        })
                    });
                }

                this.connect(this.contentNode, 'onclick', function (evt) {
                    // toggle checkbox
                    this._checkbox.set('checked', !this._checkbox.get('checked'));
                    this._onCheckBoxChange(this._checkbox);
                    evt.preventDefault();
                    evt.stopPropagation();
                });
            }
        },
        _onClick: function (evt) {
            // summary:
            //      handling the click event on a tree node
            // description:
            //      check to see if the target of the click was an input, one of our checkboxes for toggling vis,
            //        or the label or something else in the tree
            // tags:
            //      private
            console.log('app/_CheckBoxTreeNode:_onClick', arguments);

            if (evt.target.nodeName === 'INPUT') {
                this._onCheckBoxChange(evt.target);
            } else {
                return this.inherited(arguments);
            }
        },
        _onCheckBoxChange: function (checkbox) {
            // summary:
            //      handles when checkbox was clicked
            // description:
            //      changes the value in the store and publishes to update visibilities
            //        adds an id to the node so we can query for it to change the disabled attribute later on
            // tags:
            //      private
            console.log('app/_CheckBoxTreeNode:_onCheckBoxChange', arguments);

            function toggleChildren(rootNode) {
                var children = rootNode.getChildren();

                if (children) {
                    children.forEach(function (child) {
                        child._checkbox.set('disabled', !checkbox.checked);
                        toggleChildren(child);
                    }, this);
                }
            }

            // check to see if this is the root node
            if (this.item.root) {
                topic.publish('_CheckboxTreeNode' + this._treeId + '.RootChanged', [checkbox.checked]);

                toggleChildren(this);
            } else {
                var children = this._store.getValues(this.item, 'children');

                // returns [null] when has no children
                if (children[0]) {
                    children.forEach(function (cb) {
                        var node = registry.byId(this._treeId + '_CheckboxTreeNode_' + this._store.getValue(cb, 'id'));
                        if (node) {
                            node.set('disabled', !checkbox.checked);
                        }
                    }, this);
                }

                this._store.setValue(this.item, 'defaultVisibility', checkbox.checked);
                this._store.save();

                topic.publish('_CheckboxTreeNode' + this._treeId + '.Changed');
            }
        }
    });
});
