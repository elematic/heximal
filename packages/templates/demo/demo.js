import * as stampino from 'stampino';

let demoTemplate = document.querySelector(`#demo`);

function formatOuterHtml(s) {
  let lines = s.split('\n');
  if (lines.length < 2) {
    return s;
  }
  let lastLine = lines[lines.length - 1];
  let indent = /^\s*/.exec(lastLine)[0].length;

  for (let i = 1; i < lines.length; i++) {
    lines[i] = lines[i].substring(indent);
  }
  return lines.join('\n');
}

function runDemo(id, model) {
  let template = document.querySelector(`#${id}`);
  let output = document.createElement('div');
  document.body.appendChild(output);

  let sourceTemplate = template.content.querySelector('[name=demo]');
  let source = document.createTextNode(
      formatOuterHtml(sourceTemplate.outerHTML));

  let superTemplate;
  if (sourceTemplate.hasAttribute('extends')) {
    let extendsRef = sourceTemplate.getAttribute('extends');
    superTemplate = document.querySelector(`#${extendsRef}`);

    let sourceFrag = document.createDocumentFragment();
    sourceFrag.appendChild(document.createTextNode(
        formatOuterHtml(superTemplate.outerHTML)));
    sourceFrag.appendChild(document.createTextNode('\n\n'));
    sourceFrag.appendChild(source);
    source = sourceFrag;
  }

  let demoRenderer = stampino.prepareTemplate(sourceTemplate, null, null,
      null, superTemplate);

  stampino.render(template, output, model, {
    extends: demoTemplate,
    renderers: {
      'source': function(template, model, renderers, handlers, attributeHandler) {
        stampino.renderNode(source, model, renderers, handlers, attributeHandler);
      },
      'demo': function(template, model, renderers, handlers, attributeHandler) {
        demoRenderer(model);
      },
    },
  });
}

runDemo('demo-1');
runDemo('demo-2', {foo: 'this is foo'});
runDemo('demo-3', {x: 9});
runDemo('demo-4');
runDemo('demo-5', {items: ['a', 'b', 'c']});
runDemo('demo-6', {});
runDemo('demo-7', {});
