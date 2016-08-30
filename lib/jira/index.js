const config = require('./config');
const cache = require('./cache');
const auth = require('./auth');
const ls = require('./list');
const status = require('./transitions');
const users = require('./users');
const assign = require('./assign');
const Comment = require('./comment');

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

  'clearSettings': function() {
    return auth.clearConfig();
  },

  'clearCache': function() {
    return cache.clear();
  },

  'editSettings': function() {
      this.auth()
        .then(() => {
          const sh = require('child_process');
          sh.exec('open ' + config.cfgPath + config.cfgFile);
        })
  }
};

module.exports = Jira;