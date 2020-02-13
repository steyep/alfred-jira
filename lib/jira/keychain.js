const sh = require('child_process');
let key = 'alfred-jira';
let user = process.env.USER;

let Keychain = {
  'find': function() {
    try{
      let token = sh.execSync('security 2>&1 >/dev/null find-generic-password -s ' + key + ' -g').toString();
      if (/^password/.test(token)) {
        token = token.split('"')[1];
        return token;
      }
      else {
        console.error('Unable to retrieve password');
        return false;
      }
    }
    catch(e) {
      return false;
    }
  },

  'save': function(token) {
    sh.exec('security add-generic-password -a '+user+' -s '+key+' -w "'+token+'" -U ', function(err, stderr, stdout) {
      if (err) {
        throw err;
      }
      console.log(stdout);
    });
  },

  'delete': function() {
    sh.exec('security delete-generic-password -s ' + key, function(err, stderr, stdout) {
      if (err) {
        console.error('No credentials found for ' + key);
      }
      console.error('Credentials erased!');
    });
  },
};

module.exports = Keychain;