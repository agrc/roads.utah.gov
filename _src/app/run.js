(function () {
    require({ baseUrl: './' }, [
        'dojo/parser',
        'jquery',
        'dojo/domReady!',
        'polyfill'
    ], function (parser) {
        parser.parse();
    });
}());
