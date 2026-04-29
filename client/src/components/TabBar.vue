<template>
  <nav class="tab-bar">
    <button
      v-for="file in files"
      :key="file.id"
      class="tab"
      :class="{ active: file.id === activeId }"
      @click="$emit('select', file.id)"
    >
      {{ file.name }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { TodoFile } from '../types';

defineProps<{
  files: Pick<TodoFile, 'id' | 'name'>[];
  activeId: string | null;
}>();
defineEmits<{ select: [id: string] }>();
</script>

<style scoped>
.tab-bar {
  display: flex;
  gap: 0;
  overflow-x: auto;
}

.tab {
  padding: 0.85rem 1.2rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  border-bottom: 3px solid transparent;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}

.tab:hover {
  color: var(--color-text);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}
</style>
