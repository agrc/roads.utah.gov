/* eslint-disable no-unused-vars, no-undef */
var profile = {
    resourceTags: {
        test: function test(mid) {
            return (/\/Spec/.test(mid)
            );
        },
        copyOnly: function copyOnly(filename, mid) {
            return (/^app\/resources\//.test(mid) && !/\.css$/.test(filename)
            );
        },
        amd: function amd(filename, mid) {
            return !this.copyOnly(filename, mid) && /\.js$/.test(filename);
        },
        miniExclude: function miniExclude(filename, mid) {
            return mid in {
                'app/package': 1,
                'app/tests/jasmineTestBootstrap': 1
            };
        }
    }
};
//# sourceMappingURL=app.profile.js.map
