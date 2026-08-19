# Security policy

Please do not publish an unpatched security vulnerability as a public issue.

Use GitHub's private vulnerability reporting feature for this repository when available. If that is unavailable, contact the repository owner privately before disclosure.

## Security boundary

Ghost Editor Adapter is browser-only and intentionally has no backend, Ghost Admin API credentials, database access or persistent storage.

The main external supply-chain boundary is the Cropper.js module URL. The default is pinned to Cropper.js 2.1.1 on jsDelivr. Operators that require a fully first-party dependency chain should self-host the reviewed Cropper.js module and configure `window.GhostEditorAdapterConfig.cropperModuleUrl` accordingly.

Image URLs are supplied by Ghost. The adapter sets `crossOrigin="anonymous"` and never adds cookies or authorization headers to image requests.
