// Better show dbs
shellHelper.show = function() {
  const show = shellHelper.show;
  return function(what) {
    assert(typeof what == 'string');

    if (what === 'collections' || what === 'tables') {
      let collectionNames = db.getCollectionNames();
      const collectionStats = collectionNames.map(function(name) {
        const stats = db.getCollection(name).stats();
        if (stats.ok) {
          const size = (stats.size / 1024 / 1024).toFixed(3);
          return (size + 'MB');
        } else if (stats.code === 166) {
          return 'VIEW';
        } else {
          return 'ERR:' + stats.code;
        }
      });
      const collectionStorageSizes = collectionNames.map(function(name) {
        const stats = db.getCollection(name).stats();
        if (stats.ok) {
          const storageSize = (stats.storageSize / 1024 / 1024).toFixed(3);
          return (storageSize + 'MB');
        }
        return '';
      });
      collectionNames = colorizeAll(collectionNames,
          mongo_hacker_config['colors']['collectionNames']);
      printPaddedColumns(collectionNames, collectionStats,
          collectionStorageSizes);
      return '';
    }

    if (what === 'dbs' || what === 'databases') {
      const databases = db.getMongo().getDBs().databases.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });
      let databaseNames = databases.map(function(db) {
        return db.name;
      });
      const databaseSizes = databases.map(function(db) {
        const sizeInGigaBytes = (db.sizeOnDisk / 1024 / 1024 / 1024).toFixed(3);
        return (db.sizeOnDisk > 1) ? (sizeInGigaBytes + 'GB') : '(empty)';
      });
      databaseNames = colorizeAll(databaseNames,
          mongo_hacker_config['colors']['databaseNames']);
      printPaddedColumns(databaseNames, databaseSizes);
      return '';
    }

    return show(what);
  };
}();
