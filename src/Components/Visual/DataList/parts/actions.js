// Part of DataList: used only by DataList.js (see shared/README.md).
//
// Actions on an item, in one vocabulary for the buttons on a row, its ⋯ menu
// and the bar that acts on a selection:
//
//   { label, icon, onClick(ctx), danger, inline, hidden, disabled, confirm }
//
//   inline     a button on the row (the rest go in the ⋯ menu)
//   hidden     true, or (item) => boolean
//   disabled   true, or (item) => boolean
//   confirm    true, a question, or { title, text, confirmLabel }: ask first
//   'separator' in the list draws a line in the menu
//
// `actions` can also be a function (item) => actions, for actions that depend
// on the item ("Archive" or "Restore").

/** True when a flag (a boolean, or a function of the item) is on. */
export function flag(value, item) {
   return typeof value === 'function' ? !!value(item) : value === true;
}

/**
 * The actions that apply to one item (or to a selection: `item` is then the
 * array of selected items), without the hidden ones.
 * @returns {any[]}
 */
export function resolveActions(spec, item) {
   const list = typeof spec === 'function' ? spec(item) : spec;
   if (!Array.isArray(list)) return [];
   const out = [];
   for (const action of list) {
      if (action === 'separator' || action?.type === 'separator') {
         // No line at the start, and never two in a row.
         if (out.length && out[out.length - 1] !== 'separator') out.push('separator');
         continue;
      }
      if (!action || typeof action !== 'object') continue;
      if (flag(action.hidden, item)) continue;
      out.push({ ...action, disabled: flag(action.disabled, item) });
   }
   while (out[out.length - 1] === 'separator') out.pop();
   return out;
}

/** Buttons on the row, and the rest for the ⋯ menu. */
export function splitActions(actions) {
   const inline = [];
   const menu = [];
   for (const action of actions) {
      if (action !== 'separator' && action.inline === true) inline.push(action);
      else menu.push(action);
   }
   while (menu[0] === 'separator') menu.shift();
   while (menu[menu.length - 1] === 'separator') menu.pop();
   return { inline, menu };
}

/** The confirm question of an action, as { title, text, confirmLabel }, or null. */
export function confirmOf(action, label) {
   const confirm = action?.confirm;
   if (!confirm) return null;
   if (confirm === true) return { title: label, text: '', confirmLabel: action.label };
   if (typeof confirm === 'string') return { title: confirm, text: '', confirmLabel: action.label };
   return { title: confirm.title ?? label, text: confirm.text ?? '', confirmLabel: confirm.confirmLabel ?? action.label };
}
