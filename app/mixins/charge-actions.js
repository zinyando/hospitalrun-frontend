import Ember from 'ember';
export default Ember.Mixin.create({
  _createNewChargeRecord: function(quantityCharged, pricingId) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      this.store.find('pricing', pricingId).then(function(item) {
        var newCharge = this.store.createRecord('proc-charge', {
          dateCharged: new Date(),
          quantity: quantityCharged,
          pricingItem: item
        });
        newCharge.save().then(function(chargeRecord) {
          var charges = this.get('charges');
          charges.addObject(chargeRecord);
          resolve();
        }.bind(this), reject);
      }.bind(this), reject);
    }.bind(this), '_createNewChargeRecord with pricingId:' + pricingId);
  },

  actions: {
    addCharge: function(charge) {
      var charges = this.get('charges');
      charges.addObject(charge);
      this.send('update', true);
      this.send('closeModal');
    },

    deleteCharge: function(model) {
      var chargeToDelete = model.get('chargeToDelete'),
        charges = this.get('charges');
      charges.removeObject(chargeToDelete);
      chargeToDelete.destroyRecord();
      this.send('update', true);
      this.send('closeModal');
    },

    showAddCharge: function() {
      var newCharge = this.get('store').createRecord('proc-charge', {
        dateCharged: new Date(),
        quantity: 1,
        pricingCategory: this.get('chargePricingCategory')
      });
      this.send('openModal', this.get('chargeRoute'), newCharge);
    },

    showEditCharge: function(charge) {
      charge.set('pricingCategory', this.get('chargePricingCategory'));
      this.send('openModal', this.get('chargeRoute'), charge);
    },

    showDeleteCharge: function(charge) {
      this.send('openModal', 'dialog', Ember.Object.create({
        confirmAction: 'deleteCharge',
        title: 'Delete Charge Item',
        message: 'Are you sure you want to delete this charged item?',
        chargeToDelete: charge,
        updateButtonAction: 'confirm',
        updateButtonText: 'Ok'
      }));
    },

    setChargeQuantity: function(id, quantity) {
      this.set(id, quantity);
    }
  },

  canAddCharge: function() {
    return this.currentUserCan('add_charge');
  }.property(),

  /**
   * Returns pricing list without object types
   * Used for labs and imaging where the labs and imaging types are
   * directly in the price list.
   */
  chargesPricingList: function() {
    var pricingList = this.get('pricingList'),
      pricingTypeForObjectType = this.get('pricingTypeForObjectType');
    return pricingList.filter(function(item) {
      return (item.type !== pricingTypeForObjectType);
    });
  }.property('pricingList', 'pricingTypeForObjectType'),

  chargeRoute: null,

  findChargeForPricingItem: function(pricingItem) {
    var charges = this.get('charges'),
      chargeForItem = charges.find(function(charge) {
        var chargePricingItemId = charge.get('pricingItem.id');
        return (pricingItem.id === chargePricingItemId);
      });
    return chargeForItem;
  },
  /**
   * Returns object types out of the pricing list.
   * Used for labs and imaging where the labs and imaging types are
   * directly in the price list.
   */
  objectTypeList: function() {
    var pricingList = this.get('pricingList'),
      pricingTypeForObjectType = this.get('pricingTypeForObjectType'),
      userCanAddPricingTypes = this.get('userCanAddPricingTypes'),
      returnList = Ember.Object.create({
        value: [],
        userCanAdd: userCanAddPricingTypes
      });
    if (!Ember.isEmpty(pricingList)) {
      returnList.set('value', pricingList.filterBy('pricingType', pricingTypeForObjectType));
    }
    return returnList;
  }.property('pricingList', 'pricingTypeForObjectType', 'pricingTypeValues'),

  organizeByType: Ember.computed.alias('pricingTypes.organizeByType'),

  pricingTypeList: function() {
    var pricingList = this.get('pricingList'),
      pricingTypeValues = this.get('pricingTypeValues'),
      pricingTypeForObjectType = this.get('pricingTypeForObjectType');
    pricingTypeValues = pricingTypeValues.filter(function(pricingType) {
      var havePricing = false;
      if (!Ember.isEmpty(pricingList)) {
        havePricing = !Ember.isEmpty(pricingList.findBy('pricingType', pricingType));
      }
      return havePricing && pricingType !== pricingTypeForObjectType;
    });
    pricingTypeValues = pricingTypeValues.sortBy('name');
    return pricingTypeValues;
  }.property('pricingTypeValues', 'pricingTypeForObjectType', 'pricingList'),

  pricingTypeValues: Ember.computed.alias('pricingTypes.value'),

  /**
   * Create multiple new request records from the pricing records passed in.  This function
   * will also add those new records to the specified visit.
   * @param {array} pricingRecords the list of pricing records to use to create request records from.
   * @param {string} pricingField the name of the field on the request record to set the pricing record on.
   * @param {string} visitChildName the name of the child object on the visit to add to.
   * @param {string} newVisitType if a new visit needs to be created, what type of visit
   * should be created.
   */
  createMultipleRequests: function(pricingRecords, pricingField, visitChildName, newVisitType) {
    var firstRecord = pricingRecords.get('firstObject'),
      modelToSave = this.get('model');
    modelToSave.set(pricingField, firstRecord);
    this.addChildToVisit(modelToSave, visitChildName, newVisitType).then(function(visit) {
      modelToSave.save().then(function() {
        this._finishCreateMultipleRequests(pricingRecords, pricingField, visitChildName, newVisitType, visit);
      }.bind(this));
    }.bind(this));
  },

  _finishCreateMultipleRequests: function(pricingRecords, pricingField, visitChildName, newVisitType, visit) {
    var attributesToSave = {},
      baseModel = this.get('model'),
      modelToSave,
      modelsToAdd = [],
      patient = this.get('patient'),
      savePromises = [];

    baseModel.eachAttribute(function(name) {
      attributesToSave[name] = baseModel.get(name);
    });

    pricingRecords.forEach(function(pricingRecord, index) {
      if (index > 0) {
        modelToSave = this.store.createRecord(newVisitType.toLowerCase(), attributesToSave);
        modelToSave.set(pricingField, pricingRecord);
        modelToSave.set('patient', patient);
        modelToSave.set('visit', visit);
        modelsToAdd.push(modelToSave);
        savePromises.push(modelToSave.save());
      }
    }.bind(this));

    Ember.RSVP.all(savePromises).then(function() {
      var addPromises = [];
      modelsToAdd.forEach(function(modelToSave) {
        addPromises.push(this.addChildToVisit(modelToSave, visitChildName, newVisitType));
      }.bind(this));
      Ember.RSVP.all(addPromises).then(function(addResults) {
        this.afterUpdate(addResults, true);
      }.bind(this));
    }.bind(this));
  },

  saveNewPricing: function(pricingName, pricingCategory, priceObjectToSet) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      var newPricing,
        pricingTypeForObjectType = this.get('pricingTypeForObjectType');
      newPricing = this.store.createRecord('pricing', {
        name: pricingName,
        category: pricingCategory,
        pricingType: pricingTypeForObjectType
      });
      newPricing.save().then(function(savedNewPricing) {
        this.get('pricingList').addObject({
          id: savedNewPricing.get('id'),
          name: newPricing.get('name')
        });
        this.set(priceObjectToSet, newPricing);
        resolve();
      }.bind(this), reject);
    }.bind(this), 'saveNewPricing for: ' + pricingName);
  },

  getSelectedPricing: function(selectedField) {
    var selectedItem = this.get(selectedField);
    if (!Ember.isEmpty(selectedItem)) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        if (Ember.isArray(selectedItem)) {
          var pricingIds = selectedItem.map(function(pricingItem) {
            return pricingItem.id;
          });
          this.store.findByIds('pricing', pricingIds).then(resolve, reject);
        } else {
          this.store.find('pricing', selectedItem.id).then(resolve, reject);
        }
      }.bind(this));
    } else {
      return Ember.RSVP.resolve();
    }
  },

  showAddCharge: function() {
    var canAddCharge = this.get('canAddCharge'),
      organizeByType = this.get('organizeByType');
    if (canAddCharge) {
      return !organizeByType;
    } else {
      return false;
    }
  }.property('canAddCharge', 'organizeByType'),

  showEditCharges: function() {
    var canAddCharge = this.get('canAddCharge'),
      organizeByType = this.get('organizeByType');
    if (canAddCharge) {
      return organizeByType;
    } else {
      return false;
    }
  }.property('canAddCharge', 'organizeByType'),

  showPricingTypeTabs: function() {
    var pricingTypeList = this.get('pricingTypeList');
    return (!Ember.isEmpty(pricingTypeList) && pricingTypeList.get('length') > 1);
  }.property('pricingTypeList'),

  userCanAddPricingTypes: function() {
    var pricingTypes = this.get('pricingTypes');
    if (Ember.isEmpty(pricingTypes)) {
      return true;
    } else {
      return pricingTypes.get('userCanAdd');
    }
  }.property('pricingTypes'),

  /**
   * When using organizeByType charges need to be mapped over from the price lists
   */
  updateCharges: function() {
    var charges = this.get('charges'),
      organizeByType = this.get('organizeByType'),
      pricingList = this.get('pricingList');

    if (!organizeByType) {
      return Ember.RSVP.resolve();
    }
    return new Ember.RSVP.Promise(function(resolve, reject) {
      var chargePromises = [];
      pricingList.forEach(function(pricingItem) {
        var currentCharge = this.findChargeForPricingItem(pricingItem),
          quantityCharged = this.get(pricingItem.id);
        if (Ember.isEmpty(quantityCharged)) {
          if (currentCharge) {
            // Remove existing charge because quantity is blank
            charges.removeObject(currentCharge);
            chargePromises.push(currentCharge.destroyRecord());
          }
        } else {
          if (currentCharge) {
            if (currentCharge.get('quantity') !== quantityCharged) {
              currentCharge.set('quantity', quantityCharged);
              chargePromises.push(currentCharge.save());
            }
          } else {
            chargePromises.push(this._createNewChargeRecord(quantityCharged, pricingItem.id));
          }
        }
      }.bind(this));
      Ember.RSVP.all(chargePromises, 'Charges updated for current record:' + this.get('id')).then(resolve, reject);
    }.bind(this), 'updateCharges for current record:' + this.get('id'));
  }
});
