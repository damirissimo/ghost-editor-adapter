import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('entry module exposes the Ghost compatibility boundary', async () => {
  const source = await read('dist/ghost-editor-adapter.js');
  assert.match(source, /window\.pintura = pinturaAdapter/);
  assert.match(source, /cropperjs@2\.1\.1/);
  assert.match(source, /runEditor/);
});

test('UI preserves current Ghost close-intent selectors', async () => {
  const source = await read('dist/editor-ui.js');
  assert.match(source, /PinturaModal/);
  assert.match(source, /button\('Cancel', 'cancel', '', 'Close'\)/);
});

test('runtime distribution contains no site-specific implementation branding', async () => {
  const source = [
    await read('dist/ghost-editor-adapter.js'),
    await read('dist/editor.js'),
    await read('dist/editor-ui.js'),
    await read('dist/ghost-editor-adapter.css'),
  ].join('\n');
  assert.doesNotMatch(source, /damirissimo/i);
  assert.doesNotMatch(source, /aduk/i);
});
