define([
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (
    declare,
    lang,

    Query,
    QueryTask
) {
    return declare(null, {
        // summary:
        //      Easily add a query task to your class

        // query: esri.tasks.Query
        query: null,

        // qTask: esri.tasks.QueryTask
        qTask: null,

        setUpQueryTask: function (url, queryParams) {
            // summary:
            //      sets up the query task and query parameters objects
            //      and wires events
            // url: String
            //      The url to the layer that you want the task based upon
            // queryParams: {
            //      geometry: esri.Geometry,
            //      maxAllowableOffset: Number,
            //      outFields: String[],
            //      returnGeometry: Boolean (default: false),
            //      where: String
            // }
            //      The parameters that will be mixed into the esri.tasks.Query object
            console.log('app/_QueryTaskMixin:setUpQueryTask', arguments);

            this.query = new Query();
            lang.mixin(this.query, queryParams);

            this.qTask = new QueryTask(url);

            this.connect(this.qTask, 'onComplete', this, 'onQueryTaskComplete');
            this.connect(this.qTask, 'onError', this, 'onQueryTaskError');
        },
        onQueryTaskComplete: function () {
            // summary:
            //      callback for the query task
            // fSet: esri.tasks.FeatureSet
            console.log('app/_QueryTaskMixin:onQueryTaskComplete', arguments);
        },
        onQueryTaskError: function () {
            // summary:
            //      callback for when the query task returns an error
            // er: Error
            console.log('app/_QueryTaskMixin:onQueryTaskError', arguments);
        },
        executeQueryTask: function (geo, where) {
            // summary:
            //      updates the query and fires the task
            console.log('app/_QueryTaskMixin:executeQueryTask', arguments);

            this.query.geometry = geo;
            this.query.where = where;

            this.qTask.execute(this.query);
        }
    });
});
