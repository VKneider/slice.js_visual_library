export default class ElementCarrouselDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Product gallery with thumbnails","expected":"a product page: a photo gallery with thumbnails under it on one side, and the name, price, colour choice and Add to cart on the other; picking a colour moves the gallery to that photo","kind":"script","content":"// Pretend photos: a gradient and an icon stand in for real images.\nconst photos = [\n  { name: 'Front', colors: ['#1e3a8a', '#60a5fa'], icon: 'headphones', color: 'Navy' },\n  { name: 'Side', colors: ['#334155', '#94a3b8'], icon: 'headphones', color: 'Navy' },\n  { name: 'Case', colors: ['#7c2d12', '#fb923c'], icon: 'cart', color: 'Sunset' },\n  { name: 'Detail', colors: ['#14532d', '#4ade80'], icon: 'star', color: 'Forest' },\n  { name: 'In use', colors: ['#581c87', '#c084fc'], icon: 'user', color: 'Forest' }\n];\n\nconst picture = async (photo, size) => {\n  const box = document.createElement('div');\n  box.style.cssText = `display:grid;place-items:center;aspect-ratio:${size === 'thumb' ? 'auto' : '4 / 3'};\n    border-radius:${size === 'thumb' ? '6px' : '14px'};color:#fff;\n    background:linear-gradient(135deg, ${photo.colors[0]}, ${photo.colors[1]})`;\n  box.setAttribute('role', 'img');\n  box.setAttribute('aria-label', photo.name);\n  box.appendChild(await slice.build('Icon', { name: photo.icon, size: size === 'thumb' ? 'small' : '64px' }));\n  return box;\n};\n\nconst gallery = await slice.build('ElementCarrousel', {\n  label: 'Photos of Aria wireless headphones',\n  elements: await Promise.all(photos.map((p) => picture(p))),\n  indicators: 'thumbnails',\n  // Thumbnails are built from the photo data, not from the slides.\n  thumbnail: (_slide, i) => {\n    const t = document.createElement('div');\n    t.style.cssText = `width:100%;height:100%;background:linear-gradient(135deg, ${photos[i].colors[0]}, ${photos[i].colors[1]})`;\n    return t;\n  }\n});\n\nconst info = document.createElement('div');\ninfo.style.cssText = 'display:grid;gap:12px;align-content:start';\ninfo.innerHTML = `<div style=\"font-size:.8rem;opacity:.7\">Audio · Headphones</div>\n  <h3 style=\"margin:0\">Aria wireless headphones</h3>\n  <div style=\"font-size:1.4rem;font-weight:700\">$149</div>\n  <p style=\"margin:0;opacity:.8\">40 hours of battery, noise cancelling, and a case that folds flat.</p>`;\ninfo.prepend(await slice.build('Badge', { label: 'In stock', tone: 'success' }));\n\nconst colors = ['Navy', 'Sunset', 'Forest'];\nconst picker = document.createElement('div');\npicker.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';\nfor (const color of colors) {\n  picker.appendChild(await slice.build('Button', {\n    value: color, variant: 'outlined', size: 'sm',\n    // A colour shows its first photo.\n    onClick: () => gallery.goTo(photos.findIndex((p) => p.color === color))\n  }));\n}\ninfo.appendChild(picker);\ninfo.appendChild(await slice.build('Button', { value: 'Add to cart', icon: 'cart' }));\n\nconst page = document.createElement('div');\npage.style.cssText = 'width:100%;min-width:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;align-items:start';\npage.append(gallery, info);\nreturn page;"},{"label":"Recommended courses (several per view)","expected":"a 'Recommended for you' heading with a See all button, and a row of course Cards: one per view on a phone, two from 560px and three from 900px, with a peek of the next card and arrows beside the row; Enrol on a card changes its button to Enrolled","kind":"script","content":"const courses = [\n  { title: 'Components from scratch', teacher: 'Ana Ruiz', hours: 6, level: 'Beginner', icon: 'code' },\n  { title: 'Accessible forms', teacher: 'Luis Pérez', hours: 4, level: 'Intermediate', icon: 'check' },\n  { title: 'Design tokens', teacher: 'María Gil', hours: 3, level: 'Beginner', icon: 'palette' },\n  { title: 'Testing with Playwright', teacher: 'Jorge Díaz', hours: 8, level: 'Advanced', icon: 'star' },\n  { title: 'Routing in an SPA', teacher: 'Ana Ruiz', hours: 5, level: 'Intermediate', icon: 'book-open' },\n  { title: 'Performance basics', teacher: 'Carla Soto', hours: 2, level: 'Beginner', icon: 'clock' }\n];\nconst tone = { Beginner: 'success', Intermediate: 'warning', Advanced: 'danger' };\n\nconst cards = await Promise.all(courses.map((course) => slice.build('Card', {\n  title: course.title,\n  subtitle: `${course.teacher} · ${course.hours} h`,\n  headerIcon: course.icon,\n  badge: { label: course.level, tone: tone[course.level] },\n  text: 'Short videos, exercises and a final project you can show.',\n  actions: [{\n    value: 'Enrol', size: 'sm',\n    onClick: ({ card }) => { card.actions = [{ value: 'Enrolled', icon: 'check', variant: 'soft', size: 'sm', disabled: true }]; }\n  }]\n})));\n\nconst row = await slice.build('ElementCarrousel', {\n  label: 'Recommended courses',\n  elements: cards,\n  perView: { 0: 1, 560: 2, 900: 3 },\n  peek: 48,\n  arrows: 'outside',\n  indicators: 'none'\n});\n\nconst header = document.createElement('div');\nheader.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px';\nheader.innerHTML = '<h3 style=\"margin:0\">Recommended for you</h3>';\nheader.appendChild(await slice.build('Button', { value: 'See all', variant: 'ghost', size: 'sm', icon: 'arrow-right' }));\n\nconst section = document.createElement('section');\nsection.style.cssText = 'width:100%;min-width:0';\nsection.append(header, row);\nreturn section;"},{"label":"Testimonials that move by themselves","expected":"a centred testimonial with the ones around it dimmed; it moves every 6 seconds and loops; hovering or focusing it holds it; a pause button and dots sit under it","kind":"script","content":"const quotes = [\n  { text: 'We moved our dashboard in a week. The components just fit together.', name: 'Laura M.', role: 'Product lead' },\n  { text: 'The docs answer the question I have, with an example I can copy.', name: 'Pedro A.', role: 'Frontend developer' },\n  { text: 'Our forms finally work with a keyboard and a screen reader.', name: 'Sofía R.', role: 'Accessibility lead' },\n  { text: 'Small, fast and no build step. Exactly what our team needed.', name: 'Diego F.', role: 'CTO' }\n];\n\nconst slides = await Promise.all(quotes.map(async (q) => {\n  const card = await slice.build('Card', {\n    variant: 'filled',\n    headerIcon: 'quote',\n    title: q.name,\n    subtitle: q.role,\n    text: `“${q.text}”`\n  });\n  return card;\n}));\n\nconst testimonials = await slice.build('ElementCarrousel', {\n  label: 'What our customers say',\n  elements: slides,\n  align: 'center',\n  peek: 56,\n  loop: true,\n  autoplay: 6000,\n  onChange: (index) => { status.textContent = `Showing ${quotes[index].name}`; }\n});\n\nconst status = document.createElement('p');\nstatus.style.cssText = 'margin:8px 0 0;font-size:.8rem;opacity:.7;text-align:center';\nstatus.textContent = `Showing ${quotes[0].name}`;\n\nconst box = document.createElement('div');\nbox.style.cssText = 'width:100%;min-width:0';\nbox.append(testimonials, status);\nreturn box;"},{"label":"What's new, with a count","expected":"a release notes panel: one Card per release, a '1 / 4' count under it, overlay arrows; Read more on a card opens a Modal with the details","kind":"script","content":"const releases = [\n  { version: '3.4', date: 'Oct 2026', title: 'Faster first load', notes: 'Templates are cached and styles load in parallel.' },\n  { version: '3.3', date: 'Sep 2026', title: 'Tooltips everywhere', notes: 'One provider for every tooltip in a page.' },\n  { version: '3.2', date: 'Aug 2026', title: 'New date picker', notes: 'Ranges, presets and the locale’s first day of the week.' },\n  { version: '3.1', date: 'Jul 2026', title: 'File uploads', notes: 'Progress, retry, cancel and checks for type and size.' }\n];\n\nconst cards = await Promise.all(releases.map((r) => slice.build('Card', {\n  title: r.title,\n  subtitle: `v${r.version} · ${r.date}`,\n  icon: 'star',\n  text: r.notes,\n  actions: [{\n    value: 'Read more', variant: 'ghost', icon: 'arrow-right',\n    onClick: async () => {\n      const modal = await slice.build('Modal', {\n        title: `Version ${r.version}: ${r.title}`,\n        description: r.date,\n        destroyOnClose: true,\n        content: r.notes,\n        actions: [{ value: 'Close', variant: 'ghost' }]\n      });\n      document.body.appendChild(modal);\n      await modal.show();\n    }\n  }]\n})));\n\nconst panel = await slice.build('ElementCarrousel', {\n  label: 'Release notes',\n  elements: cards,\n  indicators: 'count'\n});\npanel.style.cssText = 'width:100%;max-width:420px;min-width:0';\nreturn panel;"}];
  }

  async init() {
    this.markdownPath = "carrousel.md";
    this.markdownContent = "---\ntitle: ElementCarrousel\nroute: /docs/layout/element-carrousel\nnavLabel: Carrousel\nsection: Layout\ngroup: Containers\norder: 25\ndescription: A row of slides that moves one position at a time. Swipe, drag, arrows, the keyboard, dots, a count or thumbnails, several slides per view with a peek, loop, and autoplay that pauses itself.\ncomponent: ElementCarrouselDocumentation\ngenerate: true\ntags: [carrousel, carousel, slider, gallery, layout, navigation]\n---\n\n# ElementCarrousel\n\n## Overview\n`ElementCarrousel` shows a row of slides that moves one position at a time. A slide can hold anything: a picture, a [Card](/docs/layout/card), a testimonial, or any other component.\n\nThe row is a native scroll container with scroll snapping. A swipe on a phone, a trackpad flick and Shift+wheel all move it the way the platform does, and a mouse can drag it. Arrows, dots, the keyboard and autoplay move the same scroll.\n\n### When to use it\n- **A product gallery**: several photos of one thing, with thumbnails.\n- **A row of related items** that does not need to be seen all at once: \"Recommended for you\", \"Recently viewed\", courses or articles. Use several slides per view and a peek.\n- **Testimonials or quotes**: one at a time, moving by itself.\n\n### When not to use it\n- **Content everyone must see**, such as prices, terms or a main call to action. Few people look past the second slide, so put it on the page.\n- **Items people compare side by side.** Use a [Grid](/docs/layout/grid) or a [Table](/docs/data/table), which show them all at once.\n- **Steps of a process** that have to be done in order. Use a form with steps, or [Pagination](/docs/data/pagination) with `mode: 'dots'` under one Card.\n- **A long list.** Past about 10 slides a carousel is hard to browse. Use a grid with [Pagination](/docs/data/pagination).\n\n## Core Behavior\n\n### Slides\n- `elements` is an array of nodes (built components or plain elements) or strings. Each one becomes a slide.\n- Setting `elements` again replaces the slides. Components in slides that were dropped are destroyed. Elements passed again are kept as they are, with their state.\n- Every slide is announced as \"Slide 2 of 5\". Slides out of view are `inert`, so Tab never lands on something that cannot be seen.\n\n### Moving\n- **Arrows**: Previous and Next, disabled at the ends unless `loop` is on.\n- **Keyboard**: ← and → move one position; Home and End go to the first and the last. Arrows typed in a field inside a slide stay in the field.\n- **Touch and trackpad**: the native scroll, with snapping.\n- **Mouse**: drag the row. A quick flick goes one slide further. A drag never counts as a click on what it ends on.\n- `goTo(index)`, `next()` and `previous()` do the same from code.\n- `onChange(index, { previous })` and the `slide-change` event report every move. `index` is the first slide in view.\n\n### Several per view\n- `perView` is how many slides sit side by side. It can be a number, or an object keyed by the carousel's **own** width: `{ 0: 1, 560: 2, 900: 3 }`. The carousel's width is used, not the window's, so the same carousel works in a sidebar and in a page.\n- `gap` is the space between slides, in pixels (16 by default).\n- `peek` shows that many pixels of the next slide, as a hint that there is more.\n- `align: 'center'` puts the current slide in the middle, with the peek on both sides, and dims the slides around it.\n- When everything fits, there are no arrows and no dots.\n\n### Autoplay\n- `autoplay: true` moves every 5 seconds; a number sets the time in milliseconds. It goes back to the first slide after the last.\n- It stops while the pointer is over the carousel or the focus is in it, so nothing moves while someone reads or clicks.\n- A pause button is always shown with it (WCAG 2.2.2: anything that moves by itself can be paused).\n- With *reduce motion* on in the system, it never starts, and the button starts it on request.\n- While it plays, slides are not announced, so a screen reader is not interrupted every few seconds.\n\n## Looks\n- `arrows`:\n  - `'overlay'` (default): round buttons over the edges of the slides, hidden at the ends;\n  - `'outside'`: beside the row, for cards that should not be covered. Under 480px they move over the slides, so a phone keeps the width for the slides;\n  - `'none'`: no arrows, for a row moved by swiping or by the dots.\n- `indicators`:\n  - `'dots'` (default): one dot per position, built with [Pagination](/docs/data/pagination);\n  - `'count'`: \"2 / 5\";\n  - `'thumbnails'`: small buttons built by `thumbnail(slide, index)`, for galleries;\n  - `'none'`.\n- The CSS variables `--element-carrousel-accent` and `--element-carrousel-radius` adjust the current thumbnail, the focus ring and the corners.\n\n## Language\n- `label` names the carousel (\"Product photos\"). Give every carousel one.\n- `texts` replaces the other words:\n  - `label` (the default name);\n  - `slide` (`{index}`, `{total}`) and `announce` (`{index}`, `{total}`);\n  - `previous`, `next`, `goTo` (`{page}`);\n  - `play`, `pause`.\n\n## Live Preview\n:::component name=\"ElementCarrousel\"\n{\n  \"elements\": [\"First slide\", \"Second slide\", \"Third slide\", \"Fourth slide\"],\n  \"perView\": 2,\n  \"peek\": 40,\n  \"label\": \"Preview\"\n}\n:::\n\n## Examples\n:::script label=\"Product gallery with thumbnails\" expected=\"a product page: a photo gallery with thumbnails under it on one side, and the name, price, colour choice and Add to cart on the other; picking a colour moves the gallery to that photo\"\n// Pretend photos: a gradient and an icon stand in for real images.\nconst photos = [\n  { name: 'Front', colors: ['#1e3a8a', '#60a5fa'], icon: 'headphones', color: 'Navy' },\n  { name: 'Side', colors: ['#334155', '#94a3b8'], icon: 'headphones', color: 'Navy' },\n  { name: 'Case', colors: ['#7c2d12', '#fb923c'], icon: 'cart', color: 'Sunset' },\n  { name: 'Detail', colors: ['#14532d', '#4ade80'], icon: 'star', color: 'Forest' },\n  { name: 'In use', colors: ['#581c87', '#c084fc'], icon: 'user', color: 'Forest' }\n];\n\nconst picture = async (photo, size) => {\n  const box = document.createElement('div');\n  box.style.cssText = `display:grid;place-items:center;aspect-ratio:${size === 'thumb' ? 'auto' : '4 / 3'};\n    border-radius:${size === 'thumb' ? '6px' : '14px'};color:#fff;\n    background:linear-gradient(135deg, ${photo.colors[0]}, ${photo.colors[1]})`;\n  box.setAttribute('role', 'img');\n  box.setAttribute('aria-label', photo.name);\n  box.appendChild(await slice.build('Icon', { name: photo.icon, size: size === 'thumb' ? 'small' : '64px' }));\n  return box;\n};\n\nconst gallery = await slice.build('ElementCarrousel', {\n  label: 'Photos of Aria wireless headphones',\n  elements: await Promise.all(photos.map((p) => picture(p))),\n  indicators: 'thumbnails',\n  // Thumbnails are built from the photo data, not from the slides.\n  thumbnail: (_slide, i) => {\n    const t = document.createElement('div');\n    t.style.cssText = `width:100%;height:100%;background:linear-gradient(135deg, ${photos[i].colors[0]}, ${photos[i].colors[1]})`;\n    return t;\n  }\n});\n\nconst info = document.createElement('div');\ninfo.style.cssText = 'display:grid;gap:12px;align-content:start';\ninfo.innerHTML = `<div style=\"font-size:.8rem;opacity:.7\">Audio · Headphones</div>\n  <h3 style=\"margin:0\">Aria wireless headphones</h3>\n  <div style=\"font-size:1.4rem;font-weight:700\">$149</div>\n  <p style=\"margin:0;opacity:.8\">40 hours of battery, noise cancelling, and a case that folds flat.</p>`;\ninfo.prepend(await slice.build('Badge', { label: 'In stock', tone: 'success' }));\n\nconst colors = ['Navy', 'Sunset', 'Forest'];\nconst picker = document.createElement('div');\npicker.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';\nfor (const color of colors) {\n  picker.appendChild(await slice.build('Button', {\n    value: color, variant: 'outlined', size: 'sm',\n    // A colour shows its first photo.\n    onClick: () => gallery.goTo(photos.findIndex((p) => p.color === color))\n  }));\n}\ninfo.appendChild(picker);\ninfo.appendChild(await slice.build('Button', { value: 'Add to cart', icon: 'cart' }));\n\nconst page = document.createElement('div');\npage.style.cssText = 'width:100%;min-width:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;align-items:start';\npage.append(gallery, info);\nreturn page;\n:::\n\n:::script label=\"Recommended courses (several per view)\" expected=\"a 'Recommended for you' heading with a See all button, and a row of course Cards: one per view on a phone, two from 560px and three from 900px, with a peek of the next card and arrows beside the row; Enrol on a card changes its button to Enrolled\"\nconst courses = [\n  { title: 'Components from scratch', teacher: 'Ana Ruiz', hours: 6, level: 'Beginner', icon: 'code' },\n  { title: 'Accessible forms', teacher: 'Luis Pérez', hours: 4, level: 'Intermediate', icon: 'check' },\n  { title: 'Design tokens', teacher: 'María Gil', hours: 3, level: 'Beginner', icon: 'palette' },\n  { title: 'Testing with Playwright', teacher: 'Jorge Díaz', hours: 8, level: 'Advanced', icon: 'star' },\n  { title: 'Routing in an SPA', teacher: 'Ana Ruiz', hours: 5, level: 'Intermediate', icon: 'book-open' },\n  { title: 'Performance basics', teacher: 'Carla Soto', hours: 2, level: 'Beginner', icon: 'clock' }\n];\nconst tone = { Beginner: 'success', Intermediate: 'warning', Advanced: 'danger' };\n\nconst cards = await Promise.all(courses.map((course) => slice.build('Card', {\n  title: course.title,\n  subtitle: `${course.teacher} · ${course.hours} h`,\n  headerIcon: course.icon,\n  badge: { label: course.level, tone: tone[course.level] },\n  text: 'Short videos, exercises and a final project you can show.',\n  actions: [{\n    value: 'Enrol', size: 'sm',\n    onClick: ({ card }) => { card.actions = [{ value: 'Enrolled', icon: 'check', variant: 'soft', size: 'sm', disabled: true }]; }\n  }]\n})));\n\nconst row = await slice.build('ElementCarrousel', {\n  label: 'Recommended courses',\n  elements: cards,\n  perView: { 0: 1, 560: 2, 900: 3 },\n  peek: 48,\n  arrows: 'outside',\n  indicators: 'none'\n});\n\nconst header = document.createElement('div');\nheader.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px';\nheader.innerHTML = '<h3 style=\"margin:0\">Recommended for you</h3>';\nheader.appendChild(await slice.build('Button', { value: 'See all', variant: 'ghost', size: 'sm', icon: 'arrow-right' }));\n\nconst section = document.createElement('section');\nsection.style.cssText = 'width:100%;min-width:0';\nsection.append(header, row);\nreturn section;\n:::\n\n:::script label=\"Testimonials that move by themselves\" expected=\"a centred testimonial with the ones around it dimmed; it moves every 6 seconds and loops; hovering or focusing it holds it; a pause button and dots sit under it\"\nconst quotes = [\n  { text: 'We moved our dashboard in a week. The components just fit together.', name: 'Laura M.', role: 'Product lead' },\n  { text: 'The docs answer the question I have, with an example I can copy.', name: 'Pedro A.', role: 'Frontend developer' },\n  { text: 'Our forms finally work with a keyboard and a screen reader.', name: 'Sofía R.', role: 'Accessibility lead' },\n  { text: 'Small, fast and no build step. Exactly what our team needed.', name: 'Diego F.', role: 'CTO' }\n];\n\nconst slides = await Promise.all(quotes.map(async (q) => {\n  const card = await slice.build('Card', {\n    variant: 'filled',\n    headerIcon: 'quote',\n    title: q.name,\n    subtitle: q.role,\n    text: `“${q.text}”`\n  });\n  return card;\n}));\n\nconst testimonials = await slice.build('ElementCarrousel', {\n  label: 'What our customers say',\n  elements: slides,\n  align: 'center',\n  peek: 56,\n  loop: true,\n  autoplay: 6000,\n  onChange: (index) => { status.textContent = `Showing ${quotes[index].name}`; }\n});\n\nconst status = document.createElement('p');\nstatus.style.cssText = 'margin:8px 0 0;font-size:.8rem;opacity:.7;text-align:center';\nstatus.textContent = `Showing ${quotes[0].name}`;\n\nconst box = document.createElement('div');\nbox.style.cssText = 'width:100%;min-width:0';\nbox.append(testimonials, status);\nreturn box;\n:::\n\n:::script label=\"What's new, with a count\" expected=\"a release notes panel: one Card per release, a '1 / 4' count under it, overlay arrows; Read more on a card opens a Modal with the details\"\nconst releases = [\n  { version: '3.4', date: 'Oct 2026', title: 'Faster first load', notes: 'Templates are cached and styles load in parallel.' },\n  { version: '3.3', date: 'Sep 2026', title: 'Tooltips everywhere', notes: 'One provider for every tooltip in a page.' },\n  { version: '3.2', date: 'Aug 2026', title: 'New date picker', notes: 'Ranges, presets and the locale’s first day of the week.' },\n  { version: '3.1', date: 'Jul 2026', title: 'File uploads', notes: 'Progress, retry, cancel and checks for type and size.' }\n];\n\nconst cards = await Promise.all(releases.map((r) => slice.build('Card', {\n  title: r.title,\n  subtitle: `v${r.version} · ${r.date}`,\n  icon: 'star',\n  text: r.notes,\n  actions: [{\n    value: 'Read more', variant: 'ghost', icon: 'arrow-right',\n    onClick: async () => {\n      const modal = await slice.build('Modal', {\n        title: `Version ${r.version}: ${r.title}`,\n        description: r.date,\n        destroyOnClose: true,\n        content: r.notes,\n        actions: [{ value: 'Close', variant: 'ghost' }]\n      });\n      document.body.appendChild(modal);\n      await modal.show();\n    }\n  }]\n})));\n\nconst panel = await slice.build('ElementCarrousel', {\n  label: 'Release notes',\n  elements: cards,\n  indicators: 'count'\n});\npanel.style.cssText = 'width:100%;max-width:420px;min-width:0';\nreturn panel;\n:::\n\n## Best Practices\n:::tip\nGive every carousel a `label` that says what is in it (\"Product photos\", \"Recommended courses\"). Screen readers announce it when the focus enters.\n:::\n\n:::tip\nPrefer several slides per view with a `peek` for rows of items. People see at once that there is more, and can swipe to it, without hunting for arrows or dots.\n:::\n\n:::tip\nBuild slides with the data you already have, and keep that data next to them. Use `index` and `onChange` to find which item is on screen, instead of reading it back from the slide.\n:::\n\n## Pitfalls\n:::warning\nDo not hide the only copy of something important in a later slide. Most people never see past the second one.\n:::\n\n:::warning\nUse autoplay sparingly, and only for content that can be missed (quotes, highlights). Text that moves while someone reads it is hard to follow. The pause button, the hover hold and the reduced-motion check are there for that reason; do not hide them.\n:::\n\n:::warning\nInside a flex or grid item, give that item `min-width: 0`. Flex and grid items do not shrink below their content by default, and a row of slides is wider than any screen, so the page would scroll sideways.\n:::\n\n:::warning\nA slide's content fills its width. Do not give the elements fixed widths: they would overflow the slide on a phone. Use `perView` to decide how many fit instead.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"elements\": [\"First slide\", \"Second slide\", \"Third slide\", \"Fourth slide\"],\n  \"perView\": 2,\n  \"peek\": 40,\n  \"label\": \"Preview\"\n}") {
               try {
                  props = JSON.parse("{\n  \"elements\": [\"First slide\", \"Second slide\", \"Third slide\", \"Fourth slide\"],\n  \"perView\": 2,\n  \"peek\": 40,\n  \"label\": \"Preview\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('ElementCarrousel', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"elements\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"perView\",\"type\":\"any\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"gap\",\"type\":\"number\",\"required\":false,\"default\":\"16\",\"allowedValues\":[]},{\"path\":\"peek\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"align\",\"type\":\"string\",\"required\":false,\"default\":\"start\",\"allowedValues\":[]},{\"path\":\"loop\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"autoplay\",\"type\":\"any\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"arrows\",\"type\":\"string\",\"required\":false,\"default\":\"overlay\",\"allowedValues\":[]},{\"path\":\"indicators\",\"type\":\"string\",\"required\":false,\"default\":\"dots\",\"allowedValues\":[]},{\"path\":\"thumbnail\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"startIndex\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"elements\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"perView\",\"type\":\"any\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"gap\",\"type\":\"number\",\"required\":false,\"default\":\"16\",\"allowedValues\":[]},{\"path\":\"peek\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"align\",\"type\":\"string\",\"required\":false,\"default\":\"start\",\"allowedValues\":[]},{\"path\":\"loop\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"autoplay\",\"type\":\"any\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"arrows\",\"type\":\"string\",\"required\":false,\"default\":\"overlay\",\"allowedValues\":[]},{\"path\":\"indicators\",\"type\":\"string\",\"required\":false,\"default\":\"dots\",\"allowedValues\":[]},{\"path\":\"thumbnail\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"startIndex\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Card","path":"/docs/layout/card"},{"text":"Grid","path":"/docs/layout/grid"},{"text":"Table","path":"/docs/data/table"},{"text":"Pagination","path":"/docs/data/pagination"},{"text":"Pagination","path":"/docs/data/pagination"},{"text":"Pagination","path":"/docs/data/pagination"}];
         for (const [index, linkProps] of links.entries()) {
            const placeholder = this.querySelector('[data-inline-link="' + index + '"]');
            if (!placeholder) continue;
            const link = await slice.build('Link', linkProps);
            placeholder.replaceWith(link);
            this._inlineLinks.push(link);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

   beforeDestroy() {
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
   }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: '❐'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios — so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all — the divs
      // were never filled, nothing in the repo reads .script-block — the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
      const demobox = await slice.build('DemoBox', {
        label: scenario.label,
        expected: scenario.expected || ''
      });

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });

      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        demobox.clear();
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed var(--warning-color)';
          fallback.style.borderRadius = '8px';
          fallback.style.background = 'color-mix(in srgb, var(--primary-background-color) 85%, var(--warning-color))';
          fallback.style.color = 'var(--font-primary-color)';
          fallback.textContent = String(name || '')
            ? 'Component "' + String(name) + '" is not registered in this build yet.'
            : 'Requested component is not registered in this build yet.';
          return fallback;
        };

        const safeSlice = Object.create(slice);
        safeSlice.build = async (name, props) => {
          const built = await slice.build(name, props);
          if (built instanceof Node) {
            return built;
          }
          if (Array.isArray(built)) {
            const fragment = document.createDocumentFragment();
            let hasNode = false;
            built.forEach((item) => {
              if (item instanceof Node) {
                fragment.appendChild(item);
                hasNode = true;
              }
            });
            if (hasNode) {
              return fragment;
            }
          }
          return built ?? createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            demobox.appendDemo(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            demobox.appendDemo(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                demobox.appendDemo(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-elementcarrouseldocumentation', ElementCarrouselDocumentation);
