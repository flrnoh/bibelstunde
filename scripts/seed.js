#!/usr/bin/env node
import { putBar, barExists } from '../lib/kv.js';
import { hashPassword } from '../lib/hash.js';

const SEED = [
  { name: 'BlockBar',      password: 'VelvetPour26',   email: null, source: 'manual-legacy' },
  { name: 'riverside2026', password: 'VelvetPour_27',  email: null, source: 'manual-legacy' },
  { name: 'testbar123',    password: 'Bibelstunde_No5', email: null, source: 'manual-legacy' },
];

const force = process.argv.includes('--force');

for (const entry of SEED) {
  const exists = await barExists(entry.name);
  if (exists && !force) {
    console.log(`skip   ${entry.name} (already in KV, pass --force to overwrite)`);
    continue;
  }
  const passwordHash = await hashPassword(entry.password);
  await putBar(entry.name, {
    name: entry.name,
    passwordHash,
    email: entry.email,
    createdAt: new Date().toISOString(),
    source: entry.source,
  });
  console.log(`${exists ? 'update' : 'create'} ${entry.name}`);
}
