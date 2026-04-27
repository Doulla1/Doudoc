# Changelog

## 3.2.0

### Refonte du mode édition (tableaux, code, listes)

- **Tableaux** : l'insertion crée désormais un vrai bloc `<div class="doc-table-wrap"><table>` au niveau racine de l'article (sortie automatique du paragraphe courant), avec cellules vides et éditables. Le bug de sérialisation qui produisait `Header 1Header 2…CellCell` sur une seule ligne est corrigé : `processBlocks` détecte les blocs imbriqués dans un `<p>` et les promeut, et l'insertion garantit que le tableau n'est plus enfant d'un paragraphe.
- **Navigation tableau** : `Tab` / `Shift+Tab` déplace le curseur vers la cellule suivante / précédente. `Tab` sur la dernière cellule ajoute automatiquement une nouvelle ligne. Cellule active mise en évidence (outline accent).
- **Bloc de code** : la modale "Insert code block" propose un sélecteur de langage (`datalist` avec ~35 langages courants : `javascript`, `typescript`, `python`, `bash`, `json`, `mermaid`, `sql`, …) et un champ multiline pour coller / saisir le code. Le bloc est inséré comme `<div class="code-block" data-lang="…"><pre><code class="language-…">…</code></pre></div>`, avec étiquette de langage non-éditable. `Enter` à l'intérieur d'un bloc de code insère un saut de ligne, plus un nouveau paragraphe.
- **Listes de tâches** : structure améliorée (`<input type="checkbox" contenteditable="false"> <span class="task-list-text">…</span>`). `Enter` dans un item duplique correctement la case à cocher pour le nouvel item ; `Enter` sur un item vide sort de la liste vers un paragraphe.
- **Modale d'insertion** : le helper `showInsertDialog` accepte maintenant des champs `multiline` (textarea) et `list` (datalist) ; `Cmd/Ctrl+Enter` valide les textareas, `Enter` valide les inputs simples.
- **Raccourcis clavier** dans le contenu éditable : `Ctrl/Cmd+B` (gras), `Ctrl/Cmd+I` (italique), `Ctrl/Cmd+K` (lien), `Ctrl/Cmd+Shift+C` (bloc de code), `Ctrl/Cmd+S` (save).

## 3.1.1

### Retrait de l'export PDF

- La fonctionnalité d'export PDF / impression est retirée. En remote (SSH, WSL, Dev Container), `vscode.env.openExternal` sur un fichier local du remote produit une URL `vscode-remote://...` que la machine locale ne sait pas ouvrir, et `window.print()` à l'intérieur du webview VS Code ne déclenche aucun dialogue d'impression. Les deux pistes ne donnent pas une expérience fiable cross-environnement.
- Bouton imprimante du header retiré, commande `doudoc.exportPagePdf` retirée, code mort associé nettoyé.
- Pour générer un PDF d'une page Doudoc, ouvrir le `.md` dans VS Code et utiliser une extension Markdown→PDF tierce, ou copier le rendu vers un éditeur externe.

## 3.1.0

### Correctifs

- **Auto-save sans faux conflit** : la sauvegarde automatique ne déclenche plus systématiquement le bandeau « Conflict: This file was modified externally ». Le watcher reconnaît désormais les écritures issues de l'extension elle-même (mtime suivi avec tolérance de 5 ms et TTL de 2 s) et ne signale un conflit que pour les modifications externes réelles.
- **Export PDF fiable** : la commande `Doudoc: Export current page (PDF)` (et le bouton imprimante) génère désormais un fichier HTML autonome (avec styles inline et auto-`window.print()`) ouvert dans le navigateur par défaut via `vscode.env.openExternal`. L'utilisateur dispose ainsi du dialogue d'impression natif et de « Save as PDF » sans dépendre du `window.print()` du webview VS Code, qui ne déclenchait rien.
- **Toggle sidebar = sortie de zen** : ouvrir la sidebar via le bouton du header désactive automatiquement le mode zen, ce qui évite de cliquer sans effet visible.

### Éditeur enrichi (tableaux, tâches)

