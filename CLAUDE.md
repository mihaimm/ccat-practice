# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

A CCAT (Criteria Cognitive Aptitude Test) practice platform. Users take timed aptitude tests and track their progress over time. No backend — all user progress is persisted in browser `localStorage`. Questions and test content are stored as static JSON files.

## Tech Stack

- **Framework**: Nuxt.js (Vue.js)
- **Data storage**: Static JSON files (questions/content), `localStorage` (user progress)
- **No backend, no database**

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server (http://localhost:3000)
npm run build     # production build
npm run generate  # static site generation (SPA, no server needed)
npm run preview   # preview production build
```

## Architecture

- `data/questions.json` — 200 CCAT questions (verbal/math/logic/spatial) including correct answers; intentionally client-side (self-practice tool)
- `pages/index.vue` — Dashboard: stats cards, score history bar chart, per-category accuracy bars, improvement suggestions, test history table
- `pages/test.vue` — Test: stratified 50-question selection (15 verbal / 18 math / 10 logic / 7 spatial), 15-min countdown, one question at a time, no back navigation, in-app leave guard
- `pages/results/[id].vue` — Results: score ring, category breakdown, delta vs. prior average, collapsible full question review
- `composables/useProgress.js` — All localStorage logic: user name (`ccat_user`), results (`ccat_results`), aggregate stats, improvement suggestion generation
- `app.vue` — Shell: sticky nav header + first-visit name-prompt modal
- `assets/css/main.css` — CSS custom properties and shared utility classes (`.btn`, `.card`, `.badge`, `.bar-fill`, accuracy color classes)

### localStorage keys
- `ccat_user` — `{ name: string }`
- `ccat_results` — array of `{ id, date, durationSeconds, score, totalQuestions, answers[] }`

### Question JSON format
```json
{ "id": "v-001", "type": "verbal", "subtype": "analogy", "question": "...", "options": ["A","B","C","D"], "answer": "A" }
```
Types: `verbal`, `math`, `logic`, `spatial`. Subtypes map to human labels in `getSubtypeLabel()` in the composable.
