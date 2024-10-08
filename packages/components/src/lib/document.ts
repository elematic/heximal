import {prepareTemplate} from '@heximal/templates';
import {render} from 'lit';
import {effect} from 'signal-utils/subtle/microtask-effect';
import {HeximalScope} from './scope.js';

// TODO (justinfagnani): Put this in a new @heximal/document package

const rootScopes = new WeakMap<
  Document | ShadowRoot,
  Record<string, unknown>
>();

/**
 * Returns the root scope object for an element. The root scope is the object
 * that is shared by all elements in the same document or shadow root.
 */
export const getScope = (node: Node) => {
  while (true) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).localName === 'h-scope'
    ) {
      return (node as HeximalScope).scope;
    }
    if (node.parentNode === null) {
      if (
        node.nodeType === Node.DOCUMENT_NODE ||
        node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
      ) {
        let scope = rootScopes.get(node as Document | ShadowRoot);
        if (scope === undefined) {
          scope = {
            window,
            document,
            JSON,
            $: (selector: string) =>
              (node.getRootNode() as Document | ShadowRoot)?.querySelector(
                selector,
              ),
          };
          rootScopes.set(node as Document | ShadowRoot, scope);
        }
        return scope;
      }
      return undefined;
    }
    node = node.parentNode;
  }
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
  const outerScope = getScope(el);
  if (outerScope === undefined) {
    throw new Error('No scope found');
  }
  const scope: Record<string, unknown> = Object.create(outerScope, {
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

    const preparedTemplate = prepareTemplate(
      template as HTMLTemplateElement,
      undefined,
    );

    // This is a hack to get any h-var and h-scope elements in the template to
    // attach to the scope so that they can be used in template expressions.
    // Other ways to do this:
    // - Make scope be a signal-producing Proxy, and adopt signals from the
    //   scope into variables once they are created. Then when the var sets its
    //   value, the signal in the scope is updated, and parts will update.
    // - Process the prepared template and create a signal for each var.
    const scope = getScope(template);
    render(preparedTemplate(scope ?? {}), template.parentElement!, {
      renderBefore: template,
    });

    effect(() => {
      const scope = getScope(template);
      render(preparedTemplate(scope ?? {}), template.parentElement!, {
        renderBefore: template,
      });
    });
  }
};
