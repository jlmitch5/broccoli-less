'use strict';
var Filter = require('broccoli-filter');
var RSVP = require('rsvp');
var less = require('less');
var Minimatch = require('minimatch').Minimatch;

function LessFilter(inputTree, options) {
	if (!(this instanceof LessFilter)) {
		return new LessFilter(inputTree, options);
	}

	this.inputTree = inputTree;
  this.includeFiles = options.include || [];
  delete options.include;
	this.options = options || {};
}

LessFilter.prototype = Object.create(Filter.prototype);
LessFilter.prototype.constructor = LessFilter;

LessFilter.prototype.extensions = ['less'];
LessFilter.prototype.targetExtension = 'css';

var canProcessFile = LessFilter.prototype.canProcessFile;

LessFilter.prototype.canProcessFile = function(relativePath) {

    // If not using include, then default to previous behavior of processing
    // everything
    //
    if (this.includeFiles == []) {
        return canProcessFile.apply(this, [relativePath]);
    }

    var includedFiles =
        this.includeFiles.filter(function(pattern) {
            if (this._includeFile(relativePath, new Minimatch(pattern))) {
                return true;
            }
        }.bind(this));

    return includedFiles.length > 0;
};

LessFilter.prototype._includeFile = function(relativePath, pattern) {
    return pattern.match(relativePath);
}

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
