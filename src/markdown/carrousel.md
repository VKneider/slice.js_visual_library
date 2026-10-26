---
title: ElementCarrousel
route: /docs/layout/element-carrousel
navLabel: Carrousel
section: Layout
group: Containers
order: 25
description: A row of slides that moves one position at a time. Swipe, drag, arrows, the keyboard, dots, a count or thumbnails, several slides per view with a peek, loop, and autoplay that pauses itself.
component: ElementCarrouselDocumentation
generate: true
tags: [carrousel, carousel, slider, gallery, layout, navigation]
---

# ElementCarrousel

## Overview
`ElementCarrousel` shows a row of slides that moves one position at a time. A slide can hold anything: a picture, a [Card](/docs/layout/card), a testimonial, or any other component.

The row is a native scroll container with scroll snapping. A swipe on a phone, a trackpad flick and Shift+wheel all move it the way the platform does, and a mouse can drag it. Arrows, dots, the keyboard and autoplay move the same scroll.

### When to use it
- **A product gallery**: several photos of one thing, with thumbnails.
- **A row of related items** that does not need to be seen all at once: "Recommended for you", "Recently viewed", courses or articles. Use several slides per view and a peek.
- **Testimonials or quotes**: one at a time, moving by itself.

### When not to use it
- **Content everyone must see**, such as prices, terms or a main call to action. Few people look past the second slide, so put it on the page.
- **Items people compare side by side.** Use a [Grid](/docs/layout/grid) or a [Table](/docs/data/table), which show them all at once.
- **Steps of a process** that have to be done in order. Use a form with steps, or [Pagination](/docs/data/pagination) with `mode: 'dots'` under one Card.
- **A long list.** Past about 10 slides a carousel is hard to browse. Use a grid with [Pagination](/docs/data/pagination).

## Core Behavior

### Slides
- `elements` is an array of nodes (built components or plain elements) or strings. Each one becomes a slide.
- Setting `elements` again replaces the slides. Components in slides that were dropped are destroyed. Elements passed again are kept as they are, with their state.
- Every slide is announced as "Slide 2 of 5". Slides out of view are `inert`, so Tab never lands on something that cannot be seen.

### Moving
- **Arrows**: Previous and Next, disabled at the ends unless `loop` is on.
- **Keyboard**: ← and → move one position; Home and End go to the first and the last. Arrows typed in a field inside a slide stay in the field.
- **Touch and trackpad**: the native scroll, with snapping.
- **Mouse**: drag the row. A quick flick goes one slide further. A drag never counts as a click on what it ends on.
- `goTo(index)`, `next()` and `previous()` do the same from code.
- `onChange(index, { previous })` and the `slide-change` event report every move. `index` is the first slide in view.

### Several per view
- `perView` is how many slides sit side by side. It can be a number, or an object keyed by the carousel's **own** width: `{ 0: 1, 560: 2, 900: 3 }`. The carousel's width is used, not the window's, so the same carousel works in a sidebar and in a page.
- `gap` is the space between slides, in pixels (16 by default).
- `peek` shows that many pixels of the next slide, as a hint that there is more.
- `align: 'center'` puts the current slide in the middle, with the peek on both sides, and dims the slides around it.
- When everything fits, there are no arrows and no dots.

### Autoplay
- `autoplay: true` moves every 5 seconds; a number sets the time in milliseconds. It goes back to the first slide after the last.
- It stops while the pointer is over the carousel or the focus is in it, so nothing moves while someone reads or clicks.
- A pause button is always shown with it (WCAG 2.2.2: anything that moves by itself can be paused).
- With *reduce motion* on in the system, it never starts, and the button starts it on request.
- While it plays, slides are not announced, so a screen reader is not interrupted every few seconds.

## Looks
- `arrows`:
  - `'overlay'` (default): round buttons over the edges of the slides, hidden at the ends;
  - `'outside'`: beside the row, for cards that should not be covered. Under 480px they move over the slides, so a phone keeps the width for the slides;
  - `'none'`: no arrows, for a row moved by swiping or by the dots.
- `indicators`:
  - `'dots'` (default): one dot per position, built with [Pagination](/docs/data/pagination);
  - `'count'`: "2 / 5";
  - `'thumbnails'`: small buttons built by `thumbnail(slide, index)`, for galleries;
  - `'none'`.
- The CSS variables `--element-carrousel-accent` and `--element-carrousel-radius` adjust the current thumbnail, the focus ring and the corners.

## Language
- `label` names the carousel ("Product photos"). Give every carousel one.
- `texts` replaces the other words:
  - `label` (the default name);
  - `slide` (`{index}`, `{total}`) and `announce` (`{index}`, `{total}`);
  - `previous`, `next`, `goTo` (`{page}`);
  - `play`, `pause`.

## Live Preview
:::component name="ElementCarrousel"
{
  "elements": ["First slide", "Second slide", "Third slide", "Fourth slide"],
  "perView": 2,
  "peek": 40,
  "label": "Preview"
}
:::

