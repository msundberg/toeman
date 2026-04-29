<template>
  <div class="git-warning" v-if="visible">
    <span class="icon">⚠️</span>
    <div class="content">
      <strong>Other files are staged in this repo:</strong>
      <ul>
        <li v-for="f in files" :key="f">{{ f }}</li>
      </ul>
    </div>
    <button class="dismiss" @click="$emit('dismiss')">✕</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTodosStore } from '../stores/todos';

const props = defineProps<{ files: string[] }>();
const emit = defineEmits<{ dismiss: [] }>();
const store = useTodosStore();
const visible = ref(true);

let intervalId: ReturnType<typeof setInterval>;

onMounted(() => {
  intervalId = setInterval(() => {
    if (store.activeFileId) store.checkStatus(store.activeFileId);
  }, 5000);
});

onUnmounted(() => clearInterval(intervalId));
</script>

<style scoped>
.git-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: var(--color-warning-bg);
  border-bottom: 1px solid var(--color-border);
  padding: 0.75rem 1.5rem;
  font-size: 0.88rem;
}

.icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }

.content { flex: 1; }
.content ul { margin-top: 0.25rem; margin-left: 1rem; }

.dismiss {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 1rem;
  padding: 0 0.25rem;
  flex-shrink: 0;
}
.dismiss:hover { color: var(--color-text); }
</style>
