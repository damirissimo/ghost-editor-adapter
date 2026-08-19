# Changelog

All notable changes to this project will be documented here.

## 0.1.0 - Unreleased

- Extract the production-proven Cropper.js editor into a standalone Ghost-compatible adapter.
- Generalize runtime names and remove site-specific dependencies.
- Update the default Cropper.js pin to 2.1.1.
- Implement Ghost's current editor lifecycle: `process`, `destroy`, `.destroy()` and `willClose`.
- Preserve source-density export dimensions with a configurable maximum edge.
- Preserve PNG/WebP output based on source URL; default other inputs to JPEG.
- Add installation, CORS, compatibility, security and dependency documentation.
- Add contract/distribution tests and GitHub Actions CI.
