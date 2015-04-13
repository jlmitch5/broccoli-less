'use strict';
var Filter = require('broccoli-filter');
var RSVP = require('rsvp');
var less = require('less');
var Minimatch = require('minimatch').Minimatch;
var fs = require('fs');
var path = require('path');

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


LessFilter.prototype.processFile = function (srcDir, destDir, relativePath) {
  var self = this
  var inputEncoding = (this.inputEncoding === undefined) ? 'utf8' : this.inputEncoding
  var outputEncoding = (this.outputEncoding === undefined) ? 'utf8' : this.outputEncoding
  var string = fs.readFileSync(srcDir + '/' + relativePath, { encoding: inputEncoding })
  return RSVP.Promise.resolve(this.processString(string, srcDir, relativePath))
    .then(function (outputString) {
      var outputPath = self.getDestFilePath(relativePath)
      fs.writeFileSync(destDir + '/' + outputPath, outputString, { encoding: outputEncoding })
    })
}

LessFilter.prototype.processString = function (str, srcDir, relativePath) {

    this.options.filename = this.options.filename || relativePath;
    this.options.paths = this.options.paths.map(function(relative) {
        return path.join(srcDir, relative);
    });

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
