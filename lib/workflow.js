const builder = require('xmlbuilder');
const fs = require('fs');
const config = require('./jira/config');
const log = require('./alfred-log');
const alfredVersion = parseInt(process.env.alfred_version);

let ActionHandler = (() => {
  const events = require('events');
  const eventEmitter = new events.EventEmitter();
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

let Storage = (function(){
  const storage = require('node-persist');
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

let Icon = (icon, def) => {
  return fs.existsSync(icon) ? icon : def;
}

function Item(settings) {
  if (!settings || typeof settings != 'object') {
    let settings = {};
  }

  let icon = settings.icon ? Icon(config.iconPath + settings.icon, null) : null;
  icon = settings.projectIcon ? Icon(config.projectIconPath + settings.projectIcon, config.iconPath + 'default.png') : icon;
  icon = settings.userIcon ? Icon(config.userIconPath + settings.userIcon, config.iconPath + 'assigned.png') : icon;
  icon = settings.priorityIcon ? Icon(config.priorityIconPath + settings.priorityIcon, config.iconPath + 'priority.png') : icon;
  icon = settings.bookmarkIcon ? Icon(settings.bookmarkIcon, config.iconPath + 'bookmark.png') : icon;

  let mods = [];
  if (alfredVersion > 2) {
    for (let modKey of ['ctrl','alt','cmd','fn','shift']) {
      let modConfig = settings[`${modKey}Mod`];
      if (modConfig && typeof modConfig == 'object') {
        let mod = { 
          '@key': modKey, 
          '@valid': modConfig.valid !== false ? 'yes' : 'no'
        };
        if (modConfig.subtitle)
          mod['@subtitle'] = modConfig.subtitle;
        if (modConfig.arg)
          mod['@arg'] = modConfig.arg;
        mods.push(mod);
      }
    }
  } 

  this.item = {
    '@valid': settings.valid !== false ? 'yes' : 'no',
    '@autocomplete': settings.autocomplete !== undefined ? settings.autocomplete : null,
    '@arg': settings.arg || null,
    '@uid': settings.uid || null,
    'title': settings.title || null,
    'subtitle': settings.subtitle || null,
    'wfId': settings.wfId || null,
    'icon': icon,
    'mod': mods.length ? mods : null
  }
  if (!fs.existsSync(this.item.icon)) {
    this.item.icon = null;
  }
  let item = this.item;
  for (let i in item) {
    if (item[i] === null) {
      delete item[i];
    }
  }
}

let Workflow = function() {
  return {
    items: [],
    defaultItem: null,
    actionHandler: ActionHandler,
    storage: Storage,
    _sep: '► ',
    enableBack: true,

    'path': function (...args) {
      let sep = this._sep;
      args = args
        .join(sep)
        .split(sep)
        .filter(String)
        .map(s => `${s} `);
      let path = ['', ...args, ''].join(sep);
      return path;
    },

    'addItem': function(settings){
      settings = settings || {};
      let key = settings.title || null,
          data = settings.data || null;
      if (data && typeof data === 'object') {
        key = data['_key'] || key;
      }
      if (key && data) {
        this.storage.set(key, data);
      }
      this.items.push(new Item(settings));
    },

    'addItems': function(array) {
      for (let item in array) {
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
        icon: 'warning'
      });
      if (!suppressFeedback)
        this.feedback();
    },
    
    'goBack': function() {
      if (this.enableBack) {
        let path = (process.argv[2].match(new RegExp('^.+' + this._sep, 'i')) || [''])[0];
        let paths = this.storage.get('paths') || [];

        if (!path) {
          paths = [];
        } else {
          paths.push(path);
        }

        let index = paths.findIndex(s => s.replace(/ /g, '') == path.replace(/ /g, ''));
        if (index > -1 && index != paths.length - 1) {
          paths = paths.splice(0, index + 1);
        }

        this.storage.set('paths', paths);
        var backPath = paths[paths.length - 2];

        if (path.trim()) {
          return new Item({
            title: 'Back',
            autocomplete: backPath || '',
            valid: false,
            icon: 'back.png'
          });
        }

      }
      return null;
    },

    'feedback': function() {
      if (!this.items.length && this.defaultItem) {
        this.items.push(this.defaultItem);
      }

      if (goback = this.goBack()) {
        this.items.push(goback);
      }

      let root = builder.create('items');
      for (let i in this.items) {
        let item = root.ele(this.items[i]);
      }
      console.log(root.end({pretty:true}))
    }
  }
}

module.exports = Workflow;
