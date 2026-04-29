<template>
  <div class="category-section">
    <div class="cat-drag-handle" title="Drag to reorder category">⠿</div>
    <div class="cat-header-row">
      <CategoryHeader
        :name="category.name"
        @save="onRenameCategory"
      />
      <button class="delete-cat-btn" title="Delete category" @click="onDelete">✕</button>
    </div>
    <VueDraggable
      v-model="items"
      group="items"
      handle=".item-drag-handle"
      class="items-list"
    >
      <TodoItem
        v-for="element in items"
        :key="element.id"
        :item="element"
        :fileId="fileId"
        :catId="category.id"
      />
    </VueDraggable>
    <NewItemRow :fileId="fileId" :catId="category.id" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useTodosStore } from '../stores/todos';
import { Category, TodoItem as TodoItemType } from '../types';
import { showConfirm } from '../composables/useModal';
import CategoryHeader from './CategoryHeader.vue';
import TodoItem from './TodoItem.vue';
import NewItemRow from './NewItemRow.vue';

const props = defineProps<{ category: Category; fileId: string }>();
const store = useTodosStore();

const items = computed({
  get(): TodoItemType[] {
    const cats = store.contents[props.fileId] ?? [];
    const cat = cats.find(c => c.id === props.category.id);
    return cat ? cat.items : [];
  },
  set(val: TodoItemType[]) {
    const cats = store.contents[props.fileId] ?? [];
    const cat = cats.find(c => c.id === props.category.id);
    if (cat) cat.items = val;
  },
});

function onRenameCategory(name: string) {
  store.updateCategory(props.fileId, props.category.id, name);
}

async function onDelete() {
  const hasItems = items.value.length > 0;
  if (hasItems) {
    const ok = await showConfirm(`Delete "${props.category.name}" and its ${items.value.length} item(s)?`, 'Delete');
    if (!ok) return;
  }
  store.removeCategory(props.fileId, props.category.id);
}
</script>

<style scoped>
.category-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  position: relative;
  padding-left: 1.5rem;
}

.cat-drag-handle {
  position: absolute;
  left: 0.35rem;
  top: 0.85rem;
  cursor: grab;
  color: var(--color-border);
  font-size: 1.2rem;
  line-height: 1;
  user-select: none;
}

.cat-drag-handle:hover { color: var(--color-text-muted); }

.cat-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 0.5rem;
}

.delete-cat-btn {
  opacity: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
  transition: opacity 0.15s, color 0.15s;
  flex-shrink: 0;
}

.category-section:hover .delete-cat-btn {
  opacity: 1;
}

.delete-cat-btn:hover {
  color: var(--color-danger);
  background: #fee2e2;
}

.items-list {
  min-height: 4px;
}

@media (max-width: 480px) {
  .delete-cat-btn {
    opacity: 1;
  }
}</style>
