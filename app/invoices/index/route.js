import AbstractIndexRoute from 'hospitalrun/routes/abstract-index-route';
import Ember from 'ember';
export default AbstractIndexRoute.extend({
  modelName: 'invoice',
  pageTitle: 'Invoice Listing',

  _getStartKeyFromItem: function(item) {
    var billDateAsTime = item.get('billDateAsTime'),
      id = this._getPouchIdFromItem(item),
      searchStatus = item.get('status');
    return [searchStatus, billDateAsTime, id];
  },

  _modelQueryParams: function(params) {
    var queryParams,
      maxId = this._getMaxPouchId(),
      maxValue = this.get('maxValue'),
      minId = this._getMinPouchId(),
      searchStatus = params.status;
    if (Ember.isEmpty(searchStatus)) {
      searchStatus = 'Billed';
    }
    this.set('pageTitle', '%@ Invoices'.fmt(searchStatus));
    queryParams = {
      options: {
        startkey: [searchStatus, null, minId],
        endkey: [searchStatus, maxValue, maxId]
      },
      mapReduce: 'invoice_by_status'
    };

    if (searchStatus === 'All') {
      delete queryParams.options.startkey;
      delete queryParams.options.endkey;
    }
    return queryParams;

  },

  queryParams: {
    startKey: { refreshModel: true },
    status: { refreshModel: true }
  }
});
