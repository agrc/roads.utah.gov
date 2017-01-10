/* jshint maxlen:false */
define([
    'dojo/has',
    'dojo/request/xhr',

    'esri/config'
], function (
    has,
    xhr,

    esriConfig
) {
    // force api to use CORS on mapserv thus removing the test request on app load
    // e.g. http://mapserv.utah.gov/ArcGIS/rest/info?f=json
    esriConfig.defaults.io.corsEnabledServers.push('mapserv.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('basemaps.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('api.mapserv.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('discover.utah.gov');

    var localBase = '/arcgis/rest/services/PLPCO/';
    var roadsUrl = localBase + 'RoadsGeneral/MapServer';
    var roadsSecureUrl = localBase + 'RoadsSecure/MapServer';
    var fldREQUEST = 'REQUEST';
    var backgroundLayers = localBase + 'BackgroundLayers/MapServer';

    window.AGRC = {
        // version.: String
        //      The version number.
        version: '1.4.0',
        appName: '/PLPCO',

        // app: App
        //      global reference to app
        app: null,

        excludedLayerNodes: [
            'Proposed RedRock Wilderness',
            'BLM Wilderness Study Area'
        ],
        includedLayerNodes: [
            'Quarter Sections',
            'Quad Index',
            'Imagery Index',
            'Historic Imagery',
            '15 Minute Quads',
            '7.5 Minute Quads',
            'UDOT Historic Maps',
            'Washington Historic DRGs',
            '2006 Imagery (1ft)',
            '2011 Imagery (1m)'
        ],

        // role: String
        //      The role of the current user
        role: 'PLPCO_Secure',

        // apiKey: String
        //      The api key used for services on api.mapserv.utah.gov
        // acquire at developer.mapserv.utah.gov
        apiKey: '',

        fields: {
            roads: {
                RD_ID: ['RD_ID', 'Road ID', 94], // 135 is width of attribute table column
                CO_UNIQUE: ['CO_UNIQUE', 'County Unique', 151],
                S_NAME: ['S_NAME', 'Road Name', 240],
                Miles: ['Miles', 'Miles', 100],
                CLASS: ['CLASS', 'Class', 75],
                VERIFIED76: ['VERIFIED76', 'Verified 76', 130],
                VERIFIED24: ['VERIFIED24K', 'Verified 24', 130],
                VERIFIED15: ['VERIFIED15MIN', 'Verified 15', 130],
                UDOT: ['UDOT', 'UDOT', 84],
                /* eslint-disable camelcase */
                CoA_AREA: ['CoA_AREA', 'Cause of Action Area', 200],
                /* eslint-enable camelcase */
                AFFIDAVITS: ['AFFIDAVITS', 'Affidavits', 120],
                REC_STATUS: ['REC_STATUS', 'Recordation Status', 180],
                COMMENTS: ['COMMENTS', 'Comments', 165],
                WITNESS1: ['WITNESS1', 'Witness 1', 150],
                WITNESS2: ['WITNESS2', 'Witness 2', 150],
                WITNESS3: ['WITNESS3', 'Witness 3', 150],
                BLM_LENGTH: ['BLM_LENGTH', 'BLM Length', 130],
                PROTECTION: ['PROTECTION', 'Protection', 115],
                NOTES: ['NOTES', 'Notes', 300],
                TITLE: ['TITLE_WRK', 'Title', 150],
                REQUEST: [fldREQUEST, 'Request', 150]
            },
            counties: {
                NAME: 'NAME'
            },
            sherlockData: {
                ROAD_CLASS: 'ROAD_CLASS'
            },
            OBJECTID: 'OBJECTID',
            photos: {
                HOTLINK: 'HOTLINK'
            }
        },
        requestDefQuery: fldREQUEST + " IN ('YES', 'Yes')",

        urls: {
            photosBase: 'http://roads.utah.gov/wddr/',

            backgroundLayers: backgroundLayers,
            sherlockData: localBase + 'SherlockData/MapServer',
            roadsUrl: roadsUrl,
            roadsLegend: roadsUrl + '/legend',
            roadsSecureUrl: roadsSecureUrl,
            attributeTableUrl: roadsSecureUrl + '//${0}',

            maskQueryTaskUrl: backgroundLayers + '/1'
        },

        roleNames: {
            plpcoAdmin: 'PLPCO_Admin',
            plpcoSecure: 'PLPCO_Secure',
            plpcoGeneral: 'PLPCO_General'
        },

        counties: [
            'Beaver',
            'Box Elder',
            'Carbon',
            'Daggett',
            'Duchesne',
            'Emery',
            'Garfield',
            'Grand',
            'Iron',
            'Juab',
            'Millard',
            'Piute',
            'Rich',
            'San Juan',
            'Sanpete',
            'Sevier',
            'Tooele',
            'Uintah',
            'Utah',
            'Washington',
            'Wayne',
            'Kane'
        ],

        featureClassNames: {
            counties: 'SGID10.Boundaries.Counties'
        }
    };

    if (has('agrc-build') === 'prod') {
        // roads.utah.gov
        window.AGRC.apiKey = '??';
        window.AGRC.quadWord = '??';
    } else if (has('agrc-build') === 'stage') {
        // test.mapserv.utah.gov
        window.AGRC.quadWord = 'opera-event-little-pinball';
        window.AGRC.apiKey = 'AGRC-AC122FA9671436';
    } else {
        // localhost
        xhr(require.baseUrl + 'secrets.json', {
            handleAs: 'json',
            sync: true
        }).then(function (secrets) {
            window.AGRC.quadWord = secrets.quadWord;
            window.AGRC.apiKey = secrets.apiKey;
        }, function () {
            throw 'Error getting secrets!';
        });
    }

    return window.AGRC;
});
