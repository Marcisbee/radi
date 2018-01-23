'use strict';

const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const testdir = path.join(__dirname, './fixtures');

global.window = {};
global.document = new JSDOM('<div id="app"></div>').window.document;
global.testapp = document.getElementById('app');
const radi = require('../src');

describe('radi.js', function () {

  fs.readdirSync(testdir)
    .forEach(function(name) {
      if (/^(\.|\~)/.test(name)) {
        return;
      }

      it(name, () => {
        testapp.innerHTML = '';
        expect(
          (require(testdir + '/' + name)(radi)).trim()
        ).to.equal(
          fs.readFileSync(testdir + '/' + name + '/expected.html', 'utf8').trim()
        );
      });

    });

});
