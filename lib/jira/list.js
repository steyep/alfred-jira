const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const cache = require('./cache');


let list = {
  query: null, 
  issues: null,
  type: null,
  setCache: false,
  cacheId: null,
  cacheLimit: 15*60*1000, // 15 minutes 

  getIssues: function() {
    let self = this;
    return new Promise((resolve, reject) => {
      let cachedData = cache.get(self.cacheId, self.cacheLimit);
      if (cachedData) {
        return resolve(cachedData);
      }
      request
        .get(config.url + self.query, config.req)
        .then(function(res) {
          if (res.status != 200) {
            reject(new Error(res.statusText));
          }

          self.issues = res.data.issues;
          let table = [];
          for (let i =0; i < self.issues.length; i++) {
            let issue = self.issues[i],
                fields = issue.fields;
            if (!fields.priority) {
              fields.priority = { name: '' }
            }

            if (!fields.status) {
              fields.status = { name: '' }
            }

            if (!fields.assignee) {
              fields.assignee = { displayName: '' }
            }

            if (!fields.status.statusCategory) {
              fields.status.statusCategory = { name: '' }
            }

            table.push({
              'Key': issue.key,
              'Priority': fields.priority.name,
              'Summary': fields.summary,
              'Description': fields.description,
              'Status': fields.status.name,
              'StatCategory': fields.status.statusCategory.name,
              'Assignee': fields.assignee.displayName,
              'URL': config.url + 'browse/' + issue.key
            });
          }
          if (self.setCache) {
            cache.set(self.cacheId, table);
          }
          resolve(table);
        })
        .catch(res => {
          let err = res.response;
          if (!err) { 
            reject('Unable to receive response from: ' + 
              config.url + ' ' + '\n' + res)
          }
          if (err.status === 401) {
            auth.logout();
          }
          if (err.status === 403) {
            console.error('Too many failed login attempts: \n%s', 
              err.headers['x-authentication-denied-reason'])
          }
          reject(err.status + ': ' + err.statusText);
        })
    });
  },

  watchedIssues: function() {
    this.query = 'rest/api/2/search?jql='
      + 'issueKey+IN+watchedIssues()'
      + '+AND+status+in+("' + this.getAvailableStatuses() + '")'
      + '+order+by+updated+DESC'
    this.setCache = true;
    this.cacheId = 'watchedTickets';
    return this.getIssues();
  },

  showAll: function (type) {
    this.type = type ? '+AND+type="' + type + '"' : '';
    this.query = 'rest/api/2/search?jql='
      + 'assignee=currentUser()'
      + this.searchInProjects()
      + '+AND+status+in+("' + this.getAvailableStatuses() + '")'
      + '+order+by+priority+DESC,+key+DESC';
    this.setCache = true;
    this.cacheId = 'tickets';
    return this.getIssues();
  },

  findIssue: function(ticket){
    this.query = 'rest/api/2/search?jql='
      + 'issueKey="' + ticket + '"'
      + '+order+by+priority+DESC,+key+DESC';
    return this.getIssues();
  },

  search: function (query) {
    this.setCache = true;
    this.cacheId = 'search';
    this.cacheLimit = 45*1000; // 45 seconds
    if (/\w+-\d+/.test(query)) {
      return this.findIssue(query);
    }
    this.query = 'rest/api/2/search?jql='
      + 'summary+~+"' + query + '"'
      + '+OR+description+~+"' + query + '"'
      + '+OR+comment+~+"' + query + '"'
      + '+order+by+priority+DESC,+key+DESC';
    return this.getIssues();
  },

  getAvailableStatuses: function () {
    return config.options.available_issues_statuses.join('", "');
  },

  searchInProjects: () => {
    let options = config.options || {},
        projects = options.available_projects || [];
    if (!projects.length) {
      return '';
    }
    return '+AND+project+in+("' + projects.join('", "') + '")';
  }
};

module.exports = list;