# Diagrammes Mermaid

Doudoc intègre **Mermaid v11** via un chargement asynchrone (sans bloquer l'affichage). Le thème du diagramme suit automatiquement le thème clair / sombre de l'interface.

---

## Flowchart — Processus de rendu

```mermaid
flowchart TD
    A([Fichier .md modifié]) --> B{Watcher FS détecte}
    B -->|Oui| C[DocsRepository.refresh]
    C --> D[Scan récursif /docs]
    D --> E[analyzeMarkdown → titre, headings, plainText]
    E --> F[Index de recherche mis à jour]
    F --> G{Panneau ouvert ?}
    G -->|Oui| H[publishPanelState]
    G -->|Non| I([En attente])
    H --> J[renderMarkdown → HTML + highlight.js]
    J --> K[postMessage panel-page]
    K --> L([WebviewPanel affiche la page])
```

---

## Diagramme de séquence — Ouverture d'une page

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant E as ExplorerView
    participant H as Extension Host
    participant R as DocsRepository
    participant P as DocsPanel

    U->>E: Clic sur un fichier
    E->>H: postMessage open-page {relativePath}
    H->>R: getPage(relativePath, webview)
    R->>R: renderMarkdown + highlight
    R-->>H: RenderedDocPage {html, headings}
    H->>P: createOrReveal()
    H->>P: postMessage panel-state
    H->>P: postMessage panel-page
    P-->>U: Affiche le contenu rendu
```

---

## Diagramme de classes — Architecture principale

```mermaid
classDiagram
    class DocsRepository {
        -snapshot: DocsSnapshot
        -projectRoot: string
        +refresh() DocsSnapshot
        +getPage(relativePath, webview) RenderedDocPage
        +search(query) DocSearchResult[]
        +filterTree(query) DocTreeNode[]
        +savePage(relativePath, markdown) void
        +getPageTimestamp(relativePath) number
    }

    class ExplorerViewProvider {
        -view: WebviewView
        +resolveWebviewView(webviewView)
        +postMessage(message)
        +reveal()
    }

    class DocsPanel {
        -current$ DocsPanel
        -panel: WebviewPanel
        +createOrReveal(context, onMessage, getTheme)
        +postMessage(message)
        +getWebview() Webview
        +setTitle(title)
    }

    DocsRepository --> ExplorerViewProvider : fournit état
    DocsRepository --> DocsPanel : fournit état + page
    ExplorerViewProvider --> DocsPanel : déclenche ouverture
```

---

## Graphe d'état — Mode édition

```mermaid
stateDiagram-v2
    [*] --> Lecture : page chargée

    Lecture --> Édition : clic Edit
    Édition --> Lecture : clic Cancel
    Édition --> Sauvegarde : clic Save / Ctrl+S

    Sauvegarde --> Lecture : succès
    Sauvegarde --> Édition : erreur (message affiché)

    Édition --> ConflitDétecté : fichier modifié externalement
    ConflitDétecté --> Édition : dismiss
    ConflitDétecté --> Sauvegarde : clic Save (écrase)
```

---

## Diagramme Gantt — Feuille de route

```mermaid
gantt
    title Feuille de route Doudoc
    dateFormat  YYYY-MM-DD
    section V1
    Navigation & lecture         :done, 2024-01-01, 2024-02-15
    Recherche globale            :done, 2024-02-01, 2024-03-01
    Recherche dans la page       :done, 2024-02-15, 2024-03-15
    section V2
    Mode édition inline          :done, 2024-04-01, 2024-06-01
    Collage d'images             :done, 2024-05-01, 2024-06-15
    section V2.1
    Diagrammes Mermaid           :done, 2026-04-01, 2026-04-20
    section V2.2
    Coloration syntaxique        :done, 2026-04-20, 2026-04-27
    Tableaux stylés              :done, 2026-04-20, 2026-04-27
    Task lists GFM               :done, 2026-04-20, 2026-04-27
    section Futur
    Footnotes                    :2026-05-01, 30d
    Frontmatter metadata         :2026-05-15, 30d
```

---

## Diagramme en secteurs — Répartition des langages

```mermaid
pie title Langages de codebase
    "TypeScript" : 78
    "JavaScript (scripts)" : 8
    "Markdown (docs)" : 10
    "JSON / Config" : 4
```

---

## Diagramme entités-relations

```mermaid
erDiagram
    WORKSPACE ||--o{ DOCS_FOLDER : contains
    DOCS_FOLDER ||--o{ PAGE : contains
    DOCS_FOLDER ||--o{ SUBFOLDER : contains
    SUBFOLDER ||--o{ PAGE : contains
    PAGE {
        string relativePath PK
        string label
        string rawMarkdown
        string plainText
        timestamp mtime
    }
    PAGE ||--o{ HEADING : has
    HEADING {
        string id
        int    depth
        string text
    }
    PAGE ||--o{ WARNING : generates
    WARNING {
        string message
    }
```

---

## Navigation

- [← Tableaux](./tableaux.md)
- [Listes & tâches →](./listes-et-taches.md)
