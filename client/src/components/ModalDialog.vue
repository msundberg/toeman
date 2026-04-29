<template>
  <Teleport to="body">
    <div v-if="state.current.type !== 'none'" class="modal-backdrop" @mousedown.self="cancel">
      <div class="modal" role="dialog" @keydown.escape="cancel">
        <p class="modal-message" style="white-space: pre-wrap">{{ state.current.message }}</p>

        <input
          v-if="state.current.type === 'prompt'"
          ref="inputRef"
          v-model="draft"
          class="modal-input"
          @keydown.enter.prevent="confirm"
          @keydown.escape.prevent="cancel"
        />

        <div class="modal-actions">
          <button class="btn-cancel" @click="cancel">Cancel</button>
          <button class="btn-confirm" @click="confirm">
            {{ state.current.type === 'confirm' ? state.current.confirmLabel : 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { modalState as state } from '../composables/useModal';

const draft = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => state.current, async (cur) => {
  if (cur.type === 'prompt') {
    draft.value = cur.defaultValue;
    await nextTick();
    inputRef.value?.select();
  }
}, { immediate: true });

function confirm() {
  const cur = state.current;
  if (cur.type === 'confirm') cur.resolve(true);
  else if (cur.type === 'prompt') cur.resolve(draft.value);
  state.current = { type: 'none' };
}

function cancel() {
  const cur = state.current;
  if (cur.type === 'confirm') cur.resolve(false);
  else if (cur.type === 'prompt') cur.resolve(null);
  state.current = { type: 'none' };
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 1.5rem;
  min-width: 320px;
  max-width: 480px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-message {
  font-size: 0.95rem;
  color: var(--color-text);
  line-height: 1.5;
}

.modal-input {
  width: 100%;
  padding: 0.45rem 0.7rem;
  font-size: 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  outline: none;
  background: var(--color-bg);
  color: var(--color-text);
}

.modal-input:focus {
  border-color: var(--color-primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-cancel, .btn-confirm {
  padding: 0.4rem 1rem;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-cancel {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-cancel:hover { background: var(--color-border); }

.btn-confirm {
  background: var(--color-primary);
  color: #fff;
}

.btn-confirm:hover { background: var(--color-primary-hover); }
</style>
