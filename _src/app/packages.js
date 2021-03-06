require({
    packages: [
        'agrc',
        'app',
        'dgrid',
        'dgrid1',
        'dgauges',
        'dijit',
        'dojo',
        'dojox',
        'dstore',
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
        }, {
            name: 'polyfill',
            location: '../node_modules/@babel/polyfill',
            main: 'dist/polyfill'
        }
    ],
    map: {
        '*': {
            spinjs: 'spin'
        }
    }
});
