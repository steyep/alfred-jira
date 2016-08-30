var builder = require('xmlbuilder');
var fs = require('fs');

var ActionHandler = (() => {
  var events = require('events');
  var eventEmitter = new events.EventEmitter();
  return {
    onAction: (action, handler) => {
      if (!handler) return;
      eventEmitter.on('action-' + action, handler);
    },

    handle: (action, query) => {
      eventEmitter.emit('action-' + action, query);
    }
  }
})();

var Storage = (function(){
  var config = require('./jira/config');
  var storage = require('node-persist');
  storage.initSync({
    dir: config.cfgPath
  });

  return {
    set: (key, value) => {
      return storage.setItemSync(key, value);
    },
    get: function(key) {
      let data = storage.getItemSync(key);
      return data;
    },
    clear: () => storage.clear()
  }
})();

function Item(settings) {
  if (!settings || typeof settings != 'object') {
    var settings = {};
  }
  this.item = {
    '@valid': settings.valid !== false ? 'yes' : 'no',
    '@autocomplete': settings.autocomplete || null,
    '@arg': settings.arg || null,
    '@uid': settings.uid || null,
    'title': settings.title || null,
    'subtitle': settings.subtitle || null,
    'icon': settings.icon || null
  }
  if (!fs.existsSync(this.item.icon)) {
    this.item.icon = null;
  }
  var item = this.item;
  for (var i in item) {
    if (item[i] === null) {
      delete item[i];
    }
  }
}

var Workflow = function() {
  return {
    items: [],
    defaultItem: null,
    actionHandler: ActionHandler,
    storage: Storage,
    _sep: '► ',

    'addItem': function(settings){
      settings = settings || {};
      let key = settings.title || null,
          data = settings.data || null;
      if (data && typeof data === 'object') {
        key = data['_key'] || key;
      }
      console.error(key)
      if (key && data) {
        this.storage.set(key, data);
      }
      this.items.push(new Item(settings));
    },

    'addItems': function(array) {
      for (var item in array) {
        this.addItem(array[item]);
      }
    },

    'default': function(settings){
      this.defaultItem = new Item(settings);
    },

    'error': function(title, subtitle, suppressFeedback) {
      this.addItem({
        title: title,
        subtitle: subtitle,
        valid: false,
        icon: './resources/icons/warning.png'
      });
      if (!suppressFeedback)
        this.feedback();
    },
    
    'feedback': function() {
      if (!this.items.length && this.defaultItem) {
        this.items.push(this.defaultItem);
      }
      var root = builder.create('items');
      for (var i in this.items) {
        var item = root.ele(this.items[i]);
      }
      console.log(root.end({pretty:true}))
    }
  }
}

module.exports = Workflow;
