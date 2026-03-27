# Doudoc

Doudoc est une extension VS Code qui lit la documentation présente dans `/<projectRoot>/docs` et l'affiche dans une interface moderne avec :

- une `WebviewView` compacte dans l'activité bar ;
- une `WebviewPanel` principale de lecture ;
- une recherche globale sur titre + contenu ;
- une recherche dans la page avec surbrillance ;
- un sommaire cliquable ;
- la prise en charge des liens relatifs Markdown et des images locales.

## Installation locale

1. Générer le package :

```bash
npm install
npm run build
npx @vscode/vsce package -o doudoc-0.0.1.vsix
```

2. Dans VS Code :

- ouvrir `Extensions`
- ouvrir le menu `...`
- choisir `Install from VSIX...`
- sélectionner `doudoc-0.0.1.vsix`

## Test rapide

Le projet contient un dossier `docs/` de démonstration avec :

- une arborescence multi-niveaux ;
- des liens relatifs entre pages ;
- une image locale ;
- des cas de fallback de label ;
- des cas de warnings sur assets ou liens non résolus.

Une fois l'extension installée :

- ouvrir l'activité bar `Doudoc` ;
- vérifier l'icône dédiée de l'Activity Bar ;
- ouvrir des pages depuis la `WebviewView` ;
- tester la recherche globale et la recherche dans la page ;
- vérifier l'affichage des warnings non bloquants.

## Limites actuelles

- l'édition WYSIWYG inline n'est pas encore implémentée ;
- les warnings sont informatifs mais pas encore interactifs ;
- le support des erreurs complexes de contenu Markdown reste volontairement minimal.

## Développement

```bash
npm install
npm run build
npm test
```
