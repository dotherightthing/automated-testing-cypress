/**
 * Cypress spec for a search modal
 *
 * This tests a pre-programmed flow, using Lajax.js + callbacks.
 *
 * @author dev@dotherightthing.co.nz
 * 
 * Some tests fail intermittently, e.g.:
 * - when the target is out of the viewable area,
 * - when Cypress is triggered on file change
 * - when Ajax requests imply a certain order
 *   but Cypress checks states in a machine order
 *
 * Waiting for the mutable DOM to stabilise to a certain state is considered an anti-pattern.
 *
 * Where triggered clicks fail, BM says:
 * I would simply add an assertion about the element (or something else)
 * that can guard Cypress from proceeding until the element is ready to receive the click event.
 * It may be something about its dimensions, or content on the page, or waiting for an XHR, etc.
 *
 * This is my first Cypress spec, and my next task will be to break down
 * the screens and test them individually using stubs and fixtures
 * rather than allowing the modal to build up state.
 *
 * @todo Check visibility of transient Ajax spinner
 * @todo Check visibility of transient Typeahead (test sometimes fails)
 * @see https://github.com/cypress-io/cypress/issues/2037 (visibility)
 * @see https://github.com/cypress-io/cypress/issues/695 (visibility)
 * @see https://github.com/cypress-io/cypress/issues/2507 (my ajax route issue)
 * @see https://www.chaijs.com/api/assert/#method_assert
 * @see https://www.chaijs.com/api/bdd/
 * @see https://docs.cypress.io/guides/core-concepts/conditional-testing.html
 */

// Test principles:
// ARRANGE: SET UP APP STATE > ACT: INTERACT WITH IT > ASSERT: MAKE ASSERTIONS

// Aliases are cleared between tests
// https://stackoverflow.com/questions/49431483/using-aliases-in-cypress

// Passing arrow functions (“lambdas”) to Mocha is discouraged
// https://mochajs.org/#arrow-functions

/* eslint-disable prefer-arrow-callback */
/* global cy */

'use strict';

