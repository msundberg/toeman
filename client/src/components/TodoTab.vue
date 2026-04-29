<template>
  <div class="todo-tab">
    <div v-if="store.remoteChanged[fileId]" class="reload-banner">
      File changed externally.
      <button class="reload-btn" @click="reload">Reload</button>
      <button class="dismiss-btn" @click="store.remoteChanged[fileId] = false">✕</button>
    </div>

    <div v-if="store.remoteAhead[fileId]" class="remote-banner">
      Remote has new commits — run <code>git pull</code> to update.
      <button class="dismiss-btn" @click="store.remoteAhead[fileId] = false">✕</button>
    </div>

    <GitWarning
      v-if="status && status.unrelatedStaged.length > 0"
      :files="status.unrelatedStaged"
      @dismiss="dismissed = true"
      v-show="!dismissed"
    />

    <div class="scroll-area">
      <VueDraggable
        v-model="categories"
        group="categories"
        handle=".cat-drag-handle"
        class="categories-list"
        @end="onCategoryReorder"
      >
        <CategorySection
          v-for="element in categories"
          :key="element.id"
          :category="element"
          :fileId="fileId"
        />
      </VueDraggable>

      <button class="add-category-btn" @click="addCategory">+ Add category</button>
    </div>

    <HistoryPanel v-if="store.historyOpen" :fileId="fileId" />
    <ActionBar :fileId="fileId" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useTodosStore } from '../stores/todos';
import GitWarning from './GitWarning.vue';
import CategorySection from './CategorySection.vue';
import HistoryPanel from './HistoryPanel.vue';
import ActionBar from './ActionBar.vue';
import { Category } from '../types';
import { showPrompt } from '../composables/useModal';

const props = defineProps<{ fileId: string }>();
const store = useTodosStore();
const dismissed = ref(false);

const status = computed(() => store.gitStatus[props.fileId]);

const categories = computed({
  get(): Category[] {
    return store.contents[props.fileId] ?? [];
  },
  set(val: Category[]) {
    store.setCategories(props.fileId, val);
  },
});

function onCategoryReorder() {
  // categories is already updated by v-model
}

async function addCategory() {
  const name = await showPrompt('Category name:');
  if (name?.trim()) store.addCategory(props.fileId, name.trim());
}

watch(() => props.fileId, () => {
  dismissed.value = false;
}, { immediate: true });

onMounted(() => {
  if (!store.contents[props.fileId]) {
    store.loadContent(props.fileId);
  }
  store.startPolling(props.fileId);
});

onUnmounted(() => {
  store.stopPolling(props.fileId);
});

async function reload() {
  await store.loadContent(props.fileId);
}
</script>

<style scoped>
.remote-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem;
  background: #eff6ff;
  border-bottom: 1px solid #93c5fd;
  font-size: 0.88rem;
  flex-shrink: 0;
}

.remote-banner code {
  font-size: 0.82rem;
  background: #dbeafe;
  padding: 1px 5px;
  border-radius: 4px;
}

.reload-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem;
  background: var(--color-warning-bg);
  border-bottom: 1px solid var(--color-warning-border);
  font-size: 0.88rem;
  flex-shrink: 0;
}

.reload-btn {
  padding: 0.2rem 0.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--color-warning-border);
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.reload-btn:hover { background: var(--color-warning-border); }

.dismiss-btn {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
}

.todo-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.categories-list,
.add-category-btn {
  width: 100%;
  max-width: 760px;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.add-category-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: 2px dashed var(--color-border);
  background: none;
  border-radius: var(--radius);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.15s, border-color 0.15s;
}

.add-category-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

@media (max-width: 480px) {
  .scroll-area {
    padding: 0.75rem;
  }
  .categories-list {
    gap: 0.75rem;
  }
}
</style>
