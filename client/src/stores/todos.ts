import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../api';
import { TodoFile, Category, GitStatus, GitCommit, TodoItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { showConfirm } from '../composables/useModal';

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function computeChangelog(oldCats: Category[], newCats: Category[]): string | null {
  const changes: string[] = [];

  const oldItemMap = new Map<string, { text: string; done: boolean; catName: string }>();
  const newItemMap = new Map<string, { text: string; done: boolean; catName: string }>();

  for (const cat of oldCats) {
    for (const item of cat.items) {
      oldItemMap.set(item.id, { text: item.text, done: item.done, catName: cat.name });
    }
  }
  for (const cat of newCats) {
    for (const item of cat.items) {
      newItemMap.set(item.id, { text: item.text, done: item.done, catName: cat.name });
    }
  }

  // Added items
  for (const [id, newItem] of newItemMap) {
    if (!oldItemMap.has(id)) {
      changes.push(`* Added: ${newItem.text}`);
    }
  }

  // Removed items
  for (const [id, oldItem] of oldItemMap) {
    if (!newItemMap.has(id)) {
      changes.push(`* Removed: ${oldItem.text}`);
    }
  }

  // Edited or moved items
  for (const [id, newItem] of newItemMap) {
    const oldItem = oldItemMap.get(id);
    if (!oldItem) continue;

    if (oldItem.text !== newItem.text) {
      changes.push(`* Edited: ${oldItem.text} → ${newItem.text}`);
    }
    if (oldItem.catName !== newItem.catName) {
      changes.push(`* Moved: ${newItem.text} to ${newItem.catName}`);
    }
  }

  return changes.length > 0 ? changes.join('\n') : null;
}

export const useTodosStore = defineStore('todos', () => {
  const files = ref<TodoFile[]>([]);
  const activeFileId = ref<string | null>(null);
  const contents = ref<Record<string, Category[]>>({});
  const originalContents = ref<Record<string, Category[]>>({});
  const loading = ref(false);
  const saving = ref(false);
  const gitStatus = ref<Record<string, GitStatus>>({});
  const history = ref<Record<string, GitCommit[]>>({});
  const historyOpen = ref(false);
  const mtimes = ref<Record<string, number>>({});
  const remoteChanged = ref<Record<string, boolean>>({});
  const remoteAhead = ref<Record<string, boolean>>({});
  const pollTimers: Record<string, ReturnType<typeof setInterval>> = {};
  const remotePollTimers: Record<string, ReturnType<typeof setInterval>> = {};

  const activeFile = computed(() =>
    files.value.find(f => f.id === activeFileId.value) ?? null
  );

  const activeCategories = computed(() =>
    activeFileId.value ? (contents.value[activeFileId.value] ?? []) : []
  );

  function isDirty(id: string): boolean {
    return JSON.stringify(contents.value[id] ?? []) !==
           JSON.stringify(originalContents.value[id] ?? []);
  }

  async function loadFiles() {
    loading.value = true;
    try {
      const result = await api.getFiles();
      files.value = result as TodoFile[];
      if (files.value.length > 0 && !activeFileId.value) {
        activeFileId.value = files.value[0].id;
        await loadContent(files.value[0].id);
        await checkStatus(files.value[0].id);
      }
    } catch {
      // Server may be restarting — caller will retry
    } finally {
      loading.value = false;
    }
  }

  async function loadContent(id: string) {
    const data = await api.getContent(id);
    contents.value[id] = data.categories;
    originalContents.value[id] = deepClone(data.categories);
    remoteChanged.value[id] = false;
    try {
      const { mtime } = await api.getMtime(id);
      mtimes.value[id] = mtime;
    } catch {}
  }

  async function saveFile(id: string) {
    // Fetch fresh git status immediately before saving
    await checkStatus(id);
    const status = gitStatus.value[id];
    if (status?.unrelatedStaged?.length) {
      const fileList = status.unrelatedStaged.join('\n');
      const ok = await showConfirm(
        `The following unrelated files are also staged and will be included in this commit:\n\n${fileList}\n\nCommit anyway?`,
        'Commit'
      );
      if (!ok) return;
    }

    saving.value = true;
    try {
      const cats = contents.value[id] ?? [];
      const original = originalContents.value[id] ?? [];
      const file = files.value.find(f => f.id === id);
      const changes = computeChangelog(original, cats);
      const subject = `Updated ${file?.name ?? 'TODO'}`;
      const message = changes === null ? subject : `${subject}\n\n${changes}`;
      await api.putContent(id, cats);
      await api.saveFile(id, message);
      originalContents.value[id] = deepClone(cats);
      // Refresh mtime so the next poll doesn't treat the saved file as external change
      try {
        const { mtime } = await api.getMtime(id);
        mtimes.value[id] = mtime;
      } catch {}
      remoteChanged.value[id] = false;
    } finally {
      saving.value = false;
    }
  }

  async function checkStatus(id: string) {
    const status = await api.getStatus(id);
    gitStatus.value[id] = status;
  }

  async function loadHistory(id: string) {
    const commits = await api.getHistory(id);
    history.value[id] = commits;
  }

  function setActiveFile(id: string) {
    activeFileId.value = id;
    if (!contents.value[id]) {
      loadContent(id);
    }
    checkStatus(id);
  }

  function setCategories(fileId: string, cats: Category[]) {
    contents.value[fileId] = cats;
  }

  function addCategory(fileId: string, name: string) {
    if (!contents.value[fileId]) contents.value[fileId] = [];
    contents.value[fileId].push({ id: uuidv4(), name, items: [] });
  }

  function updateCategory(fileId: string, catId: string, name: string) {
    const cats = contents.value[fileId];
    if (!cats) return;
    const cat = cats.find(c => c.id === catId);
    if (cat) cat.name = name;
  }

  function removeCategory(fileId: string, catId: string) {
    const cats = contents.value[fileId];
    if (!cats) return;
    contents.value[fileId] = cats.filter(c => c.id !== catId);
  }

  function addItem(fileId: string, catId: string, text: string): string {
    const cats = contents.value[fileId];
    if (!cats) return '';
    const cat = cats.find(c => c.id === catId);
    if (cat) {
      const id = uuidv4();
      cat.items.push({ id, text, done: false });
      return id;
    }
    return '';
  }

  function insertItemAfter(fileId: string, catId: string, afterItemId: string, text: string): string {
    const cats = contents.value[fileId];
    if (!cats) return '';
    const cat = cats.find(c => c.id === catId);
    if (!cat) return '';
    const idx = cat.items.findIndex(i => i.id === afterItemId);
    const id = uuidv4();
    cat.items.splice(idx + 1, 0, { id, text, done: false });
    return id;
  }

  function updateItem(fileId: string, catId: string, itemId: string, patch: Partial<TodoItem>) {
    const cats = contents.value[fileId];
    if (!cats) return;
    const cat = cats.find(c => c.id === catId);
    if (!cat) return;
    const item = cat.items.find(i => i.id === itemId);
    if (item) Object.assign(item, patch);
  }

  function removeItem(fileId: string, catId: string, itemId: string) {
    const cats = contents.value[fileId];
    if (!cats) return;
    const cat = cats.find(c => c.id === catId);
    if (cat) {
      cat.items = cat.items.filter(i => i.id !== itemId);
    }
  }

  function toggleHistory() {
    historyOpen.value = !historyOpen.value;
    if (historyOpen.value && activeFileId.value) {
      loadHistory(activeFileId.value);
    }
  }

  async function checkMtime(id: string) {
    try {
      const { mtime } = await api.getMtime(id);
      if (mtimes.value[id] !== undefined && mtime > mtimes.value[id]) {
        remoteChanged.value[id] = true;
      }
      mtimes.value[id] = mtime;
    } catch {}
  }

  function startPolling(id: string) {
    if (pollTimers[id]) return;
    pollTimers[id] = setInterval(() => checkMtime(id), 10_000);
    // Check remote every 60s
    checkRemote(id);
    remotePollTimers[id] = setInterval(() => checkRemote(id), 60_000);
  }

  function stopPolling(id: string) {
    clearInterval(pollTimers[id]);
    delete pollTimers[id];
    clearInterval(remotePollTimers[id]);
    delete remotePollTimers[id];
  }

  async function checkRemote(id: string) {
    try {
      const { changed } = await api.getRemoteChanged(id);
      remoteAhead.value[id] = changed;
    } catch {}
  }

  return {
    files,
    activeFileId,
    contents,
    originalContents,
    loading,
    saving,
    gitStatus,
    history,
    historyOpen,
    remoteChanged,
    remoteAhead,
    activeFile,
    activeCategories,
    isDirty,
    loadFiles,
    loadContent,
    saveFile,
    checkStatus,
    loadHistory,
    setActiveFile,
    setCategories,
    addCategory,
    updateCategory,
    removeCategory,
    addItem,
    insertItemAfter,
    updateItem,
    removeItem,
    toggleHistory,
    startPolling,
    stopPolling,
  };
});
