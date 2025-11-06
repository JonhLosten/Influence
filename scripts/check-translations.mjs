import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const localesDir = resolve(__dirname, '../apps/web/src/locales');

async function readLocale(file) {
  const content = await readFile(resolve(localesDir, file), 'utf8');
  return JSON.parse(content);
}

function diffKeys(baseKeys, otherKeys) {
  return [...baseKeys].filter((key) => !otherKeys.has(key));
}

async function main() {
  const fr = await readLocale('fr.json');
  const en = await readLocale('en.json');

  const frKeys = new Set(Object.keys(fr));
  const enKeys = new Set(Object.keys(en));

  const missingInEn = diffKeys(frKeys, enKeys);
  const missingInFr = diffKeys(enKeys, frKeys);

  if (missingInEn.length || missingInFr.length) {
    console.error('Translation keys mismatch:');
    if (missingInEn.length) {
      console.error('  Missing in en.json:', missingInEn.join(', '));
    }
    if (missingInFr.length) {
      console.error('  Missing in fr.json:', missingInFr.join(', '));
    }
    process.exit(1);
  }

  console.log('✅ Translation keys are aligned between fr and en locales.');
}

main().catch((err) => {
  console.error('Failed to validate translations', err);
  process.exit(1);
});
