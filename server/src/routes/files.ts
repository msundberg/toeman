import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import { TodoFile, Category } from '../types';
import { parse, serialize } from '../lib/markdown';
import { getStatus, commitAndPush, getHistory, hasRemoteChanges } from '../lib/git';

export function createFilesRouter(registry: Map<string, TodoFile>): Router {
  const router = Router();

  router.get('/files', (_req: Request, res: Response) => {
    const files = Array.from(registry.values()).map(f => ({
      id: f.id,
      name: f.name,
      path: f.path,
      isRepo: f.isRepo,
    }));
    res.json(files);
  });

  router.get('/files/:id', (req: Request, res: Response) => {
    const file = registry.get(req.params.id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const categories = parse(content);
      res.json({ fileId: file.id, categories });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  router.put('/files/:id', (req: Request, res: Response) => {
    const file = registry.get(req.params.id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    const { categories }: { categories: Category[] } = req.body;
    if (!Array.isArray(categories)) return res.status(400).json({ error: 'Invalid body' });

    try {
      const markdown = serialize(categories);
      fs.writeFileSync(file.path, markdown, 'utf-8');
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  router.get('/files/:id/status', async (req: Request, res: Response) => {
    const file = registry.get(req.params.id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    if (!file.isRepo) return res.json({ todoFileStaged: false, unrelatedStaged: [] });

    try {
      const status = await getStatus(file.repoRoot, file.path);
      res.json(status);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  router.post('/files/:id/save', async (req: Request, res: Response) => {
    const file = registry.get(req.params.id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    const { message }: { message: string } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    if (!file.isRepo) return res.json({ ok: true });

    try {
      await commitAndPush(file.repoRoot, file.path, message);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  router.get('/files/:id/mtime', (req: Request, res: Response) => {
    const file = registry.get(req.params.id);
    if (!file) return res.status(404).json({ error: 'Not found' });
    try {
      const stat = fs.statSync(file.path);
      res.json({ mtime: stat.mtimeMs });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  router.get('/files/:id/remote-changed', async (req: Request, res: Response) => {
    const file = registry.get(req.params.id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    if (!file.isRepo) return res.json({ changed: false });

    try {
      const changed = await hasRemoteChanges(file.repoRoot, file.path);
      res.json({ changed });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  router.get('/files/:id/history', async (req: Request, res: Response) => {
    const file = registry.get(req.params.id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    if (!file.isRepo) return res.json([]);

    try {
      const history = await getHistory(file.repoRoot, file.path);
      res.json(history);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  return router;
}
