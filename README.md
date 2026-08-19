# Ghost Editor Adapter

A small, open-source image editor for **self-hosted Ghost Admin**. It plugs into Ghost's existing configurable image-editor loading seam, so you can crop and make common image adjustments without maintaining a Ghost Admin fork.

The project is intentionally narrow: one JavaScript entry module and one stylesheet, with no server component and no access to your Ghost database or Admin API.

> **Unofficial integration.** Ghost currently labels this configuration as **Pintura**. This project is not Pintura and contains no Pintura code. It implements the runtime contract that Ghost Admin currently expects from the configured editor asset.

## Features

- crop: free, original, 1:1, 3:2, 4:3, 16:10 and 16:9;
- rotate left/right by 90°;
- straighten from -15° to +15°;
- horizontal and vertical flip;
- zoom and pan;
- brightness, contrast, saturation and temperature;
- JPEG, PNG and WebP output selection based on the source URL;
- source-density-aware export capped at 4096 px on the longest edge by default;
- responsive desktop/mobile editor UI;
- current Ghost editor lifecycle support: `process`, `destroy`, `.destroy()` and `willClose`;
- no Ghost core or Admin modifications.

## Quick install

Use a **versioned release URL** for both files. Once `v0.1.0` is tagged, jsDelivr can serve the repository assets directly:

```text
JavaScript
https://cdn.jsdelivr.net/gh/damirissimo/ghost-editor-adapter@v0.1.0/dist/ghost-editor-adapter.js

CSS
https://cdn.jsdelivr.net/gh/damirissimo/ghost-editor-adapter@v0.1.0/dist/ghost-editor-adapter.css
```

Then in Ghost Admin:

1. open **Settings → Integrations → Pintura**;
2. set the JavaScript URL to the adapter module;
3. set the CSS URL to the adapter stylesheet;
4. enable the integration and save;
5. open a post and use Ghost's normal image edit action.

You can also host the `dist/` directory yourself. Production installations should pin an immutable tag or commit rather than `main`.

See [Installation](docs/INSTALLATION.md) for self-hosting and runtime configuration.

## How it works

Ghost Admin dynamically imports the configured JavaScript and expects a browser global compatible with this shape:

```js
window.pintura.openDefaultEditor({src, ...options})
```

The returned editor handle supports:

```js
editor.on('process', ({dest}) => {
  // dest is a browser File that Ghost can upload/replace normally.
});

editor.on('destroy', () => {});
editor.destroy();
```

Ghost remains responsible for replacing/uploading the edited image. This adapter only edits pixels in the visitor's browser and emits the resulting `File`.

The global name is inherited from Ghost's existing integration seam; it does **not** mean this project contains or emulates the Pintura product beyond the small interface Ghost consumes.

## Cropper.js

The editor uses [Cropper.js](https://github.com/fengyuanchen/cropperjs) and currently pins **2.1.1**. By default the browser imports:

```text
https://cdn.jsdelivr.net/npm/cropperjs@2.1.1/+esm
```

To self-host the dependency, define this before Ghost loads the adapter:

```html
<script>
window.GhostEditorAdapterConfig = {
  cropperModuleUrl: 'https://static.example.com/cropperjs-2.1.1.esm.js',
  maxExportEdge: 4096,
  jpegQuality: 0.92
};
</script>
```

The adapter itself is MIT licensed. Cropper.js is a separate MIT-licensed dependency; see [NOTICE.md](NOTICE.md).

## CORS requirement

The browser must be allowed to read the source image pixels. If your Ghost images are served from another hostname/CDN, that image origin must return an appropriate `Access-Control-Allow-Origin` header for Ghost Admin.

Without CORS, the image may display normally but browser canvas export will fail because the canvas becomes tainted. See [CORS](docs/CORS.md).

## Compatibility

This repository targets the current Ghost Admin integration behavior rather than a documented third-party plugin API. The compatibility boundary is therefore deliberately tested and documented, but Ghost can change it in a future release.

See [Compatibility](docs/COMPATIBILITY.md) before upgrading Ghost in a production installation.

## Development

There is no compilation step in the initial release. The human-readable native-ESM modules under `dist/` are both the maintained source and the deployable assets. `ghost-editor-adapter.js` imports its sibling modules with relative version-stable URLs.

```bash
npm test
npm run check
```

A browser demo is available under `demo/`. Serve the repository over HTTP and upload a local image there; the demo deliberately uses a local object URL so image CORS does not obscure editor behavior.

## Project scope

The project aims to remain a fast editorial image editor rather than become a general graphics suite. Good additions are operations that make sense immediately before publishing an image in Ghost. Complex drawing, layers, generative tools and server-side media processing are intentionally out of scope unless that direction changes explicitly.

## Security

The adapter runs entirely in the browser. It has no backend, database credentials or Ghost Admin API token. The default configuration loads Cropper.js from the pinned jsDelivr URL above, so deployments with stricter supply-chain requirements should self-host that dependency.

Please report security issues as described in [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
