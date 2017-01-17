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
        'put-selector',
        'sherlock',
        'xstyle',
        {
            name: 'bootstrap',
            location: './bootstrap',
            main: 'dist/js/bootstrap'
        }, {
            name: 'jquery',
            location: './jquery/dist',
            main: 'jquery'
        }, {
            name: 'ladda',
            location: './ladda-bootstrap',
            main: 'dist/ladda'
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
