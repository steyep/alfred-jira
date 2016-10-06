const child = require('child_process');
let shell = process.env.SHELL;
let escQuotes = str => str.replace(/"/g,'\\"');
let escSpace = str => str.replace(/ /g, '\\ ');

module.exports = {
  'exec': (cmd, options, callback) => {
    cmd = escQuotes(cmd);
    return child.exec(`${shell} -c "${cmd}"`, options, callback);
  },
  'execSync': (cmd, options) => {
    cmd = escQuotes(cmd);
    return child.execSync(`${shell} -c "${cmd}"`, options);
  },
  'spawn': (cmd, args, options) => {
    args = args.map(escSpace)
    return child.spawn(shell, ['-c', `${cmd} ${args.join(' ')}`], options);
  }
}