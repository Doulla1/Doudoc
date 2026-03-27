# Cahier des charges - Extension VS Code Doudoc

## 1. Objectif

Créer une extension VS Code qui détecte automatiquement le dossier `/docs` à la racine du projet ouvert, reconstruit l'arborescence de ses sous-dossiers et fichiers Markdown, puis propose une expérience documentaire moderne, épurée et proche d'un usage Notion / Confluence.

L'extension doit proposer deux surfaces complémentaires :

- une `WebviewView` intégrée à VS Code pour explorer rapidement la documentation ;
- une `WebviewPanel` principale pour la lecture immersive, la recherche avancée et, dans une seconde phase, l'édition WYSIWYG.

## 2. Périmètre fonctionnel

### 2.1 Source des données

- Le dossier source est strictement `/<projectRoot>/docs`.
- Le projet visé est le dossier racine actuellement ouvert dans VS Code.
- Le support `multi-root` n'est pas prévu pour le MVP.
- Par `multi-root`, on entend un workspace VS Code contenant plusieurs dossiers racine ouverts en même temps.
- Les fichiers pris en charge sont les fichiers `.md`.
- Les dossiers et fichiers cachés peuvent être ignorés dans un premier temps.

### 2.2 Arborescence documentaire

L'arborescence doit afficher :

- les sous-dossiers de `/docs` ;
- les fichiers `.md` présents dans chaque dossier ;
- une hiérarchie repliable / dépliable ;
- un état visuel clair de la page actuellement ouverte.

Ordre d'affichage proposé :

- dossiers avant fichiers ;
- tri alphabétique insensible à la casse.

### 2.3 Libellé des pages

Le libellé affiché pour chaque document doit être calculé ainsi :

1. utiliser le premier titre Markdown de plus haut niveau trouvé dans le fichier ;
2. si aucun titre valide n'est trouvé, dériver le label à partir du nom de fichier ;
3. reformater les noms PascalCase, camelCase, snake_case et kebab-case en libellés lisibles.

Exemples :

- `GettingStarted.md` -> `Getting Started`
- `getting_started.md` -> `Getting Started`
- `gettingStarted.md` -> `Getting Started`
- `api-reference.md` -> `Api Reference`

### 2.4 WebviewView

La `WebviewView` doit servir d'explorateur documentaire compact intégré à VS Code.

Elle doit afficher :

- une barre de recherche au-dessus de l'arborescence ;
- l'arborescence de `/docs` ;
- les dossiers parents repliables / dépliables ;
- les pages filtrées selon la recherche ;
- un accès rapide à l'ouverture d'une page dans la `WebviewPanel`.
- une adaptation automatique au thème actif de VS Code, sans switch local.

### 2.5 WebviewPanel

La `WebviewPanel` est la surface principale de lecture.

Elle doit afficher :

- une sidebar gauche avec l'arborescence des dossiers et documents ;
- une barre de recherche globale au-dessus de cette sidebar ;
- une zone centrale de lecture du document sélectionné ;
- une barre fixe au-dessus du contenu pour rechercher un terme dans la page courante ;
- une sidebar droite sans bordure lourde contenant le sommaire de la page.

Comportements attendus :

- le clic sur un document depuis la `WebviewView` ou la `WebviewPanel` ouvre ou met à jour la `WebviewPanel` ;
- la `WebviewPanel` reste la surface de référence pour la lecture complète ;
- l'état actif doit être synchronisé entre la vue latérale et le panneau principal.

### 2.6 Zone de contenu centrale

La zone centrale doit afficher :

- le Markdown rendu en HTML ;
- une typographie lisible et soignée ;
- les titres, listes, tableaux, citations, blocs de code et liens ;
- une largeur de lecture confortable ;
- des ancres sur les titres pour permettre la navigation via le sommaire ;
- les images locales référencées dans `/docs` ;
- les liens relatifs Markdown entre documents.

Améliorations prévues :

- coloration syntaxique des blocs de code ;
- gestion correcte des liens internes et externes ;
- scroll fluide sur des documents longs.

### 2.7 Sommaire de droite

La sidebar de droite doit afficher :

- le plan du document courant ;
- les titres et sous-titres extraits du Markdown ;
- une navigation cliquable vers les ancres ;
- la mise en évidence de la section active au scroll.

Contraintes visuelles :

