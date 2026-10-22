---
title: DatePicker
route: /docs/input/datepicker
navLabel: DatePicker
section: Input Components
group: Basic
order: 16
description: Date field with a calendar. People can type the date or pick it. Supports ranges over two months, min / max and disabled days, presets, an inline calendar, the full keyboard pattern and the same field styling and validation as Input.
component: DatePickerDocumentation
generate: true
tags: [datepicker, date, calendar, range, forms]
---

# DatePicker

## Overview
`DatePicker` is a date field with a calendar. People can do either of two things:
- **type the date** in the order their locale writes it (`21/10/2026` in `es-VE`, `10/21/2026` in `en-US`) or as ISO (`2026-10-21`);
- **pick it** from a calendar that opens under the field.

It is the same field as [Input](/docs/input/input): the same label (floating or above), variants, sizes, help, errors and ✕ to clear, and the same rule for errors. An empty field is never flagged on its own; `required` waits for `validate()` or the Form's submit.

The value is **ISO text** (`'2026-10-21'`), never a `Date`. A picked day is a day on a calendar, not an instant in time, and turning it into one is how pickers end up showing the day before. When you do need a `Date`, `valueAsDate` gives you one at local midnight.

## Core Behavior
- `value`: `'2026-10-21'`, a `Date`, or `''` for none. In range mode (`mode: 'range'`), it is `{ start, end }`. Reading `value` always gives ISO text back.
- `onChange(value, { valueAsDate })` and the `date-change` event (`detail: { value, valueAsDate }`) report every change, including ✕ (which reports `''`).
- `name` puts a hidden input in the field, so a plain `<form>` posts it. Its value is the ISO date, or `start/end` for a range (the ISO 8601 interval).
- `onOpenChange(open)` tells you when the calendar opens and closes.

### Typing
- Focusing the field turns the readable text (`Oct 21, 2026`) into the typed form (`10/21/2026`), and the placeholder shows the order (`mm/dd/yyyy`).
- Any separator works (`/`, `-`, `.`, a space), and a two-digit year means this century. In a range, type the two dates with a dash between them.
- **Enter** or leaving the field sets what was typed. Text that is not a date says "Enter a valid date" and keeps the previous value.

### The calendar
- The ▾ button, a click on the field or **↓** opens it, with the focus on the selected day (or today).
- The title opens a month view, and the month view's title opens a year view, to jump far without paging.
- The week starts where the locale starts it (Sunday in `en-US`, Monday in most of Europe and Latin America). `weekStartsOn` (0 is Sunday) overrides it.
- `showToday` (default `true`) adds a **Today** button, and `clearable` a **Clear** one.
- On a phone, the calendar opens as a sheet at the bottom of the screen.

### Keyboard
The calendar follows the WAI-ARIA date grid pattern:
- **← →** move a day, and **↑ ↓** move a week.
- **PageUp / PageDown** move a month, or a year with **Shift**.
- **Home / End** go to the start and end of the week.
- **Enter** or **Space** picks the day, and the focus goes back to the field.
- **Escape** closes the calendar without picking.

### Days that cannot be picked
- `min` and `max` are ISO dates, or `'today'`. Days outside them are greyed out, and the arrows stop paging past them.
- `disabledDates` is a list of ISO dates, or a function `(iso, date) => boolean` for rules ("every 25th", "days the shop is closed").
- `disableWeekends` disables Saturdays and Sundays.
- A disabled day stays in the grid, so the arrow keys can move over it, but it cannot be picked. A typed date that falls on one gets a message that says why: "Pick a date on or after Oct 10, 2026" or "That date is not available".

## Ranges
- `mode: 'range'` picks a start and an end. The first click sets the start. The second sets the end, and the two are swapped if the end comes first.
- While the end is being picked, the calendar previews the range under the pointer and shows how many days it covers.
- `months: 2` shows two months side by side, which makes a range across a month boundary one look instead of paging.
- A range with a start but no end does not validate ("Pick an end date").

## Presets
`presets` puts quick picks beside the calendar: `[{ label, value }]`.
- `value` is an ISO date (or `'today'`), a `{ start, end }` range, or a function `({ today }) => value`, which is worked out each time the calendar opens.
- The preset that matches the current value is highlighted.

## Inline
`inline: true` shows the calendar on the page with no field, which suits a booking page or a dashboard. It stays open, and `onChange` fires on every pick.

