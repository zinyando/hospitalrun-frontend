import Ember from 'ember';
export default Ember.Component.extend({
  cancelAction: 'cancel',
  closeModalAction: 'closeModal',
  hideCancelButton: false,
  hideUpdateButton: false,
  isUpdateDisabled: false,
  title: '',
  updateButtonAction: '',
  updateButtonText: '',

  actions: {
    cancelAction: function() {
      this.sendAction('cancelAction');
    },
    updateAction: function() {
      this.sendAction('updateButtonAction');
    }
  },

  didInsertElement: function() {
    var $modal = this.$('.modal').modal();

    $modal.on('hidden.bs.modal', function() {
      this.sendAction('closeModalAction');
    }.bind(this));
  },

  willDestroyElement: function() {
    var $modal = this.$('.modal');
    $modal.off('hidden.bs.modal');
    $modal.modal('hide');
    // jquery fixes
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  }
});
