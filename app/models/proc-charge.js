import AbstractModel from 'hospitalrun/models/abstract';
import DS from 'ember-data';
import Ember from 'ember';

/**
 * Procedure charges
 */
export default AbstractModel.extend({
  medication: DS.belongsTo('inventory', {
    async: false
  }),
  pricingItem: DS.belongsTo('pricing', {
    async: false
  }),
  quantity: DS.attr('number'),
  dateCharged: DS.attr('date'),

  medicationCharge: function() {
    var medication = this.get('medication'),
      newMedicationCharge = this.get('newMedicationCharge');
    return (!Ember.isEmpty(medication) || newMedicationCharge);
  }.property('medication'),

  inventoryItemChanged: function() {
    var inventoryItem = this.get('inventoryItem');
    this.set('medication', inventoryItem);
  }.observes('inventoryItem'),

  validations: {
    itemName: {
      presence: true,
      acceptance: {
        accept: true,
        if: function(object) {
          var medicationCharge = object.get('medicationCharge');
          if (!medicationCharge || !object.get('hasDirtyAttributes')) {
            return false;
          }
          var itemName = object.get('inventoryItem.name'),
            itemTypeAhead = object.get('itemName');
          if (Ember.isEmpty(itemName) || Ember.isEmpty(itemTypeAhead)) {
            // force validation to fail
            return true;
          } else {
            var typeAheadName = itemTypeAhead.substr(0, itemName.length);
            if (itemName !== typeAheadName) {
              return true;
            }
          }
          // Inventory item is properly selected; don't do any further validation
          return false;
        },
        message: 'Please select a valid medication'
      }

    },

    quantity: {
      numericality: {
        greaterThan: 0
      }
    }
  }
});
