const config = require('./config');
const auth = require('./auth');
const cache = require('./cache');
const list = require('./list');
const request = require('axios');
const moment = require('moment');
const fs = require('fs');

if (!fs.existsSync(config.cfgPath)) {
  fs.mkdirSync(config.cfgPath);
}

let inProgressStorage = config.cfgPath + 'inProgress.json';
let inProgress = fs.existsSync(inProgressStorage) ?
    JSON.parse(fs.readFileSync(inProgressStorage, 'utf-8')) : {};
let cacheId = 'in-progress';
let cacheLimit = 15*60*1000; // 15 minutes 

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
      return res.length ? res.join(' ') : seconds + ' secs';
    }
  },

  'start': function (ticket) {
    let curr = Object.keys(inProgress).filter(key => key != ticket);
    if (curr.length) {
      return console.log('%s still in progress', curr.join(', '));
    }
    inProgress[ticket] = inProgress[ticket] || { 'start': Date.now() };
    fs.writeFileSync(inProgressStorage, JSON.stringify(inProgress));
    console.log('Started working on: ' + ticket);
  },

  'stop': function(ticket) {
    let self = this;
    return new Promise((resolve,reject) => {
      let seconds = self.timeRunning(ticket);
      if (inProgress[ticket] && seconds) {
        let date = moment(inProgress[ticket]['start']).format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ');
        let data = {
          'timeSpentSeconds': seconds,
          'comment': '',
          'started': date
        }
        request
          .post(config.url + 'rest/api/2/issue/' + ticket + '/worklog', data, config.req)
          .then(function(res) {
            if (res.status === 201) {
              delete inProgress[ticket];
              fs.writeFileSync(inProgressStorage, JSON.stringify(inProgress));
              return resolve('Logged ' + res.data.timeSpent + ' to ' + ticket);
            } 
          })
          .catch(res => {
            console.error(res);
            return reject('Unable to log progress of ' + ticket);
          });
      } else {
        return reject('Unable to determine progress of ' + ticket);
      }
    });
  },

  'inProgressInfo': function(ticket) {
    return new Promise((resolve, reject) => {
      let cached = cache.get(cacheId, cacheLimit) || {};
      if (cached[ticket]) {
        return resolve(cached[ticket]);
      }
      list.findIssue(ticket)
        .then(res => {
          cached[ticket] = res[0]
          cache.set(cacheId, cached);
          resolve(res[0])
        }).catch(reject);
    });
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