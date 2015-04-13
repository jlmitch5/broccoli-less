'use strict';
var Filter = require('broccoli-filter');
var RSVP = require('rsvp');
var less = require('less');

function LessFilter(inputTree, options) {
	if (!(this instanceof LessFilter)) {
		return new LessFilter(inputTree, options);
	}

	this.inputTree = inputTree;
	this.options = options || {};
}

LessFilter.prototype = Object.create(Filter.prototype);
LessFilter.prototype.constructor = LessFilter;

LessFilter.prototype.extensions = ['less'];
LessFilter.prototype.targetExtension = 'css';

LessFilter.prototype.processString = function (str, relativePath) {

    this.options.filename = this.options.filename || relativePath;

    return less.render(str, this.options).then(function(output) {
        return output.css;
    }).catch(function(error) {
        console.error("Error processing file ", error.filename, "at line ", error.line);
        console.error(error.message);
        console.error("Near:");
        console.error(error.extract.join('\n'));
    });
};

module.exports = LessFilter;