- pas de bordure lourde ;
- rendu discret, léger et cohérent avec le reste de la page.

### 2.8 Recherches attendues

Trois recherches distinctes doivent être prévues.

#### Recherche 1 - Exploration dans la WebviewView

- barre au-dessus de l'arborescence ;
- recherche dès la V1 dans le titre et le contenu entier ;
- permet d'accéder rapidement à une page.

#### Recherche 2 - Recherche globale dans la WebviewPanel

- barre au-dessus de la sidebar gauche de la `WebviewPanel` ;
- recherche d'abord par titre de page ;
- puis par contenu de page ;
- retourne les résultats par ordre de pertinence ;
- permet d'ouvrir directement la page choisie.

Ordre de pertinence minimal recommandé :

1. correspondance exacte sur le titre ;
2. correspondance préfixe sur le titre ;
3. correspondance partielle sur le titre ;
4. correspondance dans les titres internes du document ;
5. correspondance dans le corps du document.

#### Recherche 3 - Recherche dans la page courante

- barre fixe en haut de la zone centrale ;
- recherche un terme uniquement dans le document actuellement ouvert ;
- met les occurrences en surbrillance ;
- permet idéalement de naviguer entre occurrences.

### 2.9 Identité visuelle et logo

L'extension doit avoir un logo dédié, utilisé dans l'extension et sa documentation.

Contraintes demandées :

- logo composé d'un `D` à l'intérieur d'un autre `D` ;
- rendu simple, lisible et distinctif ;
- compatible avec un affichage d'icône VS Code ;
- export prévu au minimum en PNG ;
- idéalement une source rééditable.

### 2.10 Expérience utilisateur

L'interface doit évoquer un espace documentaire moderne :

- sobre ;
- aérée ;
- fluide ;
- focalisée sur la lecture.

Éléments UX attendus :

- thème sombre par défaut ;
- présence d'une icône cliquable pour basculer clair / sombre ;
- sidebar gauche fixe ou sticky ;
- contenu central scrollable ;
- sidebar droite fixe ou sticky ;
- barre haute de recherche dans la page fixe au scroll ;
- transitions discrètes ;
- excellente lisibilité sur écran standard.

### 2.11 Édition future WYSIWYG

Une seconde phase devra permettre l'édition des pages Markdown directement depuis l'interface.

Objectif :

- proposer un éditeur WYSIWYG puissant pour le Markdown ;
- permettre la modification du contenu sans quitter l'interface ;
- privilégier une édition inline directement dans la page affichée ;
- enregistrer les modifications dans le fichier `.md` réel ;
- garantir une sortie Markdown propre et exploitable dans le repository.

Contraintes à anticiper dès la phase 1 :

- architecture compatible avec un futur mode lecture / édition ;
- séparation claire entre modèle documentaire, rendu et persistance ;
- gestion correcte des images et liens relatifs lors de l'édition ;
- choix d'un éditeur capable de round-tripper correctement vers Markdown.

## 3. Cas d'usage principaux

### 3.1 Navigation documentaire

L'utilisateur ouvre la vue documentaire, parcourt l'arborescence, clique sur une page, puis consulte son contenu et son sommaire dans la `WebviewPanel`.

### 3.2 Lecture longue

L'utilisateur lit un document long et utilise le sommaire de droite pour naviguer entre sections sans revenir à l'arborescence.

### 3.3 Recherche globale

L'utilisateur saisit un mot-clé dans la barre de recherche de la `WebviewPanel`, obtient une liste de pages triées par pertinence, puis ouvre le résultat voulu.

### 3.4 Recherche dans la page

L'utilisateur recherche un terme dans le document courant depuis la barre fixe de la zone centrale, voit toutes les occurrences mises en surbrillance et navigue dans la page.

### 3.5 Mise à jour du contenu

Quand des fichiers Markdown sont ajoutés, supprimés, renommés ou modifiés dans `/docs`, l'interface doit refléter les changements.

Hypothèse initiale :

- rechargement automatique via `FileSystemWatcher` ;
- fallback manuel via une commande `Refresh`.

### 3.6 Édition future

Dans une itération ultérieure, l'utilisateur bascule en mode édition, modifie une page via un éditeur visuel, puis enregistre pour persister le Markdown dans le fichier source.

## 4. Architecture technique proposée

### 4.1 Type d'extension

