'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _through2 = require('through2');

var _through22 = _interopRequireDefault(_through2);

var _sassport = require('sassport');

var _sassport2 = _interopRequireDefault(_sassport);

var _vinylSourcemapsApply = require('vinyl-sourcemaps-apply');

var _vinylSourcemapsApply2 = _interopRequireDefault(_vinylSourcemapsApply);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var gulpSassport = function gulpSassport() {
  var modules = arguments[0] === undefined ? [] : arguments[0];
  var options = arguments[1] === undefined ? {} : arguments[1];
  var sync = arguments[2] === undefined ? false : arguments[2];

  return _through22['default'].obj(function (file, enc, callback) {
    if (file.isNull() || !file.contents.length) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(gulpError('Streaming not supported!'));
    }

    if (_path2['default'].basename(file.path).indexOf('_') === 0) {
      return callback();
    }

    options.data = file.contents.toString();

    // Ensure `indentedSyntax` is true if a `.sass` file
    options.indentedSyntax = _path2['default'].extname(file.path) === '.sass';

    // Ensure file's parent directory in the include path
    options.includePaths = Array.prototype.concat.call([], options.includePaths || []);

    options.includePaths.unshift(_path2['default'].dirname(file.path));

    // Generate Source Maps if plugin source-map present
    if (file.sourceMap) {
      options.sourceMap = file.path;
      options.omitSourceMapUrl = true;
    }

    console.log(options);

    if (sync !== true) {
      // Async Sass render
      var wrappedCallback = function wrappedCallback(error, obj) {
        if (error) {
          return errorMessage(file, error, callback);
        }

        filePush(file, obj, callback);
      };

      _sassport2['default'](modules).render(options, wrappedCallback);
    } else {
      // Sync Sass render
      try {
        console.log(options);
        result = _sassport2['default'](modules).renderSync(options);

        filePush(file, result, callback);
      } catch (error) {
        return errorMessage(file, error, callback);
      }
    }
  });
};

// Handles returning the file to the stream
var filePush = function filePush(file, sassObj, callback) {
  var sassMap;
  var sassMapFile;
  var sassFileSrc;

  // Build Source Maps!
  if (sassObj.map) {
    // Transform map into JSON
    sassMap = JSON.parse(sassObj.map.toString());
    // Grab the stdout and transform it into stdin
    sassMapFile = sassMap.file.replace('stdout', 'stdin');
    // Grab the base file name that's being worked on
    sassFileSrc = file.relative;
    // Replace the stdin with the original file name
    sassMap.sources[sassMap.sources.indexOf(sassMapFile)] = sassFileSrc;
    // Replace the map file with the original file name (but new extension)
    sassMap.file = _gulpUtil2['default'].replaceExtension(sassFileSrc, '.css');
    // Apply the map
    _vinylSourcemapsApply2['default'](file, sassMap);
  }

  file.contents = sassObj.css;
  file.path = _gulpUtil2['default'].replaceExtension(file.path, '.css');

  callback(null, file);
};

// Handles error message
var errorMessage = function errorMessage(file, error, callback) {
  var relativePath = '';
  var filePath = error.file === 'stdin' ? file.path : error.file;
  var message = '';

  filePath = filePath ? filePath : file.path;
  relativePath = _path2['default'].relative(process.cwd(), filePath);

  message += _gulpUtil2['default'].colors.underline(relativePath) + '\n';
  message += _gulpUtil2['default'].colors.gray('  ' + error.line + ':' + error.column) + '  ';
  message += error.message;

  error.messageFormatted = message;
  error.message = _gulpUtil2['default'].colors.stripColor(message);

  return callback(gulpError(error));
};

var gulpError = function gulpError(message, data) {
  return new _gulpUtil2['default'].PluginError('Sassport', message);
};

exports['default'] = gulpSassport;
module.exports = exports['default'];