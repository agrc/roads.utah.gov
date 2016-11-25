/*global dojo, console*/
dojo.provide("plpco._GetSubLayersMixin");

dojo.declare("plpco._GetSubLayersMixin", null,{
    // summary:
    //      Provides functionality for finding the matching county group layer and
    //      returning the associated sub layer ids.
    //      Used in RoadsToc and RoadsIdentify

    // getSubLayersRoadsLayer: esri.layers.ArcGISDynamicMapServiceLayer
    getSubLayersRoadsLayer: null,

    getSubLayers: function(county){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        // find matching group layer and associated sub layers
        var gLayerInfo;
        dojo.some(this.getSubLayersRoadsLayer.layerInfos, function(info){
            if (info.name.toLowerCase() === county.toLowerCase()) {
                gLayerInfo = info;
                return true;
            } else {
                return false;
            }
        }, this);

        if (!gLayerInfo) {
            // throw new Error('No matching county found!');
            // swallow
        } else {
            return gLayerInfo.subLayerIds;
        }
    }
});