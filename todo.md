# Todo - Extension VS Code Doudoc

## Phase 1 - Cadrage

- [x] Inspecter le workspace existant
- [x] Rédiger le cahier des charges
- [x] Formaliser les hypothèses de démarrage
- [x] Clarifier l'usage `WebviewView` + `WebviewPanel`
- [x] Clarifier la portée du projet ouvert et l'absence de support multi-root au MVP
- [x] Valider le thème sombre par défaut avec bascule clair / sombre
- [x] Valider la recherche sur le contenu entier dès la V1
- [x] Valider la préférence pour une future édition WYSIWYG inline
- [x] Valider avec l'utilisateur les dernières questions ouvertes structurantes

## Phase 2 - Initialisation du projet

- [x] Initialiser la structure d'une extension VS Code en TypeScript
- [x] Créer `package.json`, `tsconfig.json`, configuration de build et scripts npm
- [x] Déclarer les commandes principales de l'extension
- [x] Déclarer la contribution UI de l'extension dans VS Code
- [x] Déclarer la `WebviewView` d'exploration
- [x] Déclarer la commande et l'ouverture de la `WebviewPanel`
- [x] Prévoir les assets de branding de l'extension

## Phase 3 - Modèle documentaire

- [x] Définir les types `DocTreeNode`, `DocPage`, `DocHeading` et `DocSearchResult`
- [x] Définir les types de messages entre extension host et webviews
- [x] Implémenter le scan récursif du dossier `/docs`
- [x] Filtrer les fichiers pour ne garder que les `.md`
- [x] Trier les dossiers et fichiers de manière stable
- [x] Gérer le cas où `/docs` n'existe pas
- [x] Préparer la résolution des liens relatifs et des images locales

## Phase 4 - Parsing et transformation

- [x] Implémenter l'extraction du premier titre principal d'un document
- [x] Implémenter le fallback du label basé sur le nom de fichier
- [x] Gérer PascalCase, camelCase, snake_case et kebab-case
- [x] Implémenter l'extraction des headings pour le sommaire
- [x] Générer des ancres stables et uniques
- [x] Transformer le Markdown en HTML rendu proprement
- [x] Résoudre les images locales dans le rendu webview
- [x] Intercepter et transformer les liens relatifs Markdown entre pages
- [x] Construire un index de recherche sur titre, headings et contenu
- [x] Définir une stratégie simple de scoring de pertinence

## Phase 5 - WebviewView

- [x] Créer l'UI compacte de la `WebviewView`
- [x] Ajouter la barre de recherche au-dessus de l'arborescence
- [x] Rendre l'arborescence repliable / dépliable
- [x] Filtrer les pages selon la recherche
- [x] Ouvrir ou focaliser la `WebviewPanel` au clic sur une page
- [x] Appliquer une direction visuelle cohérente avec le panneau principal

## Phase 6 - WebviewPanel

- [x] Créer la structure en trois zones : navigation, contenu, sommaire
- [x] Ajouter la barre de recherche documentaire au-dessus de la sidebar gauche
- [x] Ajouter la barre fixe de recherche dans la page au-dessus du contenu
- [x] Ajouter un switch de thème clair / sombre avec sombre par défaut
- [x] Concevoir une direction visuelle moderne, sobre et lisible
- [x] Ajouter le HTML de base de la webview
- [x] Ajouter le CSS de layout et de typographie
- [x] Ajouter le JavaScript de navigation côté client
- [x] Rendre la sidebar gauche repliable / dépliable
- [x] Rendre le sommaire droit cliquable
- [x] Mettre en évidence la section active pendant le scroll
- [x] Mettre en surbrillance les termes trouvés dans la page
- [x] Gérer la navigation entre occurrences dans la page si possible
- [x] Afficher les résultats de recherche documentaire par pertinence

## Phase 7 - Communication extension <-> webviews

- [x] Envoyer l'arborescence initiale aux webviews
- [x] Synchroniser `WebviewView` et `WebviewPanel`
- [x] Gérer la sélection d'une page
- [x] Recharger le contenu central quand la page change
- [x] Synchroniser l'état actif dans les sidebars
- [x] Prévoir un protocole de messages simple et typé
- [x] Gérer les actions de recherche globale et de recherche dans la page

## Phase 8 - Rafraîchissement et robustesse

