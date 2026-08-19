import {createModal, updateRangeOutput} from './editor-ui.js';

const cropperLoaders = new Map();

async function loadCropper(moduleUrl) {
    if (!cropperLoaders.has(moduleUrl)) {
        cropperLoaders.set(moduleUrl, import(/* @vite-ignore */ moduleUrl).then(module => module.default || module.Cropper));
    }
    return cropperLoaders.get(moduleUrl);
}

export function sourceBaseName(source) {
    try {
        const base = typeof window !== 'undefined' ? window.location.href : 'https://example.invalid/';
        const pathname = new URL(source, base).pathname;
        const lastSegment = pathname.split('/').filter(Boolean).pop() || 'image';
        return decodeURIComponent(lastSegment).replace(/\.[^.]+$/, '') || 'image';
    } catch (_) {
        return 'image';
    }
}

export function outputDescriptor(source) {
    let extension = '';
    try {
        const base = typeof window !== 'undefined' ? window.location.href : 'https://example.invalid/';
        extension = new URL(source, base).pathname.toLowerCase().split('.').pop() || '';
    } catch (_) {}

    if (extension === 'png') return {mimeType: 'image/png', extension: 'png'};
    if (extension === 'webp') return {mimeType: 'image/webp', extension: 'webp'};
    return {mimeType: 'image/jpeg', extension: 'jpg'};
}

function previewFilter(adjustments) {
    const warmth = Math.abs(adjustments.temperature) / 100;
    const sepia = adjustments.temperature > 0 ? warmth * 0.18 : warmth * 0.08;
    const hue = adjustments.temperature > 0 ? -warmth * 8 : warmth * 18;
    return `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) sepia(${sepia}) hue-rotate(${hue}deg)`;
}

function applyTemperature(canvas, temperature) {
    if (!temperature) return;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (!context) return;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const amount = temperature / 100;
    for (let index = 0; index < data.length; index += 4) {
        data[index] = Math.max(0, Math.min(255, data[index] + amount * 18));
        data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + amount * 3));
        data[index + 2] = Math.max(0, Math.min(255, data[index + 2] - amount * 18));
    }
    context.putImageData(imageData, 0, 0);
}

export function exportSize(selection, cropperImage, maxExportEdge) {
    const [a, b, c, d] = cropperImage.$getTransform();
    const scaleX = Math.hypot(a, b) || 1;
    const scaleY = Math.hypot(c, d) || scaleX;
    let width = Math.max(1, Math.round(selection.width / scaleX));
    let height = Math.max(1, Math.round(selection.height / scaleY));
    const edge = Math.max(width, height);
    if (edge > maxExportEdge) {
        const factor = maxExportEdge / edge;
        width = Math.max(1, Math.round(width * factor));
        height = Math.max(1, Math.round(height * factor));
    }
    return {width, height};
}

function canvasToFile(canvas, source, jpegQuality) {
    const descriptor = outputDescriptor(source);
    const quality = descriptor.mimeType === 'image/png' ? undefined : jpegQuality;
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) return reject(new Error('The edited image could not be encoded'));
            resolve(new File([blob], `${sourceBaseName(source)}-edited.${descriptor.extension}`, {
                type: descriptor.mimeType,
                lastModified: Date.now(),
            }));
        }, descriptor.mimeType, quality);
    });
}

