# Todo — v3.0.0 Phase 16.D : Refonte du design

**Début** : 2026-04-27 18:53
**Fin** : 2026-04-27 18:57

## Tâches

- [x] Refonte des tokens de couleur (palette neutres + accents repensés)
- [x] Typographie Inter / JetBrains Mono avec font-features
- [x] En-tête neutre, focus ring accent, blur backdrop
- [x] Liens, blockquote, code inline polish
- [x] Sidebar tree : item actif `accent-soft`
- [x] Tokens d'ombre / radius / état centralisés
- [x] Mettre à jour la documentation (CHANGELOG, README, docs/todo.md)
- [x] Bump version 3.0.0, commit + push

---

# Todo — v2.5.0 Phase 15 + Phase 16.A-C : Front matter, fuzzy, autosave, zen, PDF, multi-root, settings

**Début** : 2026-04-27 18:39
**Fin** : 2026-04-27 18:53

## Tâches

- [x] Front matter YAML (titre, tags, description, date) parsé et exposé au panel
- [x] Recherche fuzzy avec tolérance aux fautes (Levenshtein simple)
- [x] Auto-save en mode édition (debounce paramétrable via setting)
- [x] Création de page (commande + bouton `+`, scaffold avec front matter)
- [x] Mode zen (toggle + setting + CSS)
- [x] Export PDF (commande + bouton + stylesheet `@media print`)
- [x] Date de dernière modification (git log + fallback fs)
- [x] Quick-pick global de recherche (raccourci `Ctrl+Alt+P`)
- [x] Multi-root workspace (scan combiné, prefixage source)
- [x] Settings (theme, readingWidth, zen, useGitMTime, fuzzy)
- [x] Mettre à jour les tests
- [x] Mettre à jour la documentation (CHANGELOG, README, docs/todo.md)
- [x] Bump version 2.5.0, commit + push

---

# Todo — v2.4.0 Tier 1 + multi-source + open any .md

**Début** : 2026-04-27 18:02
**Fin** : 2026-04-27 18:13

## Tâches

- [x] Setting `doudoc.docsPaths` (array de chemins relatifs au projet, défaut `["docs"]`)
- [x] Refactor `DocsRepository` pour supporter plusieurs sources documentaires
- [x] Watchers multi-sources synchronisés
- [x] Commande `doudoc.openMarkdownFile` (ouvrir n'importe quel `.md` dans le panel)
- [x] Menu contextuel explorer/editor pour `.md`
- [x] T1.1 — Navigation back/forward dans la `WebviewPanel`
- [x] T1.2 — Palette `Cmd/Ctrl+K` quick-open
- [x] T1.3 — Barre de progression de lecture (scroll)
- [x] T1.4 — Bouton "Ouvrir dans l'éditeur VS Code"
- [x] T1.5 — Détection des liens cassés (warnings au scan)
- [x] T1.6 — Estimation du temps de lecture sous le titre
- [x] Mettre à jour les tests
- [x] Mettre à jour la documentation (CHANGELOG, README, todo)

---

# Todo — v2.3.0 paste image + scroll preservation

**Début** : 2026-04-27 17:34
**Fin** : 2026-04-27 17:35

## Tâches

- [x] Confirmer que le collage d'image presse-papier fonctionne déjà (depuis 2.0.0)
- [x] Préserver `scrollTop` de la page sur changement de thème / sauvegarde
- [x] Bump version 2.2.0 → 2.3.0
- [x] Mettre à jour CHANGELOG.md
- [x] Mettre à jour les tests (aucun test impacté — comportement webview)
- [x] Mettre à jour la documentation (CHANGELOG fait foi)
- [x] Construire le package .vsix
- [x] Commit + push
