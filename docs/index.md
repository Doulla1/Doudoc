# Doudoc Documentation

Bienvenue dans l'espace de documentation de test de `Doudoc`.

## Objectif

Cette arborescence permet de valider :

- la navigation dans les dossiers ;
- les labels de pages ;
- le rendu Markdown ;
- les liens relatifs entre documents ;
- les images locales ;
- le sommaire et les ancres ;
- la recherche globale et la recherche dans la page.

## Showcase des fonctionnalités

Parcours les pages de démonstration pour valider chaque capacité de rendu :

| Page | Ce qu'elle teste |
| :--- | :--------------- |
| [Typographie & Formatage](./showcase/markdown-bases.md) | H1–H6, gras, italique, barré, code inline, blockquotes, liens, images |
| [Blocs de code](./showcase/blocs-de-code.md) | Coloration syntaxique (26 langages), bouton Copy, fallback sans langage |
| [Tableaux](./showcase/tableaux.md) | Alignement colonnes, scroll horizontal, formatage inline dans les cellules |
| [Diagrammes Mermaid](./showcase/diagrammes.md) | Flowchart, séquence, classes, états, Gantt, secteurs, entités-relations |
| [Listes & tâches](./showcase/listes-et-taches.md) | Listes imbriquées, numérotation libre, task lists GFM (☑) |
| [Navigation & liens](./showcase/navigation-liens.md) | Liens internes, externes, avec ancres, liens cassés |

## Guides & référence

- [Getting Started](./guides/getting-started.md)
- [API Reference](./reference/api-reference.md)
- [Editor Workflow](./guides/workflows/editorMode.md)
- [Broken Examples](./reference/broken-examples.md)

## Image de test

![Architecture simplifiée](./assets/diagram.png)

## Navigation par ancres

Voir la section [Fonctionnalités testées](#fonctionnalites-testees).

## Fonctionnalités testées

### Recherche

Le moteur doit retrouver des pages par titre, titres internes et contenu.

### Sommaire

Le panneau de droite doit suivre les sections visibles.

### Thème

La `WebviewView` suit automatiquement le thème actif de VS Code. La `WebviewPanel` conserve sa bascule clair / sombre.