Extension VS Code en TypeScript avec :

- activation côté extension host ;
- une `WebviewView` d'exploration ;
- une `WebviewPanel` principale de lecture ;
- un protocole de synchronisation entre les deux.

### 4.2 Modules principaux

Modules à prévoir :

- découverte du dossier `/docs` ;
- scan récursif de l'arborescence ;
- parsing des fichiers Markdown ;
- extraction du titre principal ;
- extraction du plan du document ;
- indexation de recherche titre / contenu ;
- transformation des données pour l'UI ;
- rendu des deux webviews ;
- synchronisation extension host <-> webviews ;
- rafraîchissement sur changement de fichiers.

### 4.3 Données manipulées

Structures de données prévues :

- `DocTreeNode`
- `DocPage`
- `DocHeading`
- `DocSearchResult`

Exemple conceptuel :

```ts
type DocTreeNode = {
  id: string;
  type: 'directory' | 'file';
  name: string;
  label: string;
  path: string;
  children?: DocTreeNode[];
};

type DocHeading = {
  id: string;
  depth: number;
  text: string;
};

type DocPage = {
  path: string;
  label: string;
  rawMarkdown: string;
  html: string;
  headings: DocHeading[];
};

type DocSearchResult = {
  path: string;
  label: string;
  score: number;
  matchType: 'title' | 'heading' | 'content';
  excerpt?: string;
};
```

## 5. Choix techniques recommandés

### 5.1 Langage et outillage

- TypeScript
- API officielle VS Code
- bundling via `esbuild` ou `tsup`

### 5.2 Rendu Markdown

Option recommandée :

- `markdown-it` pour le rendu Markdown ;
- plugin d'ancres / slug ;
- `highlight.js` ou `shiki` pour le code.

Raison :

- pipeline simple ;
- bon contrôle sur le HTML rendu ;
- intégration légère côté webview.

### 5.3 UI des webviews

Deux options réalistes :

1. UI HTML/CSS/JS simple sans framework
2. UI React légère si l'on veut une interface plus structurée

Recommandation initiale :

- commencer sans framework pour réduire la complexité ;
- ne passer à React que si l'interface devient plus interactive.

### 5.4 Recherche

Capacités recommandées :

- index mémoire initial en phase 1 ;
- pondération simple titre / headings / contenu ;
- mise à jour de l'index lors du refresh documentaire ;
- surlignage local dans la page courante côté client.

### 5.5 Édition future

Pour la phase 2, prévoir une évaluation d'éditeurs WYSIWYG compatibles Markdown, par exemple :

- Milkdown
- Toast UI Editor
- TipTap avec pipeline Markdown

Le choix devra privilégier :

- qualité du round-trip Markdown ;
- support des images et liens ;
- intégration propre en webview VS Code.

## 6. Comportements détaillés

### 6.1 Détection du dossier `/docs`

- Si `/docs` n'existe pas, afficher un état vide propre avec un message explicite.
- Proposer éventuellement un bouton ou une commande pour créer la structure.

### 6.2 Sélection d'un document

- Au clic sur un fichier, charger son contenu ;
- rendre le Markdown ;
- générer le sommaire ;
- scroller en haut de page ;
- mettre à jour l'état actif dans la navigation ;
- synchroniser `WebviewView` et `WebviewPanel`.

### 6.3 Génération des ancres

- Les titres doivent recevoir des identifiants stables ;
- le sommaire doit pointer vers ces identifiants ;
- la logique doit gérer les doublons de titres.

### 6.4 Formatage des labels fallback

Règles minimales :

- suppression de l'extension `.md` ;
- remplacement des `_` et `-` par des espaces ;
- séparation des mots dans `camelCase` et `PascalCase` ;
- normalisation des espaces ;
- capitalisation lisible.

### 6.5 Gestion du scroll

- La navigation dans le sommaire doit scroller vers l'ancre ;
- la section active doit être détectée pendant le scroll ;
- le comportement doit rester fluide sur des documents longs.

### 6.6 Gestion des images et liens relatifs

- Les images référencées depuis un Markdown doivent être résolues correctement depuis la webview ;
- les liens relatifs vers d'autres documents Markdown doivent ouvrir la page cible dans la `WebviewPanel` ;
- les liens externes doivent être distingués clairement des liens internes ;
- les chemins doivent être sécurisés et limités au périmètre documentaire autorisé.

