const bcrypt = require('bcryptjs'), db = require('./db');
(async () => {
  const h = await bcrypt.hash('Admin@123', 10);
  await db.query(`INSERT INTO users(name,email,password_hash,address,role)
    VALUES('System Administrator Account','admin@roxiler.com',$1,'Head Office, Pune','admin') ON CONFLICT (email) DO NOTHING`, [h]);
  console.log('Admin ready -> admin@roxiler.com / Admin@123');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
