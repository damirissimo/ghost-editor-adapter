import assert from 'node:assert/strict';
import test from 'node:test';

import {createEmitter, getRuntimeConfig, openDefaultEditor} from '../dist/ghost-editor-adapter.js';
import {exportSize, outputDescriptor, sourceBaseName} from '../dist/editor.js';

test('default runtime configuration is pinned and bounded', () => {
  assert.deepEqual(getRuntimeConfig(), {
    cropperModuleUrl: 'https://cdn.jsdelivr.net/npm/cropperjs@2.1.1/+esm',
    maxExportEdge: 4096,
    jpegQuality: 0.92,
  });
});

test('emitter is chainable and isolates listener failures', () => {
  const emitter = createEmitter();
  const received = [];
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal(emitter.on('process', value => received.push(value)), emitter);
    emitter.on('process', () => { throw new Error('listener failure'); });
    assert.equal(emitter.emit('process', 42), emitter);
    assert.deepEqual(received, [42]);
  } finally {
    console.error = originalError;
  }
});

test('source file names are safe and query strings do not leak into names', () => {
  assert.equal(sourceBaseName('https://images.example/test/photo.large.jpg?v=123'), 'photo.large');
  assert.equal(sourceBaseName('%%%'), 'image');
});

test('output format preserves PNG and WebP URLs and otherwise uses JPEG', () => {
  assert.equal(outputDescriptor('https://example.com/a.png').mimeType, 'image/png');
  assert.equal(outputDescriptor('https://example.com/a.webp?v=2').mimeType, 'image/webp');
  assert.equal(outputDescriptor('https://example.com/a.jpeg').mimeType, 'image/jpeg');
  assert.equal(outputDescriptor('blob:https://example.com/id').mimeType, 'image/jpeg');
});

test('export size uses source density and enforces maximum edge', () => {
  const selection = {width: 1000, height: 500};
  const cropperImage = {$getTransform: () => [0.5, 0, 0, 0.5, 0, 0]};
  assert.deepEqual(exportSize(selection, cropperImage, 4096), {width: 2000, height: 1000});
  assert.deepEqual(exportSize(selection, cropperImage, 1000), {width: 1000, height: 500});
});

test('editor handle exposes Ghost lifecycle and destroy is idempotent', async () => {
  let destroyed = 0;
  const editor = openDefaultEditor({src: 'https://example.com/image.jpg'});
  assert.equal(typeof editor.on, 'function');
  assert.equal(typeof editor.destroy, 'function');
  assert.equal(editor.on('destroy', () => destroyed += 1), editor);
  editor.destroy();
  editor.destroy();
  await Promise.resolve();
  assert.equal(destroyed, 1);
});
