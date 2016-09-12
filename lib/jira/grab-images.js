const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const sh = require('child_process');

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