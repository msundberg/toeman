<template>
  <div class="category-header">
    <input
      v-if="editing"
      ref="inputRef"
      v-model="draft"
      class="header-input"
      @blur="confirm"
      @keydown.enter.prevent="confirm"
      @keydown.escape.prevent="cancel"
    />
    <h2 v-else class="header-text" @click="startEdit">{{ name }}</h2>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

const props = defineProps<{ name: string }>();
const emit = defineEmits<{ save: [name: string] }>();

const editing = ref(false);
const draft = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

async function startEdit() {
  draft.value = props.name;
  editing.value = true;
  await nextTick();
  inputRef.value?.select();
}

function confirm() {
  if (draft.value.trim()) emit('save', draft.value.trim());
  editing.value = false;
}

function cancel() {
  editing.value = false;
}
</script>

<style scoped>
.category-header {
  padding: 0.75rem 1rem 0.5rem;
}

.header-text {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  cursor: pointer;
  display: inline-block;
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
}

.header-text:hover {
  background: var(--color-bg);
}

.header-input {
  width: 100%;
  font-size: 1rem;
  font-weight: 700;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  padding: 2px 6px;
  outline: none;
  background: var(--color-surface);
}
</style>
