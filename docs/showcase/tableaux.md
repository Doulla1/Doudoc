# Tableaux Markdown

Les tableaux sont rendus avec scroll horizontal automatique, en-têtes mis en évidence et survol de ligne. L'alignement des colonnes est préservé lors de l'édition.

---

## Tableau simple

| Nom       | Rôle         | Statut  |
| --------- | ------------ | ------- |
| Alice     | Développeuse | Actif   |
| Bob       | Designer     | Actif   |
| Charlie   | DevOps       | En congé|

---

## Alignement des colonnes

L'alignement est défini par la ligne de séparation :
- `:---` → gauche (défaut)
- `:---:` → centré
- `---:` → droite

| Produit        | Prix HT  | TVA    | Prix TTC  |
| :------------- | -------: | :----: | --------: |
| Abonnement Pro | 49,00 €  | 20 %   | 58,80 €   |
| Extension Add-on | 12,00 € | 20 %   | 14,40 €   |
| Support Premium  | 99,00 € | 20 %   | 118,80 €  |
| **Total**        |          |        | **192,00 €** |

---

## Tableau avec mise en forme inline

| Commande                        | Description                               | Depuis       |
| ------------------------------- | ----------------------------------------- | :----------: |
| `doudoc.openPanel`              | Ouvre le panneau de lecture               | v1.0.0       |
| `doudoc.refresh`                | Recharge l'index de la documentation      | v1.0.0       |
| ~~`doudoc.preview`~~            | *Supprimé* — remplacé par `openPanel`     | —            |
| `doudoc.toggleTheme`            | Bascule clair / sombre *(interne)*        | v1.0.0       |

---

## Tableau large (scroll horizontal)

Ce tableau est intentionnellement large pour déclencher le scroll horizontal. Il ne doit jamais déborder dans la mise en page.

| ID    | Prénom     | Nom          | Email                    | Téléphone       | Ville         | Pays         | Rôle          | Créé le    | Statut   |
| :---: | ---------- | ------------ | ------------------------ | --------------- | ------------- | ------------ | ------------- | ---------- | :------: |
| 001   | Alice      | Dupont       | alice@exemple.fr         | +33 6 10 20 30  | Paris         | France       | Admin         | 2024-01-15 | ✓ Actif  |
| 002   | Bob        | Martin       | bob@exemple.fr           | +33 6 40 50 60  | Lyon          | France       | Éditeur       | 2024-02-03 | ✓ Actif  |
| 003   | Carol      | Smith        | carol@exemple.co.uk      | +44 7700 900000 | Londres       | Royaume-Uni  | Lecteur       | 2024-03-12 | ⏸ Pause  |
| 004   | David      | García       | david@exemple.es         | +34 600 000 000 | Madrid        | Espagne      | Éditeur       | 2024-04-01 | ✓ Actif  |
| 005   | Eva        | Müller       | eva@exemple.de           | +49 170 0000000 | Berlin        | Allemagne    | Admin         | 2024-05-20 | ✓ Actif  |

---

## Tableau de comparaison de fonctionnalités

| Fonctionnalité              | v1.0 | v2.0 | v2.1 | v2.2 |
| :-------------------------- | :--: | :--: | :--: | :--: |
| Navigation arborescence     | ✓    | ✓    | ✓    | ✓    |
| Panneau de lecture          | ✓    | ✓    | ✓    | ✓    |
| Recherche globale           | ✓    | ✓    | ✓    | ✓    |
| Recherche dans la page      | ✓    | ✓    | ✓    | ✓    |
| Thème clair / sombre        | ✓    | ✓    | ✓    | ✓    |
| Mode édition inline         | —    | ✓    | ✓    | ✓    |
| Collage d'images            | —    | ✓    | ✓    | ✓    |
| Diagrammes Mermaid          | —    | —    | ✓    | ✓    |
| Coloration syntaxique       | —    | —    | —    | ✓    |
| Bouton Copy sur les blocs   | —    | —    | —    | ✓    |
| Task lists GFM              | —    | —    | —    | ✓    |
| Scroll horizontal tableaux  | —    | —    | —    | ✓    |
| Warnings repliés            | —    | —    | —    | ✓    |

---

## Navigation

- [← Blocs de code](./blocs-de-code.md)
- [Diagrammes Mermaid →](./diagrammes.md)
