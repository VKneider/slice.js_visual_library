# Property Mangling Bug — Slice.js Production Build

## ¿Qué es?

Terser (el minificador usado en `slice build`) tiene una opción de **property mangling**: renombra propiedades de objetos a nombres cortos (`a`, `b`, `c`, `D`, `E`, etc.) para reducir tamaño.

El regex que determina qué propiedades manglear está en `buildProduction.js:285`:

```js
mangle: {
  properties: {
    regex: /^(slice|_|\$|on[A-Z]|get|set|has|is)/
  }
}
```

Esto significa: toda propiedad que empiece con `slice`, `_`, `$`, `on[A-Z]`, `get`, `set`, `has` o `is` **va a ser renombrada**, a menos que esté explícitamente en la lista `reserved`.

## ¿Por qué ocurre?

Cada archivo `.js` en `src/` se minifica **individualmente** por Terser. El property mangling no es global — cada archivo obtiene su propio mapping:

```
// Archivo A (Pagination.js)
onPageChange → D
setPage      → E

// Archivo B (Table.js)
onPageChange → F
setPage      → G
```

Cuando Table llama a `pagination.onPageChange(callback)`, ese nombre `onPageChange` se convirtió a `F` en Table.js, pero en Pagination.js el setter se llama `D`. La llamada falla porque `pagination.F` no existe o no es función.

## ¿Cuándo ocurre?

Solo en **production build** (`pnpm run build`). En dev mode no hay Terser, los nombres se preservan.

Ocurre cuando:

1. **Un componente llama a un método/getter/setter de otro componente**, y el nombre de ese método matchea el regex de mangling.
2. **El nombre NO está en `mangle.reserved`** (la lista blanca de `buildProduction.js:248-283`).
3. **Los dos componentes terminan en bundles/archivos distintos** (si estuvieran en el mismo `.js`, Terser les asigna el mismo nombre corto y funciona).

### Casos conocidos

| Prop | Matchea | Componente origen | Componente destino | Bundle |
|------|---------|------------------|-------------------|--------|
| `onPageChange` | `on[A-Z]` | Table → Pagination | Table.js vs Pagination.js | `multiroute-App--p5` (mismo bundle, distinto archivo original) |
| `setPageSize` | `set` | Table → DataGridEngine | Table.js vs DataGridEngine.js | Distintos bundles |
| `setSort` | `set` | Table → DataGridEngine | idem | idem |
| `setTotalItems` | `set` | Table → DataGridEngine | idem | idem |
| `setPage` | `set` | Pagination → DataGridEngine | Pagination.js vs DataGridEngine.js | Distintos bundles |
| `setActiveTreeItem` | `set` | TreeItem → TreeView | TreeItem.js vs TreeView.js | `multiroute-App--p11` |
| `sliceId` | `slice` | MiniInspector → target component | MiniInspector.js vs cualquier componente | Distintos archivos |
| `onClick` | `on[A-Z]` | TreeView → TreeItem | TreeView.js vs TreeItem.js | `multiroute-App--p11` |
| `onChange` | `on[A-Z]` | Input/Switch/Select → consumer | Componente.js vs consumer | Distintos |
| `onClickCallback` | `on[A-Z]` | Deprecated alias en varios | — | — |

## ¿Qué se hizo hasta ahora?

Se aplicó un patrón de **computed property names + const variable** para los casos más críticos:

```js
// En el archivo que DEFINE la propiedad:
const _ON_PAGE_CHANGE = 'onPageChange';

class Pagination extends HTMLElement {
  static props = {
    // props es un objeto plano — Terser manglea sus keys
    // Solución: bracket notation con la variable
    [_ON_PAGE_CHANGE]: { type: 'function' }
  };

  // Los setters también usan computed property:
  set [_ON_PAGE_CHANGE](value) {
    // ...
  }
}

// En el archivo que CONSUME:
import { _ON_PAGE_CHANGE } from './constants.js';
pagination[_ON_PAGE_CHANGE](callback);
```

Esto funciona porque:
- Terser NO manglea **string literals** (`'onPageChange'`)
- Tampoco manglea **computed properties** (`[_ON_PAGE_CHANGE]`) cuando la key es una variable
- La variable `_ON_PAGE_CHANGE` es un `const` que contiene el string exacto

## ¿Qué falta fixear?

| Prop | Componentes | Prioridad |
|------|-------------|-----------|
| `onClick` | TreeView → TreeItem | **Alta** — tests de TreeView fallan en prod |
| `onClickCallback` | deprecated alias | **Alta** — necesario para retrocompat |
| `onChange` | Input, Switch, Select, Checkbox | **Media** |
| `sliceId` | MiniInspector → cualquier target | **Media** |
| `customColor` (cuando es string) | Varios | **Baja** — solo legacy path |

**Nota:** `onClickCallback` ya está en `mangle.reserved` (línea 267), pero si se mueve de archivo o se refiere desde otro bundle, puede fallar igual.

## Posibles soluciones globales

### A. Agregar TODOS los nombres de props al `mangle.reserved` (rápido, parcial)

En `buildProduction.js`, agregar a la lista `reserved` todos los nombres de propiedades públicas de componentes. Esto evita que se mangleen, pero hay que mantener la lista actualizada.

**Problema:** No escala. Cualquier prop nueva hay que acordarse de agregarla.

### B. Desactivar property mangling (drástico, seguro)

Cambiar `properties: { regex: /^.../ }` a `properties: false`. Se pierde ~5-8% de compresión pero se elimina el bug completamente.

```js
mangle: {
  properties: false,  // ← desactiva todo property mangling
  reserved: [ ... ]
}
```

### C. Property mangling solo intra-archivo con detector de exports (complejo)

Un script custom que analice qué propiedades se usan entre archivos distintos y las agregue automáticamente a `reserved`. Esto requeriría modificar el CLI.

### D. Usar símbolos o strings con naming convention protegida

Como hacemos con `_ON_PAGE_CHANGE`, pero sistematizado: generar automáticamente constantes para todas las props públicas. Esto es lo que hace frameworks como MobX con sus decoradores.

## Recomendación

**Corto plazo:** Opción B (desactivar property mangling). Es un cambio de 1 línea en `buildProduction.js`, 100% seguro, elimina el bug de raíz. Se pierde compresión mínima.

**Largo plazo:** Opción C + refactor del CLI para que el bundle analyzer detecte estas dependencias y las agregue a `reserved` automáticamente, o migrar a que los bundles se minifiquen como un todo en vez de archivo por archivo.
