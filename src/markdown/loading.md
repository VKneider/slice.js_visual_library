---
title: Loading
route: /docs/feedback/loading
navLabel: Loading
section: Feedback
group: Status
order: 40
description: Shows that the app is busy, over the whole page or one part of it. Four indicators (the Slice logo, a ring, dots, a top bar), backdrops, a label, a delay and a minimum time, and a welcome screen for the first load of the app, built in or your own.
component: LoadingDocumentation
generate: true
tags: [loading, spinner, progress, splash, welcome, feedback]
---

# Loading

## Overview
`Loading` shows that the app is working: over the **whole page** while a route loads, or over **one part** of it while a form saves, a card refreshes or a table fetches its next page.

Slice also uses it for the app itself. With `"loading": { "enabled": true }` in `sliceConfig.json`, Slice builds one as `slice.loading`. It shows while the first page loads and on every route change. The rest of `sliceConfig.loading` decides how it looks, including a **welcome screen** for the first load of the app (see "The app's loading screen" below).

### When to use it
- **Work people have to wait for** before they can go on: saving a form, signing in, opening a page.
- **One part of the page** that is out of date for a moment: a card refreshing, a list loading its next page. Cover only that part, so the rest of the page stays usable.
- **The first load of the app**, as a branded welcome screen instead of a blank page.

### When not to use it
- **Work under a second.** Use `delayMs`, so fast work shows nothing at all. A flash of a spinner reads as a glitch.
- **Content whose shape is known**, such as a list of cards, a profile or a table. Placeholders in that shape (a [Card](/docs/layout/card) with `loading: true`) feel faster than a spinner on top.
- **Work that runs in the background**, such as autosave or sync. Say it quietly (a [Toast](/docs/feedback/toast), a status text) and do not block anything.
- **A modal.** A `<dialog>` is in the browser's top layer, above any overlay. Show the busy state inside the [Modal](/docs/feedback/modal).

## Core Behavior

### Starting and stopping
- `start(container?)` shows it: over `container`, the `container` prop, or the whole page. Over a container, the overlay covers only that box and blocks only it.
- `stop()` fades it out and gives the container back its styles (see "The way out" below).
- `active` does the same as a property: `true` starts, `false` stops.
- While it shows, the container (or `<body>`) has `aria-busy="true"`, and screen readers hear `label` (or "Loading…") once.

### Timing
- `delayMs`: work that ends before this does not show anything. 150–300 ms suits route changes and quick saves.
- `minVisibleMs`: once shown, it stays at least this long, so it never blinks on and off.
- A `start()` while a stop is waiting keeps it on screen, so back-to-back requests show one steady overlay.

### The way out
`stop()` does not cut to the page. The overlay **fades out where it is** — 220 ms, 320 ms for the welcome — so the content underneath comes in as a crossfade instead of appearing in one frame. That is what keeps a first load or a route change from reading as a jump. Only when the fade ends is the overlay removed and the container given back its styles.

- The page is usable immediately: the fading overlay lets clicks through, and `active` turns `false` when the stop is applied, not when the fade ends.
- A `start()` during the fade takes the same overlay back — no second entrance, no blink.
- Nothing animates the page itself, so a page with its own entrance (a [Card](/docs/layout/card), a list) keeps it.
- With **reduce motion** on, the fade stays (it only changes opacity); what goes away is the movement: the indicator does not lift, the welcome card does not step back.

### Variants
- `variant`:
  - `'slice'` (default): the Slice.js logo, spinning;
  - `'spinner'`: a ring;
  - `'dots'`: three bouncing dots, softer, for small areas;
  - `'bar'`: a thin line along the top. It has no backdrop and blocks nothing, so it suits route changes and uploads. `progress` (0–1) shows a known amount; without it, the line slides.
- `label`: a short text under the indicator, such as "Saving…" or "Signing you in…".
- `backdrop`: `'dim'` (default), `'blur'`, `'solid'` (hides what is underneath) or `'none'`.
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- With **reduce motion** on in the system, the indicators pulse slowly instead of spinning, entrances are off, and the fade out stays (it only changes opacity).

## The app's loading screen
`sliceConfig.json` configures the loader Slice builds for the app. Props passed to a `Loading` win over it, so the same keys work in both places.

```json
"loading": {
  "enabled": true,
  "variant": "slice",
  "delayMs": 150,
  "minVisibleMs": 300,
  "welcome": {
    "kicker": "Welcome to",
    "title": "Conclave",
    "subtitle": "Getting your space ready",
    "logo": "/images/logo.svg",
    "minVisibleMs": 1500
  }
}
```