### 6.7 Recherche globale

- Construire un index à partir des titres de page, headings et contenu textuel ;
- recalculer ou mettre à jour cet index lors des modifications de `/docs` ;
- exposer les meilleurs résultats dans la `WebviewView` et la `WebviewPanel` ;
- éviter les résultats dupliqués ;
- ouvrir directement la page lorsqu'un résultat est sélectionné.

### 6.8 Recherche dans la page

- Surbrillance visuelle de toutes les occurrences ;
- compteur d'occurrences si possible ;
- navigation précédente / suivante en amélioration utile ;
- nettoyage des highlights quand la requête est vide.

## 7. Contraintes non fonctionnelles

### 7.1 Performance

- Scan rapide de `/docs` ;
- pas de blocage perceptible sur petits et moyens ensembles de documentation ;
- éviter de reparser tous les fichiers inutilement si possible.

### 7.2 Robustesse

- Supporter les fichiers Markdown imparfaits ;
- ne pas faire échouer toute l'interface si un document est invalide ;
- journaliser proprement les erreurs utiles au debug.

### 7.3 Sécurité

- Limiter les capacités de la webview ;
- éviter l'injection HTML non contrôlée ;
- définir une CSP adaptée ;
- contrôler les URI de ressources locales.

### 7.4 Maintenabilité

- séparation claire entre logique VS Code, parsing documentaire et UI ;
- types partagés explicites ;
- code modulaire et testable.

### 7.5 Évolutivité

- La phase 1 doit préparer l'arrivée du mode édition sans réécriture complète ;
- les composants de rendu et de navigation doivent pouvoir être réutilisés ;
- l'ajout futur d'un mode lecture / édition doit rester localisé.

## 8. Livrables attendus

Livrables visés :

- structure de projet d'extension VS Code ;
- configuration TypeScript ;
- commande d'ouverture / rafraîchissement ;
- `WebviewView` d'exploration ;
- `WebviewPanel` de lecture ;
- scan du dossier `/docs` ;
- parsing des labels et headings ;
- moteur de recherche documentaire ;
- recherche dans la page avec surbrillance ;
- interface webview complète à trois colonnes ;
- styles modernes ;
- logo de l'extension ;
- documentation d'installation et d'usage ;
- base de tests unitaires sur les fonctions critiques.

## 9. Plan de réalisation proposé

1. Initialiser le projet d'extension VS Code.
2. Mettre en place le build TypeScript.
3. Implémenter le scan du dossier `/docs`.
4. Implémenter les utilitaires de parsing des labels.
5. Implémenter le parsing Markdown, l'extraction du sommaire et la résolution des liens / images.
6. Construire la `WebviewView` d'exploration.
7. Construire la `WebviewPanel` de lecture à trois colonnes.
8. Ajouter la recherche documentaire titre / contenu.
9. Ajouter la recherche dans la page avec surbrillance.
10. Ajouter le rafraîchissement automatique et manuel.
11. Créer le logo et l'intégrer à l'extension.
12. Ajouter les états d'erreur et d'empty state.
13. Tester avec un jeu d'exemples.
14. Préparer l'architecture pour la future phase d'édition WYSIWYG.

## 10. Questions ouvertes

Points à confirmer avant l'implémentation complète :

- aucune question bloquante pour lancer l'implémentation du MVP ;
- le dossier cible reste `/<projectRoot>/docs` ;
- le thème sombre est le défaut avec bascule clair / sombre ;
- la recherche porte sur le titre et le contenu dès la V1 ;
- la future édition WYSIWYG privilégie un mode inline.

## 11. Hypothèses retenues pour démarrer

Sauf instruction contraire, le MVP partira sur les hypothèses suivantes :

- dossier cible fixe : `/docs` à la racine du projet ouvert ;
- prise en charge des fichiers `.md` uniquement ;
- `WebviewView` d'exploration + `WebviewPanel` principale ;
- thème sombre par défaut avec bascule clair / sombre ;
- rendu Markdown soigné avec sommaire cliquable ;
- images locales et liens relatifs pris en charge ;
- recherche documentaire sur titre + contenu dès la V1 et recherche dans la page ;
- rafraîchissement automatique + commande manuelle ;
- architecture préparée pour une future édition WYSIWYG inline.
