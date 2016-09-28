var config = require('./config');
var auth = require('./auth');
let request = require('axios');
let cache = require('./cache');

// Cache list of users for a week (7 days)
let users = cache.get('users', 7*24*60*60*1000);

module.exports = {
  getUsers: function() {
    let self = this;
    return new Promise((resolve, reject) => {
      if (users) {
        return resolve(users);
      }
      let projects = self.getAvailableProjects();
      let query = 'rest/api/2/user/assignable/multiProjectSearch';
      config.req.params = {
        username: '%',
        projectKeys: projects,
        startAt: 0,
        maxResults: 1000
      };
      if (!projects) { 
        return reject('No available projects found');
      }
      request
        .get(config.url + query, config.req)
        .then(res => {
          let seen = {};
          let users = res.data
            .filter(s => seen.hasOwnProperty(s.name) ? false : (seen[s.name] = true))
            .map( user => {
            return {
              username: user.name,
              name: user.displayName,
              avatarUrls: user.avatarUrls
            }
          })
          cache.set('users', users);
          resolve(users)
        })
        .catch(reject)
    })
  },

  getAvailableProjects: () => {
    let options = config.options || {},
        projects = options.available_projects || [];
    return (projects.length) ? projects.join(',') : false;
  }
};
