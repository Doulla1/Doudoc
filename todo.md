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
- [ ] Vérifier les comportements sur plusieurs structures `/docs`
- [ ] Vérifier le rendu de documents longs
- [ ] Vérifier les recherches globales et dans la page
- [ ] Vérifier la sécurité de la webview et la CSP

## Phase 11 - Finition

- [x] Rédiger un `README.md` de prise en main
- [x] Ajouter un jeu de documents d'exemple si utile
- [x] Vérifier le packaging de l'extension
- [x] Tester l'installation locale dans VS Code
- [ ] Préparer la suite des itérations après validation utilisateur

## Phase 12 - Édition WYSIWYG (seconde phase)

- [ ] Évaluer un éditeur WYSIWYG robuste compatible Markdown
- [ ] Définir un mode lecture / édition inline dans la `WebviewPanel`
- [ ] Vérifier le round-trip vers un Markdown propre
- [ ] Persister les modifications dans le fichier source `.md`
- [ ] Gérer correctement les images et liens relatifs en édition
- [ ] Ajouter la stratégie d'enregistrement, d'annulation et de retour arrière
- [ ] Tester les cas de conflits potentiels avec des modifications externes

## Questions à trancher

- [ ] Aucune question bloquante pour lancer l'implémentation
