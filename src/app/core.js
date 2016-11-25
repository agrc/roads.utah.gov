/*global dojo, console, agrc, plpco, plpcoglobal, dijit, ijit, esri, location,
setTimeout*/
/*jslint sub:true*/
dojo.provide("js.core");

dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("agrc.widgets.map.BaseMap");
dojo.require("plpco.SideBarToggler");
dojo.require("dijit.TitlePane");
dojo.require("ijit.widgets.layout.PaneStack");
dojo.require("agrc.widgets.locate.TRSsearch");
dojo.require("ijit.modules.ErrorLogger");
dojo.require("plpco.CountyZoomer");
dojo.require("plpco.LayerToggler");
dojo.require("plpco.Toc");
dojo.require("plpco.RoadsToc");
dojo.require("plpco.LogInDialog");
dojo.require("plpco.UserMenu");
dojo.require("plpco.Identify");
dojo.require("agrc.widgets.map.BaseMapSelector");
dojo['require']('esri.dijit.Legend');
dojo.require('plpco.MagicZoom');

var plpcoapp;
dojo.declare("plpcoapp", null, {
    // lDialog: plpco.LogInDialog
    lDialog: null,

    // uMenu: plpco.UserMenu
    uMenu: null,

    // identify: plpco.Identify
    identify: null,

    // map: agrc.widgets.map.Basemap
    map: null,

    // roadsToc: plpco.RoadsToc
    roadsToc: null,

    // magicZooms: plpco.MagicZoom[]
    magicZooms: [],

    // overlaysLyr: esri.layers.ArcGISDynamicMapServiceLayer
    overlaysLyr: null,

    // backgroundLyrsLyr: esri.layers.ArcGISDynamicMapServiceLayer
    backgroundLyrsLyr: null,

    // leg: esri.dijit.Legend
    leg: null,

    constructor: function(){
        // summary:
        //      first function to fire after page loads
        console.info("constructor", arguments);

        dojo.byId('version').innerHTML = plpcoglobal.version;

        plpco.errorLogger = new ijit.modules.ErrorLogger({
            appName: 'PLPCORoadsViewer'
        });

        // global reference
        plpcoapp = this;

        this.lDialog = new plpco.LogInDialog(null, 'log-in');
        if (this.lDialog.loggedIn) {
            this.afterLogInSuccessful(this.lDialog.email, this.lDialog.role);
        } else {
            dojo.connect(this.lDialog, "onLogInSuccessful", this, 'afterLogInSuccessful');
        }
    },
    afterLogInSuccessful: function(email, role){
        // summary:
        //      Fires after the user has successfully logged in
        // email: String
        // role: String
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        plpco.errorLogger.userName = email;

        this.uMenu = new plpco.UserMenu({
            email: email,
            role: role
        }, 'user-menu');

        var paneStack = new ijit.widgets.layout.PaneStack(null, 'pane-stack');

        this.initMap();

        var sb = new plpco.SideBarToggler({
            sidebar: dojo.byId('side-bar'),
            mainContainer: dijit.byId('main-container'),
            map: this.map,
            centerContainer: dojo.byId('center')
        }, 'sidebar-toggle');

        if (role !== plpcoglobal.roleNames.plpcoGeneral) {
            // get secure layer for identify and attribute table to use
            plpco.secureLayer = new esri.layers.ArcGISDynamicMapServiceLayer(plpcoglobal.urls.roadsSecureUrl);
        }
    },
    initMap: function(){
        // summary:
        //      description
        console.info("initMap", arguments);

        this.identify = new plpco.Identify();

        this.map = new agrc.widgets.map.BaseMap('map-div', {
            useDefaultBaseMap: false,
            infoWindow: this.identify.getPopup()
        });

        var selector = new agrc.widgets.map.BaseMapSelector({
            map: this.map,
            id: 'claro',
            defaultThemeLabel: 'Lite'
        });

        var lyrs = [];

        // Background Layers
        var imageParams = new esri.layers.ImageParameters();
        imageParams.format = 'PNG24';
        this.backgroundLyrsLyr = new esri.layers.ArcGISDynamicMapServiceLayer(plpcoglobal.urls.backgroundLayers, {
            imageParameters: imageParams
        });
        lyrs.push(this.backgroundLyrsLyr);
        this.map.addLoaderToLayer(this.backgroundLyrsLyr);
        var that = this;
        dojo.connect(this.backgroundLyrsLyr, 'onLoad', function(){
            var tocParams = {layer: that.backgroundLyrsLyr};
            if (that.lDialog.role === plpcoglobal.roleNames.plpcoGeneral) {
                tocParams.excludedLayerNodes = plpcoglobal.excludedLayerNodes;
                tocParams.includedLayerNodes = plpcoglobal.includedLayerNodes;
            }
            var btoc = new plpco.Toc(tocParams, 'background-layers-toc');
            // refresh legend on each change in toc
            dojo.connect(btoc, "_refreshLayerVisibilty", function(){
                that.leg.refresh();
            });
        });

        // overlays
        this.overlaysLyr = new esri.layers.ArcGISDynamicMapServiceLayer(plpcoglobal.urls.overlaysUrl, {
            opacity: 0.5
        });
        lyrs.push(this.overlaysLyr);
        this.map.addLoaderToLayer(this.overlaysLyr);
        var overlayTgl = new plpco.LayerToggler({
            layer: this.overlaysLyr,
            name: 'Land Ownership'
        }, 'overlays-toggler');

        // PLSS
        var plssLyr = new esri.layers.ArcGISTiledMapServiceLayer(plpcoglobal.urls.plssUrl, {
            visible: false
        });
        lyrs.push(plssLyr);
        this.map.addLoaderToLayer(plssLyr);
        var plssTgl = new plpco.LayerToggler({
            layer: plssLyr,
            name: 'Township/Range/Sections'
        }, 'plss-toggler');

        // Roads
        var roadsLyr = new esri.layers.ArcGISDynamicMapServiceLayer(plpcoglobal.urls.roadsUrl, {
            visible: true
        });
        lyrs.push(roadsLyr);
        this.map.addLoaderToLayer(roadsLyr);
        this.roadsToc = new plpco.RoadsToc({layer: roadsLyr}, 'roads-layers-toc');
        this.identify.toc = this.roadsToc;

        this.map.addLayers(lyrs);
        dojo.connect(this.map, "onLayersAddResult", this, 'afterMapLoaded');

        // city search
        var muni = new plpco.MagicZoom({
            promptMessage: null,
            mapServiceURL: plpcoglobal.urls.terrain,
            map: this.map,
            maxResultsToDisplay: 35,
            tooltipPosition: 'after',
            placeHolder: 'Municipality',
            searchLayerIndex: 1,
            searchField: 'NAME'
        }, 'city-search');

        // gnis search
        var place = new plpco.MagicZoom({
            promptMessage: null,
            mapServiceURL: plpcoglobal.urls.overlaysNoToken,
            map: this.map,
            maxResultsToDisplay: 35,
            tooltipPosition: 'after',
            placeHolder: 'Place Name',
            searchLayerIndex: 2,
            searchField: 'NAME',
            token: plpco.token
        }, 'place-name-search');
    },
    afterMapLoaded: function(){
        // summary:
        //      fires after the map and layers have loaded
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.countyZoomer = new plpco.CountyZoomer({map: this.map}, 'county-zoomer');

        this.wireEvents();

        this.leg = new esri.dijit.Legend({
            map: this.map,
            layerInfos: [
                {
                    layer: this.overlaysLyr,
                    title: ''
                },
                {
                    layer: this.backgroundLyrsLyr,
                    title: ''
                }
            ]
        }, 'legend');
        this.leg.startup();

        this.hideLoadingOverlay();
    },
    wireEvents: function(){
        // summary:
        //      description
        console.info("wireEvents", arguments);

        var that = this;
        dojo.connect(this.countyZoomer, 'zoom', this, 'onZoomToCounty');
        dojo.connect(dijit.byId('select-county'), 'onClick', this, 'onSelectCounty');
        dojo.connect(this.uMenu, "onLogOut", function () {
            that.lDialog.clearCookies();
            location.reload();
        });
        dojo.connect(this.map, "onClick", this.identify, 'onMapClick');
    },
    onZoomToCounty: function(county){
        // summary:
        //      description
        console.info("zoomToCounty", arguments);

        dojo.byId('county-name').innerHTML = county;

        this.roadsToc.selectCounty(county);
        this.initMagicZooms(county);
        this.identify.selectCounty(county);
    },
    onSelectCounty: function(){
        // summary:
        //      description
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.map.infoWindow.hide();

        this.countyZoomer.dialog.show();
    },
    initMagicZooms: function(county){
        // summary:
        //      description
        // indB: Number
        //      The index of the B layer
        // indD: Number
        //      The index of the D layer
        console.info("initMagicZooms", arguments);

        var that = this, connect;
        function onZoom(graphic){
            that.identify.popup.hide();
            that.identify.gLayer.clear();
            dojo.forEach(that.magicZooms, function(zoom){
                zoom._graphicsLayer.clear();
            });
            function showPopup(g){
                var geo, pnt;
                geo = g.geometry;
                pnt = geo.getPoint(0, geo.paths[0].length / 2);
                that.identify.showRoad(g,
                    g.attributes[plpcoglobal.fields.magicZoomsData.ROAD_CLASS]);
            }
            setTimeout(function(){
                showPopup(graphic);
            }, 1500);
        }

        if (this.magicZooms) {
            dojo.forEach(this.magicZooms, function(zoom){
                zoom.destroyRecursive();
            });
            this.magicZooms = [];
        }

        var layerIndex = dojo.indexOf(plpcoglobal.counties, county);

        // if (layerIndex === -1) {
        //     throw 'MagicZooms: No match found for :' + county;
        // }

        var params = {
            promptMessage: null,
            mapServiceURL: plpcoglobal.urls.magicZoomsData,
            map: this.map,
            maxResultsToDisplay: 35,
            tooltipPosition: 'after',
            searchLayerIndex: layerIndex,
            token: plpco.token,
            outFields: [
                plpcoglobal.fields.magicZoomsData.ROAD_CLASS,
                plpcoglobal.fields.roads.CO_UNIQUE[0],
                plpcoglobal.fields.roads.S_NAME[0],
                plpcoglobal.fields.roads.CoA_AREA[0],
                plpcoglobal.fields.roads.RD_ID[0],
                plpcoglobal.fields.roads.Miles[0]
            ],
            defQuery: (this.lDialog.role === plpcoglobal.roleNames.plpcoGeneral) ? plpcoglobal.requestDefQuery : null
        };

        function getPlaceHolder(field){
            return field[1] + ' (' + field[0] + ')';
        }

        var rdid = new plpco.MagicZoom(dojo.mixin({
            placeHolder: getPlaceHolder(plpcoglobal.fields.roads.RD_ID),
            searchField: plpcoglobal.fields.roads.RD_ID[0]
        }, params), dojo.create('div', {}, 'magic-zooms-container'));
        this.magicZooms.push(rdid);
        dojo.connect(rdid, "onZoomed", onZoom);
        var co = new plpco.MagicZoom(dojo.mixin({
            placeHolder: getPlaceHolder(plpcoglobal.fields.roads.CO_UNIQUE),
            searchField: plpcoglobal.fields.roads.CO_UNIQUE[0]
        }, params), dojo.create('div', {}, 'magic-zooms-container'));
        this.magicZooms.push(co);
        dojo.connect(co, "onZoomed", onZoom);
        var name = new plpco.MagicZoom(dojo.mixin({
            placeHolder: getPlaceHolder(plpcoglobal.fields.roads.S_NAME),
            searchField: plpcoglobal.fields.roads.S_NAME[0]
        }, params), dojo.create('div', {}, 'magic-zooms-container'));
        this.magicZooms.push(name);
        dojo.connect(name, "onZoomed", onZoom);
        this.magicZooms.push(new plpco.MagicZoom(dojo.mixin({
            placeHolder: getPlaceHolder(plpcoglobal.fields.roads.CoA_AREA),
            searchField: plpcoglobal.fields.roads.CoA_AREA[0]
        }, params), dojo.create('div', null, 'magic-zooms-container')));
    },
    hideLoadingOverlay: function(){
        // summary:
        //      fades out the loader overlay
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        dojo.fadeOut({
            node: 'loading-overlay',
            onEnd: function(n) {
                dojo.style(n, 'display', 'none');
            }
        }).play();
    }
});

dojo.ready(function(){
    var app = new plpcoapp();
});
