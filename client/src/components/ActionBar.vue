<template>
  <div class="action-bar">
    <button
      class="btn btn-primary"
      :disabled="store.saving || !store.isDirty(fileId)"
      @click="store.saveFile(fileId)"
    >
      <span v-if="store.saving" class="spinner">⟳</span>
      <span v-else>💾 Save</span>
    </button>
    <button
      class="btn btn-secondary"
      :class="{ active: store.historyOpen }"
      @click="store.toggleHistory"
    >
      📜 History
    </button>
  </div>
</template>

<script setup lang="ts">
import { useTodosStore } from '../stores/todos';

defineProps<{ fileId: string }>();
const store = useTodosStore();
</script>

<style scoped>
.action-bar {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.btn {
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.15s, opacity 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-secondary.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.spinner {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .action-bar {
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
  }
  .btn {
    flex: 1;
  }
}
</style>
