const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const sh = require('child_process');
const users = require('./users');

const download = (opts, cb) => {
  opts = opts
    .filter(opt => opt.file && opt.address)
    .map(opt => {
      return [
      '-o', 
      opt.path + opt.file.replace(/[^a-z0-9]/gi, '_'),
      opt.address
      ];
    });
  let dl = sh.spawn('sh', ['./bin/download_img.sh'].concat(...opts));
  // dl.stdout.on('data', data => process.stdout.write(data.toString()))
  // dl.stderr.on('data', data => process.stdout.write(data.toString()))
  dl.on('close', cb);
}

const DownloadImages = {
  projects: (callback) => {
    request
      .get(config.url + 'rest/api/2/project', config.req)
      .then(res => {
        let params = res.data.map(s => {
          return {
            path: config.projectIconPath,
            file: s.key,
            address: s['avatarUrls']['48x48']
          }
        });
        download(params, callback);
      })
      .catch(console.error);
  },

  users: (callback) => {
    users.getUsers()
      .then(res => {
        let params = res.map(s => {
          return {
            path: config.userIconPath,
            file: s.name,
            address: s['avatarUrls']['48x48']
          }
        });
        download(params, callback);
      })
      .catch(console.error);
  },

  priorities: (callback) => {
    request
      .get(config.url + '/rest/api/2/priority', config.req)
      .then(res => {
        let params = res.data.map(s => {
            return {
              path: config.priorityIconPath,
              file: s.name,
              address: s.iconUrl
            }
          });
        download(params, callback);
      })
      .catch(console.error);
  }
};

module.exports = (action, callback) => {
  auth.setConfig()
    .then(() => {
      DownloadImages[action](callback);
    });
}
