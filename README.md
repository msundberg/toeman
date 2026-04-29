# toeman

A local web UI for managing todo lists stored as Markdown files, with Git integration.

## Features

- Edit todo items grouped by category in a clean browser UI
- Stores todos in plain Markdown files you own
- Commit and push changes directly from the UI
- View file history and detect remote changes
- Manage multiple todo files at once

## Markdown format

```markdown
## Work

- [ ] Write tests
- [x] Fix login bug

## Personal

- [ ] Buy groceries
```

## Installation

```bash
npm install -g toeman
```

Or run directly from the repo:

```bash
cd server && npm install -g .
```

## Usage

```bash
toeman                          # serves ./TODO.md on http://localhost:3000
toeman path/to/MY_TODOS.md      # custom file
toeman TODO.md WORK.md          # multiple files
toeman -p 8080                  # custom port
toeman -H 0.0.0.0               # listen on all interfaces
toeman -p 8080 -H 0.0.0.0 TODO.md
```

### Options

| Option | Default | Description |
|---|---|---|
| `-p, --port <number>` | `3000` | Port to listen on |
| `-H, --host <address>` | `127.0.0.1` | Network interface to bind to |

The `PORT` environment variable is also respected as a fallback for `--port`.

## Development

```bash
npm run dev       # start client + server in watch mode
npm run build     # production build
npm start         # run production server
```

Requires Node.js 18+.
