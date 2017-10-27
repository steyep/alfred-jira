const sh = require('../alfred-exec');
const config = require('./config');
const cache = require('./cache');
const auth = require('./auth');
const ls = require('./list');
const status = require('./transitions');
const users = require('./users');
const assign = require('./assign');
const Comment = require('./comment');
const watch = require('./watch');
const worklog = require('./worklog');
const log = require('../alfred-log');
const create = require('./create');
const issueTypes = require('./issuetypes');
const search = require('./search');

Jira = {
  'auth': () => auth.setConfig(),

  'checkConfig': () => auth.checkConfig(),

  'getOptions': function() {
    if (this.checkConfig()) {
      return config.options;
    } else {
      log('Unable to get options. auth.checkConfig did not pass.');
      return [];
    }
  },
  
  'getBookmarks': function() {
    if (this.checkConfig()) {
      if (config.bookmarks && typeof config.bookmarks == 'object') {
        return config.bookmarks;
      }
    }
    return [];
  },

  'getAllBookmarks': function() {
    let self = this;
    return Promise.all(self.getBookmarks()
        .map((bookmark, index) => 
          self.listAll(`bookmark-${index}`)));
  },

  'getUsers': function() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(users.getUsers.bind(users))
        .then(resolve)
        .catch(reject)
    })
  },

  'getIssueTypes': function(project) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => {
          if (project) {
            return issueTypes.getIssueTypesByProject(project);
          }
          return issueTypes.getIssueTypes();
        })
        .then(resolve)
        .catch(reject)
    })
  },

  'login': () => auth.setConfig().then(auth.login.bind(auth)),

  'testBookmark': function(bookmarkConfig) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => ls.showAll(bookmarkConfig))
        .then(resolve)
        .catch(res => {
          reject(res.response.data.errorMessages);
        })
    })
  },

  'listAll': function(bookmarkConfig) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => {
          return ls.showAll(bookmarkConfig);
        })
        .then(resolve)
        .catch(res => {
          let err = res.response;
          log(err);
          if (!err) { 
            reject('Unable to receive response from: ' + 
              config.url + ' ' + '\n' + res)
          }
          if (err.status === 401) {
            auth.logout();
          }
          if (err.status === 403) {
            log('Too many failed login attempts: \n%s', 
              err.headers['x-authentication-denied-reason']);
          }
          reject(err.status + ': ' + err.statusText);
        });
    })
  },

  'search': function(query) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => resolve(search.search(query)))
        .catch(reject);
    })
  },

  'status': function(ticketId) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => {
          return resolve(status.availableTransitions(ticketId));
        })
        .catch(reject)
    })
  },

  'transition': function(ticketId, action, token) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => {
          return resolve(status.transition(ticketId, action, token));
        })
        .catch(reject)
    })
  },

  'createIssue': function() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => {
          return resolve(create());
        })
        .catch(reject)
    })
  },

  'assign': function(ticket, assignee) {
    let self = this;
    return new Promise((resolve, reject) => {
      if (!ticket) return reject('No ticket specified');
      self.auth()
        .then(() => {
          if (assignee) {
            assign.to(ticket, assignee)
              .then(resolve)
              .catch(reject)
          } else {
            return reject('No assignee specified');
          }
        })
    });
  },

  'comment': function(ticket, comment) {
    let self = this;
    return new Promise((resolve, reject) => {
      if (!ticket || !comment) {
        return reject('Requires a ticket & comment.');
      }
      self.auth()
        .then(() => resolve(Comment(ticket, comment)))
        .catch(reject);
    })
  },

  'toggleWatch': function(ticket, currentState) {
    let self = this;
    return new Promise((resolve, reject) => {
      if (!ticket || currentState === undefined) {
        return reject('Requires a ticket & the current watched status');
      }
      self.auth()
        .then(() =>
          resolve(watch[['start', 'stop'][+currentState]](ticket)))
        .catch(reject);
    });
  },

  'startProgress': function(issue) {
    return worklog.start(issue);
  },

  'stopProgress': function(issue) {
    let self = this;
    return new Promise((resolve,reject) => {
      self.auth()
        .then(() => {
          worklog.stop(issue).then(resolve).catch(reject)
        })
    });
  },

  'clearProgress': function(issue) {
    return worklog.clearProgress(issue);
  },

  'getProgress': function(issue) {
    return worklog.getProgress(issue);
  },

  'listInProgress': function() {
    return worklog.inProgress();
  },

  'inProgressInfo': function(issue) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => {
          worklog.inProgressInfo(issue).then(resolve).catch(reject)
        })
    });
  },

  'clearSettings': function() {
    return auth.clearConfig();
  },

  'clearCache': function() {
    let args = [...arguments];
    return cache.clear(args);
  },

  'refreshCache': function() {
    let self = this;
    self.clearCache.apply(self, arguments)
      .then(self.fetchData);
  },

  'editSettings': function() {
    this.auth()
      .then(() => {
        sh.spawn('npm', ['run', 'electron'], 
          { detached: true, stdio: 'ignore' }).unref();
      })
  },

  'getStatuses': function() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(auth.getStatuses.bind(auth))
        .then(resolve)
        .catch(reject);
    });
  },

  'getProjects': function() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(auth.getProjects.bind(auth))
        .then(resolve)
        .catch(reject);
    });
  },

  'fetchData': function() {
    sh.spawn('node', ['./lib/background.js'], 
      { detached: true, stdio: 'ignore'}).unref();
  }
};

module.exports = Jira;