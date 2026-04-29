<template>
  <div class="app">
    <header class="app-header">
      <TabBar
        :files="store.files"
        :activeId="store.activeFileId"
        @select="store.setActiveFile"
      />
    </header>

    <main class="app-main">
      <div v-if="store.loading" class="loading">Loading…</div>
      <TodoTab v-else-if="store.activeFileId" :fileId="store.activeFileId" />
      <div v-else class="empty">No files loaded.</div>
    </main>

    <ModalDialog />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useTodosStore } from './stores/todos';
import TabBar from './components/TabBar.vue';
import TodoTab from './components/TodoTab.vue';
import ModalDialog from './components/ModalDialog.vue';

const store = useTodosStore();

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (store.activeFileId && store.isDirty(store.activeFileId)) {
      store.saveFile(store.activeFileId);
    }
  }
}

let retryTimer: ReturnType<typeof setInterval> | null = null;

function startRetry() {
  if (retryTimer) return;
  retryTimer = setInterval(async () => {
    if (store.files.length === 0 && !store.loading) {
      await store.loadFiles();
    }
    if (store.files.length > 0) {
      clearInterval(retryTimer!);
      retryTimer = null;
    }
  }, 3000);
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  const anyDirty = store.files.some(f => store.isDirty(f.id));
  if (anyDirty) {
    e.preventDefault();
  }
}

function resizeAllTextareas() {
  document.querySelectorAll<HTMLTextAreaElement>('[data-item-input]').forEach(el => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
}

onMounted(async () => {
  await store.loadFiles();
  if (store.files.length === 0) startRetry();
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('beforeunload', onBeforeUnload);
  window.addEventListener('resize', resizeAllTextareas);
});

// If files load via retry, stop retrying
watch(() => store.files.length, (len) => {
  if (len > 0 && retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('beforeunload', onBeforeUnload);
  window.removeEventListener('resize', resizeAllTextareas);
  if (retryTimer) clearInterval(retryTimer);
});
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-border: #e0e4e8;
  --color-text: #1a1a2e;
  --color-text-muted: #6b7280;
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-danger: #dc2626;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #f59e0b;
  --color-ghost: #b9c2d1;
  --color-done: #9ca3af;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  min-height: 100vh;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.app-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
}

.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading, .empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}
</style>
