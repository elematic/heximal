import { assert } from "@esm-bundle/chai";
import { StampinoBaseElement } from "../stampino-base-element.js";
import "../stampino-element.js";

suite("stampino-element", () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement("div");
    document.body.append(container);
  });

  teardown(() => {
    container.remove();
  });

  test("basic", async () => {
    container.innerHTML = `
      <stampino-element name="test-1" properties="name">
        <template>
          <h1>Hello {{ name }}!</h1>
        </template>
      </stampino-element>
    `;
    container.insertAdjacentHTML("beforeend", `<test-1 name="World"></test-1>`);
    const el = container.querySelector("test-1") as StampinoBaseElement;
    assert.instanceOf(el, StampinoBaseElement);
    await el.updateComplete;
    assert.equal(
      stripExpressionMarkers(el.shadowRoot!.innerHTML).trim(),
      `<h1>Hello World!</h1>`
    );
  });
});

const stripExpressionMarkers = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->|lit\$[0-9]+\$/g, "");
