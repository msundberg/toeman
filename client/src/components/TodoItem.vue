<template>
  <div class="todo-item" :class="{ done: item.done }" @click="onRowClick">
    <span class="item-drag-handle" title="Drag to reorder">⠿</span>

    <input
      type="checkbox"
      class="checkbox"
      :checked="item.done"
      @change="toggleDone"
    />

    <textarea
      ref="inputRef"
      data-item-input
      :data-item-id="item.id"
      :data-cat-id="catId"
      class="item-input"
      rows="1"
      :value="item.text"
      @input="onInput"
      @blur="onBlur"
      @keydown.enter.exact.prevent="onEnter"
      @keydown.ctrl.enter.prevent="toggleDoneKey"
      @keydown.ctrl.space.prevent="toggleDoneKey"
      @keydown.up="onArrowUp"
      @keydown.down="onArrowDown"
      @keydown.backspace="onBackspace"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue';
import { useTodosStore } from '../stores/todos';
import { TodoItem } from '../types';
import { navNext, navPrev, getNavInputs } from '../composables/useItemNav';

const props = defineProps<{ item: TodoItem; fileId: string; catId: string }>();
const store = useTodosStore();
const inputRef = ref<HTMLTextAreaElement | null>(null);

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

onMounted(() => nextTick(() => inputRef.value && autoResize(inputRef.value)));
watch(() => props.item.text, () => nextTick(() => inputRef.value && autoResize(inputRef.value)));

function onRowClick(e: MouseEvent) {
  if (e.target === inputRef.value) return;
  const len = inputRef.value?.value.length ?? 0;
  inputRef.value?.focus();
  inputRef.value?.setSelectionRange(len, len);
}

function onBlur() {
  const trimmed = (inputRef.value?.value ?? '').trim();
  if (trimmed !== props.item.text) {
    store.updateItem(props.fileId, props.catId, props.item.id, { text: trimmed });
  }
}

function onInput(e: Event) {
  const el = e.target as HTMLTextAreaElement;
  autoResize(el);
  store.updateItem(props.fileId, props.catId, props.item.id, { text: el.value });
}

function onEnter(e: KeyboardEvent) {
  const el = inputRef.value!;
  const pos = el.selectionStart ?? el.value.length;
  const before = el.value.slice(0, pos);
  const after = el.value.slice(pos);

  store.updateItem(props.fileId, props.catId, props.item.id, { text: before });
  const newId = store.insertItemAfter(props.fileId, props.catId, props.item.id, after);

  nextTick(() => {
    const newEl = el.closest('.scroll-area')
      ?.querySelector<HTMLTextAreaElement>(`[data-item-id="${newId}"]`);
    newEl?.focus();
    newEl?.setSelectionRange(0, 0);
  });
}

function onArrowUp(e: KeyboardEvent) {
  const el = inputRef.value!;
  if (el.selectionStart === 0 && el.selectionEnd === 0) {
    e.preventDefault();
    navPrev(el, 'end');
  }
}

function onArrowDown(e: KeyboardEvent) {
  const el = inputRef.value!;
  const len = el.value.length;
  if (el.selectionStart === len && el.selectionEnd === len) {
    e.preventDefault();
    navNext(el, 'start');
  }
}

function onBackspace(e: KeyboardEvent) {
  const el = inputRef.value!;
  if (el.selectionStart !== 0 || el.selectionEnd !== 0) return;

  const inputs = getNavInputs(el);
  const idx = inputs.indexOf(el);
  if (idx <= 0) return;
  const prevInput = inputs[idx - 1] as HTMLTextAreaElement;
  const prevItemId = prevInput.dataset.itemId;
  const prevCatId = prevInput.dataset.catId;
  if (!prevItemId || !prevCatId) return;

  e.preventDefault();
  const joinPos = prevInput.value.length;
  const scrollArea = el.closest('.scroll-area');
  store.updateItem(props.fileId, prevCatId, prevItemId, { text: prevInput.value + el.value });
  store.removeItem(props.fileId, props.catId, props.item.id);

  nextTick(() => {
    const target = scrollArea?.querySelector<HTMLTextAreaElement>(`[data-item-id="${prevItemId}"]`);
    target?.focus();
    target?.setSelectionRange(joinPos, joinPos);
  });
}

function toggleDoneKey() {
  store.updateItem(props.fileId, props.catId, props.item.id, { done: !props.item.done });
}

function toggleDone(e: Event) {
  store.updateItem(props.fileId, props.catId, props.item.id, {
    done: (e.target as HTMLInputElement).checked,
  });
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0 1rem 0 0.25rem;
  border-top: 1px solid var(--color-border);
  transition: background 0.1s;
}

.todo-item:first-child { border-top: none; }

.todo-item:focus-within {
  background: #f0f1ff;
}

.item-drag-handle {
  cursor: grab;
  color: var(--color-border);
  font-size: 1rem;
  flex-shrink: 0;
  user-select: none;
  margin-top: 0.5rem;
}

.item-drag-handle:hover { color: var(--color-text-muted); }

.checkbox {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: var(--color-primary);
  margin-top: 0.55rem;
}

.item-input {
  flex: 1;
  font-size: 0.92rem;
  font-family: inherit;
  line-height: 1.5;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0.45rem 2px;
  outline: none;
  color: var(--color-text);
  resize: none;
  overflow: hidden;
  caret-color: #000;
}

.done .item-input {
  text-decoration: line-through;
  color: var(--color-done);
}
</style>
