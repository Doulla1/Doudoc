# Editor Workflow

## Mode édition WYSIWYG

Le panneau Doudoc bascule entre **Lecture** et **Édition** via le bouton crayon dans le header (ou `Ctrl/Cmd+S` pour sauver).

### Toolbar

`B` `I` `S` · `H1` `H2` `H3` · `>` `</>` `{ }` · `• list` `1. list` `☐ task` `—` · `Link` `Img` `Table`

### Insertion de blocs

Tous les boutons d'insertion (table, bloc de code, liste de tâches, etc.) sortent automatiquement du paragraphe courant et insèrent le bloc au niveau racine de l'article — le paragraphe est remplacé s'il est vide, sinon le bloc est inséré juste après.

#### Tableau

Bouton **Table** → modale (colonnes / lignes) → tableau pré-rempli (`Header N` en en-tête, cellules vides). Le curseur est placé dans la première en-tête.

| Action               | Raccourci          |
| -------------------- | ------------------ |
| Cellule suivante     | `Tab`              |
| Cellule précédente   | `Shift+Tab`        |
| Nouvelle ligne       | `Tab` sur la dernière cellule |

#### Bloc de code

Bouton **{ }** → modale "Insert code block" :

- **Language** : champ avec auto-complétion (`javascript`, `typescript`, `python`, `bash`, `json`, `yaml`, `mermaid`, `sql`, `html`, `css`, …).
- **Code** : zone multiline pour coller / saisir le code.

`Cmd/Ctrl+Enter` valide depuis le textarea, `Enter` valide depuis le champ langage. Le bloc est rendu avec étiquette de langage et coloration syntaxique en mode lecture.

#### Liste de tâches

Bouton **☐ task** → premier item vide. Dans un item :

- `Enter` ajoute un nouvel item avec sa case à cocher.
- `Enter` sur un item vide sort de la liste vers un paragraphe.
- Cliquer sur la case bascule `[ ]` ↔ `[x]` (sérialisé en GFM).

### Raccourcis clavier

| Action          | Raccourci              |
| --------------- | ---------------------- |
| Gras            | `Ctrl/Cmd+B`           |
| Italique        | `Ctrl/Cmd+I`           |
| Lien            | `Ctrl/Cmd+K`           |
| Bloc de code    | `Ctrl/Cmd+Shift+C`     |
| Sauvegarder     | `Ctrl/Cmd+S`           |

## Contraintes

- conserver un Markdown propre ;
- préserver les liens relatifs (`data-doc-path`) ;
- préserver les images relatives (`data-original-src`) ;
- éviter les surprises à l'enregistrement (auto-save optionnel via `doudoc.autoSave`).
