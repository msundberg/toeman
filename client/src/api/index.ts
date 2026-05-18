import { TodoFile, Category, TodoContent, GitStatus, GitCommit } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  getFiles(): Promise<Pick<TodoFile, 'id' | 'name' | 'path' | 'isRepo'>[]> {
    return request('/files');
  },

  getContent(id: string): Promise<TodoContent> {
    return request(`/files/${id}`);
  },

  putContent(id: string, categories: Category[]): Promise<{ ok: boolean }> {
    return request(`/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ categories }),
    });
  },

  getStatus(id: string): Promise<GitStatus> {
    return request(`/files/${id}/status`);
  },

  saveFile(id: string, message: string): Promise<{ ok: boolean }> {
    return request(`/files/${id}/save`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  getRemoteChanged(id: string): Promise<{ changed: boolean }> {
    return request(`/files/${id}/remote-changed`);
  },

  getMtime(id: string): Promise<{ mtime: number }> {
    return request(`/files/${id}/mtime`);
  },

  getHistory(id: string): Promise<GitCommit[]> {
    return request(`/files/${id}/history`);
  },
};
