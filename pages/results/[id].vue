<template>
  <div v-if="result">
    <!-- Score hero -->
    <div class="hero-card">
      <div class="hero-left">
        <div class="hero-label">Test Complete</div>
        <div class="hero-score">
          <span class="score-num" :class="accuracyClass(result.score / result.totalQuestions)">
            {{ result.score }}
          </span>
          <span class="score-denom">/{{ result.totalQuestions }}</span>
        </div>
        <div class="hero-pct" :class="accuracyClass(result.score / result.totalQuestions)">
          {{ Math.round((result.score / result.totalQuestions) * 100) }}% correct
        </div>
        <div class="hero-meta">
          <span>📅 {{ formatDate(result.date) }}</span>
          <span>⏱ {{ formatDuration(result.durationSeconds) }}</span>
        </div>
      </div>
      <div class="hero-ring">
        <svg viewBox="0 0 80 80" class="ring-svg">
          <circle cx="40" cy="40" r="34" class="ring-bg" />
          <circle
            cx="40" cy="40" r="34"
            class="ring-fill"
            :class="accuracyClass(result.score / result.totalQuestions)"
            :stroke-dasharray="`${ringDash} 213.6`"
          />
        </svg>
        <div class="ring-label">{{ Math.round((result.score / result.totalQuestions) * 100) }}%</div>
      </div>
    </div>

    <!-- vs. previous -->
    <div v-if="comparison" class="comparison-banner" :class="comparison.delta >= 0 ? 'up' : 'down'">
      <span>{{ comparison.delta >= 0 ? '↑' : '↓' }}</span>
      <span>
        {{ comparison.delta >= 0 ? '+' : '' }}{{ comparison.delta }} points vs. your previous average of {{ comparison.prevAvg }}/50
      </span>
    </div>

    <!-- Category breakdown -->
    <div class="card">
      <div class="card-title">By Category</div>
      <div class="category-list">
        <div v-for="c in categoryBreakdown" :key="c.type" class="category-row">
          <div class="cat-label">{{ c.label }}</div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :class="accuracyClass(c.accuracy)"
              :style="{ width: `${Math.round(c.accuracy * 100)}%` }"
            ></div>
          </div>
          <div class="cat-stat">
            <span :class="accuracyClass(c.accuracy)">{{ Math.round(c.accuracy * 100) }}%</span>
            <span class="muted">{{ c.correct }}/{{ c.total }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Question review -->
    <div class="card">
      <div class="card-title-row">
        <div class="card-title" style="margin-bottom:0">Question Review</div>
        <button class="toggle-btn" @click="showReview = !showReview">
          {{ showReview ? 'Hide ▲' : 'Show all ▼' }}
        </button>
      </div>

      <div v-if="showReview" class="review-list">
        <div
          v-for="(ans, i) in result.answers"
          :key="ans.questionId"
          class="review-item"
          :class="ans.isCorrect ? 'correct' : 'incorrect'"
        >
          <div class="review-header">
            <span class="review-icon">{{ ans.isCorrect ? '✓' : '✗' }}</span>
            <span class="review-num">Q{{ i + 1 }}</span>
            <span class="review-meta">{{ getTypeLabel(ans.type) }} · {{ getSubtypeLabel(ans.subtype) }}</span>
          </div>
          <div class="review-q">{{ getQuestion(ans.questionId)?.question }}</div>
          <div v-if="getQuestion(ans.questionId)?.image" class="review-img" v-html="getQuestion(ans.questionId).image"></div>
          <div class="review-answers">
            <span v-if="!ans.isCorrect" class="review-wrong">
              Your answer:
              <span v-if="getQuestion(ans.questionId)?.imageOptions && ans.selectedAnswer"
                class="review-ans-img"
                v-html="getQuestion(ans.questionId).imageOptions[ans.selectedAnswer.charCodeAt(0) - 65]"
              ></span>
              <em v-else>{{ ans.selectedAnswer || '(no answer)' }}</em>
            </span>
            <span class="review-correct">
              {{ ans.isCorrect ? 'Correct: ' : 'Correct answer: ' }}
              <span v-if="getQuestion(ans.questionId)?.imageOptions"
                class="review-ans-img"
                v-html="getQuestion(ans.questionId).imageOptions[ans.correctAnswer.charCodeAt(0) - 65]"
              ></span>
              <strong v-else>{{ ans.correctAnswer }}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <NuxtLink to="/" class="btn btn-secondary">← Dashboard</NuxtLink>
      <NuxtLink to="/test" class="btn btn-primary">Take Another Test</NuxtLink>
    </div>
  </div>

  <!-- Not found -->
  <div v-else class="not-found">
    <p>Test result not found.</p>
    <NuxtLink to="/" class="btn btn-primary">Go to Dashboard</NuxtLink>
  </div>
</template>

<script setup>
import allQuestions from '~/data/questions.json'

const route = useRoute()
const { getResultById, getResults, getTypeLabel, getSubtypeLabel, accuracyClass } = useProgress()

const result = computed(() => getResultById(route.params.id))
const showReview = ref(false)

const questionMap = Object.fromEntries(allQuestions.map(q => [q.id, q]))
function getQuestion(id) { return questionMap[id] }

// ── Ring chart ────────────────────────────────────────
const ringDash = computed(() => {
  if (!result.value) return 0
  return Math.round((result.value.score / result.value.totalQuestions) * 213.6)
})

// ── Category breakdown ────────────────────────────────
const categoryBreakdown = computed(() => {
  if (!result.value) return []
  const map = {}
  for (const ans of result.value.answers) {
    if (!map[ans.type]) map[ans.type] = { correct: 0, total: 0 }
    map[ans.type].total++
    if (ans.isCorrect) map[ans.type].correct++
  }
  return Object.entries(map).map(([type, s]) => ({
    type, label: getTypeLabel(type), ...s, accuracy: s.correct / s.total
  })).sort((a, b) => a.accuracy - b.accuracy)
})

// ── Comparison to prior average ───────────────────────
const comparison = computed(() => {
  if (!result.value) return null
  const all = getResults()
  const prior = all.filter(r => r.id !== result.value.id)
  if (!prior.length) return null
  const prevAvg = Math.round(prior.reduce((a, r) => a + r.score, 0) / prior.length * 10) / 10
  return { delta: Math.round((result.value.score - prevAvg) * 10) / 10, prevAvg }
})

// ── Helpers ───────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
function formatDuration(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}
</script>

<style scoped>
/* Hero */
.hero-card {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 1rem;
}
.hero-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.hero-score {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  line-height: 1;
}
.score-num { font-size: 3.5rem; font-weight: 900; }
.score-denom { font-size: 1.5rem; color: var(--text-muted); font-weight: 500; }
.hero-pct { font-size: 1rem; font-weight: 700; margin: 0.35rem 0 0.75rem; }
.hero-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* Ring */
.hero-ring { position: relative; width: 90px; height: 90px; flex-shrink: 0; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--border); stroke-width: 8; }
.ring-fill {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.8s ease;
}
.ring-fill.good { stroke: var(--success); }
.ring-fill.fair { stroke: var(--warning); }
.ring-fill.poor { stroke: var(--danger); }
.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text);
}

