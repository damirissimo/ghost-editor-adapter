# Installation

## Option A: versioned jsDelivr assets

After a repository release is tagged, use the immutable versioned paths:

```text
https://cdn.jsdelivr.net/gh/damirissimo/ghost-editor-adapter@v0.1.0/dist/ghost-editor-adapter.js
https://cdn.jsdelivr.net/gh/damirissimo/ghost-editor-adapter@v0.1.0/dist/ghost-editor-adapter.css
```

Configure those URLs in **Ghost Admin → Settings → Integrations → Pintura**, enable the integration and save.

Do not use `@main` for production. Ghost imports the configured editor when the edit action becomes available; a mutable branch URL would make future repository changes an implicit production deployment.

## Option B: self-host the adapter

Copy the `dist/` directory to any HTTPS origin reachable by Ghost Admin. Ghost is configured with the entry module and stylesheet; the entry module imports `editor.js` and `editor-ui.js` from the same directory.

```text
dist/ghost-editor-adapter.js   # configure this URL in Ghost
dist/ghost-editor-adapter.css  # configure this URL in Ghost
dist/editor.js                 # sibling module
dist/editor-ui.js              # sibling module
```

The JavaScript must be served with a JavaScript-compatible MIME type because Ghost loads it with dynamic `import()`.

For a fully first-party setup, self-host Cropper.js 2.1.1 as well and configure its ESM URL before the adapter is imported:

```html
<script>
window.GhostEditorAdapterConfig = {
  cropperModuleUrl: 'https://static.example.com/vendor/cropperjs-2.1.1.esm.js'
};
</script>
```

## Runtime configuration

Optional settings live on `window.GhostEditorAdapterConfig`:

| Setting | Default | Bounds / meaning |
| --- | --- | --- |
| `cropperModuleUrl` | jsDelivr Cropper.js 2.1.1 ESM | HTTPS module URL you control/trust |
| `maxExportEdge` | `4096` | clamped to 256–16384 pixels |
| `jpegQuality` | `0.92` | clamped to 0.1–1.0 |

`maxExportEdge` is a safety ceiling, not a target size. Smaller crops retain their calculated source-density dimensions.

## Validation after installation

Test at least:

1. JPEG source: crop, rotate and save;
2. PNG source: save and confirm PNG output;
3. a large source image: confirm output is not limited to the editor viewport dimensions;
4. Cancel and explicit Ghost teardown/navigation;
5. mobile/narrow Admin layout;
6. any separate image/CDN origin, confirming CORS permits canvas export.

## Rollback

Disable the Ghost image-editor integration or replace the JavaScript/CSS URLs with your previous known-good editor assets. No Ghost content/database migration is performed by this project.
