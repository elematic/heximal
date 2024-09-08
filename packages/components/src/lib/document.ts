// TODO (justinfagnani): Put in a new @heximal/document package
import {render} from '@heximal/templates';
import {effect} from 'signal-utils/subtle/microtask-effect';

export const runAutoTemplates = (root: Document | ShadowRoot = document) => {
  const templates = root.querySelectorAll('template[h-auto]');
  for (const template of templates) {
    const root = template.getRootNode() as Document | ShadowRoot;

    // TODO (justinfagnani): extract into a utility to build a scope for any
    // element in the document.
    const variables = root.querySelectorAll('h-var');    
    const scope = {
      window,
      console,
    };
    for (const variable of variables) {
      Object.defineProperty(scope, variable.name, {
        get() {
          return variable.value;
        },
        set(value: unknown) {
          variable.value = value;
        },
      });
    }

    effect(() => {
      render(
        template as HTMLTemplateElement,
        template.parentElement!,
        scope,
        undefined,
        {renderBefore: template},
      );
    });
  }
};
