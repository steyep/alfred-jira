const config = require('./config');
const auth = require('./auth');
const cache = require('./cache');
const list = require('./list');
const request = require('axios');
const moment = require('moment');

let inProgress = cache.get('in-progress') || {};

module.exports = {
  'timeRunning': ticket => {
    ticket = inProgress[ticket] || null;
    if (!ticket) {
      return false;
    } else {
      let start = ticket.start;
      let now = new Date();
      let runTime = Math.round((now - start) / 1000);
      return runTime;
    }
  },

  'getProgress': function(ticket) {
    let seconds = this.timeRunning(ticket);
    if (seconds === false) {
      return seconds;
    } else {
      let res = [];
      let elapsed = {
        'day': Math.floor(seconds/24/60/60),
        'hour': Math.floor(seconds/60/60) % 24,
        'min': Math.floor(seconds/60) % 60
      };
      for (let i in elapsed) {
        if (time = elapsed[i]) {
          let unit = time == 1 ? i : i + 's'
          res.push(time, unit)
        }
      }
      return res.length ? res.join(' ') : '< 1 min';
    }
  },

  'start': function (ticket) {
    let curr = Object.keys(inProgress).filter(key => key != ticket);
    if (curr.length) {
      return console.log('%s still in progress', curr.join(', '));
    }
    inProgress[ticket] = inProgress[ticket] || { 'start': Date.now() };
    cache.set('in-progress', inProgress);
    console.log('Started working on: ' + ticket);
  },

  'stop': function(ticket) {
    let seconds = this.timeRunning(ticket);
    
    if (inProgress[ticket] && seconds) {
      let date = moment(inProgress[ticket]['start']).format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ');
      auth.setConfig()
      .then(() => {
        let data = {
          'timeSpentSeconds': seconds,
          'comment': 'test',
          'started': date
        }
        request
          .post(config.url + 'rest/api/2/issue/' + ticket + '/worklog', data, config.req)
          .then(function(res) {
            console.error(res.data)
            if (res.status === 201) {
              delete inProgress[ticket];
              cache.set('in-progress', inProgress);
              console.log('Logged %d seconds to %s', seconds, ticket);
            }
          })
          .catch(console.error);
      });
    } else {
      console.error('Unable to determine progress of %s', ticket);
    }
  },

  'inProgress': function() {
    let result = [];
    for (let ticket in inProgress) {
      result.push({
        'id': ticket,
        'start': inProgress[ticket]['start'],
        'runTime': this.getProgress(ticket)
      })
    }
    return result;
  }
};