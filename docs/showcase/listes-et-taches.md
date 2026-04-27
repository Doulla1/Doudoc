# Listes, imbrication & tâches GFM

---

## Listes à puces (non-ordonnées)

### Niveau 1

- Infrastructure cloud
- Intégration continue
- Monitoring

### Imbrication jusqu’au niveau 3

- Frontend
  - React
    - Composants
    - Hooks
    - Context API
  - Styling
    - CSS Modules
    - Tailwind CSS
- Backend
  - Node.js
    - Express
    - Fastify
  - Python
    - Django
    - FastAPI
- DevOps
  - Docker
    - Compose
    - Swarm
  - CI/CD
    - GitHub Actions
    - GitLab CI

---

## Listes ordonnées

### Démarrant à 1

1. Cloner le dépôt
2. Installer les dépendances (`npm install`)
3. Lancer en mode développement (`npm run dev`)
4. Ouvrir `http://localhost:3000`

### Démarrant à un autre index

La liste ci-dessous continue une numérotation interrompue :

Les étapes 1 à 3 ont déjà été exécutées. Reprenons à l’étape 4 :

4. Configurer les variables d’environnement
5. Exécuter les migrations de base de données
6. Seeder les données de démo
7. Lancer les tests (`npm test`)

### Ordonnée imbriquée

1. Phase de conception
   1. Recueil des besoins
   2. Maquettes wireframe
      1. Mobile
      2. Desktop
   3. Revue et validation
2. Phase de développement
   1. Mise en place du projet
   2. Développement des fonctionnalités
3. Phase de mise en production
   1. Revue de code
   2. Déploiement
   3. Monitoring post-déploiement

---

## Task lists (cases à cocher GFM)

### Checklist de déploiement

- [x]  Tests unitaires passent (`npm test`)
- [x]  Pas de `console.log` oubliés
- [x]  Variables d’environnement documentées
- [x]  CHANGELOG mis à jour
- [ ]  Revue de sécurité (OWASP Top 10)
- [ ]  Tests de performance (`Lighthouse > 90`)
- [ ]  Documentation utilisateur mise à jour
- [ ]  Annonce dans le channel #releases

### Fonctionnalités de l’extension

- [x]  Panneau de lecture Markdown
- [x]  Arborescence dans la barre latérale
- [x]  Recherche globale (titre + contenu)
- [x]  Recherche dans la page (Ctrl+F)
- [x]  Thème clair / sombre
- [x]  Mode édition inline
- [x]  Diagrammes Mermaid
- [x]  Coloration syntaxique highlight.js
- [x]  Bouton Copy sur les blocs de code
- [x]  Task lists GFM
- [x]  Tableaux avec scroll horizontal
- [x]  Warnings collapsibles
- [ ]  Footnotes Markdown
- [ ]  Frontmatter metadata
- [ ]  Export PDF

### Task lists avec contenu riche

- [x]  **Priorité haute** — corriger le bug `panel-state` déclenché deux fois
- [x]  Ajouter les tests pour `renderMarkdown` avec `code` contenant des backticks : ``` et `````
- [ ]  Implémenter le support des **notes de bas de page** (`[^1]`)
- [ ]  Créer un composant `<Callout type="info|warning|danger">`
- [ ]  Documenter [l’API de messages](reference/api-reference.md) host ↔ webview
- [ ] test

---

## Mélange ordonné / non-ordonné

1. Préparer l’environnement
   - Installer Node.js 20+
   - Installer VS Code Insiders
   - Cloner le dépôt
2. Configurer le projet
   - Copier `.env.example` → `.env`
   - Renseigner les variables :
     - `DATABASE_URL`
     - `SECRET_KEY`
     - `DEBUG=true`
3. Lancer les services
   - `docker compose up -d db redis`
   - `npm run dev`

---

## Navigation

- [← Diagrammes](showcase/diagrammes.md)
- [Navigation & liens →](showcase/navigation-liens.md)