## Examples
:::script label="Product gallery with thumbnails" expected="a product page: a photo gallery with thumbnails under it on one side, and the name, price, colour choice and Add to cart on the other; picking a colour moves the gallery to that photo"
// Pretend photos: a gradient and an icon stand in for real images.
const photos = [
  { name: 'Front', colors: ['#1e3a8a', '#60a5fa'], icon: 'headphones', color: 'Navy' },
  { name: 'Side', colors: ['#334155', '#94a3b8'], icon: 'headphones', color: 'Navy' },
  { name: 'Case', colors: ['#7c2d12', '#fb923c'], icon: 'cart', color: 'Sunset' },
  { name: 'Detail', colors: ['#14532d', '#4ade80'], icon: 'star', color: 'Forest' },
  { name: 'In use', colors: ['#581c87', '#c084fc'], icon: 'user', color: 'Forest' }
];

const picture = async (photo, size) => {
  const box = document.createElement('div');
  box.style.cssText = `display:grid;place-items:center;aspect-ratio:${size === 'thumb' ? 'auto' : '4 / 3'};
    border-radius:${size === 'thumb' ? '6px' : '14px'};color:#fff;
    background:linear-gradient(135deg, ${photo.colors[0]}, ${photo.colors[1]})`;
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', photo.name);
  box.appendChild(await slice.build('Icon', { name: photo.icon, size: size === 'thumb' ? 'small' : '64px' }));
  return box;
};

const gallery = await slice.build('ElementCarrousel', {
  label: 'Photos of Aria wireless headphones',
  elements: await Promise.all(photos.map((p) => picture(p))),
  indicators: 'thumbnails',
  // Thumbnails are built from the photo data, not from the slides.
  thumbnail: (_slide, i) => {
    const t = document.createElement('div');
    t.style.cssText = `width:100%;height:100%;background:linear-gradient(135deg, ${photos[i].colors[0]}, ${photos[i].colors[1]})`;
    return t;
  }
});

const info = document.createElement('div');
info.style.cssText = 'display:grid;gap:12px;align-content:start';
info.innerHTML = `<div style="font-size:.8rem;opacity:.7">Audio · Headphones</div>
  <h3 style="margin:0">Aria wireless headphones</h3>
  <div style="font-size:1.4rem;font-weight:700">$149</div>
  <p style="margin:0;opacity:.8">40 hours of battery, noise cancelling, and a case that folds flat.</p>`;
info.prepend(await slice.build('Badge', { label: 'In stock', tone: 'success' }));

const colors = ['Navy', 'Sunset', 'Forest'];
const picker = document.createElement('div');
picker.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
for (const color of colors) {
  picker.appendChild(await slice.build('Button', {
    value: color, variant: 'outlined', size: 'sm',
    // A colour shows its first photo.
    onClick: () => gallery.goTo(photos.findIndex((p) => p.color === color))
  }));
}
info.appendChild(picker);
info.appendChild(await slice.build('Button', { value: 'Add to cart', icon: 'cart' }));

const page = document.createElement('div');
page.style.cssText = 'width:100%;min-width:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;align-items:start';
page.append(gallery, info);
return page;
:::

:::script label="Recommended courses (several per view)" expected="a 'Recommended for you' heading with a See all button, and a row of course Cards: one per view on a phone, two from 560px and three from 900px, with a peek of the next card and arrows beside the row; Enrol on a card changes its button to Enrolled"
const courses = [
  { title: 'Components from scratch', teacher: 'Ana Ruiz', hours: 6, level: 'Beginner', icon: 'code' },
  { title: 'Accessible forms', teacher: 'Luis Pérez', hours: 4, level: 'Intermediate', icon: 'check' },
  { title: 'Design tokens', teacher: 'María Gil', hours: 3, level: 'Beginner', icon: 'palette' },
  { title: 'Testing with Playwright', teacher: 'Jorge Díaz', hours: 8, level: 'Advanced', icon: 'star' },
  { title: 'Routing in an SPA', teacher: 'Ana Ruiz', hours: 5, level: 'Intermediate', icon: 'book-open' },
  { title: 'Performance basics', teacher: 'Carla Soto', hours: 2, level: 'Beginner', icon: 'clock' }
];
const tone = { Beginner: 'success', Intermediate: 'warning', Advanced: 'danger' };

const cards = await Promise.all(courses.map((course) => slice.build('Card', {
  title: course.title,
  subtitle: `${course.teacher} · ${course.hours} h`,
  headerIcon: course.icon,
  badge: { label: course.level, tone: tone[course.level] },
  text: 'Short videos, exercises and a final project you can show.',
  actions: [{
    value: 'Enrol', size: 'sm',
    onClick: ({ card }) => { card.actions = [{ value: 'Enrolled', icon: 'check', variant: 'soft', size: 'sm', disabled: true }]; }
  }]
})));

