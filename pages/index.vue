<template>
  <div>
    <!-- Empty state -->
    <div v-if="!results.length" class="empty-state">
      <div class="empty-icon">📋</div>
      <h2>No tests taken yet</h2>
      <p>Take your first CCAT practice test to start tracking your progress. 50 questions, 15 minutes.</p>
      <NuxtLink to="/test" class="btn btn-primary btn-lg">Start Your First Test</NuxtLink>
    </div>

    <!-- Dashboard -->
    <div v-else>
      <div class="page-header">
        <h1>Dashboard</h1>
        <NuxtLink to="/test" class="btn btn-primary">+ New Test</NuxtLink>
      </div>

      <!-- Stats row -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Tests Taken</div>
          <div class="stat-value">{{ stats.totalTests }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average Score</div>
          <div class="stat-value">
            {{ stats.avgScore }}<span class="stat-denom">/50</span>
          </div>
          <div class="stat-pct" :class="accuracyClass(stats.avgScore / 50)">
            {{ stats.avgPct }}%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Best Score</div>
          <div class="stat-value">
            {{ stats.bestScore }}<span class="stat-denom">/50</span>
          </div>
          <div class="stat-pct" :class="accuracyClass(stats.bestScore / 50)">
            {{ Math.round((stats.bestScore / 50) * 100) }}%
          </div>
        </div>
        <div class="stat-card" v-if="stats.trend !== null">
          <div class="stat-label">Last vs. Average</div>
          <div class="stat-value trend" :class="stats.trend >= 0 ? 'good' : 'poor'">
            {{ stats.trend >= 0 ? '+' : '' }}{{ Math.round(stats.trend * 10) / 10 }}
          </div>
          <div class="stat-pct" :class="stats.trend >= 0 ? 'good' : 'poor'">
            {{ stats.trend >= 0 ? 'Improving ↑' : 'Declining ↓' }}
          </div>
        </div>
      </div>

      <!-- Progress over time -->
      <div class="card" v-if="stats.recentScores.length > 1">
        <div class="card-title">Score History</div>
        <div class="score-history">
          <div v-for="(s, i) in stats.recentScores" :key="i" class="score-bar-col">
            <div class="score-bar-label">{{ s.pct }}%</div>
            <div class="score-bar-outer">
              <div
                class="score-bar-inner"
                :class="accuracyClass(s.score / 50)"
                :style="{ height: `${s.pct}%` }"
              ></div>
            </div>
            <div class="score-bar-date">{{ s.date }}</div>
          </div>
        </div>
      </div>

      <!-- Category performance -->
      <div class="card">
        <div class="card-title">Performance by Category</div>
        <div class="category-list">
          <div v-for="t in stats.typeAccuracy" :key="t.type" class="category-row">
            <div class="category-name">{{ t.label }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :class="accuracyClass(t.accuracy)"
                :style="{ width: `${Math.round(t.accuracy * 100)}%` }"
              ></div>
            </div>
            <div class="category-stat">
              <span :class="accuracyClass(t.accuracy)">{{ Math.round(t.accuracy * 100) }}%</span>
              <span class="muted">{{ t.correct }}/{{ t.total }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Improvement suggestions -->
      <div class="card" v-if="suggestions.length">
        <div class="card-title">Where to Improve</div>
        <div class="suggestions">
          <div v-for="(s, i) in suggestions" :key="i" class="suggestion-item" :class="s.level">
            <div class="suggestion-header">
              <span class="suggestion-icon">
                {{ s.level === 'poor' ? '🔴' : s.level === 'fair' ? '🟡' : '📌' }}
              </span>
              <strong>{{ s.category }}</strong>
              <span class="suggestion-pct" :class="s.level === 'subtype' ? 'fair' : s.level">
                {{ s.pct }}%
              </span>
            </div>
            <p class="suggestion-tip">{{ s.tip }}</p>
          </div>
        </div>
      </div>

      <!-- Test history -->
      <div class="card">
        <div class="card-title">Test History</div>
        <table class="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Score</th>
              <th>Result</th>
              <th>Time Used</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in results" :key="r.id">
              <td class="muted">{{ formatDate(r.date) }}</td>
              <td><strong>{{ r.score }}/{{ r.totalQuestions }}</strong></td>
              <td>
                <span class="badge" :class="accuracyClass(r.score / r.totalQuestions)">
                  {{ Math.round((r.score / r.totalQuestions) * 100) }}%
                </span>
              </td>
              <td class="muted">{{ formatDuration(r.durationSeconds) }}</td>
              <td>
                <NuxtLink :to="`/results/${r.id}`" class="view-link">View →</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
const { getResults, getAggregateStats, accuracyClass, getImprovementSuggestions } = useProgress()

const results = computed(() => getResults())
const stats = computed(() => getAggregateStats() || {})
const suggestions = computed(() => getImprovementSuggestions())

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatDuration(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.page-header h1 { font-size: 1.5rem; }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.empty-icon { font-size: 3rem; }
.empty-state h2 { font-size: 1.4rem; }
.empty-state p { color: var(--text-muted); max-width: 400px; }

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.stat-card {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.25rem 1.5rem;
}
.stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
}
.stat-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}
.stat-denom { font-size: 1rem; color: var(--text-muted); font-weight: 500; }
.stat-pct { font-size: 0.85rem; font-weight: 600; margin-top: 0.3rem; }
.trend { font-size: 1.6rem !important; }

/* Score history bar chart */
.score-history {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  height: 100px;
  padding-top: 1.5rem;
  position: relative;
}
.score-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}
.score-bar-outer {
  flex: 1;
  width: 100%;
  background: var(--border);
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  max-width: 48px;
}
.score-bar-inner {
  width: 100%;
  border-radius: 4px;
  transition: height 0.5s ease;
}
.score-bar-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
}
.score-bar-date {
  font-size: 0.65rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Category bars */
.category-list { display: flex; flex-direction: column; gap: 0.85rem; }
.category-row {
  display: grid;
  grid-template-columns: 80px 1fr 90px;
  align-items: center;
  gap: 0.75rem;
}
.category-name { font-size: 0.9rem; font-weight: 600; }
.category-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.3;
}
.muted { color: var(--text-muted); font-weight: 400; }

/* Suggestions */
.suggestions { display: flex; flex-direction: column; gap: 0.75rem; }
.suggestion-item {
  padding: 0.85rem 1rem;
  border-radius: 8px;
  background: var(--bg);
  border-left: 3px solid var(--border);
}
.suggestion-item.poor { border-left-color: var(--danger); background: var(--danger-light); }
.suggestion-item.fair { border-left-color: var(--warning); background: var(--warning-light); }
.suggestion-item.subtype { border-left-color: var(--primary); background: var(--primary-light); }
.suggestion-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.suggestion-icon { font-size: 0.85rem; }
.suggestion-pct {
  margin-left: auto;
  font-size: 0.82rem;
  font-weight: 700;
}
.suggestion-tip { font-size: 0.85rem; color: var(--text-muted); }

/* History table */
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.history-table th {
  text-align: left;
  padding: 0 0 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.history-table td {
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--border);
}
.history-table tr:last-child td { border-bottom: none; }
.view-link { font-size: 0.85rem; font-weight: 600; color: var(--primary); }
</style>