## Looks
- `variant`: `'outlined'` (default), `'filled'` or `'ghost'`.
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- `labelPlacement`: `'floating'` (default) or `'above'`.
- `format` is the `Intl.DateTimeFormat` options used for the readable text, for example `{ dateStyle: 'full' }` or `{ day: 'numeric', month: 'long' }`.

## Language
- `locale` sets the language and the date order. By default it is the page's `lang`, then the browser's.
- `messages` replaces the error texts: `required`, `invalid`, `min`, `max`, `disabled`, `incomplete` and `order`.
- `texts` replaces every word the calendar shows or reads out: `today`, `clear`, `chooseDate`, `clearDate`, `calendar`, `previousMonth`, `nextMonth`, `previousYear`, `nextYear`, `previousYears`, `nextYears`, `chooseMonth` (`{month}`), `chooseYear` (`{year}`), `pickStart`, `pickEnd`, `days` (`{n}`) and `quickPicks`.

## Inside a Form
In a [Form](/docs/input/form) schema, use `component: 'DatePicker'`. The Form puts the label above and shows the error under the field. It also sets `required` and checks the field on submit, as it does for Input. `getValues()` returns the ISO date, or `{ start, end }` for a range.

## Live Preview
:::component name="DatePicker"
{
  "label": "Due date",
  "help": "Type it or pick it",
  "clearable": true
}
:::

## Examples
:::script label="Book a stay" expected="a two-month range calendar where booked nights are crossed out; the summary counts nights and the price; Book opens a Modal to confirm and a toast confirms the booking"
const toasts = await slice.build('ToastProvider', { singleton: true });
// Local calendar days as ISO text ('en-CA' writes YYYY-MM-DD).
const plus = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toLocaleDateString('en-CA'); };
const next = (day) => { const d = new Date(day + 'T00:00'); d.setDate(d.getDate() + 1); return d.toLocaleDateString('en-CA'); };
const nightsBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const PRICE = 128;

// Nights someone else already booked.
const booked = new Set([plus(6), plus(7), plus(8), plus(15), plus(22), plus(23)]);

const stay = await slice.build('DatePicker', {
  label: 'Check-in – check-out',
  mode: 'range',
  months: 2,
  min: 'today',
  max: plus(180),
  disabledDates: (day) => booked.has(day),
  presets: [
    { label: 'This weekend', value: ({ today }) => {
      const toFri = (5 - new Date(today + 'T00:00').getDay() + 7) % 7;
      return { start: plus(toFri), end: plus(toFri + 2) };
    } },
    { label: 'One week', value: () => ({ start: plus(1), end: plus(8) }) }
  ],
  help: 'Crossed-out nights are already booked',
  onChange: (value) => render(value)
});

const summary = document.createElement('div');
summary.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border:1px solid var(--slice-border-raised);border-radius:12px';
const text = document.createElement('div');
const book = await slice.build('Button', { value: 'Book', icon: 'calendar-month', disabled: true, onClick: () => confirm() });
summary.append(text, book);

function render({ start, end }) {
  const nights = start && end ? nightsBetween(start, end) : 0;
  const clash = nights && [...booked].some((d) => d >= start && d < end);
  text.innerHTML = nights
    ? `<strong>${nights} night${nights > 1 ? 's' : ''}</strong> · $${nights * PRICE}${clash ? ' <span style="color:var(--slice-danger)">— includes a booked night</span>' : ''}`
    : '<span style="opacity:.7">Pick your check-in and check-out</span>';
  book.disabled = !nights || clash;
}
render(stay.value);

async function confirm() {
  const { start, end } = stay.value;
  const fmt = (d) => new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const modal = await slice.build('Modal', {
    title: 'Confirm your stay',
    icon: 'calendar-month',
    destroyOnClose: true,
    content: `${fmt(start)} → ${fmt(end)} · ${nightsBetween(start, end)} nights · $${nightsBetween(start, end) * PRICE}`,
    actions: [{ value: 'Cancel', variant: 'ghost' }, { value: 'Book' }]
  });
  document.body.appendChild(modal);
  const { returnValue } = await modal.show();
  if (returnValue !== 'Book') return;
  for (let d = start; d < end; d = next(d)) booked.add(d);
  stay.value = { start: '', end: '' };
  render(stay.value);
  toasts.show('Booked — see you soon', { type: 'success' });
}

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:14px;width:100%;max-width:460px';
box.append(stay, summary);
return box;
:::

