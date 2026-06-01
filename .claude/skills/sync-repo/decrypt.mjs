#!/usr/bin/env node
// decrypt.mjs — verifies GCM auth tag, prints plaintext to STDOUT only.
// Password from $SKILL_PASSWORD. Exits 1 on wrong password / tamper, leaking nothing.
// Usage: SKILL_PASSWORD=... node decrypt.mjs <file.enc>
import { readFileSync } from 'node:fs';
import { scryptSync, createDecipheriv } from 'node:crypto';

const MAGIC = Buffer.from('SENC', 'ascii');
const VERSION = 0x01;
const SCRYPT = { N: 1 << 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const KEYLEN = 32, SALTLEN = 16, IVLEN = 12, TAGLEN = 16;
const HEADER = MAGIC.length + 1; // 5

const password = process.env.SKILL_PASSWORD;
if (!password) { console.error('ERROR: set SKILL_PASSWORD env var.'); process.exit(2); }

const encPath = process.argv[2];
if (!encPath) { console.error('Usage: node decrypt.mjs <file.enc>'); process.exit(2); }

try {
  const blob = Buffer.from(readFileSync(encPath, 'utf8').trim(), 'base64');
  if (blob.length < HEADER + SALTLEN + IVLEN + TAGLEN) throw new Error('truncated');
  if (!blob.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('bad magic');
  if (blob[MAGIC.length] !== VERSION) throw new Error('unsupported version');

  let off = HEADER;
  const salt = blob.subarray(off, off += SALTLEN);
  const iv = blob.subarray(off, off += IVLEN);
  const authTag = blob.subarray(off, off += TAGLEN);
  const ciphertext = blob.subarray(off);

  const key = scryptSync(password, salt, KEYLEN, SCRYPT);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  // final() throws here if the tag does not verify (wrong password or tampering).
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  process.stdout.write(plaintext); // STDOUT only — never written to disk.
} catch (err) {
  // Generic message: do not echo crypto internals or any plaintext.
  console.error('Decryption failed: wrong password or corrupted data.');
  process.exit(1);
}
