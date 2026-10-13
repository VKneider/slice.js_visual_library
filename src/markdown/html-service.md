---
title: HtmlService
route: /docs/services/html-service
navLabel: HtmlService
section: Services
group: Security
order: 12
description: Escape, sanitize and strip HTML at the boundary where untrusted markup becomes real DOM.
component: HtmlServiceDocumentation
generate: true
tags: [service, html, sanitize, xss, security, dompurify, escape]
---

# HtmlService

## Overview

`HtmlService` is a **Service** component: a plain logic class (no DOM, no template) that makes it
safe to turn an HTML **string** into real markup.

Most of the library never needs it, and that is the point — every visual component here assigns
`textContent`, so it cannot produce markup injection at all. Reach for this service only at the
**boundary where HTML you did not write enters your app**: a CMS field, a markdown renderer, a
template someone imports, a comment left by another user.

## Requires an npm dependency

This is the one component in the library that is not dependency-free:

```bash
pnpm add dompurify
```

`slice get HtmlService` prints a warning naming the package if it is missing.

## Three layers, in increasing paranoia

| Method | Use for | Allowlist |
| --- | --- | --- |
| `esc(value)` | each dynamic token as you interpolate it | encodes 5 characters |
| `sanitize(html, options?)` | HTML **you** built | DOMPurify's defaults: structure, links, images, tables, forms |
| `sanitizeRichText(html, options?)` | HTML **someone else** wrote | bold/italic/lists/paragraphs/links only. No images. |
| `toText(html)` | you want the words, not the markup | none — tags stripped, text kept |

`sanitize()` is the net *underneath* `esc()`, not a replacement for it. Encode as you interpolate,
sanitize as the final gate before the `innerHTML` assignment.

## Usage

```javascript title="Sanitizing HTML you built"
const html = slice.getComponent('HtmlService');
this.$root.innerHTML = html.sanitize(`<p>${html.esc(user.bio)}</p>`);
```

```javascript title="Sanitizing HTML someone else wrote"
const html = slice.getComponent('HtmlService');
this.$banner.innerHTML = html.sanitizeRichText(importedTemplate.bienvenida);
```

## Prop Scenarios

:::script label="What each layer keeps" expected="three renderings of the same hostile input; the tracker pixel and the onerror handler do not survive"
const html = await slice.build('HtmlService', { singleton: true });

// Deliberately hostile input: a tracking pixel, an event handler, and a
// javascript: link — the three things that actually show up in real payloads.
const hostile = '<p>Hi <b>there</b></p>'
   + '<img src="https://tracker.example/pixel.gif">'
   + '<span onclick="alert(1)">click</span>'
   + '<a href="javascript:alert(2)">link</a>';

const render = (label, value) => {
   const box = document.createElement('div');
   box.style.cssText = 'font-family:system-ui,sans-serif;margin-bottom:14px;';

   const h = document.createElement('strong');
   h.textContent = label;
   box.appendChild(h);

   const out = document.createElement('div');
   out.style.cssText = 'padding:8px;border:1px dashed var(--medium-color);border-radius:6px;margin-top:4px;font-size:.85rem;';
   out.innerHTML = value;
   box.appendChild(out);

   const raw = document.createElement('code');
   raw.style.cssText = 'display:block;margin-top:4px;font-size:.7rem;color:var(--font-secondary-color);word-break:break-all;';
   raw.textContent = value;
   box.appendChild(raw);

   return box;
};

const wrap = document.createElement('div');
wrap.appendChild(render('sanitize() — HTML you built', html.sanitize(hostile)));
wrap.appendChild(render('sanitizeRichText() — HTML someone else wrote', html.sanitizeRichText(hostile)));
wrap.appendChild(render('toText() — just the words', html.toText(hostile)));
mount(wrap);
:::

:::script label="Links in foreign content are forced open safely" expected="the link opens in a new tab with rel=noopener, so shared content cannot reach back into this tab"
const html = await slice.build('HtmlService', { singleton: true });

const out = document.createElement('div');
out.innerHTML = html.sanitizeRichText('<p>Read the <a href="https://example.com">docs</a>.</p>');

const note = document.createElement('p');
note.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);margin-top:10px;';
note.textContent = 'Every anchor gets target="_blank" and rel="noopener noreferrer nofollow".';

const wrap = document.createElement('div');
wrap.appendChild(out);
wrap.appendChild(note);
mount(wrap);
:::

## Best Practices

:::tip
Sanitize at the boundary, once, when the value enters — not at every render site. Then the value is
just data for the rest of its life, and a new render path cannot forget to sanitize.
:::

:::tip
`sanitize()` already passes inline SVG through unchanged, including `viewBox` and `path`. There is
no need to widen the tag or attribute allowlist to make icons work — doing so only widens the
attack surface.
:::

## Pitfalls

:::warning
`innerHTML = value` with an unsanitized `value` is an XSS hole even when the value "only" comes
from your own database: anything that writes to it — a form field, an import, a support tool — turns
it into a hole too. `sanitize()` at the boundary closes all of them at once.

:::

:::warning
Do not use `sanitize()` on content written by someone else. It allows `<img>`, so
`<img src="https://tracker.example/pixel.gif">` survives — and that leaks the reader's IP address
and User-Agent the moment the page renders, with nothing visible on screen. Use
`sanitizeRichText()`, which drops images entirely. Links are kept on purpose: an `<a href>` only
reaches its destination when the reader deliberately clicks it, and the destination is visible
first.

:::

:::warning
`sanitizeRichText()` drops tags but **keeps their text**, so a stripped `<img>` simply disappears
while `<script>alert(1)</script>` leaves `alert(1)` as visible text. That is DOMPurify's
`KEEP_CONTENT` behaviour, not a bug — but if you are rendering user comments, use `toText()`.

:::

:::warning
Sanitizing is not the same as validating. `sanitize()` guarantees the string is safe to become
markup; it says nothing about whether the content is *correct*. Check the shape of the data too.
:::
