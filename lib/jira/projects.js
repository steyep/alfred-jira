const config = require('./config');
const request = require('axios');

module.exports = {
  'getStatuses': () => {
    return new Promise((resolve, reject) => {
      request
        .get(config.url + 'rest/api/2/status', config.req)
        .then(res => {
          if (res.status !== 200) {
            reject(new Error(res.statusText));
          }
          let statuses = res.data.map(status => status.name);
          resolve(statuses);
        })
        .catch(res => {
          let err = res.response;
          if (!err) { 
            reject('Unable to receive response from: ' + 
              config.url + ' ' + '\n' + res)
          }
          if (err.status === 403) {
            console.log('Too many failed login attempts: \n%s', 
              err.headers['x-authentication-denied-reason'])
          }
          reject(err.status + ': ' + err.statusText);
        });
    })
  },

  'getProjects': () => {
    return new Promise((resolve, reject) => {
      request
        .get(config.url + 'rest/api/2/project', config.req)
        .then(res => {
          if (res.status !== 200) {
            reject(new Error(res.statusText));
          }
          let projects = res.data.map( project => project.key )
          resolve(projects);
        })
        .catch(res => {
            let err = res.response;
            if (!err) { 
              reject('Unable to receive response from: ' + 
                config.url + ' ' + '\n' + res)
            }
            if (err.status === 403) {
              console.log('Too many failed login attempts: \n%s', 
                err.headers['x-authentication-denied-reason'])
            }
            reject(err.status + ': ' + err.statusText);
          });
    });
  }
}