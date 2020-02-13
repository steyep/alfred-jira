const config = require('./config');
const auth = require('./auth');
const request = require('axios');

module.exports = function (ticket, comment) {
  return new Promise((resolve, reject) => {
    request
      .post( config.url + 'rest/api/2/issue/' + ticket + '/comment', { body: comment }, config.req)
      .then(res => {
        if (res.status != 201) {
          reject(new Error(res.statusText));
        }
        resolve('Comment added to ' + ticket);
      })
      .catch(reject);
  });
};