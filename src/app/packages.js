require({
    packages: [
        'agrc',
        'app',
        'dgrid',
        'dgauges',
        'dijit',
        'dojo',
        'dojox',
        'esri',
        'ijit',
        'layer-selector',
        'moment',
        'sherlock',
        {
            name: 'bootstrap',
            location: './bootstrap',
            main: 'dist/js/bootstrap'
        }, {
            name: 'jquery',
            location: './jquery/dist',
            main: 'jquery'
        }, {
            name: 'spin',
            location: './spinjs',
            main: 'spin'
        }
    ],
    map: {
        '*': {
            spinjs: 'spin'
        }
    }
});