- Nouveau bouton **Table** dans la toolbar d'édition : prompt rapide (colonnes / lignes), insertion d'un tableau pré-rempli, curseur placé dans la première cellule d'en-tête.
- Nouveau bouton **Task** : insertion de listes de tâches `[ ] / [x]` rondes, sérialisées en GFM lors de la sauvegarde.
- Sérialisation Markdown des `task-list-item` (cases cochées préservées).
- La sortie Markdown des tableaux respecte l'alignement (`text-align`) défini sur les en-têtes.

## 3.0.1

### Correctifs barre supérieure

- titre `Documentation` et sous-titre de page n'héritaient plus du fond teinté supprimé en v3.0.0 — ils sont désormais lisibles sur le fond neutre (couleur `--text` / `--text-muted`)
- hauteur de l'en-tête passée de 52px à 56px pour éviter la troncature verticale du titre stacké
- champ de recherche dans la page (`Find in current page`) repoussé à droite via `margin-left: auto`, plus large (jusqu'à 360px) et ne se retrouve plus coincé entre la marque et les actions
- boutons d'action et d'historique uniformisés (30×30px, même radius, gap réduit pour un cluster compact)
- `brand-mark` (carré du logo) repris avec les tokens `accent-soft` au lieu de blancs hérités
- sous-titre de page tronqué par ellipse au lieu de pousser la mise en page

## 3.0.0

### Refonte du design (Phase 16.D)

Redesign complet du système de design pour une apparence moderne, épurée et plus professionnelle.

- **Palette retravaillée** : gris-bleu plus profonds en sombre (`#0b0f17` background), neutres plus doux en clair (`#fbfbfd`), accents `#6ea8fe` (sombre) / `#2563eb` (clair)
- **Typographie** : Inter prioritaire, JetBrains Mono / Fira Code pour le code, font-feature-settings activés (chiffres tabulaires, ligatures de programmation), antialiasing optimisé
- **Headings** : poids 700/650, letter-spacing serré, séparateur fin sous H2
- **En-tête (toolbar) refait** : disparition du fond teal/bleu vif au profit d'une barre neutre alignée sur le thème, blur de fond, focus ring accent sur l'input de recherche
- **Liens** : underline animée au hover
- **Citations (`blockquote`)** : barre d'accent + fond teinté `accent-soft`
- **Code inline** : nouveau token `--code-inline-bg` distinct du bloc, avec famille mono dédiée
- **Sidebar tree** : item actif teinté `accent-soft` au lieu d'un highlight transparent ; transitions fluides hover/actif
- **Tokens d'ombre** (`--shadow-sm/md/lg`) et de rayon (`--radius-sm/md/lg`) centralisés
- **Tokens d'état** (`--success`, `--warning`, `--danger`) ajoutés pour les futures fonctionnalités
- **Boutons d'en-tête** unifiés : nouvelles actions (créer, zen, imprimer) avec hover state cohérent

## 2.5.0

### Front matter YAML

- parser interne (sans dépendance externe) pour les blocs `---` en tête de fichier — supporte `title`, `description`, `date`, `tags` (inline `[a, b]`, block `- item`, ou liste `a, b, c`)
- le `title` du front matter prend la priorité sur le premier `# H1` pour la navigation
- nouvel en-tête `<header class="doc-header">` rendu au-dessus du contenu : date, description, badges de tags
- l'extrait de contenu est tokenisé sans le bloc YAML (fidélité au markdown source préservée pour la sauvegarde)

### Recherche

- **fuzzy search** activable via `doudoc.fuzzySearch` (par défaut `true`) — tolérance de 1–2 fautes de frappe (Levenshtein avec early-termination) appliquée uniquement quand aucun match exact/préfixe/contient n'est trouvé
- nouveau scoring pour les `tags` (haute priorité) et la `description` du front matter

### Édition

- **auto-save** activable via `doudoc.autoSave` + `doudoc.autoSaveDelay` (500 ms à 60 s, défaut 2000 ms) — sauvegarde silencieusement sans sortir du mode édition, avec indicateur "Auto-saving…" / "Auto-saved"

### Création de page

- nouvelle commande **`Doudoc: Create new page`** (icône `+` dans l'en-tête du panel et le titre de la sidebar) — prompts pour le titre + chemin relatif (slugifié), source documentaire si plusieurs configurées, scaffold avec front matter `title`/`date`/`tags`

### Lecture

- mode **zen** (`doudoc.zenMode`, bouton dans l'en-tête, commande `Doudoc: Toggle zen mode`) — masque la sidebar et la TOC pour une lecture plein cadre
- **largeur de lecture** configurable (`doudoc.readingWidth` : `narrow` / `comfortable` / `wide` / `full`) — applique une `max-width` sur le contenu
- **export PDF / impression** : nouveau bouton dans l'en-tête + commande `Doudoc: Export current page to PDF` (utilise la boîte d'impression native du webview, avec stylesheet `@media print` dédiée)
- **date de dernière modification** affichée sous le titre, prioritise `git log -1` si dispo (setting `doudoc.useGitMTime`, défaut `true`), fallback `mtime` filesystem

### Navigation rapide

- nouvelle commande **`Doudoc: Search documentation…`** (raccourci `Ctrl+Alt+P` / `Cmd+Alt+P`) — quick-pick global avec aperçu et nombre de mots

### Multi-root

- la repository scanne maintenant **tous les workspace folders** combinés avec les `doudoc.docsPaths` configurés ; les sources sont préfixées par `<root>/<path>` quand plusieurs racines sont présentes
- réindexation automatique sur `onDidChangeWorkspaceFolders`

### Préférences UI

- nouveau message `panel-state` enrichi de `preferences` (`readingWidth`, `zenMode`, `autoSave`, `autoSaveDelay`) — appliquées via `data-reading-width` / `data-zen` sur `<html>`
- thème par défaut configurable (`doudoc.defaultTheme` : `auto` / `light` / `dark`, défaut `auto` = synchronisé avec VS Code)

## 2.4.0

### Sources et fichiers ad-hoc

- nouveau setting `doudoc.docsPaths` (tableau de chemins relatifs au projet, défaut `["docs"]`) — permet de configurer un ou plusieurs dossiers documentaires
- support multi-sources : si plusieurs chemins sont configurés, chaque source apparaît comme un groupe de premier niveau dans l'arborescence
- nouvelle commande **`Doudoc: Open with Doudoc`** disponible en clic droit sur n'importe quel fichier `.md` (depuis l'explorer, l'éditeur ou l'onglet) — l'ouvre dans la `WebviewPanel` même hors des sources configurées
- watchers indépendants par source documentaire

### Tier 1 — améliorations de lecture

- **navigation back / forward** dans l'en-tête de la `WebviewPanel` (boutons + raccourcis `Alt+←` / `Alt+→`)
- **palette `Ctrl/Cmd+K`** : quick-open d'une page par son titre, navigation flèches + Enter, Esc pour fermer
- **barre de progression de lecture** au scroll, sous l'en-tête du panel
- **bouton "Open in VS Code editor"** dans l'en-tête : ouvre le `.md` source dans l'éditeur natif
- **détection des liens cassés** au scan : avertissements pour les liens relatifs `*.md` qui pointent vers un fichier inexistant
- **estimation du temps de lecture** affichée sous le titre du panel (ex. `4 min read · 812 words`)

### Architecture interne

- refactor `DocsRepository` pour supporter plusieurs sources avec préfixage stable des `relativePath` (`<sourceKey>/<inner>`)
- nouveaux champs `sourceKey`, `sourceRoot`, `wordCount` sur `DocPageRecord`
- nouveau message typé `panel-open-in-editor`
- nouvelle fonction `extractRelativeLinks` côté core pour la détection de liens cassés

## 2.3.1

- correction : le chemin d'une image collée depuis le presse-papier est désormais calculé relativement au dossier de la page courante (et non à la racine `docs/`), ce qui évite l'avertissement "Missing image asset" après sauvegarde lorsque la page se trouve dans un sous-dossier

## 2.3.0

- correction : la position de défilement est désormais préservée lors d'un changement de thème ou d'une sauvegarde de modifications (le contenu ne remonte plus automatiquement en haut de la page)
- documentation : confirmation que le collage d'image depuis le presse-papier fonctionne dans l'éditeur (Ctrl+V / Cmd+V en mode édition) — l'image est sauvegardée dans `docs/assets/` et insérée à la position du curseur

## 2.2.0

- coloration syntaxique des blocs de code via `highlight.js` (rendu côté extension host, sans CDN ni script supplémentaire dans la webview)
- bouton **Copy** sur chaque bloc de code (apparaissant au hover) avec retour visuel « Copied » / « Copy failed »
- étiquette de langage discrète en haut à gauche de chaque bloc de code (`js`, `python`, etc.)
- les bandeaux d'avertissement (warnings de scan et warnings de page) sont désormais repliés par défaut (`<details>` cliquable)
- round-trip HTML→Markdown du nouveau wrapper `.code-block` qui préserve le langage d'origine

## 2.1.3

- task lists GFM (`- [ ]` / `- [x]`) rendues comme des cases à cocher (interactives en mode édition, lecture seule en mode lecture)
- les tableaux Markdown sont désormais habillés (`<div class="doc-table-wrap">`) avec scroll horizontal, fond d'en-tête, séparateurs et hover de ligne
- l'alignement de colonne des tableaux (`:---`, `:---:`, `---:`) est préservé lors du round-trip HTML→Markdown en mode édition
- l'attribut `start` des listes ordonnées HTML est préservé lors du round-trip HTML→Markdown
- les cases à cocher sont préservées (`[ ]` / `[x]`) lors de la conversion HTML→Markdown
- styling clarifié pour le strikethrough (`~~text~~`)

## 2.1.2

- correction critique : un caractère backtick non échappé (`\u0060`) suivi d'un saut de ligne réel dans le script du panneau produisait un littéral de chaîne JS non terminé après bundling (SyntaxError), empêchant l'exécution complète du script de la `WebviewPanel` (arbre, contenu et TOC vides au démarrage)
- les séquences `\u0060` et `\n` du convertisseur HTML→Markdown pour les blocs Mermaid sont désormais correctement échappées (`\\u0060` / `\\n`) afin que la chaîne reste valide une fois injectée dans la webview

## 2.1.1

- correction : le script Mermaid CDN était synchrone/bloquant et empêchait tout affichage dans VS Code Server ; passage en `async` avec initialisation via événement `load`
- le rendu de la page n'attend plus le chargement du CDN (comportement dégradé élégant si le CDN est inaccessible)

## 2.1.0

- prise en charge des diagrammes Mermaid dans les blocs de code fencés (rendu SVG interactif dans la `WebviewPanel`)
- adaptation automatique du thème Mermaid (clair / sombre) selon le thème de l'interface
- conservation du code source Mermaid pour le round-trip en mode édition

## 2.0.0

- mode édition inline dans la `WebviewPanel` : basculement lecture / édition par page
- sauvegarde du contenu Markdown modifié directement dans le fichier source
- annulation de l'édition sans perte de données
- détection de conflit d'édition externe : alerte si le fichier est modifié sur disque pendant l'édition
- collage d'images depuis le presse-papier : enregistrement automatique dans `docs/assets/` et insertion du lien Markdown
- nouvelles méthodes `savePage` et `getPageTimestamp` dans `DocsRepository`
- nouveaux types de messages typés : `panel-enter-edit`, `panel-edit-ready`, `panel-save-page`, `panel-save-result`, `panel-cancel-edit`, `panel-paste-image`, `panel-edit-conflict`
- sécurité : validation que le chemin de sauvegarde ne sort pas du dossier `docs/`

## 1.0.0

- première version publique de Doudoc
- exploration du dossier `docs/` dans une `WebviewView`
- lecture complète dans une `WebviewPanel` dédiée
- recherche globale sur titres, headings et contenu
- recherche dans la page avec surbrillance
- prise en charge des liens Markdown relatifs et des images locales
