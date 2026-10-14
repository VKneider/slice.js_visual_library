/**
 * SPIKE — the recipe table (layer 2).
 *
 * The problem this replaces, measured from the components as they stand:
 *
 *   Button   size  md|sm              variant filled|outlined|ghost|soft|danger
 *   Badge    size  (default 'md', any value accepted)
 *   Chip     size  (default 'md', any value accepted)
 *   Icon     size  (default 'small')
 *
 * Three vocabularies for one concept. `size: 'sm'` is invalid on Icon and
 * `size: 'small'` is invalid on Button, and Badge/Chip accept anything at all
 * because they never declared `allowedValues`. Nobody can tell from the outside
 * whether two components agree, and the only way to find out is to read both.
 *
 * A recipe says which values a component accepts and what each one MEANS, in
 * one place. Because the framework already validates `allowedValues` at runtime,
 * the table can be the thing that generates those lists — so uniformity is a
 * property of the codebase rather than a habit of its authors.
 *
 * `size` is defined once and inherited by every control. `variant` is per
 * family, because "filled/outlined/ghost" is a button idea and "neutral/brand"
 * is a badge idea; pretending otherwise is how you end up with 43 lists.
 */

export const SIZE_RECIPE = {
   sm: { token: 'sm', height: 'var(--slice-size-sm)', radius: 'var(--slice-radius-sm)' },
   md: { token: 'md', height: 'var(--slice-size-md)', radius: 'var(--slice-radius-md)' },
   lg: { token: 'lg', height: 'var(--slice-size-lg)', radius: 'var(--slice-radius-lg)' },
};

/** The one list every control's `size` is validated against. */
export const SIZE_VALUES = Object.keys(SIZE_RECIPE);

/**
 * Which variants each family offers. Still per-family on purpose — but now the
 * differences are declared to be differences, instead of two authors happening
 * to disagree.
 */
export const VARIANT_RECIPES = {
   action: ['filled', 'outlined', 'ghost', 'soft', 'danger'],
   surface: ['default', 'elevated', 'outlined', 'minimal'],
   status: ['neutral', 'brand', 'success', 'warning', 'danger'],
   icon: ['small', 'medium', 'large'],
};

/**
 * Resolves a control's `size` onto its host element.
 *
 * Sets `data-size` rather than a class, so the CSS in scale.css owns what the
 * values mean and a component never hardcodes a pixel. Returns the applied size,
 * or the fallback when the value is not in the recipe — silently clamping is
 * what makes a typo look like a styling bug instead of a wrong argument.
 */
export function applySize(element, value, fallback = 'md') {
   if (!element) return fallback;

   const requested = typeof value === 'string' ? value : '';
   const applied = SIZE_RECIPE[requested] ? requested : fallback;

   element.dataset.size = applied;
   return applied;
}

/**
 * Adds a consumer class WITHOUT touching the component's own.
 *
 * The rule that matters: this never removes an existing class. A `className`
 * that replaced them would leave the control stripped of its structural
 * classes and broken in silence — the same failure mode as passing a bare
 * string to Button.icon.
 */
export function applyClassName(element, value) {
   if (!element || typeof value !== 'string') return;

   for (const name of value.split(/\s+/)) {
      if (name) element.classList.add(name);
   }
}