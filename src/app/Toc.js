/*global dojo, console, agrc, dijit, plpco*/
// provide namespace
dojo.provide("plpco.Toc");

dojo.require("agrc.widgets.layer.LayerList");
dojo.require("dijit.form.CheckBox");
dojo.require("agrc.widgets.layer._CheckboxTreeNode");
dojo.require("agrc.widgets.layer.CheckBoxTree");

dojo.declare("plpco.Toc", agrc.widgets.layer.LayerList, {
	// summary:
	//		Toc implementation to allow a root node on the tree.
	
	baseClass: "toc-widget",
	
	// Parameters to constructor
	_buildLayerList: function () {
		// summary:
		//      overriden
		// tags:
		//      private
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

		// if (!response) {
			// this.errorFunc('Could not fetch layer list from service');
			// return;
		// }
		
		var data = {
			identifier: "id",
			label: "name",
			items: []
		};
		
		dojo.forEach(this.layer.layerInfos, function(info){
		    if (dojo.indexOf(this.excludedLayerNodes, info.name) === -1){
		        var visible = (dojo.indexOf(this.layer.visibleLayers, info.id) != -1);
                var item = {
                    name: info.name,
                    id: info.id,
                    children: null,
                    defaultVisibility: info.defaultVisibility,
                    visible: visible,
                    parentLayerId: info.parentLayerId
                };
                if (item.parentLayerId === -1){
                    data.items.push(item);
                } 
                // skip children of group layers
                // else {
                    // dojo.some(data.items, function(matchItem){
                        // if (matchItem.id === item.parentLayerId){
                            // if (matchItem.children === null){
                                // matchItem.children = [];
                            // }
                            // matchItem.children.push(item);
                            // return true;
                        // } else {
                            // return false;
                        // }
                    // }, this);
                // }
		    }
		}, this);
		
		console.dir(data);
		
		this._store = new dojo.data.ItemFileWriteStore({
			data: data
		});

		this._store.fetch({
			onItem: dojo.hitch(this, '_updateStoreWithActualValues'),
			onComplete: dojo.hitch(this._store, 'save'),
			queryOptions: {
				deep: true
			}
		});

		var model = new dijit.tree.ForestStoreModel({
			store: this._store,
			labelAttr: "name",
			childrenAttr: "children",
			layoutAllign: "right",
			deferItemLoadingUntilExpand: false,
			rootLabel: this.rootName
		});

		dojo.mixin(model, {
			mayHaveChildren: function (item) {
				//TODO: use store to get children getValues
				return !!(dojo.isArray(item.children) && !!item.children[0]) ? true : false;
			}
		});
		
		// this is the only change in this function. switched to use the uplan.CheckBoxTree class
		var tree = new plpco.CheckBoxTree({
			model: model,
			persist: false,
			showRoot: this.showRoot,
			openOnClick: true,
			id: this.id + "_tree",
			mapServiceVisible: this.layer.visible
		}, this._layerListNode);

		tree.startup();

		dojo.publish("agrc.widgets.layer._CheckboxTreeNode" + this.id + ".Changed");
	}
});

dojo.declare("plpco._CheckBoxTreeNode", agrc.widgets.layer._CheckboxTreeNode, {
	// summary:
	//		Inherits from agrc widget. Changed to create a dijit checkbox instead of plain html
	
	postCreate: function () {
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
		
		this.inherited(arguments);
		
		this.connect(this.contentNode, "onclick", function(evt){
			// toggle checkbox
			this._checkbox.set("checked", !this._checkbox.get("checked"));
			this._onCheckBoxChange(this._checkbox);
			dojo.stopEvent(evt);
		});
    }
});

dojo.declare("plpco.CheckBoxTree", agrc.widgets.layer.CheckBoxTree, {
    _createTreeNode: function (args) {
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        args._store = this.model.store;
        args._treeId = this.id;
        args._mapServiceVisible = this.mapServiceVisible;

        return new plpco._CheckBoxTreeNode(args);
    }
});
