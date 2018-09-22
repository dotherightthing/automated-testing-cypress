/**
 * Cypress spec for a search modal
 *
 * @author dev@dotherightthing.co.nz
 * 
 * @todo Interactive visibility tests refactored to check data attributes
 *       rather than visibility due to https://github.com/cypress-io/cypress/issues/2037
 *
 * @todo Some tests fail when Cypress is triggered on file change.
 * Waiting for the mutable DOM to stabilise to a certain state is considered an anti-pattern
 * https://docs.cypress.io/guides/core-concepts/conditional-testing.html#
 *
 * @see https://www.chaijs.com/api/assert/#method_assert
 */

// ARRANGE - SET UP APP STATE
// ACT - INTERACT WITH IT
// ASSERT - MAKE ASSERTIONS

// Aliases are cleared between tests
// https://stackoverflow.com/questions/49431483/using-aliases-in-cypress

// Passing arrow functions (“lambdas”) to Mocha is discouraged
// https://mochajs.org/#arrow-functions

/* eslint-disable prefer-arrow-callback */
/* global cy */

'use strict';

describe('Search modal', function () {
  describe('Default view', function () {
    it('User can launch the modal', function () {
      // load local web page
      cy.visit('http://0.0.0.0:4567/statics/home.html');

      // TODO: observe Ajax HTML request
      // to check for spinner at the right time
      // https://github.com/dotherightthing/cypress-test-tiny-ajax-html/tree/master/cypress/integration/ajax-html

      // check that the search button exists
      cy.get('.b-nav-primary [data-modaal-ajax-search]').as('searchNav');
      cy.get('@searchNav').click();
    });

    it('UI displays the correct elements', function () {
      // check that the search theming has been applied
      cy.get('.modaal-ajax').as('modal')
        .should('be.visible')
        .should('have.class', 'b-modal-js--search');

      cy.get('@modal').find('.modaal-error')
        .should('not.exist');

      // check that the spinner appears
      /*
      cy.get('.b-modal-js .l-ajax-js__inner').as('ajaxSpinner');
      cy.get('@ajaxSpinner')
        .should('have.class', 'l-ajax-js__inner--in')
        .should('be.visible');
      */

      // check that the non-relevant elements are hidden
      cy.get('.b-modal-js #search-filter').as('filter')
        .should('not.be.visible');

      cy.get('.b-modal-js #search-results-summary .b-search-results-summary__count').as('resultsCount')
        .should('not.exist');

      cy.get('.b-modal-js #search-results-summary .b-no-results-message').as('noResultsMessage')
        .should('not.exist');

      // check that the supporting information is shown
      cy.get('.b-modal-js .b-search-suggestions, .b-search-suggestions__heading, .b-search-result').as('searchSuggestionsAndHelp')
        .should('be.visible');

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
      cy.get('.b-modal-js #search-modal').as('searchField')
        .type('ea').should('have.value', 'Lea');

      // typing three letters should launch the typeahead
      cy.get('.b-modal-js #search-modal_listbox').as('typeaheadResults')
        .should('be.visible');

      cy.get('.b-modal-js .b-tt-js__suggestion').as('typeaheadResult')
        .should('have.length', 10);

      // arrow down arrow to the 3rd suggestion and select it
      cy.get('@searchField')
        .type('{downarrow}{downarrow}{downarrow}');

      // check that the 3rd item is highlighted
      cy.get('@typeaheadResult').eq(2)
        .should('have.text', 'UDL (Universal Design for Learning)')
        .should('have.class', 'b-tt-js__cursor');

      // pressing enter should put the typeahead result into the search field and hide the typeahead
      cy.get('@searchField')
        .type('{enter}').should('have.value', 'UDL');

      cy.get('@typeaheadResults')
        .should('not.be.visible');
    });
  });

  describe('Results view (No Results with suggestions)', function () {
    it('UI shows no matching results', function () {
      // check that the spinner appears
      /*
      cy.get('.b-modal-js .l-ajax-js__inner').as('ajaxSpinner');
      cy.get('@ajaxSpinner')
        .should('have.class', 'l-ajax-js__inner--in')
        .should('be.visible');
      */

      // check that the supporting information is hidden
      cy.get('.b-modal-js .b-search-suggestions, .b-modal-js .b-search-suggestions__heading, .b-modal-js .b-search-result').as('searchSuggestionsAndHelp')
        .should('not.be.visible');

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
    });

    it('User can run a popular search', function () {
      cy.get('.b-modal-js .b-search-suggestions__popular').as('popularSearches')
        .find('button').contains('Bullying').click();

      // check that the spinner appears
      /*
      cy.get('.b-modal-js .l-ajax-js__inner').as('ajaxSpinner');
      cy.get('@ajaxSpinner')
        .should('have.class', 'l-ajax-js__inner--in')
        .should('be.visible');
      */
      // check that the suggestion is input into the search field
      // and the clear button remains visible
      cy.get('.b-modal-js #search-modal').as('searchField')
        .should('have.value', 'Bullying');

      cy.get('.b-modal-js .b-guide-list-search-and-filter--search--wide .b-search-field__reset').as('clearButton')
        .should('not.have.attr', 'disabled');

      // --- the form submits ---
      // TODO check Ajax request?
    });
  });

  describe('Results view (Popular Search Results)', function () {
    it('UI hides irrelevant content', function () {
      // check that the supporting information is still hidden
      cy.get('.b-modal-js .b-search-suggestions, .b-modal-js .b-search-suggestions__heading').as('searchSuggestionsAndHelp')
        .should('not.be.visible');
    });

    it('UI displays relevant filters', function () {
      // check that the filters are shown and have the totals data
      cy.get('.b-modal-js #search_filter').as('filter')
        .scrollIntoView().should('be.visible') // https://github.com/cypress-io/cypress/issues/2037
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
      // click the Guides 'filter'
      cy.get('.b-modal-js .b-filter__input[value="guides"] + label').as('guidesRadio')
        .click();

      // check that the results are cleared
      cy.get('.b-modal-js #search-results-all .b-search-result').as('searchResult')
        .should('have.length', 0);

      // check that the spinner appears
      /*
      cy.get('.b-modal-js .l-ajax-js__inner').as('ajaxSpinner');
      cy.get('@ajaxSpinner')
        .should('have.class', 'l-ajax-js__inner--in')
        .should('be.visible');
      */
    });
  });

  describe('Results view (Guides Filter - Synonymical Term Search Results)', function () {
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
      // click the canonical term button
      // TODO: Cypress says there are two, first fails - what is it?
      cy.get('.b-modal-js #search-results-summary .b-search-results-summary__count').as('resultsCount')
        .find('[data-field-suggestion] .b-button__content').as('resultSummarySuggestionButton')
        .click();

      // check that the suggestion appears in the search field
      // and this causes the clear button to remain visible
      cy.get('.b-modal-js #search-modal').as('searchField')
        .should('have.value', 'Child Aggression Syndrome');

      cy.get('.b-modal-js .b-guide-list-search-and-filter--search--wide .b-search-field__reset').as('clearButton')
        .should('not.have.attr', 'disabled');

      // check that the spinner appears
      /*
      cy.get('.b-modal-js .l-ajax-js__inner').as('ajaxSpinner');
      cy.get('@ajaxSpinner')
        .should('have.class', 'l-ajax-js__inner--in')
        .should('be.visible');
      */

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
      // click the 'filter'
      cy.get('.b-modal-js .b-filter__input[value="resources"] + label').as('filterResources')
        .click();

      // check that the results are cleared
      cy.get('.b-modal-js #search-results-resources .b-search-result').as('searchResult')
        .should('have.length', 0);

      // check that the spinner appears
      /*
      cy.get('.b-modal-js .l-ajax-js__inner').as('ajaxSpinner');
      cy.get('@ajaxSpinner')
        .should('have.class', 'l-ajax-js__inner--in')
        .should('be.visible');
      */
    });
  });

  describe('Results view (Resources Filter - Search Results)', function () {
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
      cy.get('@searchResult').eq(0).find('.b-hide-show-js-expandmore__button').as('revealTrigger1');
      cy.get('@revealTrigger1')
        .should('not.have.class', 'is-opened');

      cy.get('@searchResult').eq(0).find('.b-hide-show-js-expandmore__to_expand').as('revealTarget1');
      cy.get('@revealTarget1')
        .should('not.be.visible');

      // clicking should show the hideshow
      // timeout allows for animation
      cy.get('@revealTrigger1', { timeout: 5000 })
        .click()
        .should('have.class', 'is-opened');

      cy.get('@revealTarget1', { timeout: 5000 })
        .should('be.visible');

      // clicking should hide the hideshow
      // timeout allows for animation
      // TODO: fails to collapse
      cy.get('@revealTrigger1', { timeout: 5000 })
        .click()
        .should('not.have.class', 'is-opened');

      cy.get('@revealTarget1', { timeout: 5000 })
        .should('not.be.visible');
    });

    it('User can use load more to load more results', function () {
      // scroll down to visually check what is happening
      // TODO this isn't seen as the focus shifts when the button is clicked
      // or the button disappears too quickly?

      // check that the pagination button is output
      cy.get('.b-modal-js #search-results-pagination-button').as('pagination')
        .scrollIntoView()
        .contains('Load 1 more result');

      // TODO check that the button spinner appears

      // click the load more button
      cy.get('@pagination')
        .click()
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
      cy.get('@revealTrigger3', { timeout: 5000 })
        .click()
        .should('not.have.class', 'is-opened');

      cy.get('@revealTarget3', { timeout: 5000 })
        .should('not.be.visible');

      // clicking should show the hideshow
      // timeout allows for animation
      cy.get('@revealTrigger3', { timeout: 5000 })
        .click()
        .should('have.class', 'is-opened');

      cy.get('@revealTarget3', { timeout: 5000 })
        .should('be.visible');
    });
  });
});
