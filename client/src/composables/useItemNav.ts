export function getNavInputs(el: HTMLElement): HTMLTextAreaElement[] {
  const container = el.closest('.scroll-area');
  return Array.from(container?.querySelectorAll<HTMLTextAreaElement>('[data-item-input]') ?? []);
}

export function navNext(el: HTMLElement, cursorPos: 'start' | 'end' = 'start'): void {
  const inputs = getNavInputs(el);
  const idx = inputs.indexOf(el as HTMLTextAreaElement);
  if (idx >= 0 && idx < inputs.length - 1) {
    const next = inputs[idx + 1];
    next.focus();
    const pos = cursorPos === 'start' ? 0 : next.value.length;
    next.setSelectionRange(pos, pos);
  }
}

export function navPrev(el: HTMLElement, cursorPos: 'start' | 'end' = 'end'): void {
  const inputs = getNavInputs(el);
  const idx = inputs.indexOf(el as HTMLTextAreaElement);
  if (idx > 0) {
    const prev = inputs[idx - 1];
    prev.focus();
    const pos = cursorPos === 'start' ? 0 : prev.value.length;
    prev.setSelectionRange(pos, pos);
  }
}
