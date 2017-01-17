/* eslint-disable no-unused-vars */
var profile = {
    basePath: '../src',
    action: 'release',
    cssOptimize: 'comments',
    mini: true,
    optimize: false,
    layerOptimize: false,
    selectorEngine: 'acme',
    layers: {
        'dojo/dojo': {
            include: [
                'dojo/i18n',
                'dojo/domReady',
                'app/packages',
                'app/run',
                'app/App',
                'dojox/gfx/filters',
                'dojox/gfx/path',
                'dojox/gfx/svg',
                'dojox/gfx/svgext',
                'dojox/gfx/shape',
                'ladda/dist/spin'
            ],
            includeLocales: ['en-us'],
            customBase: true,
            boot: true
        },
        'ijit/widgets/authentication/UserAdmin': {
            exclude: ['dojo/dojo']
        }
    },
    packages: [{
        name: 'mustache',
        location: 'mustache',
        main: 'mustache'
    }, {
        name: 'moment',
        location: 'moment',
        main: 'moment',
        trees: [
          // don't bother with .hidden, tests, min, src, and templates
          ['.', '.', /(\/\.)|(~$)|(test|txt|src|min|templates)/]
        ],
        resourceTags: {
            amd: function amd(filename, mid) {
                return /\.js$/.test(filename);
            }
        }
    }, {
        name: 'jquery',
        location: './jquery/dist',
        main: 'jquery',
        resourceTags: {
            copyOnly: function copyOnly(filename, mid) {
                return mid !== 'jquery/jquery';
            }
        }
    }, {
        name: 'bootstrap',
        location: './bootstrap',
        main: 'dist/js/bootstrap',
        resourceTags: {
            copyOnly: function copyOnly(filename, mid) {
                return mid.startsWith('bootstrap/grunt');
            }
        }
    }],
    staticHasFeatures: {
        // The trace & log APIs are used for debugging the loader, so we don’t need them in the build
        'dojo-trace-api': 0,
        'dojo-log-api': 0,

        // This causes normally private loader data to be exposed for debugging, so we don’t need that either
        'dojo-publish-privates': 0,

        // We’re fully async, so get rid of the legacy loader
        'dojo-sync-loader': 0,

        // dojo-xhr-factory relies on dojo-sync-loader
        'dojo-xhr-factory': 0,

        // We aren’t loading tests in production
        'dojo-test-sniff': 0
    },
    userConfig: {
        packages: ['app', 'dijit', 'dojox', 'agrc', 'ijit', 'esri', 'layer-selector']
    }
};
