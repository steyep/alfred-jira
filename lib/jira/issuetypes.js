var config = require('./config');
var auth = require('./auth');
let request = require('axios');
let cache = require('./cache');

module.exports = {
  getIssueTypes: function() {
    let self = this;
    return new Promise((resolve, reject) => {
      // Cache list of issuetypes for a week (7 days)
      let issuetypes = cache.get('issuetypes', 7*24*60*60*1000);
      if (issuetypes) {
        return resolve(issuetypes);
      }

      request
        .get(config.url + 'rest/api/2/issuetype', config.req)
        .then(res => {
          let types = res.data
            .filter(type => !type.subtask)
            .map(type => ({
              name: type.name,
              icon: type.iconUrl
            }))
          cache.set('issuetypes', types);
          resolve(types)
        })
        .catch(reject)
    })
  },

  getIssueTypesByProject: function (project) {
    let self = this;
    return new Promise((resolve, reject) => {

      // Cache list of issuetypes for the project for 5 mins
      let issuetypes = cache.get(`issuetypes-${project}`, 5*60*1000);
      if (issuetypes) {
        return resolve(issuetypes);
      }

      let req = Object.assign({}, config.req);
      req.params = {
        projectKeys: project
      };

      request
        .get(config.url + 'rest/api/2/issue/createmeta', req)
        .then(res => {
          let types = res.data.projects[0].issuetypes
            .filter(type => !type.subtask)
            .map(type => ({
              name: type.name,
              icon: type.iconUrl
            }))
          resolve(types);
          cache.set(`issuetypes-${project}`, types);
        })
        .catch(reject);
    });
  }
}
