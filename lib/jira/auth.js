const sh = require('child_process');
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

  'login': function() {
    let self = this;
    let pashua = './bin/login.sh';
    let url = config.url || defaultProtocol;
    let cmd = ['sh', pashua, url, config.user].filter(String).join(' ');
    sh.exec(cmd, function(err, stderr, stdout) {
      if (err) throw err;
      
      let result = {};
      stderr.replace(/[\n\r]/g,'').split(' ').forEach(function(s) {
        let ele = s.split('=');
        let name = ele[0];
        let value = ele[1];
        if (!value.replace(/\d/g,'')) {
          value = parseInt(value);
        }
        result[name] = value;
      });

      if (!result.cancel) { 
        let token = new Buffer(result.username + ':' + result.password).toString('base64');
        delete result.password;
        keychain.save(token);
        
        config.user = result.username;
        config.url = result.url.replace(/(.)\/*$/,'$1/');
        if (!/https?:\/\//.test(config.url)) {
          config.url = defaultProtocol + config.url;
        }
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
