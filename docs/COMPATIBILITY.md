# Ghost compatibility contract

Ghost Editor Adapter deliberately integrates through the small editor-loading seam already used by Ghost Admin. It does not patch Ghost source.

## Contract currently implemented

Ghost Admin loads the configured JavaScript module and expects `window.pintura` to exist. The adapter supplies:

```js
window.pintura = {
  openDefaultEditor(options) { /* ... */ }
};
```

`openDefaultEditor()` returns an editor handle with:

```js
editor.on(eventName, callback)
editor.destroy()
```

The adapter emits:

- `process` with `{dest: File}` when Save succeeds;
- `destroy` exactly once when the editor is torn down;
- `loaderror` when the editor or export fails.

It also respects Ghost's current `willClose` callback. The adapter keeps the compatibility class `PinturaModal` and a close control with `title="Close"` because current Ghost Admin uses those selectors to distinguish an intentional close action. Those names are compatibility shims only; no Pintura implementation is included.

## Why compatibility is tested explicitly

This integration seam is an implementation detail of Ghost Admin rather than a stable third-party plugin API. A Ghost release can change:

- the global name it checks;
- the options passed to `openDefaultEditor()`;
- required editor methods;
- event names/payloads;
- close/teardown behavior;
- the CSS/JS loading mechanism.

Before declaring support for a new major Ghost release, compare Ghost Admin's current image-editor hook with this document and run a real Admin save/replace test.

## Current upstream reference

At the time this standalone repository was extracted (2026-08-19), Ghost Admin's current editor hook dynamically imported the configured editor, called `openDefaultEditor`, listened for `process` and `destroy`, called `.destroy()` during teardown, and supplied a `willClose` callback.

The upstream source lives in the Ghost repository under the Admin image-editor hooks. Treat that source, not this document, as authoritative when upgrading Ghost.