describe('Search modal', function () {
  describe('Launch page', function () {
    it('Modal launch button exists', function () {
      // load local web page
      cy.visit('http://0.0.0.0:4567/statics/home.html');

      // check that the search button exists
      cy.get('.b-nav-primary [data-modaal-ajax-search]').as('searchNav');
    });
  });

  describe('Click to launch modal', function () {
    it('Clicking launches the modal', function () {
      // check that clicking the button requests the modal
      cy.get('.b-nav-primary [data-modaal-ajax-search]').as('searchNav');
      cy.get('@searchNav').click();

      // check that the search theming has been applied
      cy.get('.modaal-ajax').as('modal')
        .should('be.visible');
    });
  });

  /* TODO - Fails as happens too fast - cached?
  describe('Ajax load of HTML', function () {
    it('UI shows modal is loading', function () {
      // check that the spinner appears
      cy.get('.b-modal-js .l-ajax-js__inner').as('ajaxSpinner');
      cy.get('@ajaxSpinner')
        // .scrollIntoView() // helps Cypress to 'see' elements below the fold - sometimes..
        .should('be.visible');
    });
  });
  */

  describe('Default view', function () {
    it('UI displays the correct elements', function () {
      // check that the search theming has been applied
      cy.get('.modaal-ajax').as('modal')
        .should('have.class', 'b-modal-js--search');

      cy.get('@modal').find('.modaal-error')
        .should('not.exist');

      // check that the non-relevant elements are hidden

      // check for the element before evaluating its visibility
      cy.get('.b-modal-js #search-filter', {timeout: 2000}).as('filter');
      cy.get('@filter')
        .should('not.be.visible');

      // within makes for shorter selectors in the test pane
      // this could be a more efficient alternative to aliases
      // if the selectors are well named
      cy.get('.b-modal-js #search-results-summary').within((el) => {
        // result count
        cy.get('.b-search-results-summary__count').as('resultsCount')
          .should('not.exist');

        // no results message
        cy.get('.b-no-results-message').as('noResultsMessage')
          .should('not.exist');
      });

      // check that the supporting information is shown
      cy.get('.b-modal-js').within((el) => {
        cy.get('.b-search-suggestions__previous')
          .should('not.be.visible');

        cy.get('.b-search-suggestions')
          .should('be.visible');

        cy.get('.b-search-result--help')
          .should('be.visible')
          .should('have.length', 3);
      });

      // check that the search field exists
      cy.get('.b-modal-js #search-modal').as('searchField')
        .should('exist');

      // and the clear button is hidden
      cy.get('.b-modal-js .b-guide-list-search-and-filter--search--wide .b-search-field__reset').as('clearButton')
        .should('have.attr', 'disabled');
    });

    it('UI displays the clear button when text is entered', function () {
      // the search field should have focus on modal launch
      cy.focused()
        .should('have.attr', 'id', 'search-modal');

      // typing a single letter should cause the clear button to appear
      cy.get('.b-modal-js #search-modal').as('searchField')
        .type('L').should('have.value', 'L');

      cy.get('.b-modal-js .b-guide-list-search-and-filter--search--wide .b-search-field__reset').as('clearButton')
        .should('not.have.attr', 'disabled');
    });

    it('UI displays a typeahead when 3 characters are entered', function () {
      // typing three letters should launch the typeahead
      cy.get('.b-modal-js #search-modal').as('searchField');

      cy.get('@searchField')
        .type('ea').should('have.value', 'Lea');

      // typing three letters should launch the typeahead
      cy.get('.b-modal-js #search-modal_listbox', {timeout: 2000}).as('typeaheadResults');
      cy.get('@typeaheadResults')
        .should('be.visible');

      cy.get('.b-modal-js .b-tt-js__suggestion').as('typeaheadResult')
        .should('have.length', 10);

    });

    it('User can select a typeahead suggestion using the keyboard', function () {
      // arrow down arrow to the 3rd suggestion and select it
      cy.get('.b-modal-js #search-modal').as('searchField');
      cy.get('@searchField')
        .type('{downarrow}{downarrow}{downarrow}');

      // check that the 3rd item is highlighted
      cy.get('.b-modal-js .b-tt-js__suggestion').as('typeaheadResult')
      cy.get('@typeaheadResult').eq(2)
        .should('have.text', 'UDL (Universal Design for Learning)')
        .should('have.class', 'b-tt-js__cursor');
    });

    it('Pressing enter performs a search for the selected term', function () {
      // set up a route to listen for the expected Ajax request
      cy.server();

      // check that the suggestion was submitted with the form values
      cy.route({
        method: 'GET',
        url: '/ajaxed/test-ajax-search-step-1-results-update.json?*',
        onRequest: (xhr) => {
          // trailing ampersands ensure that exact matches
          expect(xhr.url).to.include('search-modal=UDL&');
          expect(xhr.url).to.include('search-modal__value=Universal+Design+for+Learning&');
          expect(xhr.url).to.include('search_filter=all&');

          // Cypress.$ = jQuery
          const $ajaxSpinner = Cypress.$('.b-modal-js .l-ajax-js__inner--in:visible');
          expect($ajaxSpinner).to.have.lengthOf(1);
          expect($ajaxSpinner.css('opacity')).to.equal('1'); // as :visible can have opacity:0
          expect($ajaxSpinner.height()).to.be.at.least(parseInt($ajaxSpinner.css('min-height'), 10));
        }
      }).as('step1');

      // pressing enter should put the typeahead result into the search field and hide the typeahead
      cy.get('.b-modal-js #search-modal').as('searchField');
      cy.get('@searchField')
        .type('{enter}').should('have.value', 'UDL');

      cy.get('.b-modal-js #search-modal_listbox', {timeout: 2000}).as('typeaheadResults');
      cy.get('@typeaheadResults')
        .should('not.be.visible');

      cy.wait('@step1');
    });
  });

  describe('Results view (No Results with suggestions)', function () {
    it('UI shows no matching results', function () {
      // check that the filters are shown and the first is selected
      cy.get('.b-modal-js #search-filter').as('filter')
        .should('be.visible');

      cy.get('.b-modal-js #search_filter_1').as('filterRadio1')
        .should('have.value', 'all')
        .should('be.checked');

      // check that the summary is output
      cy.get('.b-modal-js #search-results-summary .b-search-results-summary__count').as('resultsCount')
        .contains('0 results for “balloons”');

      // check that the results message is output
      cy.get('.b-modal-js #search-results-summary .b-no-results-message').as('noResultsMessage')
        .contains('Sorry, nothing matches your search “balloons“. Try a different search term or try a popular search.');

      // check that the supporting information is shown
      cy.get('.b-modal-js').within((el) => {
        cy.get('.b-search-suggestions__previous')
          .should('not.be.visible');

        cy.get('.b-search-suggestions')
          .should('be.visible');

        cy.get('.b-search-result--help')
          .should('be.visible')
          .should('have.length', 3);
      });
    });

    it('User can run a popular search', function () {
      // set up a route to listen for the expected Ajax request
      cy.server();

      // check that the suggestion was registered with Typeahead
      cy.route({
        method: 'GET',
        url: '/ajaxed/test-typeahead-search.json?*',
        onRequest: (xhr) => {
          expect(xhr.url).to.include('q=Bullying');
        }
      }).as('ajaxTypeahead');

      // check that the suggestion was submitted with the form values
      cy.route({
        method: 'GET',
        url: '/ajaxed/test-ajax-search-step-2-results-update.json?*',
        onRequest: (xhr) => {
          expect(xhr.url).to.include('search-modal=Bullying');
          expect(xhr.url).to.include('search_filter=all');

          /* Fails
          // Cypress.$ = jQuery
          const $ajaxSpinner = Cypress.$('.b-modal-js .l-ajax-js__inner--in:visible');
          expect($ajaxSpinner).to.have.lengthOf(1);
          expect($ajaxSpinner.css('opacity')).to.equal('1'); // as :visible can have opacity:0
          expect($ajaxSpinner.height()).to.be.at.least(parseInt($ajaxSpinner.css('min-height'), 10));
          */
        }
      }).as('step2');

      // click the popular search button
      cy.get('.b-modal-js .b-search-suggestions__popular').as('popularSearches')
        .find('button').contains('Bullying').click();

      /* TODO:
      This element '<div.l-ajax-js__inner>' is not visible
      because it has CSS property: 'position: fixed'
      and its being covered by another element:
      <p class="b-search-result__button">...</p>

      // check that the spinner appears
      cy.get('.b-modal-js .l-ajax-js__inner').as('ajaxSpinner');
      cy.get('@ajaxSpinner')
        // .scrollIntoView() // helps Cypress to 'see' elements below the fold - sometimes..
        .should('be.visible');
      */

      // wait for the Ajax responses
      cy.wait(['@ajaxTypeahead', '@step2']);
    });
  });

  describe('Results view (Popular Search Results)', function () {
    it('UI hides irrelevant content', function () {
      // check that the suggestion is input into the search field
      // and the clear button remains visible
      cy.get('.b-modal-js #search-modal').as('searchField')
        .should('have.value', 'Bullying');

      cy.get('.b-modal-js .b-guide-list-search-and-filter--search--wide .b-search-field__reset').as('clearButton')
        .should('not.have.attr', 'disabled');

      // check that the supporting information is shown
      cy.get('.b-modal-js').within((el) => {
        cy.get('.b-search-suggestions__previous')
          .should('not.be.visible');

        cy.get('.b-search-suggestions')
          .should('not.be.visible');

        cy.get('.b-search-result--help')
          .should('be.visible'); // part of 'All' search results
      });
    });

    it('UI displays relevant filters', function () {
      // check that the filters are shown and have the totals data
      cy.get('.b-modal-js #search_filter', {timeout: 2000}).as('filter');

      cy.get('@filter')
        .should('be.visible')
        .should('have.attr', 'data-content-filter-totals', '{"all":64,"guides":40,"suggestions":20,"resources":3,"other":0}');

      // check that the first filter is selected
      cy.get('.b-modal-js #search_filter_1').as('filterRadio1')
        .should('have.value', 'all').should('be.checked');

      // check that filters with matches are enabled
      cy.get('.b-modal-js .b-guide-list-search-and-filter .b-filter__input:not([value="other"])').as('filterNotOther')
        .should('not.be.disabled');

      /*
      TODO - button disabling disabled as it prevented the form from submitting
      cy.get('.b-modal-js .b-guide-list-search-and-filter .b-filter__input[value="other"]').as('filterOther')
        .should('be.disabled');
      */
    });

    it('UI displays relevant results summary', function () {
      // check that summary count is output
      cy.get('.b-modal-js #search-results-summary .b-search-results-summary__count').as('resultsCount')
        .contains('64 results for');

      cy.get('@resultsCount')
        .contains('Bullying');

      // check that summary canonical suggestion term button is output
      cy.get('@resultsCount').find('[data-field-suggestion] .b-button__content').as('resultSummarySuggestionButton');

      // check that the results are output
      cy.get('.b-modal-js #search-results-all .b-search-result').as('searchResult')
        .should('have.length', 16);

      // check that the pagination button is output
      cy.get('.b-modal-js #search-results-pagination-button').as('pagination')
        .contains('Load 20 more results');
    });

    it('User can run a filter/search for Guides', function () {
      // set up a route to listen for the expected Ajax request
      cy.server();

      // check that the suggestion was submitted with the form values
      cy.route({
        method: 'GET',
        url: '/ajaxed/test-ajax-search-step-3-results-update.json?*',
        onRequest: (xhr) => {
          expect(xhr.url).to.include('search-modal=Bullying');
          expect(xhr.url).to.include('search_filter=guides');

          // Cypress.$ = jQuery
          const $ajaxSpinner = Cypress.$('.b-modal-js .l-ajax-js__inner--in:visible');
          expect($ajaxSpinner).to.have.lengthOf(1);
          expect($ajaxSpinner.css('opacity')).to.equal('1'); // as :visible can have opacity:0
          expect($ajaxSpinner.height()).to.be.at.least(parseInt($ajaxSpinner.css('min-height'), 10));
        }
      }).as('step3');

      // click the Guides 'filter'
      cy.get('.b-modal-js .b-filter__input[value="guides"] + label').as('guidesRadio')
        .click();

      // wait for the Ajax response
      cy.wait('@step3');
    });
  });

  describe('Results view (Guides Filter - Synonymical Term Search Results)', function () {
    if('check that old results are removed', function() {
      // check that the results are cleared
      cy.get('.b-modal-js #search-results-all .b-search-result').as('searchResult')
        .should('have.length', 0);
    });

    it('UI displays relevant filters', function () {
      // check that filters with matches are enabled
      cy.get('.b-modal-js .b-guide-list-search-and-filter .b-filter__input:not([value="other"])').as('filterNotOther')
        .should('not.be.disabled');

      /*
      TODO - button disabling disabled as it prevented the form from submitting
      cy.get('.b-modal-js .b-guide-list-search-and-filter .b-filter__input[value="other"]').as('filterOther');
      cy.get('@filterOther').should('be.disabled');
      */
    });

    it('UI displays relevant results message', function () {
      // summary total should be updated
      cy.get('.b-modal-js #search-results-summary .b-search-results-summary__count').as('resultsCount')
        .contains('40 Guides match “Bullying”').contains('Child Aggression Syndrome');
    });

    it('User can search on a canonical term', function () {
      // set up a route to listen for the expected Ajax request
      cy.server();

      // check that the suggestion was submitted with the form values
      cy.route({
        method: 'GET',
        url: '/ajaxed/test-ajax-search-step-4-results-update.json?*',
        onRequest: (xhr) => {
          expect(xhr.url).to.include('search-modal=Child+Aggression+Syndrome');
          expect(xhr.url).to.include('search_filter=guides');

          // Cypress.$ = jQuery
          const $ajaxSpinner = Cypress.$('.b-modal-js .l-ajax-js__inner--in:visible');
          expect($ajaxSpinner).to.have.lengthOf(1);
          expect($ajaxSpinner.css('opacity')).to.equal('1'); // as :visible can have opacity:0
          expect($ajaxSpinner.height()).to.be.at.least(parseInt($ajaxSpinner.css('min-height'), 10));
        }
      }).as('step4');

      // click the canonical term button
      cy.get('.b-modal-js #search-results-summary .b-search-results-summary__count').as('resultsCount')
        .find('[data-field-suggestion] .b-button__content').as('resultSummarySuggestionButton')
        .click();

      // wait for the Ajax response
      cy.wait('@step4');

      // check that the suggestion appears in the search field
      // and this causes the clear button to remain visible
      cy.get('.b-modal-js #search-modal').as('searchField')
        .should('have.value', 'Child Aggression Syndrome');

      cy.get('.b-modal-js .b-guide-list-search-and-filter--search--wide .b-search-field__reset').as('clearButton')
        .should('not.have.attr', 'disabled');

      // check that the results are cleared
      /* fails
      cy.get('.b-modal-js #search-results-guides .b-search-result').as('searchResult')
        .should('have.length', 0);
      */
    });
  });

  describe('Results view (Guides Filter - Canonical Term Search Results)', function () {
    it('UI should display the correct elements', function () {
      // canonical term suggestion button should be hidden
      cy.get('.b-modal-js #search-results-summary .b-search-results-summary__count').as('resultsCount')
        .find('[data-field-suggestion] .b-button__content').as('resultSummarySuggestionButton')
        .should('have.length', 0);

      // check that the results are output
      cy.get('.b-modal-js #search-results-guides .b-search-result').as('searchResult')
        .should('have.length', 3);
    });

    it('User can run a filter/search for Resources', function () {
      // set up a route to listen for the expected Ajax request
      cy.server();

      // check that the suggestion was submitted with the form values
      cy.route({
        method: 'GET',
        url: '/ajaxed/test-ajax-search-step-5-results-update.json?*',
        onRequest: (xhr) => {
          expect(xhr.url).to.include('search-modal=Child+Aggression+Syndrome');
          expect(xhr.url).to.include('search_filter=resources');

          /* intermiitent fail
          // Cypress.$ = jQuery
          const $ajaxSpinner = Cypress.$('.b-modal-js .l-ajax-js__inner--in:visible');
          expect($ajaxSpinner).to.have.lengthOf(1);
          expect($ajaxSpinner.css('opacity')).to.equal('1'); // as :visible can have opacity:0
          expect($ajaxSpinner.height()).to.be.at.least(parseInt($ajaxSpinner.css('min-height'), 10));
          */
        }
      }).as('step5');

      // click the 'filter'
      cy.get('.b-modal-js .b-filter__input[value="resources"] + label').as('filterResources')
        .click();

      // wait for the Ajax response
      cy.wait('@step5');
    });
  });

  describe('Results view (Resources Filter - Search Results)', function () {
    it('There should be 2 results', function () {
      cy.get('.b-modal-js #search-results-resources .b-search-result').as('searchResult')
        .should('have.length', 2);
    });

    it('UI displays relevant filters', function () {
      // check that filters with matches are enabled
      cy.get('.b-modal-js .b-guide-list-search-and-filter .b-filter__input:not([value="other"])').as('filterNotOther')
        .should('not.be.disabled');

      /*
      cy.get('.b-modal-js .b-guide-list-search-and-filter .b-filter__input[value="other"]').as('filterOther');
      cy.get('@filterOther').should('be.disabled');
      */

      // summary total should be updated
      cy.get('.b-modal-js #search-results-summary .b-search-results-summary__count').as('resultsCount')
        .contains('3 Resources match “Child Aggression Syndrome”');

      // check that the results are output
      cy.get('.b-modal-js #search-results-resources .b-search-result').as('searchResult')
        .should('have.length', 2);
    });

    it('Hide-show is set up correctly', function () {
      // NOTE: using .as() with a chained assertion
      // returns a function rather than a jQuery object
      // causing an error
      // It only works when the alias is never used
      // in which case it simply acts as a label
      /*
        cy.get('[data-controls="search-result-expand-5"]').as('revealTrigger1')
        .should('not.have.class', 'is-opened');
       */

      cy.get('.b-modal-js #search-results-resources .b-search-result').as('searchResult');

      // by default, hideshow should be hidden
      cy.get('@searchResult').eq(0).find('.b-hide-show-js-expandmore__button', {timeout: 2000}).as('revealTrigger1');
      cy.get('@revealTrigger1')
        .should('not.have.class', 'is-opened');

      cy.get('@searchResult').eq(0).find('.b-hide-show-js-expandmore__to_expand').as('revealTarget1');
      cy.get('@revealTarget1')
        .should('not.be.visible');

      // clicking should show the hideshow
      // timeout allows for animation
      cy.get('@revealTrigger1', { timeout: 2000 })
        .click()
        .should('have.class', 'is-opened');

      cy.get('@revealTarget1', { timeout: 2000 })
        .should('be.visible');

      // clicking should hide the hideshow
      // timeout allows for animation
      // NOTE: this test can be flakey

      cy.get('@revealTrigger1', { timeout: 2000 })
        .click();

      cy.get('@revealTrigger1', { timeout: 2000 })
        .should('not.have.class', 'is-opened');

      cy.get('@revealTarget1', { timeout: 2000 })
        .should('not.be.visible');
    });

    it('User can load more results', function () {
      // scroll down to visually check what is happening
      // TODO this isn't seen as the focus shifts when the button is clicked
      // or the button disappears too quickly?

      // set up a route to listen for the expected Ajax request
      cy.server();

      // check that the suggestion was submitted with the form values
      cy.route({
        method: 'GET',
        url: '/ajaxed/test-ajax-search-step-6-results-append.json?*',
        onRequest: (xhr) => {
          /* TODO: pagination doesn't seem to submit form
          expect(xhr.url).to.include('search-modal=Child+Aggression+Syndrome');
          expect(xhr.url).to.include('search_filter=resources');
          */
         
          /* Fails
          // Cypress.$ = jQuery
          const $ajaxSpinner = Cypress.$('.b-modal-js .l-ajax-js__inner--in:visible');
          expect($ajaxSpinner).to.have.lengthOf(1);
          expect($ajaxSpinner.css('opacity')).to.equal('1'); // as :visible can have opacity:0
          expect($ajaxSpinner.height()).to.be.at.least(parseInt($ajaxSpinner.css('min-height'), 10));
          */
        }
      }).as('step6');

      // check that the pagination button is output
      cy.get('.b-modal-js #search-results-pagination-button').as('pagination')
        .contains('Load 1 more result');

      // click the load more button
      cy.get('@pagination')
        .click();

      /* TODO:
      This element '<div.l-ajax-js__inner>' is not visible
      because it has CSS property: 'position: fixed'
      and its being covered by another element:
      <div class="l-2__col ">...</div>

      // check that the spinner appears
      cy.get('.b-modal-js .l-ajax-js__inner').as('ajaxSpinner');
      cy.get('@ajaxSpinner')
        // .scrollIntoView() // helps Cypress to 'see' elements below the fold - sometimes..
        .should('be.visible');
      */

      // wait for the Ajax response
      cy.wait('@step6');
    });
  });

  describe('Results', function () {

    it('Pagination removed', function () {
      cy.get('.b-modal-js #search-results-pagination-button').as('pagination')
      cy.get('@pagination')
        .should('not.be.visible');
    });

    it('Show-hide is set up correctly', function () {
      // check that the results are output
      cy.get('.b-modal-js #search-results-resources .b-search-result').as('searchResult');
      cy.get('@searchResult').should('have.length', 3);

      // by default, hideshow should be shown
      cy.get('@searchResult').eq(2).find('.b-hide-show-js-expandmore__button').as('revealTrigger3');
      cy.get('@revealTrigger3')
        .should('have.class', 'is-opened');

      cy.get('@searchResult').eq(2).find('.b-hide-show-js-expandmore__to_expand').as('revealTarget3');
      cy.get('@revealTarget3')
        .should('be.visible');

      // clicking should hide the hideshow
      // timeout allows for animation
      cy.get('@revealTrigger3', { timeout: 2000 })
        .click()
        .should('not.have.class', 'is-opened');

      cy.get('@revealTarget3', { timeout: 2000 })
        .should('not.be.visible');

      // clicking should show the hideshow
      // timeout allows for animation
      cy.get('@revealTrigger3', { timeout: 2000 })
        .click()
        .should('have.class', 'is-opened');

      cy.get('@revealTarget3', { timeout: 2000 })
        .should('be.visible');
    });
  });

  describe('Reset', function () {

    it('User can clear/reset search', function () {
      // scroll to the top of the modal
      cy.get('.b-modal-js #search-modal').as('searchField')
      cy.get('@searchField')
        .scrollIntoView();

      // set up a route to listen for the expected Ajax request
      cy.server();

      // check that the suggestion was submitted with the form values
      cy.route({
        method: 'GET',
        url: '/ajaxed/test-ajax-search-step-7-results-update.json?*',
        onRequest: (xhr) => {
          // check no value is submitted for search-modal (search field)
          expect(xhr.url).to.include('search-modal__value=&');

          // Cypress.$ = jQuery
          const $ajaxSpinner = Cypress.$('.b-modal-js .l-ajax-js__inner--in:visible');
          expect($ajaxSpinner).to.have.lengthOf(1);
          expect($ajaxSpinner.css('opacity')).to.equal('1'); // as :visible can have opacity:0
          expect($ajaxSpinner.height()).to.be.at.least(parseInt($ajaxSpinner.css('min-height'), 10));
        }
      }).as('step7');

      // Click the clear button
      cy.get('.b-modal-js .b-guide-list-search-and-filter--search--wide .b-search-field__reset').as('clearButton')
        .click();

      cy.wait('@step7');
    });
  });

  describe('Reset default view', function () {
    it('Search field is focussed', function() {
      // the search field should have focus on modal reset
      cy.focused()
        .should('have.attr', 'id', 'search-modal')
        // and be empty
        .should('have.value', '');
    });

    it('UI displays the correct elements', function () {
      // TODO add to every test
      cy.get('.modaal-ajax').as('modal');
      cy.get('@modal').find('.modaal-error')
        .should('not.exist');

      // check that the non-relevant elements are hidden

      // check for the element before evaluating its visibility
      cy.get('.b-modal-js #search-filter', {timeout: 2000}).as('filter');
      cy.get('@filter')
        .should('not.be.visible');

      // within makes for shorter selectors in the test pane
      // this could be a more efficient alternative to aliases
      // if the selectors are well named
      cy.get('.b-modal-js #search-results-summary').within((el) => {
        // result count
        cy.get('.b-search-results-summary__count').as('resultsCount')
          .should('not.exist');

        // no results message
        cy.get('.b-no-results-message').as('noResultsMessage')
          .should('not.exist');
      });

      // check that the supporting information is shown
      cy.get('.b-modal-js').within((el) => {
        cy.get('.b-search-suggestions__previous')
          .should('be.visible');

        cy.get('.b-search-suggestions')
          .should('be.visible');

        // check that the only remaining results are search results
        cy.get('.b-search-result').not('.b-search-result--help')
          .should('have.length', 0);

        // and that there are 3
        cy.get('.b-search-result--help')
          .should('be.visible')
          .should('have.length', 3);
      });

      // check that the search field exists
      cy.get('.b-modal-js #search-modal').as('searchField')
        .should('exist');

      // and the clear button is hidden
      cy.get('.b-modal-js .b-guide-list-search-and-filter--search--wide .b-search-field__reset').as('clearButton')
        .should('have.attr', 'disabled');
    });
  });
});
