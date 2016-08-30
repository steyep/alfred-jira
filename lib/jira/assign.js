const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const cache = require('./cache');

// Cache list of users for a week (7 days)
let users = cache.get('users', 7*24*60*60*1000);

module.exports = {
  to: function(ticket, assignee) {
    let query = 'rest/api/2/issue/' + ticket + '/assignee';
    return new Promise((resolve, reject) => {
      request
        .put(config.url + query, {name: assignee}, config.req)
        .then( res => {
          if (res.status != 204) {
            reject(new Error(res.statusText));
          }
          resolve(ticket + ' assigned to: ' + assignee);
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
            console.log('Too many failed login attempts: \n%s', 
              err.headers['x-authentication-denied-reason'])
          }
          reject(err.status + ': ' + err.statusText);
        })
    })
  }
}