- [x] Ajouter un `FileSystemWatcher` sur `/docs`
- [x] Rafraîchir l'arborescence sur ajout, suppression ou renommage
- [x] Ajouter une commande manuelle de refresh
- [x] Gérer les erreurs de lecture et de parsing
- [x] Gérer les erreurs de résolution des images et liens relatifs
- [x] Créer un empty state propre si aucun document n'est disponible

## Phase 9 - Identité visuelle

- [x] Concevoir un logo avec un `D` à l'intérieur d'un `D`
- [x] Produire un asset exploitable comme icône d'extension
- [x] Intégrer le logo dans l'extension et la documentation

## Phase 10 - Qualité

- [x] Ajouter des tests unitaires sur le parsing des labels
- [x] Ajouter des tests unitaires sur l'extraction des titres et headings
- [x] Ajouter des tests sur la résolution des liens relatifs
- [x] Ajouter des tests sur le scoring de recherche
- [x] Vérifier les comportements sur plusieurs structures `/docs`
- [ ] Vérifier le rendu de documents longs
- [x] Vérifier les recherches globales et dans la page
- [ ] Vérifier la sécurité de la webview et la CSP

## Phase 11 - Finition

- [x] Rédiger un `README.md` de prise en main
- [x] Ajouter un jeu de documents d'exemple si utile
- [x] Vérifier le packaging de l'extension
- [x] Tester l'installation locale dans VS Code
- [x] Préparer la suite des itérations après validation utilisateur

## Phase 12 - Édition WYSIWYG (seconde phase)

- [x] Évaluer un éditeur WYSIWYG robuste compatible Markdown
- [x] Définir un mode lecture / édition inline dans la `WebviewPanel`
- [x] Vérifier le round-trip vers un Markdown propre
- [x] Persister les modifications dans le fichier source `.md`
- [x] Gérer correctement les images et liens relatifs en édition
- [x] Ajouter la stratégie d'enregistrement, d'annulation et de retour arrière
- [x] Tester les cas de conflits potentiels avec des modifications externes

## Phase 13 - Sources configurables et fichiers ad-hoc

- [x] Setting `doudoc.docsPaths` : tableau de chemins relatifs au projet (défaut `["docs"]`)
- [x] `DocsRepository` multi-sources avec préfixage stable des `relativePath`
- [x] Tree top-level groupé par source si plusieurs sources
- [x] Watchers indépendants par source
- [x] Commande `doudoc.openMarkdownFile` pour ouvrir n'importe quel `.md` dans Doudoc
- [x] Entrée de menu contextuel "Open with Doudoc" dans l'explorer et l'éditeur

## Phase 14 - Tier 1 (impact fort, coût faible)

- [x] Navigation back/forward dans la `WebviewPanel` (historique client)
- [x] Palette `Cmd/Ctrl+K` pour ouvrir une page par son titre
- [x] Barre de progression de lecture au scroll
- [x] Bouton "Ouvrir dans l'éditeur VS Code" (commande `vscode.open`)
- [x] Détection des liens relatifs cassés au scan (warnings)
- [x] Estimation du temps de lecture sous le titre

## Phase 15 - Tier 2 (impact fort, coût moyen)

- [x] Front matter YAML (titre, tags, description, date)
- [x] Recherche fuzzy avec tolérance aux fautes
- [x] Auto-save en mode édition (debounce 2s, paramétrable)
- [x] Documentation, versionning, création du nouveau package et xacp
- [x] Création de nouvelle page depuis l'UI (bouton `+`)
- [x] Documentation, versionning, création du nouveau package et xacp

## Phase 16 - Tier 3 (nouvelles dimensions)

- [x] Mode focus (Zen Mode) — masquer les sidebars, contenu centré
- [x] Export PDF / impression avec feuille `@media print`
- [x] Date de dernière modification via `git log`
- [x] Documentation, versionning, création du nouveau package et xacp
- [x] Quick-pick VS Code pour rechercher dans les docs (`Cmd/Ctrl+P`)
- [x] Support multi-root workspace
- [x] Documentation, versionning, création du nouveau package et xacp
- [x] Settings : `doudoc.defaultTheme`, `doudoc.readingWidth`, `doudoc.autoSave`
- [x] Documentation, versionning, création du nouveau package et xacp
- [x] Amélioration design graphique de toute l'app par expert UI/UX et frontend avoir d'avoir quelque chose de moderne, beau et épuré, refonte entière s'il le faut s'il le faut
- [x] Documentation, versionning, création du nouveau package et xacp

## Questions à trancher

- [ ] Aucune question bloquante pour lancer l'implémentation
