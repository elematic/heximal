import {render} from '@heximal/templates';
import {effect} from 'signal-utils/subtle/microtask-effect';

// TODO (justinfagnani): Put this in a new @heximal/document package

const rootScopes = new WeakMap<
  Document | ShadowRoot,
  Record<string, unknown>
>();

/**
 * Returns the root scope object for an element. The root scope is the object
 * that is shared by all elements in the same document or shadow root.
 */
export const getRootScope = (el: Element) => {
  const root = el.getRootNode() as Document | ShadowRoot;
  let scope = rootScopes.get(root);
  if (scope === undefined) {
    scope = {
      window,
      document: el.ownerDocument,
    };
    rootScopes.set(root, scope);
  }
  return scope;
};

/**
 * Returns the element scope for an element. This element scope is a new object
 * that inherits from the root scope and has a `host` property that points to
 * the element.
 *
 * This is a very poor implementation of an element scope. Scopes need to be
 * specified. This is just a placeholder.
 */
export const getElementScope = (el: Element) => {
  const rootScope = getRootScope(el);
  const scope: Record<string, unknown> = Object.create(rootScope, {
    host: {
      value: el,
      writable: false,
    },
  });
  // We don't want assignments to random names to create properties on the
  // scope.
  // TODO (justinfagnani): We may want to be able to customize scope lookup
  // and assignment behavior.
  Object.freeze(scope);
  return scope;
};

export const runAutoTemplates = (root: Document | ShadowRoot = document) => {
  const templates = root.querySelectorAll('template[h-auto]');
  for (const template of templates) {
    // TODO (justinfagnani): How to we want to be able to refer to the
    // <template> element itself from within expressions? Both `this` and `host`
    // seem wrong... For now just use the root scope.
    const scope = getRootScope(template);
    effect(() => {
      // TODO (justinfagnani): use prepareTemplate() to be able to pass in
      // renderers for other templates, so that sub-template calls and
      // inheritance work.
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