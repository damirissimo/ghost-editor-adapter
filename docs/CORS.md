# Image CORS

Ghost Editor Adapter edits pixels with browser canvas APIs. That creates a stricter requirement than simply displaying an image.

## Same-origin images

If Ghost Admin and the source image use the same origin, no additional CORS configuration is normally required.

## Separate image/CDN origin

If an image is served from another origin, the image response must permit Ghost Admin to read its pixels. The adapter creates the source image with `crossOrigin = "anonymous"` before setting `src`.

A typical response is:

```http
Access-Control-Allow-Origin: https://admin.example.com
```

or, when appropriate for your deployment:

```http
Access-Control-Allow-Origin: *
```

Do not add credentialed CORS unless your image delivery actually requires credentials; ordinary public Ghost media generally should not.

## Symptom of a missing CORS policy

The image can appear correctly in the editor but Save fails when the browser tries to export the canvas. Developer tools may report a tainted canvas or blocked cross-origin pixel read.

The fix belongs at the image/CDN origin. Disabling browser security or proxying arbitrary remote URLs through Ghost Editor Adapter is not part of this project.
