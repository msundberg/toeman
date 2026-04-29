export interface TodoFile {
  id: string;
  path: string;
  repoRoot: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  items: TodoItem[];
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TodoContent {
  fileId: string;
  categories: Category[];
}

export interface GitStatus {
  todoFileStaged: boolean;
  unrelatedStaged: string[];
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  date: string;
  message: string;
  author: string;
}