`welcome` is shown **once**, on the first load of the page. It covers the page with the theme's background and shows the logo, the texts and the indicator. It stays at least `welcome.minVisibleMs` (1200 ms by default), and fades out when the first page is ready — the card steps back under the fade, so the app's first screen is already there as the brand goes. After that, route changes show the normal indicator.

### Changing the welcome screen
The welcome screen is ordinary markup in `Loading.html`, styled in `Loading.css`. Your app has its own copy of the component, so you change the welcome screen the way you change any of your components:

- **Edit `Loading.html`**: the logo, the texts, extra elements, an illustration. Elements marked `data-welcome="title"` (or `kicker`, `subtitle`, `logo`) take their text from `sliceConfig` when it gives one, and are hidden when they end up empty. Text written in the markup itself is kept.
- **Edit `Loading.css`**: colours, layout and animations. The selectors start with `slice-loading .slice-loading__…`, and the screen is on while the host has the class `is-welcome`, and fading out while it has `is-leaving`.
- Turn it on with `"welcome": true` to show the markup exactly as you wrote it, or with an object to fill its texts from the config as well.

The theme is not loaded yet when the app starts, so the stylesheet gives every colour a fallback. Keep fallbacks in your own rules too (`var(--primary-color, #7c3aed)`), or the first frames show without colours.

### A welcome component of your own
Instead of editing `Loading`, `welcome.component` can name one of your components, with `welcome.props` as its props. It is built inside the overlay for the first load, in place of the card, and destroyed when the welcome ends.

```json
"welcome": { "component": "AppSplash", "props": { "tagline": "Decide together" }, "minVisibleMs": 1500 }
```

```js
// src/Components/AppComponents/AppSplash/AppSplash.js
export default class AppSplash extends HTMLElement {
  static props = { tagline: { type: 'string', default: '' } };
  constructor(props) {
    super();
    slice.attachTemplate(this);   // your own markup and CSS, animations included
    slice.controller.setComponentProps(this, props);
  }
}
customElements.define('slice-app-splash', AppSplash);
```

The indicator still shows under your component; set the welcome's look in your component's CSS.

`start(null, { welcome: true })` shows the welcome again, for example after a sign-in. `{ welcome: false }` skips it.

## Live Preview
:::component name="Loading"
{
  "variant": "spinner",
  "label": "Loading…"
}
:::

## Examples
:::script label="Saving a form" expected="a profile Card with two fields and a Save button; Save covers only the card with a 'Saving…' overlay for about a second and a half, then a toast says it was saved; a quick second save shows nothing thanks to delayMs"
const toasts = await slice.build('ToastProvider', { singleton: true });
const loading = await slice.build('Loading', { variant: 'spinner', label: 'Saving…', delayMs: 150, minVisibleMs: 400 });

const name = await slice.build('Input', { label: 'Full name', value: 'Ana Ruiz' });
const email = await slice.build('Input', { label: 'Email', value: 'ana@example.com', type: 'email' });
const fields = document.createElement('div');
fields.style.cssText = 'display:grid;gap:14px';
fields.append(name, email);

let fast = false;
const card = await slice.build('Card', {
  title: 'Profile',
  subtitle: 'Shown to your team',
  content: fields,
  actions: [{
    value: 'Save',
    onClick: async () => {
      loading.start(card);
      // A pretend request: slow the first time, fast after.
      await new Promise((r) => setTimeout(r, fast ? 80 : 1500));
      fast = true;
      loading.stop();
      toasts.show('Profile saved', { type: 'success' });
    }
  }]
});
card.style.maxWidth = '420px';
return card;
:::

:::script label="Uploading with a progress bar" expected="a Files panel with three files and an Upload button; the upload shows a bar along the top of the panel that fills from 0 to 100% with a label counting the files, without blocking the list"
const files = ['Q3 report.pdf', 'Team photo.jpg', 'Budget.xlsx'];
const loading = await slice.build('Loading', { variant: 'bar', progress: 0 });

const list = document.createElement('ul');
list.style.cssText = 'margin:0;padding:0;list-style:none;display:grid;gap:8px';
for (const name of files) {
  const li = document.createElement('li');
  li.style.cssText = 'display:flex;justify-content:space-between;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--primary-color) 6%,transparent)';
  li.innerHTML = `<span>${name}</span><span style="opacity:.6">Waiting</span>`;
  list.append(li);
}

