import { reactive } from 'vue';

type ModalNone = { type: 'none' };
type ModalConfirm = { type: 'confirm'; message: string; confirmLabel: string; resolve: (ok: boolean) => void };
type ModalPrompt = { type: 'prompt'; message: string; defaultValue: string; resolve: (val: string | null) => void };
type ModalState = ModalNone | ModalConfirm | ModalPrompt;

export const modalState = reactive<{ current: ModalState }>({ current: { type: 'none' } });

export function showConfirm(message: string, confirmLabel = 'OK'): Promise<boolean> {
  return new Promise(resolve => {
    modalState.current = { type: 'confirm', message, confirmLabel, resolve };
  });
}

export function showPrompt(message: string, defaultValue = ''): Promise<string | null> {
  return new Promise(resolve => {
    modalState.current = { type: 'prompt', message, defaultValue, resolve };
  });
}
