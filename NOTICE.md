# Third-party notices

Ghost Editor Adapter is an independent project and is not affiliated with or endorsed by the Ghost Foundation or PQINA/Pintura.

The adapter loads **Cropper.js 2.1.1** at runtime by default from jsDelivr:

`https://cdn.jsdelivr.net/npm/cropperjs@2.1.1/+esm`

Cropper.js is Copyright (c) Chen Fengyuan and distributed under the MIT License. The dependency is not copied into this repository's source or distribution files. Operators may self-host the same module and point `window.GhostEditorAdapterConfig.cropperModuleUrl` at their own URL.

Ghost is open-source software maintained by the Ghost Foundation. This project uses an integration contract exposed by Ghost Admin; it does not redistribute Ghost Admin or modify Ghost core.
