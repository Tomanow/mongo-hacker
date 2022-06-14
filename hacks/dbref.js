DBRef.prototype.__toString = DBRef.prototype.toString;
DBRef.prototype.toString = function() {
  const org = this.__toString();
  const config = mongo_hacker_config.dbref;
  if (!config.extended_info) {
    return org;
  }
  const additional = {};
  const o = this;
  for (let p in o) {
    if (typeof o[p] === 'function') {
      continue;
    }
    if (!config.plain && (p === '$ref' || p === '$id')) {
      continue;
    }
    if (config.db_if_differs && p === '$db' && o[p] === db.getName()) {
      continue;
    }
    additional[p] = o[p];
  }
  if (config.plain) {
    return tojsonObject(additional, undefined, true);
  }
  return Object.keys(additional).length
         ? (org.slice(0, -1) + ', ' +
            tojsonObject(additional, undefined, true) + ')')
         : org;
};
