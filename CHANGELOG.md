# Changelog

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
