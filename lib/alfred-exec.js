const child = require('child_process');
let shell = process.env.SHELL;
let escQuotes = str => str.replace(/"/g,'\\"');
let escSpace = str => str.replace(/ /g, '\\ ');
const PATH = `eval $(/usr/libexec/path_helper | awk '{print $1}')`;

module.exports = {
  'exec': (cmd, options, callback) => {
    cmd = escQuotes(cmd);
    return child.exec(`${shell} -c "${PATH} ${cmd}"`, options, callback);
  },
  'execSync': (cmd, options) => {
    cmd = escQuotes(cmd);
    return child.execSync(`${shell} -c "${PATH} ${cmd}"`, options);
  },
  'spawn': (cmd, args, options) => {
    args = args.map(escSpace)
    return child.spawn(shell, ['-c', `${PATH} ${cmd} ${args.join(' ')}`], options);
  }
}