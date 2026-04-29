import simpleGit from 'simple-git';
import * as path from 'path';
import { GitStatus, GitCommit } from '../types';

export async function getStatus(repoRoot: string, filePath: string): Promise<GitStatus> {
  const git = simpleGit(repoRoot);
  const diff = await git.diff(['--cached', '--name-only']);
  const stagedFiles = diff.split('\n').map(f => f.trim()).filter(Boolean);

  const relPath = path.relative(repoRoot, filePath);
  const normalizedRel = relPath.replace(/\\/g, '/');

  const todoFileStaged = stagedFiles.some(f => f === normalizedRel);
  const unrelatedStaged = stagedFiles.filter(f => f !== normalizedRel);

  return { todoFileStaged, unrelatedStaged };
}

export async function commitAndPush(repoRoot: string, filePath: string, message: string): Promise<void> {
  const git = simpleGit(repoRoot);
  await git.add(filePath);
  await git.commit(message);
  try {
    await git.push();
  } catch {
    // push may fail if no remote; that's OK
  }
}

export async function hasRemoteChanges(repoRoot: string, filePath: string): Promise<boolean> {
  const git = simpleGit(repoRoot);
  const relPath = path.relative(repoRoot, filePath);
  try {
    await git.fetch(['--quiet']);
    const result = await git.raw(['log', 'HEAD..@{u}', '--oneline', '--', relPath]);
    return result.trim().length > 0;
  } catch {
    return false; // no upstream configured or fetch failed
  }
}

export async function getHistory(repoRoot: string, filePath: string, limit = 20): Promise<GitCommit[]> {
  const git = simpleGit(repoRoot);
  const relPath = path.relative(repoRoot, filePath);

  let log: string;
  try {
    const result = await git.raw([
      'log',
      '--follow',
      `-n${limit}`,
      '--format=---COMMIT---%H|%h|%ai|%an%n%B',
      '--',
      relPath,
    ]);
    log = result;
  } catch {
    return [];
  }

  const commits: GitCommit[] = [];
  for (const entry of log.split('---COMMIT---')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const newlineIdx = trimmed.indexOf('\n');
    if (newlineIdx === -1) continue;
    const header = trimmed.slice(0, newlineIdx).trim();
    const body = trimmed.slice(newlineIdx + 1).trim();
    const parts = header.split('|');
    if (parts.length < 4) continue;
    commits.push({
      hash: parts[0],
      shortHash: parts[1],
      date: parts[2],
      author: parts[3],
      message: body,
    });
  }

  return commits;
}
