const fs = require('fs'), path = require('path'), db = require('./db');
db.query(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'))
  .then(() => { console.log('Tables ready'); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
