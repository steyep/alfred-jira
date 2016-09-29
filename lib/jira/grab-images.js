const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const sh = require('child_process');
const users = require('./users');

let category = process.argv.slice(2)[0];

let download = (url, out) => {
  // Remove special characters from file name:
  out = out.replace(/[^\/]*$/, function(filename) { return filename.replace(/[^a-z0-9]/gi, '_'); });
  let child = sh.spawn('sh', ['./bin/download_img.sh', url, out]);
  child.stdout.on('data', data => process.stdout.write(data.toString()));
};

let DownloadImages = {
  projects: () => {
    request
      .get(config.url + 'rest/api/2/project', config.req)
      .then(res => {
        for (avatar of res.data) {
          download(avatar['avatarUrls']['48x48'], config.projectIconPath + avatar.key);
        }
      }).catch(console.error);
  },
  users: () => {
    users.getUsers()
      .then(res => {
        for (avatar of res) {
          download(avatar['avatarUrls']['48x48'], config.userIconPath + avatar.name);
        }
      }).catch(console.error);
  },
  priorities: () => {
    request
      .get(config.url + '/rest/api/2/priority', config.req)
      .then(res => {
        for (avatar of res.data) {
          download(avatar.iconUrl, config.priorityIconPath + avatar.name);
        }
      }).catch(console.error);
  }
};

if (category == 'all') {
  for (let method in DownloadImages) {
    auth.setConfig().then(DownloadImages[method]);
  }
} else {
  auth.setConfig().then(DownloadImages[category]);
}

