const config = require('./config');
const auth = require('./auth');
const cache = require('./cache');
const list = require('./list');

let inProgress = cache.get('in-progress') || {};
module.exports = {
  'getProgress': (ticket) => {
    ticket = inProgress[ticket] || null;
    let res = [];
    if (!ticket) {
      return false;
    } else {
      let start = ticket.start;
      let now = new Date();
      let runTime = Math.round(now - start);
      let elapsed = {
        'days': Math.floor(runTime/24/60/60/1000),
        'hours': Math.floor(runTime/60/60/1000) % 24,
        'mins': Math.floor(runTime/60/1000) % 60,
        // 's': Math.floor(runTime/1000) % 60
      }
      for (let i in elapsed) {
        if (time = elapsed[i]) {
          res.push(time, i)
        }
      }
      return res.join(' ');
    }
  },

  'start': function (ticket) {
    inProgress[ticket] = inProgress[ticket] || { 'start': Date.now() };
    this.refreshInfo();
    // cache.set('in-progress', inProgress);
    console.log('Started working on: ' + ticket);
  },

  'stop': function(ticket) {
    if (inProgress[ticket]) {
      delete inProgress[ticket];
    }
    cache.set('in-progress', inProgress);
    console.log('Stopped working on: ' + ticket);
  },

  'refreshInfo': function() {
    return new Promise((resolve, reject) => {
      // let cached = cache.get('in-progress', 15*60*1000);
      // if (cached) {
      //   return resolve(cached);
      // }
      for (let ticket in inProgress) {
        auth.setConfig()
          .then(() => {
            list.findIssue(ticket)
              .then( res => {
                inProgress[ticket]['info'] = res;
                cache.set('in-progress', inProgress);
                return resolve(inProgress);
              })
              .catch(console.error)
          })
      }
    })
  },

  'inProgress': function() {
    let result = [];
    for (let ticket in inProgress) {
      result.push({
        'id': ticket,
        'start': inProgress[ticket]['start'],
        'runTime': this.getProgress(ticket),
        'info': inProgress[ticket]['info'][0]
      })
    }
    return result;
  }
};