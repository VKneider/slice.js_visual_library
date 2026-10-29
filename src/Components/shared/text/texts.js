// Built-in texts of a component, shipped as the translator's lowest-priority layer.
//
// A component carries its own defaults instead of a central dictionary (`slice get` copies
// components, not the library). The app's dictionaries always win; an instance prop wins
// over both. With the translator off, `t()` returns the English default, so a component
// keeps today's behaviour in an app that never enabled it.
//
//   const t = texts('slice.notFound', {
//      en: { title: 'Page Not Found' },
//      es: { title: 'Página no encontrada' },
//   });
//   t('title')            // translated, or the English default
//   <h2 data-t="slice.notFound.title">Page Not Found</h2>   // marked in the template
//
// The defaults are registered once per namespace (module load), before the first template
// is translated, so the first paint already has them.

const registered = new Set();

/**
 * Merge the library defaults into the translator's `defaults` layer, once per namespace.
 * @param {string} namespace e.g. 'slice.notFound'
 * @param {Record<string, Record<string, string>>} defaults locale → messages
 */
export function registerTexts(namespace, defaults) {
   if (!namespace || !defaults || typeof defaults !== 'object') return;
   const translator = globalThis.slice?.translator;
   if (!translator?.enabled) return;
   if (registered.has(namespace)) return;
   registered.add(namespace);

   for (const [locale, messages] of Object.entries(defaults)) {
      if (!messages || typeof messages !== 'object') continue;
      // `slice.notFound` is a dotted path, not a flat key: build the nested branch the
      // translator's lookup expects.
      const branch = namespace
         .split('.')
         .filter(Boolean)
         .reduceRight((nested, part) => ({ [part]: nested }), messages);
      translator.add(locale, branch, { defaults: true });
   }
}

/**
 * A lookup for one component's built-in texts.
 * @param {string} namespace e.g. 'slice.notFound'
 * @param {Record<string, Record<string, string>>} defaults locale → messages (must include `en`)
 * @returns {(key: string, params?: Record<string, any>) => string}
 */
export function texts(namespace, defaults) {
   registerTexts(namespace, defaults);
   const english = defaults?.en || Object.values(defaults || {})[0] || {};

   return (key, params) => {
      const full = namespace ? `${namespace}.${key}` : key;
      const translator = globalThis.slice?.translator;
      if (translator?.enabled) {
         const text = translator.t(full, params);
         if (text !== full) return text;
      }
      const fallback = english[key];
      return fallback === undefined ? full : String(fallback);
   };
}
