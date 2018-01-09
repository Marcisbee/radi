'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

const radi = require('../src');

var autoTestDir = path.join(__dirname, './fixtures');

describe('radi.js', function () {

  fs.readdirSync(autoTestDir)
    .forEach(function(name) {
      if (/^(\.|\~)/.test(name)) {
        return;
      }

      it(name, () => {
        expect(
          require(autoTestDir + '/' + name)(radi).trim()
        ).to.equal(
          fs.readFileSync(autoTestDir + '/' + name + '/expected.html', 'utf8').trim()
        );
      });

    });

});
