import * as stampino from 'stampino';

function runDemo(id, model, opts) {
  let template = document.querySelector(`#${id}`);
  let container = document.createElement('div');
  stampino.render(template, container, model, opts);
  document.body.appendChild(container);
}

runDemo('demo-1');
runDemo('demo-2', {foo: 'this is foo'});
runDemo('demo-3', {x: 9});
runDemo('demo-4');
runDemo('demo-5', {items: ['a', 'b', 'c']});
runDemo('demo-6', {}, {extends: document.querySelector('#demo-6-super')});