/* Comparison banner */
.comparison-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
}
.comparison-banner.up { background: var(--success-light); color: var(--success); }
.comparison-banner.down { background: var(--danger-light); color: var(--danger); }

/* Category */
.category-list { display: flex; flex-direction: column; gap: 0.85rem; }
.category-row {
  display: grid;
  grid-template-columns: 80px 1fr 80px;
  align-items: center;
  gap: 0.75rem;
}
.cat-label { font-size: 0.9rem; font-weight: 600; }
.cat-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.3;
}
.muted { color: var(--text-muted); font-weight: 400; }

/* Review toggle */
.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.toggle-btn {
  font-size: 0.82rem;
  color: var(--primary);
  background: none;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

/* Review list */
.review-list { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem; }
.review-item {
  border-radius: 8px;
  padding: 0.85rem 1rem;
  border-left: 3px solid;
}
.review-item.correct { border-left-color: var(--success); background: var(--success-light); }
.review-item.incorrect { border-left-color: var(--danger); background: var(--danger-light); }
.review-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.review-icon { font-size: 0.9rem; font-weight: 700; }
.review-item.correct .review-icon { color: var(--success); }
.review-item.incorrect .review-icon { color: var(--danger); }
.review-num { font-weight: 700; font-size: 0.85rem; }
.review-meta { font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize; }
.review-q {
  font-size: 0.88rem;
  color: var(--text);
  margin-bottom: 0.4rem;
  white-space: pre-line;
}
.review-img {
  margin: 0.4rem 0;
}
.review-img :deep(svg) {
  max-width: 100%;
  height: auto;
  max-height: 160px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: white;
}
.review-answers {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.82rem;
}
.review-wrong { color: var(--danger); }
.review-correct { color: var(--success); }
.review-ans-img {
  display: inline-flex;
  vertical-align: middle;
  margin-left: 0.25rem;
}
.review-ans-img :deep(svg) {
  display: block;
  width: 60px;
  height: 60px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: white;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Not found */
.not-found {
  text-align: center;
  padding: 4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-muted);
}
</style>
