# AGENTS.md

Ce fichier définit les règles de travail permanentes pour Codex dans ce dépôt.

## Objectif

Construire une extension VS Code robuste, maintenable et testable pour explorer, rechercher, lire puis éditer la documentation Markdown située dans `/<projectRoot>/docs`.

## Principes d'ingénierie obligatoires

- `SOLID` : responsabilités courtes, dépendances explicites, interfaces simples, extension par composition avant héritage.
- `DRY` : factoriser les règles, types, helpers et protocoles partagés ; ne pas dupliquer la logique entre `WebviewView`, `WebviewPanel` et extension host.
- `KISS` : préférer les solutions simples, lisibles et locales au lieu d'abstractions prématurées.
- `YAGNI` : ne pas introduire de capacités non demandées ou spéculatives dans le MVP.
- `Testability` : écrire du code injectable, découplé et testable sans dépendre d'un runtime VS Code réel quand ce n'est pas nécessaire.
- `Least astonishment` : comportements prévisibles, conventions cohérentes, API internes stables, noms explicites, navigation intuitive.

## Règles d'architecture

- Séparer strictement :
  - le scan du filesystem ;
  - le parsing Markdown ;
  - l'indexation de recherche ;
  - la génération du modèle de vue ;
  - la logique VS Code ;
  - la logique UI webview.
- Les modules métiers ne doivent pas dépendre directement de l'API VS Code si un contrat simple suffit.
- Le code partagé entre `WebviewView` et `WebviewPanel` doit être extrait dans des modules réutilisables.
- Le protocole de messages host <-> webview doit être typé, versionnable et centralisé.
- Les types source de vérité doivent vivre dans un emplacement partagé.

## Bonnes pratiques spécifiques aux extensions VS Code

- Limiter les `activationEvents` au strict nécessaire.
- Nettoyer systématiquement les `Disposable`.
- Éviter tout blocage inutile de l'extension host.
- Encadrer les accès disque par des services dédiés et gérables en test.
- Gérer explicitement les états sans workspace, sans `/docs`, sans document, et en erreur.
- Respecter la sécurité des webviews :
  - `Content-Security-Policy` stricte ;
  - `enableScripts` seulement si nécessaire ;
  - usage de `asWebviewUri` pour les ressources locales ;
  - aucune injection HTML non contrôlée ;
  - validation des chemins et des liens relatifs.
- Gérer correctement les URI, ancres, images locales et liens Markdown relatifs.
- Conserver un comportement cohérent entre la `WebviewView` et la `WebviewPanel`.

## Bonnes pratiques UI et UX

- Thème sombre par défaut avec bascule claire / sombre accessible et cohérente.
- Expérience de lecture fluide, dense en information mais visuellement aérée.
- Éviter les effets visuels gratuits qui nuisent à la lisibilité.
- Les recherches doivent être réactives, explicables et stables.
- Les états vides et erreurs doivent être utiles, sobres et actionnables.
- Toute action utilisateur importante doit produire un résultat attendu sans surprise.

## Recherche

- L'index doit couvrir dès la V1 :
  - le titre de page ;
  - les headings ;
  - le contenu textuel complet.
- Le scoring doit être simple, documenté et testable.
- Ne pas mélanger la logique de scoring avec la logique d'affichage.
- Les extraits de résultats doivent être déterministes et lisibles.

## Markdown et édition

- Le rendu Markdown doit rester fidèle au fichier source.
- Les ancres doivent être stables et uniques.
- Les liens relatifs entre documents doivent ouvrir la bonne page dans la `WebviewPanel`.
- Les images locales doivent être résolues proprement dans le périmètre autorisé.
- Préparer la future édition WYSIWYG inline sans imposer dès maintenant une architecture excessive.
- Le round-trip Markdown de la future édition doit rester propre, prévisible et diff-friendly.

## Tests et qualité

- Couvrir en priorité par des tests unitaires :
  - le formatage des labels ;
  - l'extraction des titres et headings ;
  - la résolution des liens relatifs ;
  - le scoring de recherche ;
  - les transformations de données critiques.
- Ajouter des tests d'intégration ciblés dès qu'un flux transverse devient complexe.
- Corriger la cause racine plutôt que contourner les symptômes.
- Ne pas considérer une feature terminée sans vérification locale pertinente.

## Style de code

- Préférer des fonctions courtes et des noms explicites.
- Éviter les booléens ambigus ; préférer des types discriminés ou enums si cela clarifie le domaine.
- Éviter les commentaires décoratifs ; commenter seulement les décisions non évidentes.
- Garder les fichiers à une taille raisonnable ; scinder lorsqu'une responsabilité devient multiple.
- Favoriser l'immutabilité quand elle simplifie le raisonnement.

## Dépendances

- Ajouter une dépendance seulement si elle apporte une vraie valeur nette.
- Préférer les bibliothèques maintenues, documentées et compatibles avec une extension VS Code.
- Avant d'ajouter une dépendance lourde, vérifier si une solution plus simple suffit.

## Gestion des changements

- Toute nouvelle abstraction doit être justifiée par un besoin concret.
- Toute duplication temporaire doit être explicitement courte et planifiée pour convergence.
- Toute décision technique structurante doit être reflétée dans `cahier-des-charges.md` et `todo.md` si elle impacte le plan.
