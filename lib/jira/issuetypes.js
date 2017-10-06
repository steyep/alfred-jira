var config = require('./config');
var auth = require('./auth');
let request = require('axios');
let cache = require('./cache');

module.exports = function() {
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
};
