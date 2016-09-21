const sh = require('child_process');
const config = require('./config');
const cache = require('./cache');
const auth = require('./auth');
const ls = require('./list');
const status = require('./transitions');
const users = require('./users');
const assign = require('./assign');
const Comment = require('./comment');
const watch = require('./watch');

Jira = {
  'auth': () => auth.setConfig(),

  'getUsers': function(name) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => resolve(users.getUsers(name)))
        .then(resolve)
        .catch(reject)
    })
  },

  'login': () => auth.setConfig().then(auth.login.bind(auth)),

  'listAll': function() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(ls.showAll.bind(ls))
        .then(resolve)
        .catch(reject)
    })
  },

  'listWatched': function() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(ls.watchedIssues.bind(ls))
        .then(resolve)
        .catch(reject)
    })
  },

  'listByStatus': function(status) {
    let self = this;
    if (!status) return self.listAll();
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => resolve(ls.issuesByStatus(status)))
        .catch(reject);
    })
  },

  'search': function(query) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.auth()
        .then(() => resolve(ls.search(query)))
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
        .then(() => {
          if (currentState) {
            watch.stop(ticket)
              .then(res => {
                self.refreshCache('tickets', 'watchedTickets');
                return resolve(res);
              })
          } else {
            watch.start(ticket)
              .then(res => {
                self.refreshCache('tickets', 'watchedTickets');
                return resolve(res);
              })
          }
        })
        .catch(reject);
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
        sh.exec('open ' + config.cfgPath + config.cfgFile);
      })
  },

  'fetchData': function() {
    sh.spawn('/usr/local/bin/node', ['./lib/background.js'], 
      { detached: true, stdio: 'ignore'}).unref();
  }
};

module.exports = Jira;