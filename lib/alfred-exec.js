const child = require('child_process');
let shell = process.env.SHELL;
let escChr = str => str.replace(/(["\$])/g, '\\$1');
let escSpace = str => str.replace(/ /g, '\\ ');
const PATH = 'eval $(echo "$(/usr/libexec/path_helper -s)" | awk -F\';\' \'{ print $1 }\');';

module.exports = {
  'exec': (cmd, options, callback) => {
    cmd = escChr(`${PATH} ${cmd}`);
    return child.exec(`${shell} -c "${cmd}"`, options, callback);
  },
  'execSync': (cmd, options) => {
    cmd = escChr(`${PATH} ${cmd}`);
    return child.execSync(`${shell} -c "${cmd}"`, options);
  },
  'spawn': (cmd, args, options) => {
    args = args.map(escSpace);
    return child.spawn(shell, ['-c', `${PATH} ${cmd} ${args.join(' ')}`], options);
  },
};