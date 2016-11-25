/*global dojo, plpco, agrc, console*/
dojo.provide('plpco.MagicZoom');

dojo.require('agrc.widgets.locate.MagicZoom');

dojo.declare('plpco.MagicZoom', agrc.widgets.locate.MagicZoom, {
	// summary:
	//		overriden to provide an option to append the query to allow for
	//		REQUEST = 'YES' for general role

	// defQuery: String
	defQuery: null,
	
	_search: function(searchString) {
		// summary:
		//		Performs a search with the QueryTask using the passed in string.
		// searchString: String
		//		The string that is used to construct the LIKE query.
		// tags:
		//		private
        console.log(this.declaredClass + "::" + arguments.callee.nom);
        
        // clear table
        this._deleteAllTableRows(this.matchesTable);
        
        // return if not enough characters
        if (searchString.length < 1) {
            this._deleteAllTableRows(this.matchesTable);
            //			this.textBox.displayMessage("please type at least 2 characters...");
            return;
        }
        
        if (this.map.showLoader) {
            this.map.showLoader();
        }
        
        // update query where clause
        this.query.where = "UPPER(" + this.searchField + ") LIKE UPPER('" + searchString + "%')";

        // BEGIN NEW CODE
        if (this.defQuery) {
			this.query.where = this.query.where + ' AND ' + this.defQuery;
        }
        // END NEW CODE
        
        // execute query / canceling any previous query
        if (this._deferred) {
            this._deferred.cancel();
        }
        this._deferred = this.queryTask.execute(this.query, dojo.hitch(this, function(featureSet){
			this._processResults(featureSet.features);
		}));
    }
});