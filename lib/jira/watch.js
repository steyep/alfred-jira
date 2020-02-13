const config = require('./config');
const auth = require('./auth');
const request = require('axios');

module.exports = {
  start: issue => {
    return new Promise((resolve, reject) => {
      if (!config.user) {
        return reject('User not found');
      }
      config.req.data = config.user;
      request
        .post(config.url + 'rest/api/2/issue/' + issue + '/watchers', '"' + config.user + '"', config.req)
        .then(res => {
          if (res.status != 204) {
            reject(new Error(res.statusText));
          }
          return resolve('Started watching ' + issue);
        })
        .catch(res => {
          let err = res.response;
          if (!err) { 
            reject('Unable to receive response from: ' + 
              config.url + ' ' + '\n' + res);
          }
          if (err.status === 401) {
            auth.logout();
          }
          if (err.status === 404) {
            reject('Issue ' + issue + ' does not exist');
          }
          reject(err.status + ': ' + err.statusText);
        });
    });
  },

  stop: issue => {
    return new Promise((resolve, reject) => {
      if (!config.user) {
        return reject('User not found');
      }
      config.req.params = { username: config.user };
      request
        .delete(config.url + 'rest/api/2/issue/' + issue + '/watchers', config.req)
        .then(res => {
          if (res.status != 204) {
            reject(new Error(res.statusText));
          }
          return resolve('Stopped watching ' + issue);
        })
        .catch(res => {
          let err = res.response;
          if (!err) { 
            reject('Unable to receive response from: ' + 
              config.url + ' ' + '\n' + res);
          }
          if (err.status === 401) {
            auth.logout();
          }
          if (err.status === 404) {
            reject('Issue ' + issue + ' does not exist');
          }
          reject(err.status + ': ' + err.statusText);
        });
    });
  },
};