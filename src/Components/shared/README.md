# shared/

Code that **two or more components** use, and that is **not a component itself**.
Nothing here draws on its own or has a lifecycle: it is functions, or a class a
component creates and destroys.

## Is it a component, a part, or shared?

| It… | Then it is… | Where |
| --- | --- | --- |
| has markup of its own, and an app would use it by itself with props | a **component** | `Visual/<Name>/` (or `Service/` if it has no markup but keeps state) |
| is a piece of **one** component | a **part** | `Visual/<Name>/parts/` |
| is used by **two or more** components, and is neither of the above | **shared** | here |

Something moves here when a **second** component needs it, not before. And
when something here starts drawing its own interface, it becomes a component
(that is how the undo and error bar of DataList and Table became `Alert`).

## Folders

| Folder | What is in it | Used by |
| --- | --- | --- |
| `data/paths.js` | `getter`, `read`: a value by key, path (`'owner.name'`) or function. `readPath`, `writePath`: a path in a store's state, written without changing the original. | DataList, DescriptionList, Table |
| `data/dates.js` | `toDate`, `relativeTime` ("3 hours ago"), `fullDate`. | DataList, DescriptionList, inlineControl |
| `data/collection.js` | `insertItem`, `patchItem`, `removeItems`, `restoreItems`, `revertItem`: changes to an array that return a new one (for add / update / remove with rollback and undo). | DataList, Table |
| `text/texts.js` | `texts(namespace, defaults)` / `registerTexts`: a component's built-in texts as the translator's lowest-priority layer, with the English default when it is off. | NotFound (and the components that adopt it) |
| `editing/inlineControl.js` | Which control edits a value in place (Input, Textarea, Select, DatePicker), its props, and how to read its value back. The meaning of `edit: { … }`. | DescriptionList, Table |
| `validation/fieldRules.js` | The validation rules and messages of the text fields, and when an error may show. | Input, Textarea, DatePicker, FileUpload |
| `tooltip/tooltipCore.js` | The tooltip engine: the bubble, where it goes, when it shows. | ToolTip, ToolTipProvider |
| `color/hex.js` | Hex colour helpers (parse, convert, a readable text colour on a fill). | ColorPicker, ThemeCreator |
| `props.js` | `SIZE_VALUES`, `applySize`, `applyClassName`: the `size` and `className` every control has. | Button, Input, Textarea, Checkbox, ColorPicker, FileUpload, Card, Details, Pagination, Loading, SideMenu |

## Rules

- **Names say what kind of thing a file is.** A file that exports a class is
  PascalCase (`parts/Selection.js`); a file of functions is camelCase and named
  for its subject (`data/dates.js`).
- **Every file starts with a few lines** saying what it is and who uses it. When
  you add a user, add it to that line and to the table above.
- **Only `export` what others use.** Named exports are fine here (unlike in a
  component's own file, which only has `export default`).
- **No DOM of its own, no `window`.** A helper may receive elements and work on
  them; it never creates global state.
- **Import with a relative path** from `src/Components` (for example
  `../../shared/data/paths.js`), never from outside it.
