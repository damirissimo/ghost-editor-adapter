/* Ghost Editor Adapter: Ghost compatibility boundary. */

import {runEditor} from './editor.js';

const DEFAULT_CROPPER_MODULE_URL = 'https://cdn.jsdelivr.net/npm/cropperjs@2.1.1/+esm';
const DEFAULT_MAX_EXPORT_EDGE = 4096;
const DEFAULT_JPEG_QUALITY = 0.92;

const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

export function getRuntimeConfig() {
    const configured = typeof window !== 'undefined' && window.GhostEditorAdapterConfig
        ? window.GhostEditorAdapterConfig
        : {};

    return {
        cropperModuleUrl: typeof configured.cropperModuleUrl === 'string' && configured.cropperModuleUrl
            ? configured.cropperModuleUrl
            : DEFAULT_CROPPER_MODULE_URL,
        maxExportEdge: Math.round(clamp(configured.maxExportEdge, 256, 16384, DEFAULT_MAX_EXPORT_EDGE)),
        jpegQuality: clamp(configured.jpegQuality, 0.1, 1, DEFAULT_JPEG_QUALITY),
    };
}

export function createEmitter() {
    const listeners = new Map();
    return {
        on(eventName, callback) {
            if (typeof callback === 'function') {
                const callbacks = listeners.get(eventName) || [];
                callbacks.push(callback);
                listeners.set(eventName, callbacks);
            }
            return this;
        },
        emit(eventName, payload) {
            for (const callback of listeners.get(eventName) || []) {
                try {
                    callback(payload);
                } catch (error) {
                    console.error('[Ghost Editor Adapter] listener failed', error);
                }
            }
            return this;
        },
        clear() {
            listeners.clear();
        },
    };
}

export function openDefaultEditor(options = {}) {
    const emitter = createEmitter();
    let destroyed = false;
    let cleanup = () => {};

    const editor = {
        on(eventName, callback) {
            emitter.on(eventName, callback);
            return editor;
        },
        destroy() {
            if (destroyed) return;
            destroyed = true;
            try {
                cleanup();
            } finally {
                emitter.emit('destroy');
                emitter.clear();
            }
        },
    };

    queueMicrotask(async () => {
        if (destroyed) return;
        try {
            await runEditor(options, getRuntimeConfig(), {
                emit: (eventName, payload) => emitter.emit(eventName, payload),
                destroy: () => editor.destroy(),
                isDestroyed: () => destroyed,
                setCleanup(callback) {
                    if (destroyed) callback();
                    else cleanup = callback;
                },
            });
        } catch (error) {
            console.error('[Ghost Editor Adapter] editor failed to open', error);
            emitter.emit('loaderror', error);
            editor.destroy();
        }
    });

    return editor;
}

const pinturaAdapter = {openDefaultEditor};
if (typeof window !== 'undefined') window.pintura = pinturaAdapter;

export default pinturaAdapter;
