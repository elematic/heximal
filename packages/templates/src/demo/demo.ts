import {
  prepareTemplate,
  TemplateHandlers,
  Renderers,
  evaluateTemplate,
  Renderer,
} from '../stampino.js';
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

function runDemo(
  id: string,
  {model, renderers}: {model?: object; renderers?: Renderers} = {},
) {
  const template = document.querySelector<HTMLTemplateElement>(`#${id}`)!;
  let output = document.createElement('div');
  document.body.appendChild(output);

  const sourceTemplate =
    template.content.querySelector<HTMLTemplateElement>('[name=demo]')!;
  let source = formatOuterHtml(sourceTemplate.outerHTML);

  let superTemplate: HTMLTemplateElement | undefined;
  if (sourceTemplate.hasAttribute('extends')) {
    const extendsRef = sourceTemplate.getAttribute('extends');
    superTemplate = document.querySelector<HTMLTemplateElement>(
      `#${extendsRef}`,
    )!;
    source += `\n\n` + formatOuterHtml(superTemplate.outerHTML);
  }

  const renderDemo = prepareTemplate(
    sourceTemplate,
    undefined,
    renderers,
    superTemplate,
  );

  const renderDemoOuter = prepareTemplate(
    template,
    undefined,
    {
      ...(renderers ?? {}),
      source: (
        _model: object,
        _handlers: TemplateHandlers,
        _renderers: Renderers,
      ) => {
        return source;
      },
      'render-demo': (
        model: object,
        _handlers: TemplateHandlers,
        _renderers: Renderers,
      ) => {
        console.log('render-demo renderer');
        return renderDemo(model);
      },
    },
    demoTemplate,
  );

  render(renderDemoOuter(model ?? {}), output);
}

const demo6SubTemplateElement =
  document.querySelector<HTMLTemplateElement>(`#demo-6-sub-template`)!;

// TODO: make a utility to do this, though it probably shouldn't forward
// the model this way, because that's dynamic scoping which is confusing.
// We'll want a way to declare template parameters ike in stampino-element.
const demo6SubTemplateRenderer: Renderer = (model, handlers, renderers) => {
  return evaluateTemplate(demo6SubTemplateElement, model, handlers, renderers);
};
runDemo('demo-1');
runDemo('demo-2', {model: {foo: 'this is foo'}});
runDemo('demo-3', {model: {x: 9}});
runDemo('demo-4');
runDemo('demo-5', {model: {items: ['a', 'b', 'c']}});
runDemo('demo-6', {
  renderers: {
    'demo-6-sub-template': demo6SubTemplateRenderer,
  },
});
runDemo('demo-7', {model: {}});
runDemo('demo-8', {model: {nullable: null}});
