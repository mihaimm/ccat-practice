<template>
  <div class="test-page">
    <!-- Confirm leave modal -->
    <div v-if="showLeaveConfirm" class="modal-backdrop">
      <div class="modal-sm">
        <h3>Leave test?</h3>
        <p>Your current test progress will be lost.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showLeaveConfirm = false">Stay</button>
          <button class="btn btn-primary" @click="confirmLeave">Leave</button>
        </div>
      </div>
    </div>

    <!-- Test header bar -->
    <div class="test-header">
      <div class="test-header-inner">
        <div class="progress-info">
          <span class="q-counter">Question <strong>{{ currentIndex + 1 }}</strong> of {{ questions.length }}</span>
          <span class="q-type-tag">{{ currentQuestion?.type }} · {{ getSubtypeLabel(currentQuestion?.subtype) }}</span>
        </div>
        <div class="timer" :class="timerClass">
          <span class="timer-icon">⏱</span>
          {{ formattedTime }}
        </div>
      </div>
      <div class="progress-bar-outer">
        <div class="progress-bar-inner" :style="{ width: `${progressPct}%` }"></div>
      </div>
    </div>

    <!-- Question card -->
    <div class="question-card" :key="currentIndex">
      <p class="question-text">{{ currentQuestion?.question }}</p>

      <div v-if="currentQuestion?.image" class="question-image" v-html="currentQuestion.image"></div>

      <div
        class="options"
        :class="{ 'options-image-grid': currentQuestion?.imageOptions }"
        :style="currentQuestion?.imageOptions
          ? { gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(currentQuestion.imageOptions.length))}, 1fr)` }
          : {}"
      >
        <button
          v-for="(opt, i) in currentQuestion?.options"
          :key="i"
          class="option"
          :class="{ selected: selectedAnswer === opt, 'option-image': currentQuestion?.imageOptions }"
          @click="selectedAnswer = opt"
        >
          <span class="option-letter">{{ String.fromCharCode(65 + i) }}</span>
          <span v-if="currentQuestion?.imageOptions" class="option-img" v-html="currentQuestion.imageOptions[i]"></span>
          <span v-else class="option-text">{{ opt }}</span>
        </button>
      </div>

      <div class="question-footer">
        <span class="footer-hint" v-if="!selectedAnswer">Select an answer to continue</span>
        <button
          class="btn btn-primary btn-lg"
          :disabled="!selectedAnswer"
          @click="nextQuestion"
        >
          {{ currentIndex + 1 < questions.length ? 'Next Question →' : 'Finish Test ✓' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import allQuestions from '~/data/questions.json'

const router = useRouter()
const { saveResult, getSubtypeLabel } = useProgress()

// ── Test State ────────────────────────────────────────
const TOTAL_TIME = 15 * 60 // 900s
const questions = ref([])
const currentIndex = ref(0)
const selectedAnswer = ref(null)
const answers = ref([])
const timeLeft = ref(TOTAL_TIME)
const testFinished = ref(false)
const showLeaveConfirm = ref(false)
let leaveTarget = null
let timerInterval = null

const currentQuestion = computed(() => questions.value[currentIndex.value])
const progressPct = computed(() => ((currentIndex.value) / questions.value.length) * 100)

// ── Timer ─────────────────────────────────────────────
const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
const timerClass = computed(() => {
  if (timeLeft.value <= 60) return 'timer-critical'
  if (timeLeft.value <= 180) return 'timer-warning'
  return ''
})

// ── Stratified question selection (15 verbal, 18 math, 10 logic, 4 spatial-text, 3 spatial-image) ──
function shuffleOptions(q) {
  if (q.imageOptions) {
    // Image questions: answer is a letter ("A"–"D") indexing into imageOptions.
    // Shuffle imageOptions, then update answer to reflect the new position.
    const n = q.imageOptions.length
    const perm = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5)
    const correctIdx = q.options.indexOf(q.answer) // "A" → 0
    const newCorrectIdx = perm.indexOf(correctIdx)
    return {
      ...q,
      imageOptions: perm.map(i => q.imageOptions[i]),
      answer: String.fromCharCode(65 + newCorrectIdx)
    }
  }
  // Text questions: answer is the option text itself, so shuffling options is safe.
  return { ...q, options: [...q.options].sort(() => Math.random() - 0.5) }
}

function generateTest() {
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
  const byType = type => allQuestions.filter(q => q.type === type)
  const spatialText = allQuestions.filter(q => q.type === 'spatial' && !q.image)
  const spatialImage = allQuestions.filter(q => q.type === 'spatial' && q.image)
  return shuffle([
    ...shuffle(byType('verbal')).slice(0, 15),
    ...shuffle(byType('math')).slice(0, 18),
    ...shuffle(byType('logic')).slice(0, 10),
    ...shuffle(spatialText).slice(0, 4),
    ...shuffle(spatialImage).slice(0, 3),
  ]).map(shuffleOptions)
}

// ── Navigation ────────────────────────────────────────
function nextQuestion() {
  answers.value.push({
    questionId: currentQuestion.value.id,
    type: currentQuestion.value.type,
    subtype: currentQuestion.value.subtype,
    selectedAnswer: selectedAnswer.value,
    correctAnswer: currentQuestion.value.answer,
    isCorrect: selectedAnswer.value === currentQuestion.value.answer
  })

  if (currentIndex.value + 1 >= questions.value.length) {
    finishTest()
  } else {
    currentIndex.value++
    selectedAnswer.value = null
  }
}

// ── Submit ────────────────────────────────────────────
function finishTest() {
  if (testFinished.value) return
  testFinished.value = true
  clearInterval(timerInterval)
  window.removeEventListener('beforeunload', beforeUnloadHandler)

  const timeTaken = TOTAL_TIME - timeLeft.value

  // Pad unanswered questions (if timer ran out)
  const allAnswers = [...answers.value]
  for (let i = allAnswers.length; i < questions.value.length; i++) {
    allAnswers.push({
      questionId: questions.value[i].id,
      type: questions.value[i].type,
      subtype: questions.value[i].subtype,
      selectedAnswer: null,
      correctAnswer: questions.value[i].answer,
      isCorrect: false
    })
  }

  const score = allAnswers.filter(a => a.isCorrect).length
  const id = Date.now().toString()

  saveResult({ id, date: new Date().toISOString(), durationSeconds: timeTaken, score, totalQuestions: 50, answers: allAnswers })
  router.push(`/results/${id}`)
}

// ── Leave guard ───────────────────────────────────────
function beforeUnloadHandler(e) {
  e.preventDefault()
  e.returnValue = ''
}

onMounted(() => {
  questions.value = generateTest()
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) finishTest()
  }, 1000)
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onUnmounted(() => {
  clearInterval(timerInterval)
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

// Intercept in-app navigation
const leaveRoute = useRouter().beforeEach((to) => {
  if (!testFinished.value && questions.value.length) {
    showLeaveConfirm.value = true
    leaveTarget = to.fullPath
    return false
  }
})
onUnmounted(() => leaveRoute())

function confirmLeave() {
  testFinished.value = true
  clearInterval(timerInterval)
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  showLeaveConfirm.value = false
  router.push(leaveTarget || '/')
}
</script>

<style scoped>
.test-page { max-width: 680px; margin: 0 auto; }

/* Sticky header */
.test-header {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: 1.25rem;
  overflow: hidden;
}
.test-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
}
.progress-info { display: flex; flex-direction: column; gap: 0.15rem; }
.q-counter { font-size: 0.9rem; }
.q-counter strong { color: var(--primary); }
.q-type-tag {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

/* Timer */
.timer {
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text);
}
.timer-icon { font-size: 1rem; }
.timer-warning { color: var(--warning); }
.timer-critical {
  color: var(--danger);
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Progress bar */
.progress-bar-outer { height: 4px; background: var(--border); }
.progress-bar-inner { height: 100%; background: var(--primary); transition: width 0.4s ease; }

/* Question card */
.question-card {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 2rem;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.question-text {
  font-size: 1.1rem;
  font-weight: 500;
  line-height: 1.6;
  margin-bottom: 1.75rem;
  white-space: pre-line;
}

/* Question image */
.question-image {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.question-image :deep(svg) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: white;
}

/* Options */
.options { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.75rem; }

/* Image option grid (2×2) */
.options-image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}
.option-image {
  flex-direction: column;
  align-items: center;
  padding: 0.65rem;
  gap: 0.5rem;
}
.option-img {
  display: flex;
  align-items: center;
  justify-content: center;
}
.option-img :deep(svg) {
  display: block;
  width: 68px;
  height: 68px;
}
.option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: white;
  text-align: left;
  font-size: 0.95rem;
  transition: border-color 0.12s, background 0.12s;
  cursor: pointer;
}
.option:hover { border-color: var(--primary); background: var(--primary-light); }
.option.selected {
  border-color: var(--primary);
  background: var(--primary-light);
  font-weight: 600;
}
.option-letter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.option.selected .option-letter {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.question-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}
.footer-hint { font-size: 0.82rem; color: var(--text-muted); }

/* Leave modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal-sm {
  background: white;
  border-radius: var(--radius);
  padding: 1.75rem;
  max-width: 320px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.modal-sm h3 { font-size: 1.1rem; }
.modal-sm p { color: var(--text-muted); font-size: 0.9rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.25rem; }
</style>
