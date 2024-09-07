// @ts-expect-error: tachometer creates this
import * as bench from '../bench.js';
import * as stampino from '../stampino.js';

const template = document.querySelector('template')!;

const output = document.querySelector('output')!;

const modelScript = document.getElementById('model');

const model = modelScript?.textContent
  ? JSON.parse(modelScript.textContent)
  : undefined;

bench.start();

for (let i = 0; i < 1000; i++) {
  stampino.render(template, output, model);
}

bench.stop();
