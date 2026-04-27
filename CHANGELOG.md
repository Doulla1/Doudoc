# Changelog

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
