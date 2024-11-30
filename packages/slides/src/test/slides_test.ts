import {assert} from '@esm-bundle/chai';
import '../index.js';
import {HeximalSlideDeck} from '../lib/slide-deck.js';
import '@heximal/components';

suite('Heximal Slides', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  teardown(() => {
    container.remove();
  });

  test('Deck discovers child slides and sets visible on current slide', async () => {
    container.innerHTML = `
      <h-slide-deck>
        <h-slide name="slide-1"><template>Slide 1</template></h-slide>
        <h-slide name="slide-2"><template>Slide 2</template></h-slide>
        <h-slide name="slide-3"><template>Slide 3</template></h-slide>
      </h-slide-deck>
    `;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;

    const slides = deck.slides;
    assert.equal(slides.length, 3);
    assert.equal(deck.index, 0);

    assert.isTrue(slides[0].visible);
    assert.isFalse(slides[1].visible);
    assert.isFalse(slides[2].visible);
  });

  test('Deck navigation with next, previous, goto', async () => {
    container.innerHTML = `
      <h-slide-deck>
        <h-slide><template>Slide 1</template></h-slide>
        <h-slide><template>Slide 2</template></h-slide>
        <h-slide><template>Slide 3</template></h-slide>
      </h-slide-deck>
    `;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;

    deck.next();
    assert.equal(deck.index, 1);
    assert.isTrue(deck.slides[1].visible);
    assert.isFalse(deck.slides[0].visible);

    deck.next();
    assert.equal(deck.index, 2);

    // Reached end, next() should not advance past length - 1
    deck.next();
    assert.equal(deck.index, 2);

    deck.previous();
    assert.equal(deck.index, 1);

    deck.goto(0);
    assert.equal(deck.index, 0);

    // Negative bounds clamp
    deck.goto(-5);
    assert.equal(deck.index, 0);
  });

  test('Slide multi-step builds are handled before deck advances', async () => {
    container.innerHTML = `
      <h-slide-deck>
        <h-slide id="s1" steps="2">
          <template>
            <p>Step {{ step }}</p>
          </template>
        </h-slide>
        <h-slide id="s2">
          <template>Slide 2</template>
        </h-slide>
      </h-slide-deck>
    `;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;

    const s1 = deck.slides[0];
    assert.equal(deck.index, 0);
    assert.equal(s1.step, 0);

    // First next() increments step to 1
    deck.next();
    assert.equal(deck.index, 0);
    assert.equal(s1.step, 1);

    // Second next() increments step to 2
    deck.next();
    assert.equal(deck.index, 0);
    assert.equal(s1.step, 2);

    // Third next() advances deck to slide 2
    deck.next();
    assert.equal(deck.index, 1);
  });

  test('Layout template inheritance (theme -> layout -> slide)', async () => {
    container.innerHTML = `
      <h-slide-deck>
        <h-slide-theme>
          <h-slide name="base">
            <template>
              <div class="base-wrapper">
                <header><template name="header">Default Header</template></header>
                <main><template name="content">Default Content</template></main>
              </div>
            </template>
          </h-slide>
          <h-slide name="title-layout" layout="base">
            <template>
              <template name="header"><h1><template name="title">Untitled</template></h1></template>
              <template name="content"><div class="title-body"><template name="body"></template></div></template>
            </template>
          </h-slide>
        </h-slide-theme>

        <h-slide layout="title-layout">
          <template name="title">Presentation Intro</template>
          <template name="body"><p>Welcome to the deck</p></template>
        </h-slide>
      </h-slide-deck>
    `;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;

    const slide = deck.slides[0];
    assert.isOk(slide);
    await slide.updateComplete;

    const shadowHtml = slide.shadowRoot?.innerHTML.replace(/\s+/g, ' ') ?? '';
    assert.include(shadowHtml, 'Presentation Intro');
    assert.include(shadowHtml, 'Welcome to the deck');
    assert.include(shadowHtml, 'base-wrapper');
  });

  test('Slide sections and lexical scoping', async () => {
    container.innerHTML = `
      <h-slide-deck>
        <h-slide-section title="Section 1">
          <h-var name="message" value="Hello Section"></h-var>
          <h-var name="counter" type="number" value="0"></h-var>
          <h-slide>
            <template>
              <div class="msg">{{ message }}</div>
              <div class="count">{{ counter }}</div>
              <button @click="{{ () => counter = counter + 1 }}">+</button>
            </template>
          </h-slide>
        </h-slide-section>
      </h-slide-deck>
    `;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;

    assert.equal(deck.slides.length, 1);
    const slide = deck.slides[0];
    await slide.updateComplete;

    assert.equal(
      slide.shadowRoot?.querySelector('.msg')?.textContent,
      'Hello Section',
    );
    assert.equal(slide.shadowRoot?.querySelector('.count')?.textContent, '0');

    slide.shadowRoot?.querySelector('button')?.click();
    await slide.updateComplete;
    assert.equal(slide.shadowRoot?.querySelector('.count')?.textContent, '1');
  });

  test('Presenter notes extraction', async () => {
    container.innerHTML = `
      <h-slide-deck>
        <h-slide notes="Note from attribute">
          <template>Slide 1</template>
        </h-slide>
        <h-slide>
          <template>Slide 2</template>
          <h-slide-notes><p>Note from element</p></h-slide-notes>
        </h-slide>
      </h-slide-deck>
    `;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;

    assert.equal(deck.slides[0].notes, 'Note from attribute');
    assert.include(deck.slides[1].notes, 'Note from element');
  });

  test('Slide scale calculation on deck', async () => {
    container.innerHTML = `
      <h-slide-deck width="1920" height="1080">
        <h-slide><template>Slide</template></h-slide>
      </h-slide-deck>
    `;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;

    // Trigger updateScale
    deck.style.width = '960px';
    deck.style.height = '540px';
    const scaleStyle = deck.style.getPropertyValue('--h-slide-scale');
    assert.isDefined(scaleStyle);
    assert.isOk(deck);
  });

  test('Renders error UI when slide template has error', async () => {
    container.innerHTML = `
      <h-slide-deck>
        <h-slide name="broken">
          <template>
            <p>{{ ?invalid }}</p>
          </template>
        </h-slide>
      </h-slide-deck>
    `;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;

    const slide = deck.slides[0];
    await slide.updateComplete;
    const shadow = slide.shadowRoot?.innerHTML ?? '';
    assert.include(shadow, 'Slide Render Error');
    assert.include(shadow, 'broken');
  });

  test('Global timer state is accessible in slide bindings and presenter view', async () => {
    container.innerHTML = `
      <h-slide-presenter>
        <h-slide-deck>
          <h-slide name="first">
            <template><h1>First Heading</h1><p class="time">{{ timer.formatted }}</p></template>
            <h-slide-notes><p>First slide speaker notes</p></h-slide-notes>
          </h-slide>
          <h-slide name="second">
            <template><h2>Second Heading</h2><p>Second slide</p></template>
            <h-slide-notes><p>Second slide speaker notes</p></h-slide-notes>
          </h-slide>
          <h-slide name="third">
            <template><h3>Third Heading</h3><p>Third slide</p></template>
          </h-slide>
        </h-slide-deck>
      </h-slide-presenter>
    `;
    const presenter = container.querySelector('h-slide-presenter')!;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;
    await presenter.updateComplete;

    const firstSlide = deck.slides[0];
    await firstSlide.updateComplete;
    assert.equal(firstSlide.title, 'First Heading');
    assert.equal(deck.slides[1].title, 'Second Heading');
    assert.equal(deck.slides[2].title, 'Third Heading');
    assert.match(
      firstSlide.shadowRoot?.querySelector('.time')?.textContent ?? '',
      /^\d{2}:\d{2}$/,
    );

    // Advance via presenter next() and check previous/current/next previews & notes
    presenter.next();
    await deck.updateComplete;
    await presenter.updateComplete;

    assert.equal(deck.index, 1);
    const presenterHtml = presenter.shadowRoot?.innerHTML ?? '';
    assert.include(presenterHtml, 'Second slide speaker notes');
    assert.include(presenterHtml, 'First Heading');
    assert.include(presenterHtml, 'Second Heading');
    assert.include(presenterHtml, 'Third Heading');
  });

  test('embedded <h-slide-presenter> inside a slide renders recursively with bounded depth', async () => {
    container.innerHTML = `
      <h-slide-deck>
        <h-slide name="meta-presenter">
          <template>
            <h-slide-presenter></h-slide-presenter>
          </template>
          <h-slide-notes>Meta speaker notes</h-slide-notes>
        </h-slide>
      </h-slide-deck>
    `;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;
    const slide = deck.slides[0];
    await slide.updateComplete;

    const embeddedPresenter =
      slide.shadowRoot?.querySelector('h-slide-presenter');
    assert.isNotNull(embeddedPresenter);
    await embeddedPresenter?.updateComplete;
    assert.include(
      embeddedPresenter?.shadowRoot?.innerHTML ?? '',
      'Meta speaker notes',
    );
  });

  test('<h-slide-overview> renders slide thumbnails and navigates on click', async () => {
    container.innerHTML = `
      <h-slide-viewer overview>
        <h-slide-deck>
          <h-slide name="one"><template><p>One</p></template></h-slide>
          <h-slide name="two"><template><p>Two</p></template></h-slide>
        </h-slide-deck>
      </h-slide-viewer>
    `;
    const viewer = container.querySelector('h-slide-viewer')!;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;
    await viewer.updateComplete;

    const overview = viewer.shadowRoot?.querySelector('h-slide-overview')!;
    assert.isNotNull(overview);
    await overview.updateComplete;

    const cards =
      overview.shadowRoot?.querySelectorAll<HTMLElement>('.thumbnail-card') ??
      [];
    assert.equal(cards.length, 2);

    cards[1].click();
    await deck.updateComplete;
    await viewer.updateComplete;

    assert.equal(deck.index, 1);
    assert.isFalse(viewer.overview);
  });

  test('<h-slide-filmstrip> renders slide titles and navigates on click', async () => {
    container.innerHTML = `
      <h-slide-viewer filmstrip>
        <h-slide-deck>
          <h-slide name="one">
            <template><h3>Subheading</h3><h1>Main Title One</h1></template>
          </h-slide>
          <h-slide name="two">
            <template name="header"><h2>Title Two</h2></template>
          </h-slide>
        </h-slide-deck>
      </h-slide-viewer>
    `;
    const viewer = container.querySelector('h-slide-viewer')!;
    const deck = container.querySelector('h-slide-deck') as HeximalSlideDeck;
    await deck.updateComplete;
    await viewer.updateComplete;

    // Largest <hx> wins (<h1> over <h3>)
    assert.equal(deck.slides[0].title, 'Main Title One');
    assert.equal(deck.slides[1].title, 'Title Two');

    const filmstrip = viewer.shadowRoot?.querySelector('h-slide-filmstrip')!;
    assert.isNotNull(filmstrip);
    await filmstrip.updateComplete;

    const items =
      filmstrip.shadowRoot?.querySelectorAll<HTMLElement>('.filmstrip-item') ??
      [];
    assert.equal(items.length, 2);
    assert.include(items[0].textContent ?? '', 'Main Title One');
    assert.include(items[1].textContent ?? '', 'Title Two');

    items[1].click();
    await deck.updateComplete;
    assert.equal(deck.index, 1);
  });
});
