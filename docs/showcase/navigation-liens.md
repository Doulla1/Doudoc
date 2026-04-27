# Navigation & Liens

Cette page teste les différents types de liens pris en charge par Doudoc et leur résolution correcte dans le panneau de lecture.

---

## Liens internes (même dossier)

Ces liens naviguent dans le panneau sans ouvrir un onglet externe :

- [Typographie & Formatage](./markdown-bases.md)
- [Blocs de code](./blocs-de-code.md)
- [Tableaux](./tableaux.md)
- [Diagrammes Mermaid](./diagrammes.md)
- [Listes & tâches](./listes-et-taches.md)

---

## Liens internes (dossiers différents)

Navigation transversale dans l'arborescence `/docs` :

- [Guide de démarrage](../guides/getting-started.md)
- [Référence API & commandes](../reference/api-reference.md)
- [Exemples de liens cassés](../reference/broken-examples.md) — page de test d'erreurs
- [FAQ](../reference/faqQuestions.md)
- [Mode édition (workflow)](../guides/workflows/editorMode.md)
- [Accueil](../index.md)

---

## Liens avec ancre

Les ancres sont dérivées automatiquement des titres (slugify) :

- [Section "Tableau large" dans Tableaux](./tableaux.md#tableau-large-scroll-horizontal)
- [Section "Alignement des colonnes" dans Tableaux](./tableaux.md#alignement-des-colonnes)
- [Section "Diagramme de séquence" dans Diagrammes](./diagrammes.md#diagramme-de-séquence--ouverture-dune-page)

Ancre locale (sur cette page) :

- [Aller à la section "Cas limites"](#cas-limites)

---

## Liens externes

Les liens externes s'ouvrent dans le navigateur par défaut :

- [GitHub — dépôt Doudoc](https://github.com/Doulla1/Doudoc)
- [Documentation VS Code Extension API](https://code.visualstudio.com/api)
- [markdown-it — parser utilisé](https://markdown-it.github.io/)
- [highlight.js — coloration syntaxique](https://highlightjs.org/)
- [Mermaid — diagrammes](https://mermaid.js.org/)

---

## Liens vers des ressources locales

Les images et ressources dans `/docs/assets/` sont accessibles :

- [Voir l'image diagram.png](../assets/diagram.png)

---

## Cas limites

### Lien sans texte

<https://github.com/Doulla1/Doudoc>

### Lien avec formatage dans le texte

- [**Lien en gras** vers la FAQ](../reference/faqQuestions.md)
- [*Lien en italique* vers l'accueil](../index.md)
- [Lien avec `code inline` vers l'API](../reference/api-reference.md)

### Lien ancre seule (scroll dans la page)

[Retour en haut](#navigation--liens)

### Lien vers une page inexistante (test d'erreur)

[Cette page n'existe pas](./page-inexistante.md) — devrait afficher une erreur ou un message adapté.

---

## Récapitulatif du comportement attendu

| Type de lien                | Comportement attendu                              |
| :-------------------------- | :------------------------------------------------ |
| `./autre-page.md`           | Navigation dans le panneau Doudoc                 |
| `../dossier/page.md`        | Navigation dans le panneau Doudoc                 |
| `./page.md#ancre`           | Navigation + scroll vers l'ancre                  |
| `#ancre-locale`             | Scroll dans la page courante                      |
| `https://...`               | Ouverture dans le navigateur externe              |
| `../assets/image.png`       | Résolution et affichage de l'image locale         |
| Page inexistante            | Affichage du warning dans la webview              |

---

## Navigation

- [← Listes & tâches](./listes-et-taches.md)
- [← Accueil](../index.md)
