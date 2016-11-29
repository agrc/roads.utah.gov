define([
    'app/_CheckBoxTreeNode',

    'dijit/Tree',

    'dojo/_base/declare'
], function (
    _CheckBoxTreeNode,

    Tree,

    declare
) {
    return declare([Tree], {
        // description:
        //        **Summary**:
        //        <p>
        //        **Owner(s)**: Steve Gourley
        //        </p>
        //        <p>
        //        **Description**:
        //        A class that inherits from dijit.Tree to overwrite the node creation method so we can
        //        create checkboxes. Mixin is too late in the process
        //        and misses the first level of nodes. look at dijit.Tree for documentation.
        //        </p>
        //        <p>
        //        **Published Channels/Events**:
        //        </p>
        //        <ul><li>Same as dijit.Tree</li></ul>
        //        <p>
        //            **Exceptions**:
        //        </p>
        //        <ul><li>dijit.Tree</li></ul>
        //        <p>
        //        **Required Files**:
        //        </p>
        //        <ul><li>dijit.Tree</li></ul>
        // example:
        // |

        // mapServiceVisible: Boolean
        //        Used to populate the root node with the correct value when created
        mapServiceVisible: null,

        _createTreeNode: function (args) {
            // summary:
            //      create checkbox node
            // description:
            //      overrides the dijit.Tree method and creates an agrx checkbox tree node
            // tags:
            //      private
            // returns:
            //      agrc.widgets.map._CheckboxTreeNode
            console.log('app/CheckBoxTree:_createTreeNode', arguments);

            args._store = this.model.store;
            args._treeId = this.id;
            args._mapServiceVisible = this.mapServiceVisible;

            return new _CheckBoxTreeNode(args);
        }
    });
});
