<template>
  <div class="app">
    <!-- Name prompt modal -->
    <div v-if="showNamePrompt" class="modal-backdrop">
      <div class="modal">
        <div class="modal-icon">🧠</div>
        <h1>Welcome to CCAT Practice</h1>
        <p>The Criteria Cognitive Aptitude Test has 50 questions and a 15-minute time limit. Track your progress and identify where to improve.</p>
        <p class="modal-sub">What's your name?</p>
        <input
          ref="nameInput"
          v-model="nameValue"
          type="text"
          placeholder="Your name"
          class="name-input"
          maxlength="40"
          @keydown.enter="confirmName"
        />
        <button class="btn btn-primary btn-lg" :disabled="!nameValue.trim()" @click="confirmName">
          Get Started
        </button>
      </div>
    </div>

    <!-- App shell -->
    <template v-else>
      <header class="header">
        <div class="header-inner">
          <NuxtLink to="/" class="logo">
            <span>🧠</span>
            <span>CCAT Practice</span>
          </NuxtLink>
          <nav class="nav">
            <span v-if="userName" class="greeting">Hi, {{ userName }}</span>
            <NuxtLink to="/" class="nav-link">Dashboard</NuxtLink>
          </nav>
        </div>
      </header>
      <main class="main">
        <NuxtPage />
      </main>
    </template>
  </div>
</template>

<script setup>
const { getUser, saveUser } = useProgress()

const showNamePrompt = ref(false)
const nameValue = ref('')
const userName = ref('')
const nameInput = ref(null)

onMounted(() => {
  const user = getUser()
  if (!user) {
    showNamePrompt.value = true
    nextTick(() => nameInput.value?.focus())
  } else {
    userName.value = user.name
  }
})

function confirmName() {
  const name = nameValue.value.trim()
  if (!name) return
  saveUser(name)
  userName.value = name
  showNamePrompt.value = false
}
</script>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }

/* Header */
.header {
  background: white;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-inner {
  max-width: 920px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text);
}
.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.greeting {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.nav-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
}
.nav-link:hover { color: var(--text); }

.main {
  flex: 1;
  max-width: 920px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 1.5rem;
}

/* Name prompt modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 100;
}
.modal {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  padding: 2.5rem;
  max-width: 440px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.modal-icon { font-size: 2.5rem; }
.modal h1 { font-size: 1.4rem; }
.modal p { color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; }
.modal-sub { font-weight: 600; color: var(--text) !important; margin-top: 0.5rem; }
.name-input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.name-input:focus { border-color: var(--primary); }
</style>