const row = await slice.build('ElementCarrousel', {
  label: 'Recommended courses',
  elements: cards,
  perView: { 0: 1, 560: 2, 900: 3 },
  peek: 48,
  arrows: 'outside',
  indicators: 'none'
});

const header = document.createElement('div');
header.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px';
header.innerHTML = '<h3 style="margin:0">Recommended for you</h3>';
header.appendChild(await slice.build('Button', { value: 'See all', variant: 'ghost', size: 'sm', icon: 'arrow-right' }));

const section = document.createElement('section');
section.style.cssText = 'width:100%;min-width:0';
section.append(header, row);
return section;
:::

:::script label="Testimonials that move by themselves" expected="a centred testimonial with the ones around it dimmed; it moves every 6 seconds and loops; hovering or focusing it holds it; a pause button and dots sit under it"
const quotes = [
  { text: 'We moved our dashboard in a week. The components just fit together.', name: 'Laura M.', role: 'Product lead' },
  { text: 'The docs answer the question I have, with an example I can copy.', name: 'Pedro A.', role: 'Frontend developer' },
  { text: 'Our forms finally work with a keyboard and a screen reader.', name: 'Sofía R.', role: 'Accessibility lead' },
  { text: 'Small, fast and no build step. Exactly what our team needed.', name: 'Diego F.', role: 'CTO' }
];

const slides = await Promise.all(quotes.map(async (q) => {
  const card = await slice.build('Card', {
    variant: 'filled',
    headerIcon: 'quote',
    title: q.name,
    subtitle: q.role,
    text: `“${q.text}”`
  });
  return card;
}));

const testimonials = await slice.build('ElementCarrousel', {
  label: 'What our customers say',
  elements: slides,
  align: 'center',
  peek: 56,
  loop: true,
  autoplay: 6000,
  onChange: (index) => { status.textContent = `Showing ${quotes[index].name}`; }
});

const status = document.createElement('p');
status.style.cssText = 'margin:8px 0 0;font-size:.8rem;opacity:.7;text-align:center';
status.textContent = `Showing ${quotes[0].name}`;

const box = document.createElement('div');
box.style.cssText = 'width:100%;min-width:0';
box.append(testimonials, status);
return box;
:::

:::script label="What's new, with a count" expected="a release notes panel: one Card per release, a '1 / 4' count under it, overlay arrows; Read more on a card opens a Modal with the details"
const releases = [
  { version: '3.4', date: 'Oct 2026', title: 'Faster first load', notes: 'Templates are cached and styles load in parallel.' },
  { version: '3.3', date: 'Sep 2026', title: 'Tooltips everywhere', notes: 'One provider for every tooltip in a page.' },
  { version: '3.2', date: 'Aug 2026', title: 'New date picker', notes: 'Ranges, presets and the locale’s first day of the week.' },
  { version: '3.1', date: 'Jul 2026', title: 'File uploads', notes: 'Progress, retry, cancel and checks for type and size.' }
];

const cards = await Promise.all(releases.map((r) => slice.build('Card', {
  title: r.title,
  subtitle: `v${r.version} · ${r.date}`,
  icon: 'star',
  text: r.notes,
  actions: [{
    value: 'Read more', variant: 'ghost', icon: 'arrow-right',
    onClick: async () => {
      const modal = await slice.build('Modal', {
        title: `Version ${r.version}: ${r.title}`,
        description: r.date,
        destroyOnClose: true,
        content: r.notes,
        actions: [{ value: 'Close', variant: 'ghost' }]
      });
      document.body.appendChild(modal);
      await modal.show();
    }
  }]
})));

const panel = await slice.build('ElementCarrousel', {
  label: 'Release notes',
  elements: cards,
  indicators: 'count'
});
panel.style.cssText = 'width:100%;max-width:420px;min-width:0';
return panel;
:::

## Best Practices
:::tip
Give every carousel a `label` that says what is in it ("Product photos", "Recommended courses"). Screen readers announce it when the focus enters.
:::

:::tip
Prefer several slides per view with a `peek` for rows of items. People see at once that there is more, and can swipe to it, without hunting for arrows or dots.
:::

:::tip
Build slides with the data you already have, and keep that data next to them. Use `index` and `onChange` to find which item is on screen, instead of reading it back from the slide.
:::

## Pitfalls
:::warning
Do not hide the only copy of something important in a later slide. Most people never see past the second one.
:::

:::warning
Use autoplay sparingly, and only for content that can be missed (quotes, highlights). Text that moves while someone reads it is hard to follow. The pause button, the hover hold and the reduced-motion check are there for that reason; do not hide them.
:::

:::warning
Inside a flex or grid item, give that item `min-width: 0`. Flex and grid items do not shrink below their content by default, and a row of slides is wider than any screen, so the page would scroll sideways.
:::

:::warning
A slide's content fills its width. Do not give the elements fixed widths: they would overflow the slide on a phone. Use `perView` to decide how many fit instead.
:::