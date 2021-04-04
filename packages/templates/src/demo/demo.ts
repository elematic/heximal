import {prepareTemplate, TemplateHandlers, Renderers} from '../stampino.js';
import {render} from 'lit-html';

const demoTemplate = document.querySelector<HTMLTemplateElement>(`#demo`)!;

function formatOuterHtml(s: string) {
  let lines = s.split('\n');
  if (lines.length < 2) {
    return s;
  }
  let lastLine = lines[lines.length - 1];
  let indent = /^\s*/.exec(lastLine)![0].length;

  for (let i = 1; i < lines.length; i++) {
    lines[i] = lines[i].substring(indent);
  }
  return lines.join('\n');
}

function runDemo(id: string, model?: object) {
  const template = document.querySelector<HTMLTemplateElement>(`#${id}`)!;
  let output = document.createElement('div');
  document.body.appendChild(output);

  const sourceTemplate = template.content.querySelector<HTMLTemplateElement>(
    '[name=demo]'
  )!;
  let source = formatOuterHtml(sourceTemplate.outerHTML);

  let superTemplate: HTMLTemplateElement | undefined;
  if (sourceTemplate.hasAttribute('extends')) {
    const extendsRef = sourceTemplate.getAttribute('extends');
    superTemplate = document.querySelector<HTMLTemplateElement>(
      `#${extendsRef}`
    )!;
    console.log('has super', superTemplate);
    source += `\n\n` + formatOuterHtml(superTemplate.outerHTML);
  }

  const renderDemo = prepareTemplate(
    sourceTemplate,
    undefined,
    undefined,
    superTemplate
  );

  const renderDemoOuter = prepareTemplate(
    template,
    undefined,
    {
      source: (
        _model: object,
        _handlers: TemplateHandlers,
        _renderers: Renderers
      ) => {
        return source;
      },
      'render-demo': (
        model: object,
        _handlers: TemplateHandlers,
        _renderers: Renderers
      ) => {
        console.log('render-demo renderer');
        return renderDemo(model);
      },
    },
    demoTemplate
  );

  render(renderDemoOuter(model ?? {}), output);
}

runDemo('demo-1');
runDemo('demo-2', {foo: 'this is foo'});
runDemo('demo-3', {x: 9});
runDemo('demo-4');
runDemo('demo-5', {items: ['a', 'b', 'c']});
runDemo('demo-6', {});
runDemo('demo-7', {});
runDemo('demo-8', {nullable:null});
