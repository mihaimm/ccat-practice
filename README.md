# CCAT Practice Platform

A web-based practice tool for the Criteria Cognitive Aptitude Test (CCAT). Take timed tests, track your progress, and identify areas for improvement.

## Features

- **Timed 50-question tests** — 15 minutes, mirroring the real CCAT format
- **Stratified question selection** — 15 verbal, 18 math, 10 logic, 7 spatial questions per test
- **Progress tracking** — All results stored locally in your browser
- **Performance analytics** — Score history, category breakdowns, and improvement suggestions
- **No account required** — Everything persists in `localStorage`

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Generate static site
npm run generate

# Preview production build
npm run preview
```

The app runs at `http://localhost:3000` by default.

## Tech Stack

- **Framework**: [Nuxt.js 3](https://nuxt.com/) (Vue.js)
- **Storage**: Browser `localStorage` (no backend/database)
- **Questions**: Static JSON file (`data/questions.json`)

## Project Structure

```
├── data/
│   └── questions.json      # 200 CCAT questions with answers
├── pages/
│   ├── index.vue           # Dashboard with stats & history
│   ├── test.vue            # Test-taking interface
│   └── results/[id].vue    # Individual test results
├── composables/
│   └── useProgress.js      # localStorage & stats logic
├── assets/css/
│   └── main.css            # Global styles & CSS variables
└── app.vue                 # App shell with nav & name prompt
```

## Question Format

Questions are stored in `data/questions.json`:

```json
{
  "id": "v-001",
  "type": "verbal",
  "subtype": "analogy",
  "question": "Bird is to flock as fish is to ___",
  "options": ["school", "pack", "herd", "pod"],
  "answer": "school"
}
```

**Question types**: `verbal`, `math`, `logic`, `spatial`

**Subtypes**: analogies, antonyms, synonyms, arithmetic, number-series, word-problems, deduction, matrix patterns, and more.

## Local Storage Keys

| Key | Description |
|-----|-------------|
| `ccat_user` | `{ name: string }` |
| `ccat_results` | Array of test results |

Each result contains: `{ id, date, durationSeconds, score, totalQuestions, answers[] }`

## License

MIT