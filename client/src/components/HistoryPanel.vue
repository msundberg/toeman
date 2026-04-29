<template>
  <aside class="history-panel">
    <div class="panel-header">
      <h3>Git History</h3>
      <button class="close-btn" @click="store.toggleHistory">✕</button>
    </div>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="commits.length === 0" class="state-msg">No history found.</div>

    <ul v-else class="commit-list">
      <li v-for="commit in commits" :key="commit.hash" class="commit-item">
        <div class="commit-top">
          <code class="commit-hash">{{ commit.shortHash }}</code>
          <span class="commit-date">{{ formatDate(commit.date) }}</span>
        </div>
        <div class="commit-msg">
          <span class="commit-subject">{{ subject(commit.message) }}</span>
          <pre v-if="body(commit.message)" class="commit-body">{{ body(commit.message) }}</pre>
        </div>
        <div class="commit-author">{{ commit.author }}</div>
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTodosStore } from '../stores/todos';
import { GitCommit } from '../types';

const props = defineProps<{ fileId: string }>();
const store = useTodosStore();
const loading = ref(false);

const commits = computed<GitCommit[]>(() => store.history[props.fileId] ?? []);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function subject(message: string) {
  return message.split('\n')[0];
}

function body(message: string) {
  const rest = message.split('\n').slice(1).join('\n').trim();
  return rest || null;
}

onMounted(async () => {
  loading.value = true;
  try {
    await store.loadHistory(props.fileId);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.history-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 340px;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  box-shadow: -4px 0 16px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

@media (max-width: 480px) {
  .history-panel {
    width: 100%;
    border-left: none;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 1rem;
}
.close-btn:hover { color: var(--color-text); }

.state-msg {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.commit-list {
  list-style: none;
  overflow-y: auto;
  flex: 1;
}

.commit-item {
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.commit-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.2rem;
}

.commit-hash {
  font-size: 0.78rem;
  background: var(--color-bg);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--color-primary);
}

.commit-date {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.commit-subject {
  font-size: 0.88rem;
  color: var(--color-text);
  word-break: break-word;
}

.commit-body {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: pre-wrap;
  font-family: inherit;
  word-break: break-word;
}

.commit-author {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
</style>
