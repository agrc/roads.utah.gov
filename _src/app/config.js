/* eslint-disable camelcase */
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
    esriConfig.defaults.io.corsEnabledServers.push('gis.trustlands.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('api.mapserv.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('discover.utah.gov');

    let counties = [
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
        {
            name: 'Kane',
            displayName: 'Bellwether'
        }
    ];
    const urlParams = new URLSearchParams(new URL(window.location).search);
    let appName = 'plpco';
    let localBase = '/arcgis/rest/services/PLPCO/';
    const imageServiceBase = localBase;

    if (urlParams.has('county')) {
        const urlCounty = urlParams.get('county').toLowerCase();

        counties = counties.filter(county => {
            if (county.hasOwnProperty('name') && county.name.toLowerCase() === urlCounty) {
                return true;
            } else if (county.hasOwnProperty('name')) {
                return false;
            }

            return county.toLowerCase() === urlCounty;
        });

        appName += `_${urlCounty}`;
        localBase = localBase.replace('PLPCO', `PLPCO_${urlCounty}`);
    }

    const roadsUrl = localBase + 'RoadsGeneral/MapServer';
    const fldREQUEST = 'REQUEST';
    const backgroundLayers = imageServiceBase + 'BackgroundLayers/MapServer';
    const videos = localBase + 'Videos/MapServer';

    window.AGRC = {
        // version.: String
        //      The version number.
        version: '2.3.0',
        appName,

        // app: App
        //      global reference to app
        app: null,

        // user: User Object
        //      user object returned from permission proxy
        user: null,

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
            },
            videos: {
                Name: 'Name',
                DateTimeS: 'DateTimeS',
                Youtube_URL: 'Youtube_URL',
                GPX_Name: 'GPX_Name'
            }
        },
        urls: {
            /* eslint-disable max-len */
            photosBase: 'https://roads.utah.gov/wddr',

            // image services
            localBase,
            historic15: `${imageServiceBase}HistoricQuads_15Minute/ImageServer`,
            historic75: `${imageServiceBase}HistoricQuads_75Minute/ImageServer`,
            imagery76: `${imageServiceBase}UtahDOQ_76/ImageServer`,
            udotHistoricD: `${imageServiceBase}UDOTHistoric_D/ImageServer`,
            udotHistoricMaps: `${imageServiceBase}UDOTHistoric_B/ImageServer`,

            plss: 'https://tiles.arcgis.com/tiles/99lidPhWCzftIe9K/arcgis/rest/services/UtahPLSS/VectorTileServer',
            backgroundLayers: backgroundLayers,
            landOwnership: 'https://gis.trustlands.utah.gov/server' +
                           '/rest/services/Ownership/UT_SITLA_Ownership_LandOwnership_WM/MapServer',
            sherlockData: localBase + 'SherlockData/MapServer',
            roadsUrl,
            roadsSecureUrl: localBase + 'RoadsSecure/MapServer',
            videoRoutes: videos + '/0',
            videoLogs: videos + '/1',

            maskQueryTaskUrl: backgroundLayers + '/0',
            wildernessStudyAreas: backgroundLayers + '/1',
            redRockAreas: backgroundLayers + '/2'
            /* eslint-enable max-len */
        },
        counties,
        featureClassNames: {
            counties: 'SGID10.Boundaries.Counties',
            cities: 'SGID10.BOUNDARIES.Municipalities_Carto',
            gnis: 'SGID10.LOCATION.PlaceNamesGNIS2010'
        },
        topics: {
            updateVideoPosition: 'update-video-position'
        },
        videoMapZoomLevel: 17,
        videoMarkerColor: 'rgba(231, 48, 48, 0.86)'
    };

    if (has('agrc-build') === 'prod' || has('agrc-build') === 'stage') {
        // roads.utah.gov
        window.AGRC.apiKey = 'AGRC-ECE34D2B897904';
        window.AGRC.quadWord = 'pancake-economy-raymond-sonic';
    } else {
        // localhost
        xhr(`${document.location.href.split('?')[0]}/secrets.json`, {
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
