const sh = require('../alfred-exec');
const fs = require('fs');
const keychain = require('./keychain');
const config = require('./config');
const cache = require('./cache');

let defaultProtocol = 'https://';

let Auth = {
  cfgPath: config.cfgPath || null,
  cfgFile: config.cfgFile || null,
  cacheFile: config.cacheFile || null,
  fullPath: config.cfgPath + config.cfgFile || null,
  menuItems: config.menuItems,

  'login': function() {
    let self = this;
    sh.exec('npm run electron login', function(err, stderr, stdout) {
      if (err) throw err;

      let token = keychain.find();
      let result = null;
      try {
        result = JSON.parse(stdout);
      } catch(e) {
        console.error('Unable to parse JSON response from stdout', e);
      }

      if (result && token) {
        config.user = result.user;
        config.url = result.url.replace(/(.)\/*$/,'$1/');
        config.req.headers['Authorization'] = 'Basic ' + token;
        self.getProjects().then(projectList => {
          config.projects = projectList;
          self.getStatuses().then(statusList => {
            config.statuses = statusList;
            self.saveConfig();
          })
        }).catch(err => {
          keychain.delete();
          console.log(err)
        })
      } else {
        console.log('Login canceled');
      }
    });
  },

  'checkConfig': function() {
    config.token = keychain.find();
    config.req = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + config.token
      }
    };

    if (fs.existsSync(this.fullPath)) {
      let configJSON = JSON.parse(fs.readFileSync(this.fullPath, 'utf-8'));
      
      config.user = configJSON.user;
      config.url = configJSON.url;
      config.options = configJSON.options;

      if (configJSON.bookmarks) {
        config.bookmarks = configJSON.bookmarks;
      }

      if (configJSON.sort) {
        config.sort = configJSON.sort;
      }

      ['enabled_menu_items', 'available_projects', 'available_issues_statuses'].forEach(option => {
        if (config.options[option]) {
          config.options[option] = config.options[option]
            .filter(opt => opt.enabled !== false)
            .map(opt => opt.name || opt);
        }
      });

      return (config.url && config.user && config.options && config.token);
    } else {
      return false;
    }
  },

  'setConfig': function (callback) {
    let self = this;
    return new Promise(function (resolve, reject) {
      if (self.checkConfig()) {
        cachedSettings = cache.get('configFile');
        loadedSettings = sh.execSync('md5 -q ' + self.fullPath).toString();
        if (cachedSettings != loadedSettings) {
          cache.clear();
          cache.set('configFile', loadedSettings);
        }
        resolve(true);
      } 
      else {
        if (!fs.existsSync(self.cfgPath)) {
          fs.mkdirSync(self.cfgPath);
        }
        self.login();
      }
    });
  },

  'logout': function() {
    if (this.checkConfig()) {
      delete config.token;
      delete config.req;
      delete config.user;
      fs.writeFileSync(this.fullPath, JSON.stringify(config, null, 2));
      keychain.delete();
      console.error('Logged out.')
    } else {
      console.error('Not logged in.')
    }
  },

  'clearConfig': function() {
    if (fs.existsSync(this.fullPath)) {
      fs.unlinkSync(this.fullPath);
    }
    if (fs.existsSync(this.cfgPath + this.cacheFile)) {
      fs.unlinkSync(this.cfgPath + this.cacheFile);
    }
    if (fs.existsSync(this.cfgPath + 'inProgress.json')) {
      fs.unlinkSync(this.cfgPath + 'inProgress.json');
    }
    fs.rmdirSync(this.cfgPath);
    if (keychain.delete()) {
      console.log('Configuration deleted successfully!');      
    }
  },

  'getProjects': function() {
    const Projects = require('./projects');
    return Projects.getProjects();
  },

  'getStatuses': function() {
    const Projects = require('./projects');
    return Projects.getStatuses();
  },

  'saveConfig': function() {
    let self = this;
    let configFile = {
      url: config.url,
      user: config.user,
      options: {
        minimum_log_time: '0 seconds',
        enabled_menu_items: config.menuItems,
        available_projects: config.projects,
        available_issues_statuses: config.statuses
      }
    };
    fs.writeFileSync(self.fullPath, JSON.stringify(configFile, null, 2));    
    let hash = sh.execSync('md5 -q ' + self.fullPath).toString();
    cache.set('configFile', hash);
    console.log('Information stored!');
  }
}

module.exports = Auth;