const panel = document.createElement('section');
panel.style.cssText = 'display:grid;gap:12px;width:100%;max-width:420px;padding:16px;border:1px solid var(--slice-border-raised,#ddd);border-radius:14px';
panel.innerHTML = '<h3 style="margin:0">Files</h3>';
panel.append(list);

const upload = await slice.build('Button', {
  value: 'Upload',
  icon: 'upload',
  onClick: async () => {
    upload.disabled = true;
    loading.progress = 0;
    loading.start(panel);
    for (let i = 0; i < files.length; i++) {
      loading.label = `Uploading ${i + 1} of ${files.length}…`;
      for (let step = 1; step <= 10; step++) {
        await new Promise((r) => setTimeout(r, 70));
        loading.progress = (i + step / 10) / files.length;
      }
      list.children[i].lastElementChild.textContent = 'Done';
    }
    loading.label = '';
    loading.stop();
    upload.disabled = false;
  }
});
panel.append(upload);
return panel;
:::

:::script label="Refreshing one card at a time" expected="three metric cards, each with a refresh button; refreshing one blurs only that card with dots while it loads, and the other cards stay usable"
const metrics = [
  { title: 'Revenue', value: '$48,210', icon: 'dollar' },
  { title: 'Orders', value: '1,284', icon: 'cart' },
  { title: 'Visitors', value: '32,911', icon: 'users' }
];

const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;width:100%';

for (const metric of metrics) {
  const loading = await slice.build('Loading', { variant: 'dots', backdrop: 'blur', size: 'sm', minVisibleMs: 600 });
  const value = document.createElement('div');
  value.style.cssText = 'font-size:1.6rem;font-weight:700';
  value.textContent = metric.value;
  const card = await slice.build('Card', {
    title: metric.title,
    headerIcon: metric.icon,
    content: value,
    actions: [{
      value: 'Refresh', variant: 'ghost', icon: 'refresh', size: 'sm',
      onClick: async ({ card: target }) => {
        loading.start(target);
        await new Promise((r) => setTimeout(r, 900));
        value.textContent = metric.value.replace(/\d(?=\D*$)/, (d) => String((Number(d) + 1) % 10));
        loading.stop();
      }
    }]
  });
  grid.append(card);
}
return grid;
:::

:::script label="The welcome screen" expected="two buttons: one shows the built-in welcome screen (kicker, title, subtitle and the Slice logo spinning under the card) for two and a half seconds, then it fades out; the other shows the bar variant along the top of the page, as for a route change"
const welcome = await slice.build('Loading', {
  welcome: { kicker: 'Welcome to', title: 'Conclave', subtitle: 'Getting your space ready', minVisibleMs: 0 }
});
const route = await slice.build('Loading', { variant: 'bar' });

const showWelcome = await slice.build('Button', {
  value: 'Preview the welcome screen',
  onClick: async () => {
    welcome.start(null, { welcome: true });
    await new Promise((r) => setTimeout(r, 2500));
    welcome.stop();
  }
});

const showRoute = await slice.build('Button', {
  value: 'Preview a route change',
  variant: 'outlined',
  onClick: async () => {
    route.start();
    await new Promise((r) => setTimeout(r, 1500));
    route.stop();
  }
});

const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap';
row.append(showWelcome, showRoute);
return row;
:::

:::script label="Every variant" expected="four boxes, each covered by a running loader: the Slice logo, a ring, dots and a top bar with a label"
const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;width:100%';
for (const variant of ['slice', 'spinner', 'dots', 'bar']) {
  const box = document.createElement('div');
  box.style.cssText = 'height:130px;border-radius:12px;border:1px solid var(--slice-border-raised,#ddd)';
  grid.append(box);
  const loading = await slice.build('Loading', { variant, label: variant, backdrop: variant === 'bar' ? 'none' : 'solid' });
  loading.start(box);
}
return grid;
:::

## Best Practices
:::tip
Set `delayMs` for the app's loader (150–300 ms). Most route changes finish before it, and show nothing at all. Only slow ones show the indicator.
:::

:::tip
Cover the smallest part that is busy. A card refreshing should block that card, not the page, so people can keep working elsewhere.
:::

:::tip
Say what is happening in `label` when it takes more than a moment: "Saving…", "Uploading 2 of 3…". A label tells people the app is still working, and what on.
:::

## Pitfalls
:::warning
Always pair `start()` with `stop()`, also when the work fails: put the `stop()` in a `finally`. A loader that never stops blocks the page for good.
:::

:::warning
Keep the welcome screen short. It is shown on every visit to the app, so `welcome.minVisibleMs` above 2 seconds makes the app feel slow, however nice it looks.
:::