export async function runEditor(options, config, hooks) {
    if (!options.src) throw new Error('openDefaultEditor requires an image src');
    const Cropper = await loadCropper(config.cropperModuleUrl);
    if (hooks.isDestroyed()) return;
    if (typeof Cropper !== 'function') throw new Error('Cropper.js did not expose a constructor');

    const modal = createModal();
    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    let cropperImage;
    let selection;
    let originalRatio = Number.NaN;
    let fineRotation = 0;
    let saving = false;
    const adjustments = {brightness: 100, contrast: 100, saturation: 100, temperature: 0};

    const cleanup = () => {
        window.removeEventListener('keydown', onKeyDown, true);
        document.body.style.overflow = previousOverflow;
        modal.overlay.remove();
        if (previousActiveElement instanceof HTMLElement && previousActiveElement.isConnected) {
            previousActiveElement.focus({preventScroll: true});
        }
    };
    hooks.setCleanup(cleanup);
    if (hooks.isDestroyed()) return;

    const requestClose = () => {
        if (hooks.isDestroyed()) return;
        if (typeof options.willClose === 'function') {
            try {
                if (options.willClose() === false) return;
            } catch (error) {
                console.error('[Ghost Editor Adapter] willClose callback failed', error);
                return;
            }
        }
        hooks.destroy();
    };
    function onKeyDown(event) {
        if (event.key === 'Escape') requestClose();
    }

    const updatePreview = () => {
        if (cropperImage) cropperImage.style.filter = previewFilter(adjustments);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown, true);
    modal.overlay.focus({preventScroll: true});

    const sourceImage = new Image();
    sourceImage.crossOrigin = 'anonymous';
    sourceImage.alt = 'Image being edited';
    sourceImage.src = options.src;

    const cropper = new Cropper(sourceImage, {
        container: modal.stage,
        template: '<cropper-canvas background><cropper-image rotatable scalable skewable translatable></cropper-image><cropper-shade hidden></cropper-shade><cropper-handle action="move" plain></cropper-handle><cropper-selection initial-coverage="0.88" movable resizable keyboard><cropper-grid role="grid" bordered covered></cropper-grid><cropper-crosshair centered></cropper-crosshair><cropper-handle action="move" theme-color="rgba(255,255,255,.35)"></cropper-handle><cropper-handle action="n-resize"></cropper-handle><cropper-handle action="e-resize"></cropper-handle><cropper-handle action="s-resize"></cropper-handle><cropper-handle action="w-resize"></cropper-handle><cropper-handle action="ne-resize"></cropper-handle><cropper-handle action="nw-resize"></cropper-handle><cropper-handle action="se-resize"></cropper-handle><cropper-handle action="sw-resize"></cropper-handle></cropper-selection></cropper-canvas>',
    });

    cropperImage = cropper.getCropperImage();
    selection = cropper.getCropperSelection();
    if (!cropperImage || !selection) throw new Error('Cropper.js UI did not initialize');
    const loadedImage = await cropperImage.$ready();
    if (hooks.isDestroyed()) return;
    originalRatio = loadedImage.naturalWidth && loadedImage.naturalHeight ? loadedImage.naturalWidth / loadedImage.naturalHeight : Number.NaN;
    updatePreview();

    const reset = () => {
        cropperImage.$resetTransform();
        cropperImage.$center('contain');
        selection.aspectRatio = Number.NaN;
        selection.$reset();
        fineRotation = 0;
        Object.assign(adjustments, {brightness: 100, contrast: 100, saturation: 100, temperature: 0});
        modal.overlay.querySelectorAll('[data-adjustment]').forEach(input => {
            const key = input.dataset.adjustment;
            const value = key === 'rotation' ? 0 : adjustments[key];
            input.value = String(value);
            updateRangeOutput(modal.overlay, key, value);
        });
        modal.overlay.querySelectorAll('[data-action="ratio"]').forEach(item => item.classList.toggle('is-active', item.dataset.ratio === 'free'));
        modal.overlay.querySelectorAll('[data-action="flip-x"], [data-action="flip-y"]').forEach(item => item.classList.remove('is-active'));
        updatePreview();
    };

    modal.overlay.addEventListener('click', async event => {
        const control = event.target.closest('button[data-action]');
        if (!control || hooks.isDestroyed()) return;
        const action = control.dataset.action;
        if (action === 'cancel') return requestClose();
        if (action === 'reset') return reset();
        if (action === 'rotate-left' || action === 'rotate-right') return cropperImage.$rotate(action === 'rotate-left' ? '-90deg' : '90deg');
        if (action === 'flip-x') {
            cropperImage.$scale(-1, 1);
            return control.classList.toggle('is-active');
        }
        if (action === 'flip-y') {
            cropperImage.$scale(1, -1);
            return control.classList.toggle('is-active');
        }
        if (action === 'zoom-in' || action === 'zoom-out') return cropperImage.$zoom(action === 'zoom-in' ? 0.1 : -0.1);
        if (action === 'ratio') {
            const raw = control.dataset.ratio;
            selection.aspectRatio = raw === 'free' ? Number.NaN : raw === 'original' ? originalRatio : Number(raw);
            modal.overlay.querySelectorAll('[data-action="ratio"]').forEach(item => item.classList.toggle('is-active', item === control));
            return;
        }
        if (action !== 'save' || saving) return;

        saving = true;
        control.disabled = true;
        control.textContent = 'Saving…';
        try {
            const {width, height} = exportSize(selection, cropperImage, config.maxExportEdge);
            const canvas = await selection.$toCanvas({
                width,
                height,
                beforeDraw(context) {
                    context.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
                },
            });
            applyTemperature(canvas, adjustments.temperature);
            hooks.emit('process', {dest: await canvasToFile(canvas, options.src, config.jpegQuality)});
            setTimeout(hooks.destroy, 0);
        } catch (error) {
            console.error('[Ghost Editor Adapter] save failed', error);
            hooks.emit('loaderror', error);
            saving = false;
            control.disabled = false;
            control.textContent = 'Save and close';
        }
    });

    modal.overlay.addEventListener('input', event => {
        const input = event.target.closest('input[data-adjustment]');
        if (!input || hooks.isDestroyed()) return;
        const key = input.dataset.adjustment;
        const value = Number(input.value);
        if (key === 'rotation') {
            const delta = value - fineRotation;
            fineRotation = value;
            cropperImage.$rotate(`${delta}deg`);
        } else {
            adjustments[key] = value;
            updatePreview();
        }
        updateRangeOutput(modal.overlay, key, value);
    });
}
