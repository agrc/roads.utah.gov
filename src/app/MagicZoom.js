define([
    'agrc/widgets/locate/MagicZoom',

    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    MagicZoom,

    declare,
    lang
) {
    return declare([MagicZoom], {
        // summary:
        //        overriden to provide an option to append the query to allow for
        //        REQUEST = 'YES' for general role

        // defQuery: String
        defQuery: null,

        _search: function (searchString) {
            // summary:
            //        Performs a search with the QueryTask using the passed in string.
            // searchString: String
            //        The string that is used to construct the LIKE query.
            // tags:
            //        private
            console.log('app/MagicZoom:_search', arguments);

            // clear table
            this._deleteAllTableRows(this.matchesTable);

            // return if not enough characters
            if (searchString.length < 1) {
                this._deleteAllTableRows(this.matchesTable);

                return;
            }

            if (this.map.showLoader) {
                this.map.showLoader();
            }

            // update query where clause
            this.query.where = 'UPPER(' + this.searchField + ") LIKE UPPER('" + searchString + "%')";

            if (this.defQuery) {
                this.query.where = this.query.where + ' AND ' + this.defQuery;
            }

            // execute query / canceling any previous query
            if (this._deferred) {
                this._deferred.cancel();
            }
            this._deferred = this.queryTask.execute(this.query, lang.hitch(this, function (featureSet) {
                this._processResults(featureSet.features);
            }));
        }
    });
});
