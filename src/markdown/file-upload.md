---
title: FileUpload
route: /docs/input/file-upload
navLabel: FileUpload
section: Input Components
group: Basic
order: 12
description: Drag-and-drop zone that is also a real, keyboard-operable file input.
component: FileUploadDocumentation
generate: true
tags: [file, upload, dropzone, drop, input]
---

# FileUpload

## Overview

A drop zone for files that works with a mouse, a finger and a keyboard. The zone is a `<label>`
wrapping a real `<input type="file">`, so the browser gives you click-to-open, focus and
Enter/Space for free — none of which a clickable `<div>` would have.

## API

- `accept` (string) — extensions or MIME types, e.g. `'image/*,.png'`. Empty means anything.
- `multiple` (boolean) — allow more than one file.
- `disabled` (boolean)
- `prompt` (string, default `'Drag files here, or click to choose'`)
- `hint` (string) — small print under the prompt, e.g. the size limit.
- `icon` (string, default `'upload'`) — an `Icon` name; empty renders no glyph.
- `list` (boolean) — show the picked files under the zone.
- `onFiles` (function) — called as `onFiles(filesArray, fileList)`

The input is cleared after every pick, so choosing the **same** file twice still fires `onFiles`
instead of silently doing nothing.

## Prop Scenarios

:::script label="Images only" expected="a drop zone that says PNG or JPG"
return await slice.build('FileUpload', {
  accept: 'image/*',
  prompt: 'Drag images here, or click to choose',
  hint: 'PNG or JPG, up to 5 MB each',
});
:::

:::script label="Multiple documents" expected="a wider zone for a document drop"
return await slice.build('FileUpload', {
  accept: '.pdf,.docx,.xlsx',
  multiple: true,
  prompt: 'Drop your documents',
  hint: 'PDF, DOCX or XLSX',
  icon: 'file-lines',
});
:::

:::script label="Disabled" expected="a dimmed zone that accepts nothing"
return await slice.build('FileUpload', {
  disabled: true,
  prompt: 'Uploads are closed for this project',
});
:::

## Best Practices

:::tip
Validate the files in `onFiles` rather than relying on `accept`: it is only a picker hint, and a user
can still drop anything. Check type and size there, and tell them what you rejected.
:::

## Pitfalls

:::warning
`accept` filters the picker, not the drop handler. A file dragged onto the zone is **not** filtered
by it — always re-check `files` yourself.
:::