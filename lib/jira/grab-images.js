const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const sh = require('child_process');
const users = require('./users');

let category = process.argv.slice(2)[0];

switch(category) {
  case 'projects': 
    auth.setConfig()
    .then(() => {
      request
        .get(config.url + 'rest/api/2/project', config.req)
          .then(res => {
            let avatars = res.data;
            for (avatar of avatars) {
              let output = './resources/project_icons/' + avatar.key;
              let child = sh.spawn('sh', ['./bin/download_img.sh', avatar['avatarUrls']['48x48'], output]);
              child.stdout.on('data', data => process.stdout.write(data.toString()));
            }
          })
          .catch(reject);
    });
  break;
  case 'users': 
    auth.setConfig()
    .then(() => {
      users.getUsers()
        .then(res => {
          let avatars = res;
          for (avatar of avatars) {
            let output = './resources/user_icons/' + avatar.name.replace(/[^a-z0-9]/gi,'_');
            let child = sh.spawn('sh', ['./bin/download_img.sh', avatar['avatarUrls']['48x48'], output]);
            child.stdout.on('data', data => process.stdout.write(data.toString()));
          }
        })
        .catch(reject);
    });
  break;
}