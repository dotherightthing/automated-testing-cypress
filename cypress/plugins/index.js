/**
 * Cypress: custom plugins
 *
 * @author dev@dotherightthing.co.nz
 */

'use strict';

const normalizeWhitespace = require('normalize-html-whitespace');
const TenonNode = require('tenon-node');

const tenonApi = new TenonNode({
  key: process.env.TENON_API_KEY
});

// export a function
module.exports = (on) => {
  // configure plugins here
  on('task', {
    /**
     * Lint a URL in Tenon
     *
     * @description
     * - Get a new API key: https://tenon.io/register.php
     * - Get an existing API key: https://tenon.io/apikey.php
     * - Add your Tenon API key as an environmental variable:
     *   sudo nano ~/.bash_profile
     *   export TENON_API_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
     *
     * @param {string} url Fully qualified URL
     * @return {object} Tenon response object
     *
     * @see ../integration/recipes/tenon-spec.js
     * @see https://github.com/poorgeek/tenon-selenium-example/blob/master/test/helpers/tenonCommands.js
     * @see https://www.npmjs.com/package/tenon-node
     */
    tenonAnalyzeUrl(url) {
      return new Promise((resolve, reject) => {
        tenonApi.analyze(url, (err, tenonResult) => {
          if (err) {
            reject(err);
          }

          if (tenonResult.status > 400) {
            reject(tenonResult.info);
          } else {
            resolve(tenonResult);
          }
        });
      });
    },

    /**
     * Lint an HTML fragment in Tenon
     *
     * @description
     * - Get a new API key: https://tenon.io/register.php
     * - Get an existing API key: https://tenon.io/apikey.php
     * - Add your Tenon API key as an environmental variable:
     *   sudo nano ~/.bash_profile
     *   export TENON_API_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
     *
     * @param {string} selectorHtml HTML fragment
     * @return {object} Tenon response object
     * 
     * @see ../integration/recipes/tenon-spec.js
     * @see https://github.com/poorgeek/tenon-selenium-example/blob/master/test/helpers/tenonCommands.js
     * @see https://www.npmjs.com/package/tenon-node
     */
    tenonAnalyzeHtml(selectorHtml) {
      const html = normalizeWhitespace(selectorHtml); // strip whitespace between html tags

      return new Promise((resolve, reject) => {
        tenonApi.analyze(html, (err, tenonResult) => {
          if (err) {
            reject(err);
          }

          if (tenonResult.status > 400) {
            console.log(tenonResult.info);
            reject(tenonResult.info);
          } else {
            resolve(tenonResult);
          }
        });
      });
    }
  });
};
