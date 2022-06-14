// Improve the default prompt with hostname, process type, and version
prompt = function() {
  const serverstatus = db.serverStatus();
  const host = serverstatus.host.split('.')[0];
  const process = serverstatus.process;
  const version = db.serverBuildInfo().version;
  const repl_set = db._adminCommand({'replSetGetStatus': 1}).ok !== 0;
  let rs_state = '';
  if (repl_set) {
    const status = rs.status();
    const members = status.members;
    const rs_name = status.set;
    for (let i = 0; i < members.length; i++) {
      if (members[i].self === true) {
        rs_state = '[' + members[i].stateStr + ':' + rs_name + ']';
      }
    }
  }
  const state = isMongos() ? '[mongos]' : rs_state;
  return host + '(' + process + '-' + version + ')' + state + ' ' + db + '> ';
};

