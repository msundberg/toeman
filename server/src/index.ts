#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import { Command } from 'commander';
import simpleGit from 'simple-git';
import { TodoFile } from './types';
import { createFilesRouter } from './routes/files';

async function main() {
  const program = new Command();
  program
    .name('toeman')
    .description('Todo manager server')
    .argument('[files...]', 'TODO markdown files to manage', ['./TODO.md'])
    .option('-p, --port <number>', 'port to listen on', String(process.env.PORT ?? '3000'))
    .option('-H, --host <address>', 'network interface to listen on', '127.0.0.1')
    .parse(process.argv);

  const opts = program.opts<{ port: string; host: string }>();
  const filePaths: string[] = program.args.length > 0 ? program.args : ['./TODO.md'];

  const registry = new Map<string, TodoFile>();

  for (let i = 0; i < filePaths.length; i++) {
    const absPath = path.resolve(filePaths[i]);

    if (!fs.existsSync(absPath)) {
      console.error(`File not found: ${absPath}`);
      process.exit(1);
    }

    let repoRoot: string;
    let isRepo: boolean;
    try {
      const git = simpleGit(path.dirname(absPath));
      repoRoot = (await git.revparse(['--show-toplevel'])).trim();
      isRepo = true;
    } catch {
      repoRoot = path.dirname(absPath);
      isRepo = false;
    }

    const todoFile: TodoFile = {
      id: String(i),
      path: absPath,
      repoRoot,
      name: path.basename(absPath),
      isRepo,
    };

    registry.set(todoFile.id, todoFile);
  }

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api', createFilesRouter(registry));

  // Serve client in production
  const clientDist = path.join(__dirname, 'public');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  const port = parseInt(opts.port, 10);
  const host = opts.host;
  app.listen(port, host, () => {
    console.log(`Todo server running on http://${host}:${port}`);
    console.log('Managing files:');
    for (const f of registry.values()) {
      console.log(`  [${f.id}] ${f.path} (repo: ${f.repoRoot})`);
    }
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
