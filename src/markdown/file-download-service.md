---
title: FileDownloadService
route: /docs/services/file-download-service
navLabel: FileDownloadService
section: Services
group: Storage
order: 11
description: Saves a string or Blob to the user's device, with the object URL lifecycle handled for you.
component: FileDownloadServiceDocumentation
generate: true
tags: [service, download, file, blob, export]
---

# FileDownloadService

## Overview

`FileDownloadService` is a **Service** component: a plain logic class (no DOM, no template) that
saves content to the user's device as a file.

It exists because the "save a file from JS" snippet is short, easy to get subtly wrong, and gets
copy-pasted into every app. Build it once with a `sliceId` and call it:

```javascript title="Build the service"
const downloads = await slice.build('FileDownloadService', { sliceId: 'FileDownloadService' });
```

## API

- `download(filename, content, mimeType = 'text/plain')` — saves `content` as `filename`.
- `open(content, mimeType = 'text/plain')` — opens the content in a new tab instead of saving it.

`content` may be a `string` or a ready-made `Blob`. When it is a `Blob`, the `mimeType` argument is
ignored — a `Blob` already carries its own type.

## Usage

```javascript title="Export some data"
const downloads = await slice.build('FileDownloadService', { sliceId: 'FileDownloadService' });

downloads.download(
  'report.json',
  JSON.stringify({ rows }, null, 2),
  'application/json'
);
```

```javascript title="Download a Blob you already have"
const blob = new Blob([csv], { type: 'text/csv' });
downloads.download('export.csv', blob);
```

```javascript title="Preview a PDF instead of saving it"
downloads.open(pdfBlob, 'application/pdf');
```

:::script label="Save a file" expected="clicking either button saves a file to your device"
const downloads = await slice.build('FileDownloadService', { singleton: true });

const wrap = document.createElement('div');
wrap.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-family:system-ui,sans-serif;';

const rows = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
  { id: 3, name: 'Katherine' },
];

wrap.appendChild(await slice.build('Button', {
  value: 'Download .json',
  onClick: () => downloads.download('people.json', JSON.stringify(rows, null, 2), 'application/json'),
}));

wrap.appendChild(await slice.build('Button', {
  value: 'Download .csv',
  variant: 'outlined',
  onClick: () => downloads.download(
    'people.csv',
    ['id,name', ...rows.map((r) => `${r.id},${r.name}`)].join('\n'),
    'text/csv'
  ),
}));

mount(wrap);
:::

## Best Practices

:::tip
Pass the `mimeType` even when the browser would guess from the extension. It decides whether the
saved file opens in a text editor, a spreadsheet or an image viewer, and a wrong type is confusing
in a way a wrong name is not.
:::

## Pitfalls

:::warning
Never revoke the object URL yourself after calling `download`. The service already revokes it after
a short delay, and revoking it immediately cancels the download in some browsers — the navigation
has not started yet.

:::

:::warning
For a file larger than a few tens of MB, `Blob` + `URL.createObjectURL` is the only thing that
works: a base64 `data:` URL has to fit in a string, and browser string limits are far below what
that sounds like. Past that size, stream it from a server instead.
:::
