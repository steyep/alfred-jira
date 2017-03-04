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
const worklog = require('./worklog');

Jira = {
  'auth': () => auth.setConfig(),

  'checkConfig': () => auth.checkConfig(),

  'getOptions': function() {
    if (this.checkConfig()) {
      return config.options;
    } else {
      console.error('Unable to get options. auth.checkConfig did not pass.');
      return [];
    }
  },
  
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
                self.refreshCache('tickets', 'watchedTickets', 'in-progress');
                return resolve(res);
              })
          } else {
            watch.start(ticket)
              .then(res => {
                self.refreshCache('tickets', 'watchedTickets', 'in-progress');
                return resolve(res);
              })
          }
        })
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
        let cwd = process.cwd();
        sh.spawn(process.env.SHELL, 
          ['-c',`${cwd}/node_modules/.bin/electron ${cwd}/app`], 
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
    sh.spawn('/usr/local/bin/node', ['./lib/background.js'], 
      { detached: true, stdio: 'ignore'}).unref();
  }
};

module.exports = Jira;