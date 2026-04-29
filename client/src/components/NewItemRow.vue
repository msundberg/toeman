<template>
  <div class="new-item-row">
    <span class="ghost-handle">⠿</span>
    <span class="ghost-checkbox"></span>
    <textarea
      ref="inputRef"
      data-item-input
      class="ghost-input"
      placeholder="Add item…"
      rows="1"
      v-model="draft"
      @input="onInput"
      @keydown.up="onArrowUp"
      @keydown.down="onArrowDown"
      @keydown.escape.prevent="onEscape"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useTodosStore } from '../stores/todos';
import { navNext, navPrev, getNavInputs } from '../composables/useItemNav';

const props = defineProps<{ fileId: string; catId: string }>();
const store = useTodosStore();

const draft = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);

function onInput() {
  if (!draft.value) return;
  const text = draft.value;
  draft.value = '';
  store.addItem(props.fileId, props.catId, text);
  nextTick(() => {
    // Focus the newly created item — it sits just before this ghost input
    if (!inputRef.value) return;
    const inputs = getNavInputs(inputRef.value);
    const idx = inputs.indexOf(inputRef.value);
    if (idx > 0) inputs[idx - 1].focus();
  });
}

function onArrowUp(e: KeyboardEvent) {
  const input = inputRef.value!;
  if (input.selectionStart === 0 && input.selectionEnd === 0) {
    e.preventDefault();
    navPrev(input, 'end');
  } else {
    e.preventDefault();
    input.setSelectionRange(0, 0);
  }
}

function onArrowDown(e: KeyboardEvent) {
  const input = inputRef.value!;
  const len = input.value.length;
  if (input.selectionStart === len && input.selectionEnd === len) {
    e.preventDefault();
    navNext(input, 'start');
  } else {
    e.preventDefault();
    input.setSelectionRange(len, len);
  }
}

function onEscape() {
  draft.value = '';
  inputRef.value?.blur();
}
</script>

<style scoped>
.new-item-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0 1rem 0 0.25rem;
  border-top: 1px solid var(--color-border);
}

.ghost-handle {
  color: transparent;
  font-size: 1rem;
  flex-shrink: 0;
  user-select: none;
  width: 1em;
  margin-top: 0.5rem;
}

.ghost-checkbox {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  margin-top: 0.55rem;
}

.ghost-input {
  flex: 1;
  font-size: 0.92rem;
  font-family: inherit;
  line-height: 1.5;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0.45rem 2px;
  outline: none;
  font-style: italic;
  resize: none;
  overflow: hidden;
  color: var(--color-text);
  caret-color: #000;
}

.ghost-input::placeholder {
  color: var(--color-ghost);
}
</style>