:::script label="An invoice" expected="a two-column Form; changing the issue date or the terms moves the due date; a due date before the issue date is refused on submit; Create invoice confirms with a toast"
const toasts = await slice.build('ToastProvider', { singleton: true });
// Local calendar days as ISO text ('en-CA' writes YYYY-MM-DD).
const addDays = (day, n) => { const d = new Date(day + 'T00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
const today = new Date().toLocaleDateString('en-CA');
const TERMS = { 'On receipt': 0, 'Net 15': 15, 'Net 30': 30, 'Net 60': 60 };

const form = await slice.build('Form', {
  columns: 2,
  submitText: 'Create invoice',
  schema: [
    { kind: 'field', name: 'client', label: 'Client', component: 'Input', required: true, full: true },
    { kind: 'field', name: 'issued', label: 'Issue date', component: 'DatePicker', required: true, value: today,
      props: { onChange: () => syncDue() } },
    { kind: 'field', name: 'terms', label: 'Payment terms', component: 'Select', value: 'Net 30',
      props: { options: Object.keys(TERMS), onChange: () => syncDue() } },
    { kind: 'field', name: 'due', label: 'Due date', component: 'DatePicker', required: true, value: addDays(today, 30),
      props: { help: 'Follows the terms; you can change it' } },
    { kind: 'field', name: 'amount', label: 'Amount', component: 'Input', required: true, props: { type: 'number', prefix: '$', min: 1 } }
  ],
  onSubmit: (values) => {
    if (values.due < values.issued) {   // ISO text compares as dates
      form.setError('due', 'The due date is before the issue date');
      return;
    }
    toasts.show(`Invoice for ${values.client}: $${values.amount}, due ${values.due}`, { type: 'success' });
  }
});

// The due date follows the issue date and the terms.
function syncDue() {
  const { issued, terms } = form.getValues();
  if (issued) form.setValue('due', addDays(issued, TERMS[terms] ?? 30));
}

return form;
:::

:::script label="Orders in a period" expected="a range with presets (Today, Last 7 days, This month…) filters the Table; the badge counts the orders and the total updates"
const day = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };
const customers = ['Ana Pérez', 'Luis Gómez', 'María Rojas', 'José Díaz', 'Carla Ruiz', 'Pedro León'];
const orders = Array.from({ length: 40 }, (_, i) => ({
  id: 1040 - i,
  date: day(-Math.floor(i * 1.6)),
  customer: customers[i % customers.length],
  total: 20 + ((i * 37) % 180)
}));

const table = await slice.build('Table', {
  columns: [
    { key: 'id', label: 'Order', render: (row) => `#${row.id}` },
    { key: 'date', label: 'Date', sortable: true, render: (row) => new Date(row.date + 'T00:00').toLocaleDateString() },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total', render: (row) => `$${row.total}` }
  ],
  rows: orders,
  rowKey: 'id'
});
table.style.width = '100%';

const count = await slice.build('Badge', { variant: 'accent', value: orders.length });
const total = document.createElement('strong');

const period = await slice.build('DatePicker', {
  label: 'Period',
  mode: 'range',
  months: 2,
  max: 'today',
  size: 'sm',
  presets: [
    { label: 'Today', value: ({ today }) => ({ start: today, end: today }) },
    { label: 'Last 7 days', value: () => ({ start: day(-6), end: day(0) }) },
    { label: 'Last 30 days', value: () => ({ start: day(-29), end: day(0) }) },
    { label: 'This month', value: ({ today }) => ({ start: today.slice(0, 8) + '01', end: today }) }
  ],
  onChange: () => filter()
});
period.style.width = '300px';

function filter() {
  const { start, end } = period.value;
  const rows = start && end ? orders.filter((o) => o.date >= start && o.date <= end) : orders;
  table.rows = rows;
  count.value = rows.length;
  total.textContent = `$${rows.reduce((sum, o) => sum + o.total, 0)}`;
}
filter();

const bar = document.createElement('div');
bar.style.cssText = 'display:flex;align-items:center;gap:14px;flex-wrap:wrap';
const label = document.createElement('span');
label.textContent = 'Orders';
bar.append(period, label, count, total);

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:14px;width:100%';
box.append(bar, table);
return box;
:::

:::script label="Pick an appointment (in Spanish)" expected="an inline calendar in Spanish that starts on Monday; weekends and holidays are disabled; picking a day lists its free times, and a time confirms the appointment"
const toasts = await slice.build('ToastProvider', { singleton: true });
const holidays = ['12-24', '12-25', '12-31', '01-01'];   // every year
const taken = { 9: true, 11: true, 15: true };            // hours already booked, for the demo

const calendar = await slice.build('DatePicker', {
  inline: true,
  locale: 'es-VE',
  weekStartsOn: 1,   // Venezuela starts the week on Sunday; this calendar starts it on Monday
  min: 'today',
  disableWeekends: true,
  disabledDates: (day) => holidays.includes(day.slice(5)),
  texts: {
    today: 'Hoy', clear: 'Borrar', calendar: 'Elegir fecha', previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente',
    previousYear: 'Año anterior', nextYear: 'Año siguiente', previousYears: 'Años anteriores', nextYears: 'Años siguientes',
    chooseMonth: '{month}, elegir mes', chooseYear: '{year}, elegir año'
  },
  showToday: false,
  onChange: (day) => showTimes(day)
});

const side = document.createElement('div');
side.style.cssText = 'display:grid;align-content:start;gap:10px;min-width:200px';
const heading = document.createElement('strong');
const times = document.createElement('div');
times.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:8px';
side.append(heading, times);

async function showTimes(day) {
  // The old buttons are Slice components: destroy them before building new ones.
  slice.controller.destroyByContainer(times);
  times.replaceChildren();
  if (!day) { heading.textContent = 'Elige un día'; return; }
  heading.textContent = new Date(day + 'T00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });
  for (const hour of [8, 9, 10, 11, 14, 15, 16]) {
    const label = `${hour}:00`;
    times.appendChild(await slice.build('Button', {
      value: label,
      variant: 'outlined',
      size: 'sm',
      disabled: !!taken[hour],
      onClick: () => toasts.show(`Cita confirmada: ${heading.textContent}, ${label}`, { type: 'success' })
    }));
  }
}
showTimes('');

const box = document.createElement('div');
box.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start';
box.append(calendar, side);
return box;
:::

:::script label="Looks at a glance" expected="the three variants, the three sizes, the label above, a readonly and a disabled field, and a custom format"
const box = document.createElement('div');
box.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;width:100%';
const today = new Date();
for (const variant of ['outlined', 'filled', 'ghost']) {
  box.appendChild(await slice.build('DatePicker', { label: `${variant}`, variant, value: today }));
}
for (const size of ['sm', 'md', 'lg']) {
  box.appendChild(await slice.build('DatePicker', { label: `size ${size}`, size }));
}
box.appendChild(await slice.build('DatePicker', { label: 'Label above', labelPlacement: 'above', help: 'With help under it' }));
box.appendChild(await slice.build('DatePicker', { label: 'Readonly', readonly: true, value: today }));
box.appendChild(await slice.build('DatePicker', { label: 'Disabled', disabled: true }));
box.appendChild(await slice.build('DatePicker', { label: 'Full format', value: today, format: { dateStyle: 'full' } }));
return box;
:::

## Best Practices
:::tip
Keep the value as ISO text all the way to the server. `'2026-10-21'` sorts, compares and stores as it is, and it means the same day in every time zone. Turn it into a `Date` only to do date arithmetic: `new Date(day + 'T00:00')` is local midnight, and `toLocaleDateString('en-CA')` turns it back into ISO text.
:::

:::tip
Use `months: 2` for ranges. Most stays, trips and report periods cross a month boundary, and seeing both months saves paging back and forth.
:::

:::tip
Give report filters presets ("Last 7 days", "This month"). They are what people pick most of the time, and a function preset stays right tomorrow.
:::

:::tip
For a birth date or another date far in the past, people type faster than they page. Leave the field typeable, set the placeholder order with `locale`, and let the year view handle the rest.
:::

## Pitfalls
:::warning
Do not build the value with `new Date('2026-10-21')` and then `getDate()`. That string is read as UTC midnight, which is still the 20th in the Americas. Use `valueAsDate` (local midnight) or work with the ISO text.
:::

:::warning
`disabledDates` as a function runs for every day drawn, which is 42 times per month shown. Keep it to a lookup (a `Set`, a comparison) and fetch what it needs beforehand, not inside it.
:::

:::warning
Disabling days does not validate what the server receives. A date can still be typed, sent from code or posted by hand. Check `min`, `max` and availability on the server too.
:::