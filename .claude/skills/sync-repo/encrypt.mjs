#!/usr/bin/env node
// encrypt.mjs — AES-256-GCM + scrypt. Password from $SKILL_PASSWORD (never argv).
// Usage: SKILL_PASSWORD=... node encrypt.mjs <plaintextFile|-> <outFile.enc>
//        (pass '-' or omit the input path to read plaintext from STDIN)
import { readFileSync, writeFileSync } from 'node:fs';
import { scryptSync, randomBytes, createCipheriv } from 'node:crypto';

const MAGIC = Buffer.from('SENC', 'ascii');
const VERSION = 0x01;
const SCRYPT = { N: 1 << 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const KEYLEN = 32, SALTLEN = 16, IVLEN = 12;

const password = process.env.SKILL_PASSWORD;
if (!password) { console.error('ERROR: set SKILL_PASSWORD env var.'); process.exit(2); }

const inPath = process.argv[2];
const outPath = process.argv[3];
if (!outPath) { console.error('Usage: node encrypt.mjs <plaintextFile|-> <outFile.enc>'); process.exit(2); }

// readFileSync(0) reads STDIN; use it when no input file (or '-') is given.
const plaintext = (!inPath || inPath === '-') ? readFileSync(0) : readFileSync(inPath);

const salt = randomBytes(SALTLEN);
const iv = randomBytes(IVLEN);
const key = scryptSync(password, salt, KEYLEN, SCRYPT);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const authTag = cipher.getAuthTag(); // 16 bytes

const blob = Buffer.concat([MAGIC, Buffer.from([VERSION]), salt, iv, authTag, ciphertext]);
writeFileSync(outPath, blob.toString('base64') + '\n');
console.error(`Wrote ${outPath} (${blob.length} raw bytes, base64-encoded).`);
