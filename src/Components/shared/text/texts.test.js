import test from 'node:test';
import assert from 'node:assert/strict';
import { texts } from './texts.js';

const DEFAULTS = {
   en: { title: 'Page Not Found', home: 'Go Home' },
   es: { title: 'Página no encontrada', home: 'Ir al inicio' }
};

test('translator off: the English default, and the key when there is no default', () => {
   delete globalThis.slice;
   const t = texts('test.notFound.off', DEFAULTS);

   assert.equal(t('title'), 'Page Not Found');
   assert.equal(t('nope'), 'test.notFound.off.nope');
});

test('translator on: defaults are registered at the lowest layer and t() reads the locale', () => {
   const added = [];
   globalThis.slice = {
      translator: {
         enabled: true,
         add: (locale, messages, options) => added.push({ locale, messages, options }),
         t: (key) => (key === 'test.notFound.on.title' ? 'No encontrada' : key)
      }
   };

   const t = texts('test.notFound.on', DEFAULTS);
   assert.equal(t('title'), 'No encontrada');
   assert.deepEqual(added, [
      { locale: 'en', messages: { test: { notFound: { on: { title: 'Page Not Found', home: 'Go Home' } } } }, options: { defaults: true } },
      { locale: 'es', messages: { test: { notFound: { on: { title: 'Página no encontrada', home: 'Ir al inicio' } } } }, options: { defaults: true } }
   ]);

   // The namespace is registered once, not on every call.
   texts('test.notFound.on', DEFAULTS);
   assert.equal(added.length, 2);

   delete globalThis.slice;
});

test('translator on but the key is missing: the English default still shows', () => {
   globalThis.slice = {
      translator: {
         enabled: true,
         add: () => {},
         t: (key) => key
      }
   };

   const t = texts('test.notFound.fallback', DEFAULTS);
   assert.equal(t('home'), 'Go Home');
   delete globalThis.slice;
});

test('nested defaults fall back through the dotted path', () => {
   delete globalThis.slice;
   const t = texts('test.table', {
      en: { operators: { contains: 'contains', is: 'is' } },
      es: { operators: { contains: 'contiene', is: 'es' } }
   });

   assert.equal(t('operators.contains'), 'contains');
   assert.equal(t('operators.is'), 'is');
   assert.equal(t('operators.nope'), 'test.table.operators.nope');
});

test('the English fallback wins over a registered translation that returns the key', () => {
   globalThis.slice = {
      translator: {
         enabled: true,
         add: () => {},
         // A key with a nested branch: the translator returns it unchanged when missing.
         t: (key) => key
      }
   };

   const t = texts('test.table.on', {
      en: { operators: { contains: 'contains' } },
      es: { operators: { contains: 'contiene' } }
   });

   assert.equal(t('operators.contains'), 'contains');
   delete globalThis.slice;
});
