const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const sh = require('child_process');

auth.setConfig()
  .then(() => {
    return new Promise((resolve, reject) => {
      request
        .get(config.url + 'rest/api/2/project', config.req)
          .then(res => {
            let avatars = res.data.map( avatar => {
              return {
                key: avatar.key,
                url: avatar['avatarUrls']['48x48']
              };
            });
            for (avatar of avatars) {
              let cmd = [
                'sh ./resources/download_img.sh', 
                '"' + avatar.url + '"',
                '"./resources/project_icons/' + avatar.key + '"'
              ].join(' ')
              sh.exec(cmd);
            }
          })
          .catch(reject)
    })
  })