const RESULTS_KEY = 'ccat_results'
const USER_KEY = 'ccat_user'

export function useProgress() {
  // ── User ──────────────────────────────────────────────
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
  }
  function saveUser(name) {
    localStorage.setItem(USER_KEY, JSON.stringify({ name }))
  }

  // ── Results ───────────────────────────────────────────
  function getResults() {
    try { return JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]') } catch { return [] }
  }
  function saveResult(result) {
    const results = getResults()
    results.unshift(result)
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results))
  }
  function getResultById(id) {
    return getResults().find(r => r.id === id) || null
  }

  // ── Labels ────────────────────────────────────────────
  function getTypeLabel(type) {
    return { verbal: 'Verbal', math: 'Math', logic: 'Logic', spatial: 'Spatial' }[type] || type
  }
  function getSubtypeLabel(subtype) {
    return {
      'analogy': 'Analogies',
      'antonym': 'Antonyms',
      'synonym': 'Synonyms',
      'odd-one-out': 'Odd One Out',
      'sentence-completion': 'Sentence Completion',
      'arithmetic': 'Arithmetic',
      'number-series': 'Number Series',
      'word-problem': 'Word Problems',
      'fractions-percentages': 'Fractions & Percentages',
      'deduction': 'Deductive Reasoning',
      'ordering': 'Ordering & Ranking',
      'spatial-reasoning': 'Spatial Reasoning',
      'letter-series': 'Letter Series',
      'alphanumeric-series': 'Alphanumeric Series',
      'matrix': 'Matrix Patterns',
    }[subtype] || subtype
  }

  function accuracyClass(acc) {
    if (acc >= 0.75) return 'good'
    if (acc >= 0.55) return 'fair'
    return 'poor'
  }

  // ── Aggregate Stats ───────────────────────────────────
  function getAggregateStats() {
    const results = getResults()
    if (!results.length) return null

    const scores = results.map(r => r.score)
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const bestScore = Math.max(...scores)

    // Per-type accuracy
    const typeMap = {}
    const subtypeMap = {}
    for (const result of results) {
      for (const ans of result.answers) {
        if (!typeMap[ans.type]) typeMap[ans.type] = { correct: 0, total: 0 }
        typeMap[ans.type].total++
        if (ans.isCorrect) typeMap[ans.type].correct++

        const sk = ans.subtype
        if (!subtypeMap[sk]) subtypeMap[sk] = { correct: 0, total: 0, type: ans.type }
        subtypeMap[sk].total++
        if (ans.isCorrect) subtypeMap[sk].correct++
      }
    }

    const typeAccuracy = Object.entries(typeMap).map(([type, s]) => ({
      type, label: getTypeLabel(type),
      accuracy: s.correct / s.total,
      correct: s.correct, total: s.total
    })).sort((a, b) => a.accuracy - b.accuracy)

    const subtypeAccuracy = Object.entries(subtypeMap)
      .filter(([, s]) => s.total >= 3)
      .map(([subtype, s]) => ({
        subtype, label: getSubtypeLabel(subtype), type: s.type,
        accuracy: s.correct / s.total, correct: s.correct, total: s.total
      })).sort((a, b) => a.accuracy - b.accuracy)

    // Trend: compare last test to prior average
    let trend = null
    if (results.length >= 2) {
      const last = results[0].score
      const priorAvg = results.slice(1).reduce((a, r) => a + r.score, 0) / (results.length - 1)
      trend = last - priorAvg
    }

    // Recent scores (last 8) for mini-chart
    const recentScores = results.slice(0, 8).map(r => ({
      score: r.score,
      pct: Math.round((r.score / r.totalQuestions) * 100),
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })).reverse()

    return {
      totalTests: results.length,
      avgScore: Math.round(avgScore * 10) / 10,
      bestScore,
      avgPct: Math.round((avgScore / 50) * 100),
      typeAccuracy,
      subtypeAccuracy,
      trend,
      recentScores
    }
  }

  // ── Improvement Suggestions ───────────────────────────
  function getImprovementSuggestions() {
    const stats = getAggregateStats()
    if (!stats) return []

    const typeTips = {
      verbal: 'Practice vocabulary, word relationships, and analogies with flashcards.',
      math: 'Review arithmetic, percentages, ratios, and work-rate problems.',
      logic: "Focus on valid vs. invalid conclusions — 'definitely true' vs. 'possibly true'.",
      spatial: 'Practice letter/number sequences and look for row/column rules in matrices.'
    }
    const subtypeTips = {
      'analogy': 'Map the relationship (A→B) exactly before picking an answer.',
      'antonym': 'Eliminate words with similar meanings first.',
      'synonym': 'Use process of elimination with known word meanings.',
      'odd-one-out': 'Find the category that groups three items together.',
      'arithmetic': 'Simplify before computing — cancel common factors early.',
      'number-series': 'Check differences, then ratios, then alternating patterns.',
      'word-problem': 'Underline the question asked before setting up equations.',
      'fractions-percentages': 'Convert everything to the same format (fraction or decimal) before computing.',
      'deduction': "If the conclusion says 'definitely', be skeptical — verify it holds in all cases.",
      'ordering': 'Write a quick chain (A > B > C) on scratch paper.',
      'matrix': 'Check each row and each column independently for the rule.',
      'letter-series': 'Write out letter positions (A=1, B=2…) to spot arithmetic patterns.',
      'alphanumeric-series': 'Separate the letter part and number part and solve each independently.',
    }

    const suggestions = []

    for (const t of stats.typeAccuracy) {
      if (t.accuracy < 0.70) {
        suggestions.push({
          level: t.accuracy < 0.50 ? 'poor' : 'fair',
          category: t.label,
          pct: Math.round(t.accuracy * 100),
          tip: typeTips[t.type] || 'Keep practicing.'
        })
      }
    }

    for (const st of stats.subtypeAccuracy.slice(0, 4)) {
      if (st.accuracy < 0.60) {
        suggestions.push({
          level: 'subtype',
          category: st.label,
          pct: Math.round(st.accuracy * 100),
          tip: subtypeTips[st.subtype] || 'Focus more on this question type.'
        })
      }
    }

    return suggestions
  }

  return {
    getUser, saveUser,
    getResults, saveResult, getResultById,
    getTypeLabel, getSubtypeLabel, accuracyClass,
    getAggregateStats, getImprovementSuggestions
  }
}
