// The control that edits one value in place: which component to build (an
// Input of the right type, a Textarea, a DatePicker or a Select), with which
// props, and how to read its value back. Used by DescriptionList (a field)
// and Table (a cell), so `edit: { … }` means the same in both.
//
// edit: true, or { type, options, required, min, max, step, minlength,
//   maxlength, pattern, placeholder, searchable, validate(value, row), parse(value) }

import { toDate } from '../data/dates.js';

/** What each display type edits with, when `edit` does not say. */
export const EDIT_FOR_TYPE = {
   number: 'number',
   currency: 'number',
   percent: 'number',
   email: 'email',
   url: 'url',
   phone: 'tel',
   multiline: 'textarea',
   date: 'date',
   datetime: 'date',
   boolean: 'switch',
};

export const INPUT_KINDS = ['text', 'email', 'url', 'tel', 'number', 'password'];

/** Kinds that hold typed text: typing on the cell starts them, a blur saves them. */
export const TEXT_KINDS = [...INPUT_KINDS, 'textarea'];

/** `edit: true | 'number' | {…}` → an object, or null when not editable. */
export function normalizeEdit(edit) {
   if (edit === true) return {};
   if (typeof edit === 'string') return { type: edit };
   return edit && typeof edit === 'object' ? edit : null;
}

/** The control kind: what `edit.type` says, a select for options, else by display type. */
export function editKind(edit, type) {
   if (edit?.type) return edit.type;
   if (Array.isArray(edit?.options)) return 'select';
   return EDIT_FOR_TYPE[type] || 'text';
}

/** A value as 'YYYY-MM-DD' (local day), '' when it is not a date. */
export function isoDay(value) {
   const date = toDate(value);
   if (!date) return '';
   return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * The component to build and its props.
 * @param {{ kind: string, value: any, edit?: any, label: string, compact?: boolean,
 *   onEnter?: ((value: any, event: KeyboardEvent) => void) | null, onPick?: (() => void) | null }} options
 *   compact: the spreadsheet look (a ghost field that fills the cell);
 *   onEnter: Enter in an Input; onPick: a choice made in a Select or a DatePicker.
 * @returns {{ name: string, props: Record<string, any> }}
 */
export function controlFor({ kind, value, edit = {}, label, compact = false, onEnter = null, onPick = null }) {
   const common = { required: edit.required === true, size: 'sm', ...(compact ? { variant: 'ghost' } : {}) };
   if (kind === 'select') {
      const { variant, ...rest } = common;
      return {
         name: 'Select',
         props: {
            ...rest,
            options: edit.options || [],
            selected: value ?? null,
            searchable: edit.searchable === true,
            label: '',
            ...(onPick ? { onChange: () => onPick() } : {}),
         },
      };
   }
   if (kind === 'textarea') {
      return {
         name: 'Textarea',
         props: {
            ...common, value: value ?? '', ariaLabel: label, autoGrow: true, rows: compact ? 2 : 3,
            placeholder: edit.placeholder || '', maxlength: edit.maxlength,
         },
      };
   }
   if (kind === 'date') {
      return {
         name: 'DatePicker',
         props: { ...common, value: isoDay(value), ariaLabel: label, min: edit.min, max: edit.max, ...(onPick ? { onChange: () => onPick() } : {}) },
      };
   }
   return {
      name: 'Input',
      props: {
         ...common,
         type: INPUT_KINDS.includes(kind) ? kind : 'text',
         value: value ?? '',
         ariaLabel: label,
         placeholder: edit.placeholder || '',
         min: edit.min, max: edit.max, step: edit.step,
         minlength: edit.minlength, maxlength: edit.maxlength, pattern: edit.pattern,
         validateOn: 'manual',
         onEnter,
      },
   };
}

/**
 * The value in a control, as it should be stored: a number for a number, a
 * trimmed text, null for nothing; `edit.parse` has the last word.
 */
export function readControl(control, kind, edit = {}) {
   if (!control) return undefined;
   const value = kind === 'select' ? control.selected : control.value;
   if (typeof edit?.parse === 'function') return edit.parse(value);
   if (kind === 'number') return value === '' || value === null ? null : Number(value);
   if (typeof value === 'string' && kind !== 'textarea') return value.trim();
   return value === '' ? null : value;
}

/**
 * Check a value before it is saved: the control's own rules first (it shows
 * them), then `edit.validate(value, row)`. Returns a message, '' when fine,
 * or null when the control already said what is wrong.
 */
export function validateValue(control, value, edit, row) {
   if (control?.validate && control.validate() === false) return null;
   return (typeof edit?.validate === 'function' && edit.validate(value, row)) || '';
}

/** The label of a Select option for a value (what a cell shows instead of the raw value). */
export function optionLabel(options, value) {
   for (const option of options || []) {
      if (option && typeof option === 'object') {
         if (Array.isArray(option.options)) {
            const inner = optionLabel(option.options, value);
            if (inner !== undefined) return inner;
            continue;
         }
         const optionValue = option.value ?? option.id ?? option.label;
         if (optionValue === value) return String(option.label ?? option.text ?? optionValue);
      } else if (option === value) {
         return String(option);
      }
   }
   return undefined;
}
