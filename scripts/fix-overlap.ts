import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hardPath = path.join(__dirname, '../data/questions-hard.json');
const stdPath = path.join(__dirname, '../data/questions.json');

const stdQuestions: { id: string }[] = JSON.parse(fs.readFileSync(stdPath, 'utf8'));
const hardQuestions: { id: string; type: string }[] = JSON.parse(fs.readFileSync(hardPath, 'utf8'));

const stdIds = new Set(stdQuestions.map(q => q.id));

// Track newly assigned IDs within this run too (handles duplicates inside hard set)
const assignedIds = new Set(stdIds);

// Counter per prefix for generating new IDs
const counters: Record<string, number> = {};

function nextId(prefix: string): string {
  if (!(prefix in counters)) counters[prefix] = 900;
  let candidate: string;
  do {
    counters[prefix]++;
    candidate = `${prefix}-h${counters[prefix]}`;
  } while (assignedIds.has(candidate));
  return candidate;
}

let fixedCount = 0;

const fixed = hardQuestions.map(q => {
  if (assignedIds.has(q.id)) {
    const oldId = q.id;
    // derive prefix from type (verbal→v, math→m, logic→l, spatial→s) or keep existing prefix
    const typePrefix: Record<string, string> = { verbal: 'v', math: 'm', logic: 'l', spatial: 's' };
    const prefix = typePrefix[q.type] ?? q.id.split('-')[0];
    const newId = nextId(prefix);
    assignedIds.add(newId);
    console.log(`  ${oldId} → ${newId}  (type: ${q.type})`);
    fixedCount++;
    return { ...q, id: newId };
  }
  assignedIds.add(q.id);
  return q;
});

if (fixedCount === 0) {
  console.log('No overlapping IDs found — nothing to fix.');
} else {
  fs.writeFileSync(hardPath, JSON.stringify(fixed, null, 2));
  console.log(`\nFixed ${fixedCount} overlapping ID(s). Written to ${hardPath}`);
}
