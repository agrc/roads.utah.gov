var djConfig={
    isDebug: true, // remove for build
    debugAtAllCosts: true, // remove for build
    baseUrl: "./", // remove for build
    modulePaths: { // remove for build
        "agrc": "./content/agrc",
        "ijit": "./content/ijit",
        plpco: './content/plpco'
    },
    parseOnLoad: true
};
var plpcoglobal = {
    version: '1.4.0',
    appName: '/PLPCO',
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
    ]
};
plpcoglobal.fields = {
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
        CoA_AREA: ['CoA_AREA', 'Cause of Action Area', 200],
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
        REQUEST: ['REQUEST', 'Request', 150]
    },
    counties: {
        NAME: 'NAME'
    },
    magicZoomsData: {
        ROAD_CLASS: 'ROAD_CLASS'
    },
    OBJECTID: 'OBJECTID',
    photos: {
        HOTLINK: 'HOTLINK'
    }
};

plpcoglobal.requestDefQuery = plpcoglobal.fields.roads.REQUEST[0] + " IN ('YES', 'Yes')";

plpcoglobal.urls = {
    localBase: '/ArcGIS_PLPCO/rest/services/PLPCO/',
    mapservBase: 'http://mapserv.utah.gov/ArcGIS/rest/services/',
    photosBase: 'http://roads.utah.gov/wddr/'
};
plpcoglobal.urls.terrain = plpcoglobal.urls.mapservBase + 'BaseMaps/Hillshade/MapServer';
plpcoglobal.urls.countyQueryTaskUrl = plpcoglobal.urls.terrain + '/2';
plpcoglobal.urls.plssUrl = plpcoglobal.urls.mapservBase + 'UtahPLSS/MapServer';

plpcoglobal.urls.backgroundLayers = plpcoglobal.urls.localBase + 'BackgroundLayers/MapServer';
plpcoglobal.urls.magicZoomsData = plpcoglobal.urls.localBase + 'MagicZoomsData/MapServer';
plpcoglobal.urls.roadsUrl = plpcoglobal.urls.localBase + 'RoadsGeneral/MapServer';
plpcoglobal.urls.roadsLegend = plpcoglobal.urls.roadsUrl + '/legend';
plpcoglobal.urls.roadsSecureUrl = plpcoglobal.urls.localBase + 'RoadsSecure/MapServer';
plpcoglobal.urls.attributeTableUrl = plpcoglobal.urls.roadsSecureUrl + '//${0}';
plpcoglobal.urls.overlaysUrl = plpcoglobal.urls.localBase + 'Overlays/MapServer';
plpcoglobal.urls.overlaysNoToken = plpcoglobal.urls.overlaysUrl;

plpcoglobal.urls.maskQueryTaskUrl = plpcoglobal.urls.overlaysUrl + '/1';
plpcoglobal.urls.createUser = '/UserManagement/Register/CreateNewUser';

plpcoglobal.roleNames = {
    plpcoAdmin: 'PLPCO_Admin',
    plpcoSecure: 'PLPCO_Secure',
    plpcoGeneral: 'PLPCO_General'
};

plpcoglobal.counties = [
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
];
