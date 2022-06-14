shellHelper.find = function(query) {
  assert(typeof query == 'string');

  let args = query.split(/\s+/);
  query = args[0];
  args = args.splice(1);

  if (query !== '') {
    const regexp = new RegExp(query, 'i');
    const result = db.runCommand('listCommands');
    for (let command in result.commands) {
      const commandObj = result.commands[command];
      let help = commandObj.help;
      if (commandObj.help.indexOf('\n') !== -1) {
        help = commandObj.help.substring(0, commandObj.help.lastIndexOf('\n'));
      }
      if (regexp.test(command) || regexp.test(help)) {
        const numSpaces = 30 - command.length;
        print(colorize(command, {color: 'green'}), Array(numSpaces).join(' '),
            '-', help);
      }
    }
  }
};

