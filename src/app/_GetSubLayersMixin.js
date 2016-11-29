define([
    'dojo/_base/declare'
], function (
    declare
) {
    return declare(null, {
        // summary:
        //      Provides functionality for finding the matching county group layer and
        //      returning the associated sub layer ids.
        //      Used in RoadsToc and RoadsIdentify

        // getSubLayersRoadsLayer: esri.layers.ArcGISDynamicMapServiceLayer
        getSubLayersRoadsLayer: null,

        getSubLayers: function (county) {
            // summary:
            //      description
            console.log('app/_GetSubLayersMixin:getSubLayers', arguments);

            // find matching group layer and associated sub layers
            var gLayerInfo;
            this.getSubLayersRoadsLayer.layerInfos.some(function (info) {
                if (info.name.toLowerCase() === county.toLowerCase()) {
                    gLayerInfo = info;

                    return true;
                }

                return false;
            }, this);

            if (gLayerInfo) {
                return gLayerInfo.subLayerIds;
            }
            // swallow
        }
    });
});
