const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const cache = require('./cache');

let cacheLimit = 45*1000; // 45 seconds

let Transitions = {
  availableTransitions: function(ticketId) {
    let self = this;
    return new Promise((resolve, reject) => {
      let query = 'rest/api/2/issue/' + ticketId + '/transitions';
      if (!ticketId) return reject('No ticket supplied');
      let transitions = cache.get('transitions-' + ticketId, cacheLimit);
      if (transitions) {
        return resolve(transitions);
      }
      request
        .get(config.url + query, config.req)
        .then(function(res) {
          if (res.status != 200) {
            reject(new Error(res.statusText));
          }
          let transitions = res.data.transitions || [];
          
          if (!transitions.length) {
            return reject('No transitions found for ' + ticketId);
          } 
       
          transitions = transitions.map( status => {
            let to = status.to || { statusCategory: { name: 'done' }}
            let category = to.statusCategory;
            return {
              ticketId: ticketId,
              action: status.id,
              name: status.name,
              category: category.name
            };
          })
          cache.set('transitions-' + ticketId, transitions);
          resolve(transitions);
        }).catch(reject);
    });
  },

  transition: (ticketId, action, token) => {
    const sh = require('child_process');
    if (!ticketId || !action) {
      return console.error('Must supply ticketId and action');
    }
    let address = config.url + 'secure/CommentAssignIssue!default.jspa?'
      + 'key=' + ticketId
      + '&action=' + action;
    sh.exec('open "' + address + '"');
  }
}

module.exports = Transitions;