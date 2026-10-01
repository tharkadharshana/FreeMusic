// Usage: npm run rules -- <catalogue.csv|xlsx>   → writes extension/rules.json
import { readFileSync, writeFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { catalogueToRules } from '../src/lib/catalogue.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run rules -- <catalogue.csv|xlsx>');
  process.exit(1);
}

// type 'array' (same as the web app): the 'buffer' path mangles UTF-8 Sinhala text in CSVs.
const wb = XLSX.read(new Uint8Array(readFileSync(file)), { type: 'array', codepage: 65001 });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
const { rules, stats } = catalogueToRules(rows);
writeFileSync(new URL('../extension/rules.json', import.meta.url), JSON.stringify(rules) + '\n');
console.log('extension/rules.json written', stats);
