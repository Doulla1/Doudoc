# Blocs de code & Coloration syntaxique

Doudoc utilise **highlight.js** (rendu côté extension host) pour coloriser 26 langages. Chaque bloc affiche un bouton **Copy** au survol et une étiquette de langage en haut à gauche.

---

## JavaScript / TypeScript

```javascript
// Classe ES2022 avec champs privés
class EventBus {
  #listeners = new Map();

  on(event, handler) {
    const list = this.#listeners.get(event) ?? [];
    this.#listeners.set(event, [...list, handler]);
    return () => this.off(event, handler);
  }

  emit(event, payload) {
    this.#listeners.get(event)?.forEach((fn) => fn(payload));
  }

  off(event, handler) {
    const list = this.#listeners.get(event) ?? [];
    this.#listeners.set(event, list.filter((fn) => fn !== handler));
  }
}

const bus = new EventBus();
const unsub = bus.on('data', (msg) => console.log(msg));
bus.emit('data', { type: 'ping', ts: Date.now() });
unsub();
```

```typescript
// Générique contrainte + mapped types
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

interface Config {
  server: { host: string; port: number };
  debug: boolean;
}

function freeze<T>(obj: T): DeepReadonly<T> {
  return Object.freeze(obj) as DeepReadonly<T>;
}

const cfg = freeze<Config>({ server: { host: 'localhost', port: 3000 }, debug: false });
// cfg.server.port = 9000; // ❌ Error: Cannot assign to 'port' because it is a read-only property
```

---

## Python

```python
from dataclasses import dataclass, field
from typing import Iterator

@dataclass
class TreeNode:
    value: int
    children: list["TreeNode"] = field(default_factory=list)

    def add(self, *values: int) -> "TreeNode":
        for v in values:
            self.children.append(TreeNode(v))
        return self

    def walk(self) -> Iterator[int]:
        yield self.value
        for child in self.children:
            yield from child.walk()

root = TreeNode(1).add(2, 3)
root.children[0].add(4, 5)
print(list(root.walk()))  # [1, 2, 4, 5, 3]
```

---

## Bash / Shell

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${HOME}/.backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

for file in ~/.config/nvim ~/.zshrc ~/.tmux.conf; do
  if [[ -e "$file" ]]; then
    cp -r "$file" "$BACKUP_DIR/"
    echo "✓ Backed up $file"
  else
    echo "⚠ Skipping $file (not found)"
  fi
done

echo "Backup complete → $BACKUP_DIR"
```

---

## SQL

```sql
-- Vue matérialisée avec CTE et fenêtre glissante
WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', created_at) AS month,
    SUM(amount)                      AS revenue
  FROM orders
  WHERE status = 'paid'
  GROUP BY 1
)
SELECT
  month,
  revenue,
  SUM(revenue) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative,
  revenue - LAG(revenue, 1) OVER (ORDER BY month)                                     AS delta
FROM monthly_revenue
ORDER BY month;
```

---

## JSON

```json
{
  "name": "doudoc",
  "version": "2.2.0",
  "engines": { "vscode": "^1.90.0" },
  "contributes": {
    "commands": [
      { "command": "doudoc.openPanel", "title": "Open Documentation", "icon": "$(book)" },
      { "command": "doudoc.refresh",   "title": "Refresh Documentation", "icon": "$(refresh)" }
    ],
    "views": {
      "doudoc": [{ "id": "doudoc.explorerView", "name": "Documentation", "type": "webview" }]
    }
  }
}
```

---

## YAML

```yaml
# Docker Compose — stack de développement
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://user:pass@db:5432/myapp
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 5s
      retries: 5
```

---

## PHP

```php
<?php
declare(strict_types=1);

final class Result
{
    private function __construct(
        private readonly bool $success,
        private readonly mixed $value,
        private readonly ?string $error = null,
    ) {}

    public static function ok(mixed $value): self
    {
        return new self(true, $value);
    }

    public static function fail(string $error): self
    {
        return new self(false, null, $error);
    }

    public function map(callable $fn): self
    {
        return $this->success ? self::ok($fn($this->value)) : $this;
    }

    public function unwrap(): mixed
    {
        if (!$this->success) {
            throw new \RuntimeException($this->error ?? 'Result is failure');
        }
        return $this->value;
    }
}

$result = Result::ok(42)
    ->map(fn($n) => $n * 2)
    ->map(fn($n) => "Value: $n");

echo $result->unwrap(); // Value: 84
```

---

## HTML

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page exemple</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="site-header">
      <nav aria-label="Navigation principale">
        <a href="/" class="nav-brand">Doudoc</a>
        <ul role="list">
          <li><a href="/docs">Documentation</a></li>
          <li><a href="/about">À propos</a></li>
        </ul>
      </nav>
    </header>
    <main id="content">
      <h1>Titre principal</h1>
      <p>Contenu de la page.</p>
    </main>
  </body>
</html>
```

---

## CSS / SCSS

```css
/* Système de design — variables + composants */
:root {
  --color-primary: hsl(210 80% 52%);
  --color-surface: hsl(220 14% 96%);
  --radius-md: 0.5rem;
  --shadow-sm: 0 1px 3px rgb(0 0 0 / 0.12);
}

.card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
  transition: box-shadow 150ms ease;

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.16);
  }

  & .card__title {
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: var(--color-primary);
  }
}
```

---

## Rust

```rust
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct Cache<V> {
    store: HashMap<String, V>,
    max_size: usize,
}

impl<V: Clone> Cache<V> {
    fn new(max_size: usize) -> Self {
        Self { store: HashMap::new(), max_size }
    }

    fn set(&mut self, key: impl Into<String>, value: V) -> bool {
        if self.store.len() >= self.max_size {
            return false;
        }
        self.store.insert(key.into(), value);
        true
    }

    fn get(&self, key: &str) -> Option<&V> {
        self.store.get(key)
    }
}

fn main() {
    let mut c: Cache<u32> = Cache::new(3);
    c.set("a", 1);
    c.set("b", 2);
    println!("{:?}", c.get("a")); // Some(1)
}
```

---

## Go

```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

func fetchAll(ctx context.Context, urls []string) []string {
	results := make([]string, len(urls))
	var wg sync.WaitGroup

	for i, url := range urls {
		wg.Add(1)
		go func(idx int, u string) {
			defer wg.Done()
			select {
			case <-ctx.Done():
				results[idx] = "cancelled"
			case <-time.After(100 * time.Millisecond):
				results[idx] = fmt.Sprintf("fetched: %s", u)
			}
		}(i, url)
	}

	wg.Wait()
	return results
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()
	fmt.Println(fetchAll(ctx, []string{"https://a.com", "https://b.com"}))
}
```

---

## Dockerfile

```dockerfile
# Multi-stage — Node.js production image
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
```

---

## Diff

```diff
--- a/src/core/markdown.ts
+++ b/src/core/markdown.ts
@@ -28,7 +28,7 @@ function createMarkdownIt(): MarkdownIt {
-  return new MarkdownIt({
+  const md = new MarkdownIt({
     html: false,
     linkify: true,
     typographer: true,
   });
+  return md;
 }
```

---

## Texte brut (sans langage)

```
Ceci est un bloc de code sans langage déclaré.
Les espaces et l'indentation sont préservés :
    première colonne
        deuxième niveau
            troisième niveau
```

---

## Navigation

- [← Typographie](./markdown-bases.md)
- [Tableaux →](./tableaux.md)
