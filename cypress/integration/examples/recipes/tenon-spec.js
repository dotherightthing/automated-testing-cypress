/**
 * Cypress recipes: Linting a page fragment using tenon.io
 *
 * @author dev@dotherightthing.co.nz
 *
 * @see https://tenon.io/documentation/json-response-overview.php
 * @see https://www.chaijs.com/api/assert/#method_assert
 */

// Passing arrow functions (“lambdas”) to Mocha is discouraged
// https://mochajs.org/#arrow-functions

/* eslint-disable prefer-arrow-callback */
/* global cy */

describe('Fragment linting recipe', function () {
  it('Page validates', function () {
    // publicly accessible webpage to validate
    cy.visit('https://tenon.io/');

    // lint the current location using the Tenon API
    // https://docs.cypress.io/api/commands/location.html#Yields
    // https://tenon.io/documentation/json-response-overview.php
    cy.location().then((loc) => {
      // testing the contents rather than the length gives a more useful error object
      cy.task('tenonAnalyzeUrl', loc.toString()).its('resultSet').should('be.empty');
      // .its('resultSummary.issuesByLevel.A.count').should('eq', 0)
    });
  });
  
  it('Fragment validates', function () {
    cy.visit('http://0.0.0.0:4567/statics/guide.html');

    cy.get('.b-nav-primary [data-modaal-ajax-search]').as('searchNav');

    cy.get('@searchNav').then(($searchNav) => {
      // testing the contents rather than the length gives a more useful error object
      cy.task('tenonAnalyzeHtml', $searchNav.html()).its('resultSet').should('be.empty');
      // cy.task('tenonAnalyzeHtml', $searchNav.html()).then((data) => {
      //  console.log(data); // this is the data passed in, not the response object
      // });
    });
  });
});
