// Begin PS Hack
// Copyright (c) 2016, 2017 Andrew Young
// SPDX-License-Identifier: MIT

const psHack = {

  printTableRow: function(row, columnWidths) {
    const pad = function(x, i) {
      return x.pad(i).slice(-i).toString();
    };
    let line = '';
    for (c in columnWidths) {
      line = line + pad(row[c], columnWidths[c]) + ' ';
    }
    print(line);
  },

  printTable: function(headers, rows) {
    // printTable(headers: Array[String], rows: Array[Array[String]])

    // Find column widths

    const columnWidths = [];

    for (c in headers) {
      columnWidths[c] = headers[c].length;
    }

    for (r in rows) {
      var row = rows[r];
      for (c in headers) {
        row[c] = row[c].toString();
        columnWidths[c] = Math.max(columnWidths[c], row[c].length);
      }
    }

    // Print Table
    const hr = function(l) {
      return new Array(l + 1).join('-');
    };
    const hrs = [];
    for (c in columnWidths) {
      hrs.push(hr(columnWidths[c]));
    }
    this.printTableRow(headers, columnWidths);
    this.printTableRow(hrs, columnWidths);

    const ptr = this.printTableRow;
    rows.forEach(function(row) {
      ptr(row, columnWidths);
    });

  },

  // This parses command line options
  argumentRegex: /(-|--)(\w+)|"([^"]+)"|'([^']+)'|(\S+)/g,

  parseOptions: function(argumentString) {
    const options = {};
    if (typeof (argumentString) == 'string') {
      // Arguments outside of options will go here
      let optionName = '_args';
      options[optionName] = [];
      // If we get a -- by itself, we will stop processing arguments.
      let stopProcessingArguments = false;
      let match = this.argumentRegex.exec(argumentString);
      while (match != null) {
        if (stopProcessingArguments) {
          options['_args'].push(match[0]);
        } else if (match[0] === '--') {
          stopProcessingArguments = true;
        } else if (match[1] !== undefined) {
          // This is an option name
          optionName = match[2];
          if (options[optionName] === undefined) {
            options[optionName] = [];
          }
        } else {
          for (let i = 3; i < 6; i++) {
            // Find the first group that matched
            if (match[i] !== undefined) {
              options[optionName].push(match[i]);
              break;
            }
          }
          optionName = '_args';
        }
        match = this.argumentRegex.exec(argumentString);
      }
    }
    return options;
  },

  getOptionsAsQuery: function(options, names, f) {
    // Returns a query for a given option
    values = undefined;

    if (typeof (options) == 'object' && typeof (names) == 'object') {
      names.forEach(function(x) {
        if (options[x] !== undefined) {
          if (values === undefined) {
            values = [];
          }
          values = values.concat(options[x]);
        }
      });

      if (values !== undefined && typeof (f) == 'function') {
        values = values.map(f);
      }
    }

    if (values === undefined) {
      return undefined;
    } else if (values.length === 0) {
      return true;
    } else if (values.length === 1) {
      return values[0];
    }
    return {$or: values};
  },

  addOptionsToQuery: function(queryObject, queryName, options, names, f) {
    // Adds a given option to the query object
    const query = this.getOptionsAsQuery(options, names, f);
    if (query !== undefined) {
      if (typeof (queryName) == 'string') {
        queryObject[queryName] = query;
      }
    }
  },

  ps: function(db, argumentString) {
    const headers = [
      'Thread ID',
      'Description',
      'Connection',
      'Op ID',
      'App Name',
      'Client',
      'S',
      'Active',
      'Time',
      'WaitLock',
      'Operation',
      'Plan',
      'Namespace',
    ];

    const rows = [];
    const options = this.parseOptions(argumentString);
    if (options["h"] !== undefined || options["help"] !== undefined) {
        print("Usage: ps [options]");
        print("Options:")
        print("  -a | --all                       Show all operations (this overrides all other options)");
        print("  -c | --client <ip/hostname>      Show process for client*");
        print("  -d | --description <description> Show processes with description");
        print("  -A | --active                    Show only active processes");
        print("  -r | --running <seconds>         Show only processes which have been running for a certain time");
        print("  -o | --op <operation>            Show commands running a certain operation");
        print("  -n | --ns <namespace>            Show commands running against a certain namespace*");
        print("  -x | --app <app name>            Show commands with a matching app name*");
        print("  -l | --locks                     Show commands waiting for a lock");
        print("  -C | --collection <name>         Search the given collection instead of calling db.currentOp()");
        print("  -v | --verbose                   Print the query that is being run");
        print("Note: Options marked with * will return all operations that start with the provided value.");
        return;
    }

    let connectionOptions = {};
    if (options['a'] === undefined && options['all'] === undefined) {
      connectionOptions.connectionId = {$exists: true};
    } else {
      connectionOptions['$all'] = true;
    }
    this.addOptionsToQuery(connectionOptions, 'desc', options,
        ['d', 'description', 'desc']);
    this.addOptionsToQuery(connectionOptions, 'active', options,
        ['A', 'active']);
    this.addOptionsToQuery(connectionOptions, 'secs_running', options,
        ['r', 'running'], function(x) {
          return {$gt: x};
        });
    this.addOptionsToQuery(connectionOptions, 'op', options, ['o', 'op']);
    this.addOptionsToQuery(connectionOptions, 'ns', options, ['n', 'ns'],
        function(x) {
          return {$regex: '^' + x.replace(/\$/g, '\\$')};
        });
    this.addOptionsToQuery(connectionOptions, 'appName', options, ['x', 'app'],
        function(x) {
          return {$regex: new RegExp(x.replace(/\$/g, '\\$'), 'i')};
        });
    this.addOptionsToQuery(connectionOptions, 'waitingForLock', options,
        ['l', 'locks']);
    const clientQuery = this.getOptionsAsQuery(options, ['c', 'client'],
        function(x) {
          return {$regex: '^' + x};
        });
    if (clientQuery !== undefined) {
      // This one search two separate fields, which makes it more complicated
      const oldQueryString = JSON.stringify(connectionOptions);
      const q1 = JSON.parse(oldQueryString);
      const q2 = JSON.parse(oldQueryString);
      q1.client = clientQuery;
      q2.client_s = clientQuery;
      connectionOptions = {$or: [q1, q2]};
    }

    if (options['v'] !== undefined || options['verbose'] !== undefined) {
      print('Query: ' + tojson(connectionOptions));
    }

    let connections = [];
    const customCollection = (options['C'] || options['collection'] || [])[0];
    if (customCollection !== undefined) {
      connections = db[customCollection].find(connectionOptions);
    } else {
      connections = db.currentOp(connectionOptions).inprog;
    }

    connections.forEach(function(op) {
      const threadId = op.threadId || '';
      const description = op.desc || '';
      const connectionId = op.connectionId || '';
      const opId = op.opid || '';
      const appName = op.appName || '';
      const client = op.client || op.client_s || '';
      const isMongos = op.client_s ? 'S' : '';
      const active = op.active ? 'Active' : 'Idle';
      const time = op.secs_running || '';
      const waitingForLock = op.waitingForLock ? 'Yes' : 'No';
      const opName = op.op || '';
      const plan = op.planSummary || '';
      const ns = op.ns || '';

      rows.push([
        threadId,
        description,
        connectionId,
        opId,
        appName,
        client,
        isMongos,
        active,
        time,
        waitingForLock,
        opName,
        plan,
        ns,
      ]);
    });

    this.printTable(headers, rows);

  },

  kill: function(db, opId) {
    return db.killOp(opId);
  },
};

function ps(argumentString) {
  psHack.ps(db, argumentString);
}

function kill(argumentString) {
  psHack.kill(db, argumentString);
}

shellHelper.ps = ps;
shellHelper.kill = kill;

// End PS Hack
