<template>
  <div class="preview-page">
    <div class="preview-toolbar">
      <div class="dataset-toggle">
        <button :class="['toggle-opt', { active: dataset === 'standard' }]" @click="dataset = 'standard'">Standard</button>
        <button :class="['toggle-opt', { active: dataset === 'hard' }]" @click="dataset = 'hard'">Hard</button>
      </div>
      <form @submit.prevent="loadById">
        <input v-model="inputId" placeholder="Question ID (e.g. v-001)" class="id-input" />
        <button type="submit" class="btn btn-primary">Load</button>
      </form>
      <span v-if="question" class="meta-tag">{{ question.type }} · {{ question.subtype }} · {{ question.id }}</span>
      <span v-if="!question && searched" class="not-found">Not found: {{ inputId }}</span>
    </div>

    <div v-if="question" class="question-card">
      <p class="question-text">{{ question.question }}</p>

      <div v-if="question.image" class="question-image" v-html="question.image"></div>

      <div
        class="options"
        :class="{ 'options-image-grid': question.imageOptions }"
        :style="question.imageOptions
          ? { gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(question.imageOptions.length))}, 1fr)` }
          : {}"
      >
        <div
          v-for="(opt, i) in question.options"
          :key="i"
          class="option"
          :class="{
            correct: opt === question.answer,
            'option-image': question.imageOptions
          }"
        >
          <span class="option-letter" :class="{ 'letter-correct': opt === question.answer }">
            {{ String.fromCharCode(65 + i) }}
          </span>
          <span v-if="question.imageOptions" class="option-img" v-html="question.imageOptions[i]"></span>
          <span v-else class="option-text">{{ opt }}</span>
          <span v-if="opt === question.answer" class="correct-badge">✓ correct</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import standardQuestions from '~/data/questions.json'
import hardQuestions from '~/data/questions-hard.json'

const route = useRoute()
const router = useRouter()

const dataset = ref('standard')
const allQuestions = computed(() => dataset.value === 'hard' ? hardQuestions : standardQuestions)

const inputId = ref(route.query.id ?? '')
const question = ref(null)
const searched = ref(false)

function loadById() {
  const id = inputId.value.trim()
  searched.value = true
  question.value = allQuestions.value.find(q => q.id === id) ?? null
  router.replace({ query: id ? { id } : {} })
}

// Load from URL on mount
if (inputId.value) loadById()
</script>

<style scoped>
.preview-page {
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.dataset-toggle {
  display: flex;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.toggle-opt {
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  background: white;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  transition: background 0.12s, color 0.12s;
}
.toggle-opt + .toggle-opt { border-left: 1.5px solid var(--border); }
.toggle-opt.active { background: var(--primary); color: white; }

.id-input {
  padding: 0.5rem 0.9rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  width: 220px;
}
.id-input:focus { outline: none; border-color: var(--primary); }

form { display: flex; gap: 0.5rem; }

.meta-tag {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: capitalize;
}
.not-found { font-size: 0.88rem; color: var(--danger); }

/* Question card — reuse test.vue styles */
.question-card {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 2rem;
}

.question-text {
  font-size: 1.1rem;
  font-weight: 500;
  line-height: 1.6;
  margin-bottom: 1.75rem;
  white-space: pre-line;
}

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

.options { display: flex; flex-direction: column; gap: 0.65rem; }

.options-image-grid {
  display: grid;
  gap: 0.65rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: white;
  font-size: 0.95rem;
  cursor: default;
}
.option.correct {
  border-color: var(--success);
  background: var(--success-light);
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
}
.letter-correct {
  background: var(--success);
  border-color: var(--success);
  color: white;
}

.option-text { flex: 1; }

.correct-badge {
  margin-left: auto;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--success);
}
</style>
