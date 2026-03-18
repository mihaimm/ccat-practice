import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questions1Path = path.join(__dirname, '../data/questions.json');
const questions2Path = path.join(__dirname, '../data/questions2.json');
const outputPath = path.join(__dirname, '../data/questions.merged.json');

interface Question {
	id: string;
	type: string;
	subtype: string;
	question: string;
	options: string[];
	answer: string;
	image?: string;
	imageOptions?: string[];
}

function getPrefix(type: string): string {
	switch (type) {
		case 'verbal': return 'v';
		case 'math': return 'm';
		case 'logic': return 'l';
		case 'spatial': return 's';
		default: return 'x';
	}
}

function getNextIdForTypePaddedWithPrefix(questions: Question[], type: string): string {
	const prefix = getPrefix(type);
	const max = questions
		.filter(q => q.type === type)
		.reduce((max, q) => {
			const num = parseInt(q.id.replace(`${prefix}-`, ''), 10);
			return isNaN(num) ? max : Math.max(max, num);
		}, 0);
	return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

function questionAlreadyExists(questions: Question[], candidate: Question): boolean {
	const normalize = (s: string) => s.trim().toLowerCase();
	return questions.some(q => normalize(q.question) === normalize(candidate.question));
}

function accumulateTypes(...arrays: Question[][]): Record<string, number> {
	const counts: Record<string, number> = { verbal: 0, math: 0, logic: 0, spatial: 0 };

	for (const array of arrays) {
		for (const item of array) {
			counts[item.type] = (counts[item.type] || 0) + 1;
		}
	}

	return counts;
}


function main() {
	const questions1: Question[] = JSON.parse(fs.readFileSync(questions1Path, 'utf8'));
	const questions2: Question[] = JSON.parse(fs.readFileSync(questions2Path, 'utf8'));

	const merged = [...questions1];

	console.log(`Original questions.json: ${questions1.length} questions`);
	console.log(`questions2.json: ${questions2.length} questions`);

	const types = accumulateTypes(questions1, questions2);
	console.log(`Types across both files: ${JSON.stringify(types)}`);

	for (const question of questions2) {
		if (questionAlreadyExists(merged, question)) {
			console.log(`Skipping duplicate: ${question.id} - "${question.question}"`);
			continue;
		}
		const newId = getNextIdForTypePaddedWithPrefix(merged, question.type);
		merged.push({ ...question, id: newId });
	}

	fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2) + '\n');

	console.log(`\nMerged file written to: ${outputPath}`);
	console.log(`Total questions: ${merged.length}`);
}

main();