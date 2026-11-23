// Explicit, additive fixtures in an isolated local database; never target bloomfolio.
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import sample from '../apps/web/src/assets/stockData.js';
const requireApi = createRequire(new URL('../services/api/package.json', import.meta.url));
const mongoose = requireApi('mongoose');
const User = requireApi('./models/User');
const requireAdmin = createRequire(new URL('../services/admin-api/package.json', import.meta.url));
const adminMongoose = requireAdmin('mongoose');
const Admin = requireAdmin('./models/Admin');
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloomfolio_demo';
const target = new URL(uri);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || !target.pathname.endsWith('_demo')) {
  throw new Error('Demo fixtures require a local MongoDB database with a name ending in _demo.');
}
await mongoose.connect(uri);
await adminMongoose.connect(uri);
try {
  await mongoose.connection.db.collection('stocks').updateOne({ tradingCode: sample.tradingCode }, { $setOnInsert: sample }, { upsert: true });
  const credentials = { user: { email: 'investor@example.test', password: randomBytes(18).toString('base64url') }, admin: { email: 'admin@example.test', password: randomBytes(18).toString('base64url') } };
  // Existing accounts are left alone. Save credentials only on a fresh seed.
  if (await User.exists({ email: credentials.user.email }) || await Admin.exists({ email: credentials.admin.email })) {
    console.log('Demo accounts already exist; keeping existing credentials and data.');
  } else {
    const user = await User.create({ name: 'Demo Investor', ...credentials.user, purchasePower: 25000, portfolio: [{ stock: 'SIBL', quantity: 1000, buyPrice: 4 }] });
    await Admin.create({ name: 'Demo Admin', ...credentials.admin });
    await mongoose.connection.db.collection('moneyrequests').insertOne({ userId: user._id, requestedAmount: 5000, transactionId: 'DEMO-ONLY-001', status: 'Pending', createdAt: new Date() });
    mkdirSync(new URL('../.runtime/', import.meta.url), { recursive: true });
    writeFileSync(new URL('../.runtime/demo-credentials.json', import.meta.url), JSON.stringify(credentials, null, 2), { mode: 0o600 });
    console.log('Created isolated demo accounts. Credentials saved in .runtime/demo-credentials.json (gitignored).');
  }
} finally { await Promise.all([mongoose.disconnect(), adminMongoose.disconnect()]); }
