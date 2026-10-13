// Repair UTF-8 that a Windows PowerShell round-trip double-encoded.
// Usage: node scripts/fix-double-encoded.mjs <file...>
//
// `Get-Content` read the file as the ANSI code page (CP1252), so each UTF-8 byte
// became a CP1252 character; `Set-Content -Encoding UTF8` wrote those characters
// back out as UTF-8, doubling the encoding. An em dash went
// E2 80 94 -> "â€"" -> C3 A2 E2 82 AC E2 80 9D. Reversing it means encoding the
// string back to CP1252 and decoding the result as UTF-8.
import { readFileSync, writeFileSync } from 'node:fs';

// The 32 code points CP1252 puts at 0x80-0x9F, where latin1 has controls.
const CP1252_HIGH = [
   0x20AC, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6,
   0x2030, 0x0160, 0x2039, 0x0152, 0x017D, 0x2018, 0x2019, 0x201C,
   0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122, 0x0161, 0x203A,
   0x0153, 0x017E, 0x0178,
];

const TO_BYTE = new Map(CP1252_HIGH.map((cp, i) => [cp, 0x80 + i]));

function toCp1252Bytes(text) {
   const out = [];
   for (const ch of text) {
      const code = ch.codePointAt(0);
      if (code <= 0xFF) out.push(code);
      else if (TO_BYTE.has(code)) out.push(TO_BYTE.get(code));
      else return null;   // a genuinely valid non-latin1 char: not this damage
   }
   return Buffer.from(out);
}

// The tell: a doubled file is full of Latin-1 supplement chars (Â, â, Ã, ï¿½)
// that a hand-written English markdown file would not otherwise contain.
const SUSPECT = new RegExp('[\\u00C2\\u00C3\\u00E2][\\u0080-\\u00BF\\u20AC-\\u20BF]');

for (const file of process.argv.slice(2)) {
   const text = readFileSync(file, 'utf8');
   if (!SUSPECT.test(text)) {
      console.log(`${file}: clean`);
      continue;
   }
   const bytes = toCp1252Bytes(text);
   if (!bytes) {
      console.log(`${file}: has real non-latin1 characters, skipping`);
      continue;
   }
   const fixed = bytes.toString('utf8');
   writeFileSync(file, fixed, 'utf8');
   console.log(`${file}: repaired${SUSPECT.test(fixed) ? ' (STILL SUSPECT — inspect)' : ''}`);
}