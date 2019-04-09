'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var rheaPromise = require('rhea-promise');
var amqpCommon = require('@azure/amqp-common');
var crypto = _interopDefault(require('crypto'));
var debugModule = _interopDefault(require('debug'));
var tslib_1 = require('tslib');
var os = _interopDefault(require('os'));
var assert = _interopDefault(require('assert'));

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

/*!
 * assertion-error
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Return a function that will copy properties from
 * one object to another excluding any originally
 * listed. Returned function will create a new `{}`.
 *
 * @param {String} excluded properties ...
 * @return {Function}
 */

function exclude () {
  var excludes = [].slice.call(arguments);

  function excludeProps (res, obj) {
    Object.keys(obj).forEach(function (key) {
      if (!~excludes.indexOf(key)) res[key] = obj[key];
    });
  }

  return function extendExclude () {
    var args = [].slice.call(arguments)
      , i = 0
      , res = {};

    for (; i < args.length; i++) {
      excludeProps(res, args[i]);
    }

    return res;
  };
}
/*!
 * Primary Exports
 */

var assertionError = AssertionError;

/**
 * ### AssertionError
 *
 * An extension of the JavaScript `Error` constructor for
 * assertion and validation scenarios.
 *
 * @param {String} message
 * @param {Object} properties to include (optional)
 * @param {callee} start stack function (optional)
 */

function AssertionError (message, _props, ssf) {
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
    , props = extend(_props || {});

  // default values
  this.message = message || 'Unspecified AssertionError';
  this.showDiff = false;

  // copy from properties
  for (var key in props) {
    this[key] = props[key];
  }

  // capture stack trace
  ssf = ssf || AssertionError;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ssf);
  } else {
    try {
      throw new Error();
    } catch(e) {
      this.stack = e.stack;
    }
  }
}

/*!
 * Inherit from Error.prototype
 */

AssertionError.prototype = Object.create(Error.prototype);

/*!
 * Statically set name
 */

AssertionError.prototype.name = 'AssertionError';

/*!
 * Ensure correct constructor
 */

AssertionError.prototype.constructor = AssertionError;

/**
 * Allow errors to be converted to JSON for static transfer.
 *
 * @param {Boolean} include stack (default: `true`)
 * @return {Object} object that can be `JSON.stringify`
 */

AssertionError.prototype.toJSON = function (stack) {
  var extend = exclude('constructor', 'toJSON', 'stack')
    , props = extend({ name: this.name }, this);

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

/* !
 * Chai - pathval utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */

/**
 * ### .hasProperty(object, name)
 *
 * This allows checking whether an object has own
 * or inherited from prototype chain named property.
 *
 * Basically does the same thing as the `in`
 * operator but works properly with null/undefined values
 * and other primitives.
 *
 *     var obj = {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *
 * The following would be the results.
 *
 *     hasProperty(obj, 'str');  // true
 *     hasProperty(obj, 'constructor');  // true
 *     hasProperty(obj, 'bar');  // false
 *
 *     hasProperty(obj.str, 'length'); // true
 *     hasProperty(obj.str, 1);  // true
 *     hasProperty(obj.str, 5);  // false
 *
 *     hasProperty(obj.arr, 'length');  // true
 *     hasProperty(obj.arr, 2);  // true
 *     hasProperty(obj.arr, 3);  // false
 *
 * @param {Object} object
 * @param {String|Symbol} name
 * @returns {Boolean} whether it exists
 * @namespace Utils
 * @name hasProperty
 * @api public
 */

function hasProperty(obj, name) {
  if (typeof obj === 'undefined' || obj === null) {
    return false;
  }

  // The `in` operator does not work with primitives.
  return name in Object(obj);
}

/* !
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `internalGetPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be infinitely deep and nested.
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 * * Literal dots and brackets (not delimiter) must be backslash-escaped.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */

function parsePath(path$$1) {
  var str = path$$1.replace(/([^\\])\[/g, '$1.[');
  var parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function mapMatches(value) {
    var regexp = /^\[(\d+)\]$/;
    var mArr = regexp.exec(value);
    var parsed = null;
    if (mArr) {
      parsed = { i: parseFloat(mArr[1]) };
    } else {
      parsed = { p: value.replace(/\\([.\[\]])/g, '$1') };
    }

    return parsed;
  });
}

/* !
 * ## internalGetPathValue(obj, parsed[, pathDepth])
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(obj, parsed);
 *
 * @param {Object} object to search against
 * @param {Object} parsed definition from `parsePath`.
 * @param {Number} depth (nesting level) of the property we want to retrieve
 * @returns {Object|Undefined} value
 * @api private
 */

function internalGetPathValue(obj, parsed, pathDepth) {
  var temporaryValue = obj;
  var res = null;
  pathDepth = (typeof pathDepth === 'undefined' ? parsed.length : pathDepth);

  for (var i = 0; i < pathDepth; i++) {
    var part = parsed[i];
    if (temporaryValue) {
      if (typeof part.p === 'undefined') {
        temporaryValue = temporaryValue[part.i];
      } else {
        temporaryValue = temporaryValue[part.p];
      }

      if (i === (pathDepth - 1)) {
        res = temporaryValue;
      }
    }
  }

  return res;
}

/* !
 * ## internalSetPathValue(obj, value, parsed)
 *
 * Companion function for `parsePath` that sets
 * the value located at a parsed address.
 *
 *  internalSetPathValue(obj, 'value', parsed);
 *
 * @param {Object} object to search and define on
 * @param {*} value to use upon set
 * @param {Object} parsed definition from `parsePath`
 * @api private
 */

function internalSetPathValue(obj, val, parsed) {
  var tempObj = obj;
  var pathDepth = parsed.length;
  var part = null;
  // Here we iterate through every part of the path
  for (var i = 0; i < pathDepth; i++) {
    var propName = null;
    var propVal = null;
    part = parsed[i];

    // If it's the last part of the path, we set the 'propName' value with the property name
    if (i === (pathDepth - 1)) {
      propName = typeof part.p === 'undefined' ? part.i : part.p;
      // Now we set the property with the name held by 'propName' on object with the desired val
      tempObj[propName] = val;
    } else if (typeof part.p !== 'undefined' && tempObj[part.p]) {
      tempObj = tempObj[part.p];
    } else if (typeof part.i !== 'undefined' && tempObj[part.i]) {
      tempObj = tempObj[part.i];
    } else {
      // If the obj doesn't have the property we create one with that name to define it
      var next = parsed[i + 1];
      // Here we set the name of the property which will be defined
      propName = typeof part.p === 'undefined' ? part.i : part.p;
      // Here we decide if this property will be an array or a new object
      propVal = typeof next.p === 'undefined' ? [] : {};
      tempObj[propName] = propVal;
      tempObj = tempObj[propName];
    }
  }
}

/**
 * ### .getPathInfo(object, path)
 *
 * This allows the retrieval of property info in an
 * object given a string path.
 *
 * The path info consists of an object with the
 * following properties:
 *
 * * parent - The parent object of the property referenced by `path`
 * * name - The name of the final property, a number if it was an array indexer
 * * value - The value of the property, if it exists, otherwise `undefined`
 * * exists - Whether the property exists or not
 *
 * @param {Object} object
 * @param {String} path
 * @returns {Object} info
 * @namespace Utils
 * @name getPathInfo
 * @api public
 */

function getPathInfo(obj, path$$1) {
  var parsed = parsePath(path$$1);
  var last = parsed[parsed.length - 1];
  var info = {
    parent: parsed.length > 1 ? internalGetPathValue(obj, parsed, parsed.length - 1) : obj,
    name: last.p || last.i,
    value: internalGetPathValue(obj, parsed),
  };
  info.exists = hasProperty(info.parent, info.name);

  return info;
}

/**
 * ### .getPathValue(object, path)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue(obj, 'prop1.str'); // Hello
 *     getPathValue(obj, 'prop1.att[2]'); // b
 *     getPathValue(obj, 'prop2.arr[0].nested'); // Universe
 *
 * @param {Object} object
 * @param {String} path
 * @returns {Object} value or `undefined`
 * @namespace Utils
 * @name getPathValue
 * @api public
 */

function getPathValue(obj, path$$1) {
  var info = getPathInfo(obj, path$$1);
  return info.value;
}

/**
 * ### .setPathValue(object, path, value)
 *
 * Define the value in an object at a given string path.
 *
 * ```js
 * var obj = {
 *     prop1: {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *   , prop2: {
 *         arr: [ { nested: 'Universe' } ]
 *       , str: 'Hello again!'
 *     }
 * };
 * ```
 *
 * The following would be acceptable.
 *
 * ```js
 * var properties = require('tea-properties');
 * properties.set(obj, 'prop1.str', 'Hello Universe!');
 * properties.set(obj, 'prop1.arr[2]', 'B');
 * properties.set(obj, 'prop2.arr[0].nested.value', { hello: 'universe' });
 * ```
 *
 * @param {Object} object
 * @param {String} path
 * @param {Mixed} value
 * @api private
 */

function setPathValue(obj, path$$1, val) {
  var parsed = parsePath(path$$1);
  internalSetPathValue(obj, val, parsed);
  return obj;
}

var pathval = {
  hasProperty: hasProperty,
  getPathInfo: getPathInfo,
  getPathValue: getPathValue,
  setPathValue: setPathValue,
};

/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .flag(object, key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @namespace Utils
 * @name flag
 * @api private
 */

var flag = function flag(obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};

/*!
 * Chai - test utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */



/**
 * ### .test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name test
 */

var test = function test(obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};

var typeDetect = createCommonjsModule(function (module, exports) {
(function (global, factory) {
	module.exports = factory();
}(commonjsGlobal, (function () {
/* !
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
var promiseExists = typeof Promise === 'function';

/* eslint-disable no-undef */
var globalObject = typeof self === 'object' ? self : commonjsGlobal; // eslint-disable-line id-blacklist

var symbolExists = typeof Symbol !== 'undefined';
var mapExists = typeof Map !== 'undefined';
var setExists = typeof Set !== 'undefined';
var weakMapExists = typeof WeakMap !== 'undefined';
var weakSetExists = typeof WeakSet !== 'undefined';
var dataViewExists = typeof DataView !== 'undefined';
var symbolIteratorExists = symbolExists && typeof Symbol.iterator !== 'undefined';
var symbolToStringTagExists = symbolExists && typeof Symbol.toStringTag !== 'undefined';
var setEntriesExists = setExists && typeof Set.prototype.entries === 'function';
var mapEntriesExists = mapExists && typeof Map.prototype.entries === 'function';
var setIteratorPrototype = setEntriesExists && Object.getPrototypeOf(new Set().entries());
var mapIteratorPrototype = mapEntriesExists && Object.getPrototypeOf(new Map().entries());
var arrayIteratorExists = symbolIteratorExists && typeof Array.prototype[Symbol.iterator] === 'function';
var arrayIteratorPrototype = arrayIteratorExists && Object.getPrototypeOf([][Symbol.iterator]());
var stringIteratorExists = symbolIteratorExists && typeof String.prototype[Symbol.iterator] === 'function';
var stringIteratorPrototype = stringIteratorExists && Object.getPrototypeOf(''[Symbol.iterator]());
var toStringLeftSliceLength = 8;
var toStringRightSliceLength = -1;
/**
 * ### typeOf (obj)
 *
 * Uses `Object.prototype.toString` to determine the type of an object,
 * normalising behaviour across engine versions & well optimised.
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */
function typeDetect(obj) {
  /* ! Speed optimisation
   * Pre:
   *   string literal     x 3,039,035 ops/sec ±1.62% (78 runs sampled)
   *   boolean literal    x 1,424,138 ops/sec ±4.54% (75 runs sampled)
   *   number literal     x 1,653,153 ops/sec ±1.91% (82 runs sampled)
   *   undefined          x 9,978,660 ops/sec ±1.92% (75 runs sampled)
   *   function           x 2,556,769 ops/sec ±1.73% (77 runs sampled)
   * Post:
   *   string literal     x 38,564,796 ops/sec ±1.15% (79 runs sampled)
   *   boolean literal    x 31,148,940 ops/sec ±1.10% (79 runs sampled)
   *   number literal     x 32,679,330 ops/sec ±1.90% (78 runs sampled)
   *   undefined          x 32,363,368 ops/sec ±1.07% (82 runs sampled)
   *   function           x 31,296,870 ops/sec ±0.96% (83 runs sampled)
   */
  var typeofObj = typeof obj;
  if (typeofObj !== 'object') {
    return typeofObj;
  }

  /* ! Speed optimisation
   * Pre:
   *   null               x 28,645,765 ops/sec ±1.17% (82 runs sampled)
   * Post:
   *   null               x 36,428,962 ops/sec ±1.37% (84 runs sampled)
   */
  if (obj === null) {
    return 'null';
  }

  /* ! Spec Conformance
   * Test: `Object.prototype.toString.call(window)``
   *  - Node === "[object global]"
   *  - Chrome === "[object global]"
   *  - Firefox === "[object Window]"
   *  - PhantomJS === "[object Window]"
   *  - Safari === "[object Window]"
   *  - IE 11 === "[object Window]"
   *  - IE Edge === "[object Window]"
   * Test: `Object.prototype.toString.call(this)``
   *  - Chrome Worker === "[object global]"
   *  - Firefox Worker === "[object DedicatedWorkerGlobalScope]"
   *  - Safari Worker === "[object DedicatedWorkerGlobalScope]"
   *  - IE 11 Worker === "[object WorkerGlobalScope]"
   *  - IE Edge Worker === "[object WorkerGlobalScope]"
   */
  if (obj === globalObject) {
    return 'global';
  }

  /* ! Speed optimisation
   * Pre:
   *   array literal      x 2,888,352 ops/sec ±0.67% (82 runs sampled)
   * Post:
   *   array literal      x 22,479,650 ops/sec ±0.96% (81 runs sampled)
   */
  if (
    Array.isArray(obj) &&
    (symbolToStringTagExists === false || !(Symbol.toStringTag in obj))
  ) {
    return 'Array';
  }

  // Not caching existence of `window` and related properties due to potential
  // for `window` to be unset before tests in quasi-browser environments.
  if (typeof window === 'object' && window !== null) {
    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/multipage/browsers.html#location)
     * WhatWG HTML$7.7.3 - The `Location` interface
     * Test: `Object.prototype.toString.call(window.location)``
     *  - IE <=11 === "[object Object]"
     *  - IE Edge <=13 === "[object Object]"
     */
    if (typeof window.location === 'object' && obj === window.location) {
      return 'Location';
    }

    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/#document)
     * WhatWG HTML$3.1.1 - The `Document` object
     * Note: Most browsers currently adher to the W3C DOM Level 2 spec
     *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-26809268)
     *       which suggests that browsers should use HTMLTableCellElement for
     *       both TD and TH elements. WhatWG separates these.
     *       WhatWG HTML states:
     *         > For historical reasons, Window objects must also have a
     *         > writable, configurable, non-enumerable property named
     *         > HTMLDocument whose value is the Document interface object.
     * Test: `Object.prototype.toString.call(document)``
     *  - Chrome === "[object HTMLDocument]"
     *  - Firefox === "[object HTMLDocument]"
     *  - Safari === "[object HTMLDocument]"
     *  - IE <=10 === "[object Document]"
     *  - IE 11 === "[object HTMLDocument]"
     *  - IE Edge <=13 === "[object HTMLDocument]"
     */
    if (typeof window.document === 'object' && obj === window.document) {
      return 'Document';
    }

    if (typeof window.navigator === 'object') {
      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#mimetypearray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface MimeTypeArray
       * Test: `Object.prototype.toString.call(navigator.mimeTypes)``
       *  - IE <=10 === "[object MSMimeTypesCollection]"
       */
      if (typeof window.navigator.mimeTypes === 'object' &&
          obj === window.navigator.mimeTypes) {
        return 'MimeTypeArray';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface PluginArray
       * Test: `Object.prototype.toString.call(navigator.plugins)``
       *  - IE <=10 === "[object MSPluginsCollection]"
       */
      if (typeof window.navigator.plugins === 'object' &&
          obj === window.navigator.plugins) {
        return 'PluginArray';
      }
    }

    if ((typeof window.HTMLElement === 'function' ||
        typeof window.HTMLElement === 'object') &&
        obj instanceof window.HTMLElement) {
      /* ! Spec Conformance
      * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
      * WhatWG HTML$4.4.4 - The `blockquote` element - Interface `HTMLQuoteElement`
      * Test: `Object.prototype.toString.call(document.createElement('blockquote'))``
      *  - IE <=10 === "[object HTMLBlockElement]"
      */
      if (obj.tagName === 'BLOCKQUOTE') {
        return 'HTMLQuoteElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltabledatacellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableDataCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('td'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TD') {
        return 'HTMLTableDataCellElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltableheadercellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableHeaderCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('th'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TH') {
        return 'HTMLTableHeaderCellElement';
      }
    }
  }

  /* ! Speed optimisation
  * Pre:
  *   Float64Array       x 625,644 ops/sec ±1.58% (80 runs sampled)
  *   Float32Array       x 1,279,852 ops/sec ±2.91% (77 runs sampled)
  *   Uint32Array        x 1,178,185 ops/sec ±1.95% (83 runs sampled)
  *   Uint16Array        x 1,008,380 ops/sec ±2.25% (80 runs sampled)
  *   Uint8Array         x 1,128,040 ops/sec ±2.11% (81 runs sampled)
  *   Int32Array         x 1,170,119 ops/sec ±2.88% (80 runs sampled)
  *   Int16Array         x 1,176,348 ops/sec ±5.79% (86 runs sampled)
  *   Int8Array          x 1,058,707 ops/sec ±4.94% (77 runs sampled)
  *   Uint8ClampedArray  x 1,110,633 ops/sec ±4.20% (80 runs sampled)
  * Post:
  *   Float64Array       x 7,105,671 ops/sec ±13.47% (64 runs sampled)
  *   Float32Array       x 5,887,912 ops/sec ±1.46% (82 runs sampled)
  *   Uint32Array        x 6,491,661 ops/sec ±1.76% (79 runs sampled)
  *   Uint16Array        x 6,559,795 ops/sec ±1.67% (82 runs sampled)
  *   Uint8Array         x 6,463,966 ops/sec ±1.43% (85 runs sampled)
  *   Int32Array         x 5,641,841 ops/sec ±3.49% (81 runs sampled)
  *   Int16Array         x 6,583,511 ops/sec ±1.98% (80 runs sampled)
  *   Int8Array          x 6,606,078 ops/sec ±1.74% (81 runs sampled)
  *   Uint8ClampedArray  x 6,602,224 ops/sec ±1.77% (83 runs sampled)
  */
  var stringTag = (symbolToStringTagExists && obj[Symbol.toStringTag]);
  if (typeof stringTag === 'string') {
    return stringTag;
  }

  var objPrototype = Object.getPrototypeOf(obj);
  /* ! Speed optimisation
  * Pre:
  *   regex literal      x 1,772,385 ops/sec ±1.85% (77 runs sampled)
  *   regex constructor  x 2,143,634 ops/sec ±2.46% (78 runs sampled)
  * Post:
  *   regex literal      x 3,928,009 ops/sec ±0.65% (78 runs sampled)
  *   regex constructor  x 3,931,108 ops/sec ±0.58% (84 runs sampled)
  */
  if (objPrototype === RegExp.prototype) {
    return 'RegExp';
  }

  /* ! Speed optimisation
  * Pre:
  *   date               x 2,130,074 ops/sec ±4.42% (68 runs sampled)
  * Post:
  *   date               x 3,953,779 ops/sec ±1.35% (77 runs sampled)
  */
  if (objPrototype === Date.prototype) {
    return 'Date';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-promise.prototype-@@tostringtag)
   * ES6$25.4.5.4 - Promise.prototype[@@toStringTag] should be "Promise":
   * Test: `Object.prototype.toString.call(Promise.resolve())``
   *  - Chrome <=47 === "[object Object]"
   *  - Edge <=20 === "[object Object]"
   *  - Firefox 29-Latest === "[object Promise]"
   *  - Safari 7.1-Latest === "[object Promise]"
   */
  if (promiseExists && objPrototype === Promise.prototype) {
    return 'Promise';
  }

  /* ! Speed optimisation
  * Pre:
  *   set                x 2,222,186 ops/sec ±1.31% (82 runs sampled)
  * Post:
  *   set                x 4,545,879 ops/sec ±1.13% (83 runs sampled)
  */
  if (setExists && objPrototype === Set.prototype) {
    return 'Set';
  }

  /* ! Speed optimisation
  * Pre:
  *   map                x 2,396,842 ops/sec ±1.59% (81 runs sampled)
  * Post:
  *   map                x 4,183,945 ops/sec ±6.59% (82 runs sampled)
  */
  if (mapExists && objPrototype === Map.prototype) {
    return 'Map';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakset            x 1,323,220 ops/sec ±2.17% (76 runs sampled)
  * Post:
  *   weakset            x 4,237,510 ops/sec ±2.01% (77 runs sampled)
  */
  if (weakSetExists && objPrototype === WeakSet.prototype) {
    return 'WeakSet';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakmap            x 1,500,260 ops/sec ±2.02% (78 runs sampled)
  * Post:
  *   weakmap            x 3,881,384 ops/sec ±1.45% (82 runs sampled)
  */
  if (weakMapExists && objPrototype === WeakMap.prototype) {
    return 'WeakMap';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-dataview.prototype-@@tostringtag)
   * ES6$24.2.4.21 - DataView.prototype[@@toStringTag] should be "DataView":
   * Test: `Object.prototype.toString.call(new DataView(new ArrayBuffer(1)))``
   *  - Edge <=13 === "[object Object]"
   */
  if (dataViewExists && objPrototype === DataView.prototype) {
    return 'DataView';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%mapiteratorprototype%-@@tostringtag)
   * ES6$23.1.5.2.2 - %MapIteratorPrototype%[@@toStringTag] should be "Map Iterator":
   * Test: `Object.prototype.toString.call(new Map().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (mapExists && objPrototype === mapIteratorPrototype) {
    return 'Map Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%setiteratorprototype%-@@tostringtag)
   * ES6$23.2.5.2.2 - %SetIteratorPrototype%[@@toStringTag] should be "Set Iterator":
   * Test: `Object.prototype.toString.call(new Set().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (setExists && objPrototype === setIteratorPrototype) {
    return 'Set Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%arrayiteratorprototype%-@@tostringtag)
   * ES6$22.1.5.2.2 - %ArrayIteratorPrototype%[@@toStringTag] should be "Array Iterator":
   * Test: `Object.prototype.toString.call([][Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (arrayIteratorExists && objPrototype === arrayIteratorPrototype) {
    return 'Array Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%stringiteratorprototype%-@@tostringtag)
   * ES6$21.1.5.2.2 - %StringIteratorPrototype%[@@toStringTag] should be "String Iterator":
   * Test: `Object.prototype.toString.call(''[Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (stringIteratorExists && objPrototype === stringIteratorPrototype) {
    return 'String Iterator';
  }

  /* ! Speed optimisation
  * Pre:
  *   object from null   x 2,424,320 ops/sec ±1.67% (76 runs sampled)
  * Post:
  *   object from null   x 5,838,000 ops/sec ±0.99% (84 runs sampled)
  */
  if (objPrototype === null) {
    return 'Object';
  }

  return Object
    .prototype
    .toString
    .call(obj)
    .slice(toStringLeftSliceLength, toStringRightSliceLength);
}

return typeDetect;

})));
});

/*!
 * Chai - expectTypes utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .expectTypes(obj, types)
 *
 * Ensures that the object being tested against is of a valid type.
 *
 *     utils.expectTypes(this, ['array', 'object', 'string']);
 *
 * @param {Mixed} obj constructed Assertion
 * @param {Array} type A list of allowed types for this assertion
 * @namespace Utils
 * @name expectTypes
 * @api public
 */





var expectTypes = function expectTypes(obj, types) {
  var flagMsg = flag(obj, 'message');
  var ssfi = flag(obj, 'ssfi');

  flagMsg = flagMsg ? flagMsg + ': ' : '';

  obj = flag(obj, 'object');
  types = types.map(function (t) { return t.toLowerCase(); });
  types.sort();

  // Transforms ['lorem', 'ipsum'] into 'a lorem, or an ipsum'
  var str = types.map(function (t, index) {
    var art = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(t.charAt(0)) ? 'an' : 'a';
    var or = types.length > 1 && index === types.length - 1 ? 'or ' : '';
    return or + art + ' ' + t;
  }).join(', ');

  var objType = typeDetect(obj).toLowerCase();

  if (!types.some(function (expected) { return objType === expected; })) {
    throw new assertionError(
      flagMsg + 'object tested must be ' + str + ', but ' + objType + ' given',
      undefined,
      ssfi
    );
  }
};

/*!
 * Chai - getActual utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getActual
 */

var getActual = function getActual(obj, args) {
  return args.length > 4 ? args[4] : obj._obj;
};

/* !
 * Chai - getFuncName utility
 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getFuncName(constructorFn)
 *
 * Returns the name of a function.
 * When a non-function instance is passed, returns `null`.
 * This also includes a polyfill function if `aFunc.name` is not defined.
 *
 * @name getFuncName
 * @param {Function} funct
 * @namespace Utils
 * @api public
 */

var toString = Function.prototype.toString;
var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\s\(\/]+)/;
function getFuncName(aFunc) {
  if (typeof aFunc !== 'function') {
    return null;
  }

  var name = '';
  if (typeof Function.prototype.name === 'undefined' && typeof aFunc.name === 'undefined') {
    // Here we run a polyfill if Function does not support the `name` property and if aFunc.name is not defined
    var match = toString.call(aFunc).match(functionNameMatch);
    if (match) {
      name = match[1];
    }
  } else {
    // If we've got a `name` property we just use it
    name = aFunc.name;
  }

  return name;
}

var getFuncName_1 = getFuncName;

/*!
 * Chai - getProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getProperties(object)
 *
 * This allows the retrieval of property names of an object, enumerable or not,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getProperties
 * @api public
 */

var getProperties = function getProperties(object) {
  var result = Object.getOwnPropertyNames(object);

  function addProperty(property) {
    if (result.indexOf(property) === -1) {
      result.push(property);
    }
  }

  var proto = Object.getPrototypeOf(object);
  while (proto !== null) {
    Object.getOwnPropertyNames(proto).forEach(addProperty);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
};

/*!
 * Chai - getEnumerableProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getEnumerableProperties(object)
 *
 * This allows the retrieval of enumerable property names of an object,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getEnumerableProperties
 * @api public
 */

var getEnumerableProperties = function getEnumerableProperties(object) {
  var result = [];
  for (var name in object) {
    result.push(name);
  }
  return result;
};

var config = {

  /**
   * ### config.includeStack
   *
   * User configurable property, influences whether stack trace
   * is included in Assertion error message. Default of false
   * suppresses stack trace in the error message.
   *
   *     chai.config.includeStack = true;  // enable stack on error
   *
   * @param {Boolean}
   * @api public
   */

  includeStack: false,

  /**
   * ### config.showDiff
   *
   * User configurable property, influences whether or not
   * the `showDiff` flag should be included in the thrown
   * AssertionErrors. `false` will always be `false`; `true`
   * will be true when the assertion has requested a diff
   * be shown.
   *
   * @param {Boolean}
   * @api public
   */

  showDiff: true,

  /**
   * ### config.truncateThreshold
   *
   * User configurable property, sets length threshold for actual and
   * expected values in assertion errors. If this threshold is exceeded, for
   * example for large data structures, the value is replaced with something
   * like `[ Array(3) ]` or `{ Object (prop1, prop2) }`.
   *
   * Set it to zero if you want to disable truncating altogether.
   *
   * This is especially userful when doing assertions on arrays: having this
   * set to a reasonable large value makes the failure messages readily
   * inspectable.
   *
   *     chai.config.truncateThreshold = 0;  // disable truncating
   *
   * @param {Number}
   * @api public
   */

  truncateThreshold: 40,

  /**
   * ### config.useProxy
   *
   * User configurable property, defines if chai will use a Proxy to throw
   * an error when a non-existent property is read, which protects users
   * from typos when using property-based assertions.
   *
   * Set it to false if you want to disable this feature.
   *
   *     chai.config.useProxy = false;  // disable use of Proxy
   *
   * This feature is automatically disabled regardless of this config value
   * in environments that don't support proxies.
   *
   * @param {Boolean}
   * @api public
   */

  useProxy: true,

  /**
   * ### config.proxyExcludedKeys
   *
   * User configurable property, defines which properties should be ignored
   * instead of throwing an error if they do not exist on the assertion.
   * This is only applied if the environment Chai is running in supports proxies and
   * if the `useProxy` configuration setting is enabled.
   * By default, `then` and `inspect` will not throw an error if they do not exist on the
   * assertion object because the `.inspect` property is read by `util.inspect` (for example, when
   * using `console.log` on the assertion object) and `.then` is necessary for promise type-checking.
   *
   *     // By default these keys will not throw an error if they do not exist on the assertion object
   *     chai.config.proxyExcludedKeys = ['then', 'inspect'];
   *
   * @param {Array}
   * @api public
   */

  proxyExcludedKeys: ['then', 'catch', 'inspect', 'toJSON']
};

var inspect_1 = createCommonjsModule(function (module, exports) {
// This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js






module.exports = inspect;

/**
 * ### .inspect(obj, [showHidden], [depth], [colors])
 *
 * Echoes the value of a value. Tries to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects. Default is false.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 * @namespace Utils
 * @name inspect
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: function (str) { return str; }
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}

// Returns true if object is a DOM element.
var isDOMElement = function (object) {
  if (typeof HTMLElement === 'object') {
    return object instanceof HTMLElement;
  } else {
    return object &&
      typeof object === 'object' &&
      'nodeType' in object &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string';
  }
};

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (typeof ret !== 'string') {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // If this is a DOM element, try to get the outer HTML.
  if (isDOMElement(value)) {
    if ('outerHTML' in value) {
      return value.outerHTML;
      // This value does not have an outerHTML attribute,
      //   it could still be an XML element
    } else {
      // Attempt to serialize it
      try {
        if (document.xmlVersion) {
          var xmlSerializer = new XMLSerializer();
          return xmlSerializer.serializeToString(value);
        } else {
          // Firefox 11- do not support outerHTML
          //   It does, however, support innerHTML
          //   Use the following to render the element
          var ns = "http://www.w3.org/1999/xhtml";
          var container = document.createElementNS(ns, '_');

          container.appendChild(value.cloneNode(false));
          var html = container.innerHTML
            .replace('><', '>' + value.innerHTML + '<');
          container.innerHTML = '';
          return html;
        }
      } catch (err) {
        // This could be a non-native DOM implementation,
        //   continue with the normal flow:
        //   printing the element as if it is an object.
      }
    }
  }

  // Look up the keys of the object.
  var visibleKeys = getEnumerableProperties(value);
  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;

  var name, nameSuffix;

  // Some type of object without properties can be shortcut.
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
  // a `stack` plus `description` property; ignore those for consistency.
  if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
     ))) {
    if (typeof value === 'function') {
      name = getFuncName_1(value);
      nameSuffix = name ? ': ' + name : '';
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = ''
    , array = false
    , typedArray = false
    , braces = ['{', '}'];

  if (isTypedArray(value)) {
    typedArray = true;
    braces = ['[', ']'];
  }

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (typeof value === 'function') {
    name = getFuncName_1(value);
    nameSuffix = name ? ': ' + name : '';
    base = ' [Function' + nameSuffix + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    return formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else if (typedArray) {
    return formatTypedArray(value);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}

function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      if (value === 0 && (1/value) === -Infinity) {
        return ctx.stylize('-0', 'number');
      }
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');

    case 'symbol':
      return ctx.stylize(value.toString(), 'symbol');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}

function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }

  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}

function formatTypedArray(value) {
  var str = '[ ';

  for (var i = 0; i < value.length; ++i) {
    if (str.length >= config.truncateThreshold - 7) {
      str += '...';
      break;
    }
    str += value[i] + ', ';
  }
  str += ' ]';

  // Removing trailing `, ` if the array was not truncated
  if (str.indexOf(',  ]') !== -1) {
    str = str.replace(',  ]', ' ]');
  }

  return str;
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name;
  var propDescriptor = Object.getOwnPropertyDescriptor(value, key);
  var str;

  if (propDescriptor) {
    if (propDescriptor.get) {
      if (propDescriptor.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (propDescriptor.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
  }
  if (visibleKeys.indexOf(key) < 0) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(value[key]) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, value[key], null);
      } else {
        str = formatValue(ctx, value[key], recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}

function reduceToSingleString(output, base, braces) {
  var length = output.reduce(function(prev, cur) {
    return prev + cur.length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function isTypedArray(ar) {
  // Unfortunately there's no way to check if an object is a TypedArray
  // We have to check if it's one of these types
  return (typeof ar === 'object' && /\w+Array]$/.test(objectToString(ar)));
}

function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}

function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}

function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}

function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}
});

/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */




/**
 * ### .objDisplay(object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @namespace Utils
 * @api public
 */

var objDisplay = function objDisplay(obj) {
  var str = inspect_1(obj)
    , type = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type === '[object Function]') {
      return !obj.name || obj.name === ''
        ? '[Function]'
        : '[Function: ' + obj.name + ']';
    } else if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};

/*!
 * Chai - message composition utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */



/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Message template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getMessage
 * @api public
 */

var getMessage = function getMessage(obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');

  if(typeof msg === "function") msg = msg();
  msg = msg || '';
  msg = msg
    .replace(/#\{this\}/g, function () { return objDisplay(val); })
    .replace(/#\{act\}/g, function () { return objDisplay(actual); })
    .replace(/#\{exp\}/g, function () { return objDisplay(expected); });

  return flagMsg ? flagMsg + ': ' + msg : msg;
};

/*!
 * Chai - transferFlags utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, `lockSsfi`,
 * and `message`) will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAssertion = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags to; usually a new assertion
 * @param {Boolean} includeAll
 * @namespace Utils
 * @name transferFlags
 * @api private
 */

var transferFlags = function transferFlags(assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

  if (!object.__flags) {
    object.__flags = Object.create(null);
  }

  includeAll = arguments.length === 3 ? includeAll : true;

  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag !== 'lockSsfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};

/* globals Symbol: false, Uint8Array: false, WeakMap: false */
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */


function FakeMap() {
  this._key = 'chai/deep-eql__' + Math.random() + Date.now();
}

FakeMap.prototype = {
  get: function getMap(key) {
    return key[this._key];
  },
  set: function setMap(key, value) {
    if (Object.isExtensible(key)) {
      Object.defineProperty(key, this._key, {
        value: value,
        configurable: true,
      });
    }
  },
};

var MemoizeMap = typeof WeakMap === 'function' ? WeakMap : FakeMap;
/*!
 * Check to see if the MemoizeMap has recorded a result of the two operands
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @returns {Boolean|null} result
*/
function memoizeCompare(leftHandOperand, rightHandOperand, memoizeMap) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return null;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    var result = leftHandMap.get(rightHandOperand);
    if (typeof result === 'boolean') {
      return result;
    }
  }
  return null;
}

/*!
 * Set the result of the equality into the MemoizeMap
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @param {Boolean} result
*/
function memoizeSet(leftHandOperand, rightHandOperand, memoizeMap, result) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    leftHandMap.set(rightHandOperand, result);
  } else {
    leftHandMap = new MemoizeMap();
    leftHandMap.set(rightHandOperand, result);
    memoizeMap.set(leftHandOperand, leftHandMap);
  }
}

/*!
 * Primary Export
 */

var deepEql = deepEqual;
var MemoizeMap_1 = MemoizeMap;

/**
 * Assert deeply nested sameValue equality between two objects of any type.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
 */
function deepEqual(leftHandOperand, rightHandOperand, options) {
  // If we have a comparator, we can't assume anything; so bail to its check first.
  if (options && options.comparator) {
    return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
  }

  var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
  if (simpleResult !== null) {
    return simpleResult;
  }

  // Deeper comparisons are pushed through to a larger function
  return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
}

/**
 * Many comparisons can be canceled out early via simple equality or primitive checks.
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @return {Boolean|null} equal match
 */
function simpleEqual(leftHandOperand, rightHandOperand) {
  // Equal references (except for Numbers) can be returned early
  if (leftHandOperand === rightHandOperand) {
    // Handle +-0 cases
    return leftHandOperand !== 0 || 1 / leftHandOperand === 1 / rightHandOperand;
  }

  // handle NaN cases
  if (
    leftHandOperand !== leftHandOperand && // eslint-disable-line no-self-compare
    rightHandOperand !== rightHandOperand // eslint-disable-line no-self-compare
  ) {
    return true;
  }

  // Anything that is not an 'object', i.e. symbols, functions, booleans, numbers,
  // strings, and undefined, can be compared by reference.
  if (isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    // Easy out b/c it would have passed the first equality check
    return false;
  }
  return null;
}

/*!
 * The main logic of the `deepEqual` function.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
*/
function extensiveDeepEqual(leftHandOperand, rightHandOperand, options) {
  options = options || {};
  options.memoize = options.memoize === false ? false : options.memoize || new MemoizeMap();
  var comparator = options && options.comparator;

  // Check if a memoized result exists.
  var memoizeResultLeft = memoizeCompare(leftHandOperand, rightHandOperand, options.memoize);
  if (memoizeResultLeft !== null) {
    return memoizeResultLeft;
  }
  var memoizeResultRight = memoizeCompare(rightHandOperand, leftHandOperand, options.memoize);
  if (memoizeResultRight !== null) {
    return memoizeResultRight;
  }

  // If a comparator is present, use it.
  if (comparator) {
    var comparatorResult = comparator(leftHandOperand, rightHandOperand);
    // Comparators may return null, in which case we want to go back to default behavior.
    if (comparatorResult === false || comparatorResult === true) {
      memoizeSet(leftHandOperand, rightHandOperand, options.memoize, comparatorResult);
      return comparatorResult;
    }
    // To allow comparators to override *any* behavior, we ran them first. Since it didn't decide
    // what to do, we need to make sure to return the basic tests first before we move on.
    var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
    if (simpleResult !== null) {
      // Don't memoize this, it takes longer to set/retrieve than to just compare.
      return simpleResult;
    }
  }

  var leftHandType = typeDetect(leftHandOperand);
  if (leftHandType !== typeDetect(rightHandOperand)) {
    memoizeSet(leftHandOperand, rightHandOperand, options.memoize, false);
    return false;
  }

  // Temporarily set the operands in the memoize object to prevent blowing the stack
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, true);

  var result = extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options);
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, result);
  return result;
}

function extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options) {
  switch (leftHandType) {
    case 'String':
    case 'Number':
    case 'Boolean':
    case 'Date':
      // If these types are their instance types (e.g. `new Number`) then re-deepEqual against their values
      return deepEqual(leftHandOperand.valueOf(), rightHandOperand.valueOf());
    case 'Promise':
    case 'Symbol':
    case 'function':
    case 'WeakMap':
    case 'WeakSet':
    case 'Error':
      return leftHandOperand === rightHandOperand;
    case 'Arguments':
    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
    case 'Array':
      return iterableEqual(leftHandOperand, rightHandOperand, options);
    case 'RegExp':
      return regexpEqual(leftHandOperand, rightHandOperand);
    case 'Generator':
      return generatorEqual(leftHandOperand, rightHandOperand, options);
    case 'DataView':
      return iterableEqual(new Uint8Array(leftHandOperand.buffer), new Uint8Array(rightHandOperand.buffer), options);
    case 'ArrayBuffer':
      return iterableEqual(new Uint8Array(leftHandOperand), new Uint8Array(rightHandOperand), options);
    case 'Set':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    case 'Map':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    default:
      return objectEqual(leftHandOperand, rightHandOperand, options);
  }
}

/*!
 * Compare two Regular Expressions for equality.
 *
 * @param {RegExp} leftHandOperand
 * @param {RegExp} rightHandOperand
 * @return {Boolean} result
 */

function regexpEqual(leftHandOperand, rightHandOperand) {
  return leftHandOperand.toString() === rightHandOperand.toString();
}

/*!
 * Compare two Sets/Maps for equality. Faster than other equality functions.
 *
 * @param {Set} leftHandOperand
 * @param {Set} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function entriesEqual(leftHandOperand, rightHandOperand, options) {
  // IE11 doesn't support Set#entries or Set#@@iterator, so we need manually populate using Set#forEach
  if (leftHandOperand.size !== rightHandOperand.size) {
    return false;
  }
  if (leftHandOperand.size === 0) {
    return true;
  }
  var leftHandItems = [];
  var rightHandItems = [];
  leftHandOperand.forEach(function gatherEntries(key, value) {
    leftHandItems.push([ key, value ]);
  });
  rightHandOperand.forEach(function gatherEntries(key, value) {
    rightHandItems.push([ key, value ]);
  });
  return iterableEqual(leftHandItems.sort(), rightHandItems.sort(), options);
}

/*!
 * Simple equality for flat iterable objects such as Arrays, TypedArrays or Node.js buffers.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function iterableEqual(leftHandOperand, rightHandOperand, options) {
  var length = leftHandOperand.length;
  if (length !== rightHandOperand.length) {
    return false;
  }
  if (length === 0) {
    return true;
  }
  var index = -1;
  while (++index < length) {
    if (deepEqual(leftHandOperand[index], rightHandOperand[index], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Simple equality for generator objects such as those returned by generator functions.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function generatorEqual(leftHandOperand, rightHandOperand, options) {
  return iterableEqual(getGeneratorEntries(leftHandOperand), getGeneratorEntries(rightHandOperand), options);
}

/*!
 * Determine if the given object has an @@iterator function.
 *
 * @param {Object} target
 * @return {Boolean} `true` if the object has an @@iterator function.
 */
function hasIteratorFunction(target) {
  return typeof Symbol !== 'undefined' &&
    typeof target === 'object' &&
    typeof Symbol.iterator !== 'undefined' &&
    typeof target[Symbol.iterator] === 'function';
}

/*!
 * Gets all iterator entries from the given Object. If the Object has no @@iterator function, returns an empty array.
 * This will consume the iterator - which could have side effects depending on the @@iterator implementation.
 *
 * @param {Object} target
 * @returns {Array} an array of entries from the @@iterator function
 */
function getIteratorEntries(target) {
  if (hasIteratorFunction(target)) {
    try {
      return getGeneratorEntries(target[Symbol.iterator]());
    } catch (iteratorError) {
      return [];
    }
  }
  return [];
}

/*!
 * Gets all entries from a Generator. This will consume the generator - which could have side effects.
 *
 * @param {Generator} target
 * @returns {Array} an array of entries from the Generator.
 */
function getGeneratorEntries(generator) {
  var generatorResult = generator.next();
  var accumulator = [ generatorResult.value ];
  while (generatorResult.done === false) {
    generatorResult = generator.next();
    accumulator.push(generatorResult.value);
  }
  return accumulator;
}

/*!
 * Gets all own and inherited enumerable keys from a target.
 *
 * @param {Object} target
 * @returns {Array} an array of own and inherited enumerable keys from the target.
 */
function getEnumerableKeys(target) {
  var keys = [];
  for (var key in target) {
    keys.push(key);
  }
  return keys;
}

/*!
 * Determines if two objects have matching values, given a set of keys. Defers to deepEqual for the equality check of
 * each key. If any value of the given key is not equal, the function will return false (early).
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Array} keys An array of keys to compare the values of leftHandOperand and rightHandOperand against
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */
function keysEqual(leftHandOperand, rightHandOperand, keys, options) {
  var length = keys.length;
  if (length === 0) {
    return true;
  }
  for (var i = 0; i < length; i += 1) {
    if (deepEqual(leftHandOperand[keys[i]], rightHandOperand[keys[i]], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Recursively check the equality of two Objects. Once basic sameness has been established it will defer to `deepEqual`
 * for each enumerable key in the object.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function objectEqual(leftHandOperand, rightHandOperand, options) {
  var leftHandKeys = getEnumerableKeys(leftHandOperand);
  var rightHandKeys = getEnumerableKeys(rightHandOperand);
  if (leftHandKeys.length && leftHandKeys.length === rightHandKeys.length) {
    leftHandKeys.sort();
    rightHandKeys.sort();
    if (iterableEqual(leftHandKeys, rightHandKeys) === false) {
      return false;
    }
    return keysEqual(leftHandOperand, rightHandOperand, leftHandKeys, options);
  }

  var leftHandEntries = getIteratorEntries(leftHandOperand);
  var rightHandEntries = getIteratorEntries(rightHandOperand);
  if (leftHandEntries.length && leftHandEntries.length === rightHandEntries.length) {
    leftHandEntries.sort();
    rightHandEntries.sort();
    return iterableEqual(leftHandEntries, rightHandEntries, options);
  }

  if (leftHandKeys.length === 0 &&
      leftHandEntries.length === 0 &&
      rightHandKeys.length === 0 &&
      rightHandEntries.length === 0) {
    return true;
  }

  return false;
}

/*!
 * Returns true if the argument is a primitive.
 *
 * This intentionally returns true for all objects that can be compared by reference,
 * including functions and symbols.
 *
 * @param {Mixed} value
 * @return {Boolean} result
 */
function isPrimitive(value) {
  return value === null || typeof value !== 'object';
}
deepEql.MemoizeMap = MemoizeMap_1;

/*!
 * Chai - isProxyEnabled helper
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .isProxyEnabled()
 *
 * Helper function to check if Chai's proxy protection feature is enabled. If
 * proxies are unsupported or disabled via the user's Chai config, then return
 * false. Otherwise, return true.
 *
 * @namespace Utils
 * @name isProxyEnabled
 */

var isProxyEnabled = function isProxyEnabled() {
  return config.useProxy &&
    typeof Proxy !== 'undefined' &&
    typeof Reflect !== 'undefined';
};

/*!
 * Chai - addProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */






/**
 * ### .addProperty(ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @namespace Utils
 * @name addProperty
 * @api public
 */

var addProperty = function addProperty(ctx, name, getter) {
  getter = getter === undefined ? function () {} : getter;

  Object.defineProperty(ctx, name,
    { get: function propertyGetter() {
        // Setting the `ssfi` flag to `propertyGetter` causes this function to
        // be the starting point for removing implementation frames from the
        // stack trace of a failed assertion.
        //
        // However, we only want to use this function as the starting point if
        // the `lockSsfi` flag isn't set and proxy protection is disabled.
        //
        // If the `lockSsfi` flag is set, then either this assertion has been
        // overwritten by another assertion, or this assertion is being invoked
        // from inside of another assertion. In the first case, the `ssfi` flag
        // has already been set by the overwriting assertion. In the second
        // case, the `ssfi` flag has already been set by the outer assertion.
        //
        // If proxy protection is enabled, then the `ssfi` flag has already been
        // set by the proxy getter.
        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
          flag(this, 'ssfi', propertyGetter);
        }

        var result = getter.call(this);
        if (result !== undefined)
          return result;

        var newAssertion = new chai.Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }
    , configurable: true
  });
};

var fnLengthDesc = Object.getOwnPropertyDescriptor(function () {}, 'length');

/*!
 * Chai - addLengthGuard utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .addLengthGuard(fn, assertionName, isChainable)
 *
 * Define `length` as a getter on the given uninvoked method assertion. The
 * getter acts as a guard against chaining `length` directly off of an uninvoked
 * method assertion, which is a problem because it references `function`'s
 * built-in `length` property instead of Chai's `length` assertion. When the
 * getter catches the user making this mistake, it throws an error with a
 * helpful message.
 *
 * There are two ways in which this mistake can be made. The first way is by
 * chaining the `length` assertion directly off of an uninvoked chainable
 * method. In this case, Chai suggests that the user use `lengthOf` instead. The
 * second way is by chaining the `length` assertion directly off of an uninvoked
 * non-chainable method. Non-chainable methods must be invoked prior to
 * chaining. In this case, Chai suggests that the user consult the docs for the
 * given assertion.
 *
 * If the `length` property of functions is unconfigurable, then return `fn`
 * without modification.
 *
 * Note that in ES6, the function's `length` property is configurable, so once
 * support for legacy environments is dropped, Chai's `length` property can
 * replace the built-in function's `length` property, and this length guard will
 * no longer be necessary. In the mean time, maintaining consistency across all
 * environments is the priority.
 *
 * @param {Function} fn
 * @param {String} assertionName
 * @param {Boolean} isChainable
 * @namespace Utils
 * @name addLengthGuard
 */

var addLengthGuard = function addLengthGuard (fn, assertionName, isChainable) {
  if (!fnLengthDesc.configurable) return fn;

  Object.defineProperty(fn, 'length', {
    get: function () {
      if (isChainable) {
        throw Error('Invalid Chai property: ' + assertionName + '.length. Due' +
          ' to a compatibility issue, "length" cannot directly follow "' +
          assertionName + '". Use "' + assertionName + '.lengthOf" instead.');
      }

      throw Error('Invalid Chai property: ' + assertionName + '.length. See' +
        ' docs for proper usage of "' + assertionName + '".');
    }
  });

  return fn;
};

/*!
 * Chai - proxify utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .proxify(object)
 *
 * Return a proxy of given object that throws an error when a non-existent
 * property is read. By default, the root cause is assumed to be a misspelled
 * property, and thus an attempt is made to offer a reasonable suggestion from
 * the list of existing properties. However, if a nonChainableMethodName is
 * provided, then the root cause is instead a failure to invoke a non-chainable
 * method prior to reading the non-existent property.
 *
 * If proxies are unsupported or disabled via the user's Chai config, then
 * return object without modification.
 *
 * @param {Object} obj
 * @param {String} nonChainableMethodName
 * @namespace Utils
 * @name proxify
 */

var builtins = ['__flags', '__methods', '_obj', 'assert'];

var proxify = function proxify(obj, nonChainableMethodName) {
  if (!isProxyEnabled()) return obj;

  return new Proxy(obj, {
    get: function proxyGetter(target, property) {
      // This check is here because we should not throw errors on Symbol properties
      // such as `Symbol.toStringTag`.
      // The values for which an error should be thrown can be configured using
      // the `config.proxyExcludedKeys` setting.
      if (typeof property === 'string' &&
          config.proxyExcludedKeys.indexOf(property) === -1 &&
          !Reflect.has(target, property)) {
        // Special message for invalid property access of non-chainable methods.
        if (nonChainableMethodName) {
          throw Error('Invalid Chai property: ' + nonChainableMethodName + '.' +
            property + '. See docs for proper usage of "' +
            nonChainableMethodName + '".');
        }

        // If the property is reasonably close to an existing Chai property,
        // suggest that property to the user. Only suggest properties with a
        // distance less than 4.
        var suggestion = null;
        var suggestionDistance = 4;
        getProperties(target).forEach(function(prop) {
          if (
            !Object.prototype.hasOwnProperty(prop) &&
            builtins.indexOf(prop) === -1
          ) {
            var dist = stringDistanceCapped(
              property,
              prop,
              suggestionDistance
            );
            if (dist < suggestionDistance) {
              suggestion = prop;
              suggestionDistance = dist;
            }
          }
        });

        if (suggestion !== null) {
          throw Error('Invalid Chai property: ' + property +
            '. Did you mean "' + suggestion + '"?');
        } else {
          throw Error('Invalid Chai property: ' + property);
        }
      }

      // Use this proxy getter as the starting point for removing implementation
      // frames from the stack trace of a failed assertion. For property
      // assertions, this prevents the proxy getter from showing up in the stack
      // trace since it's invoked before the property getter. For method and
      // chainable method assertions, this flag will end up getting changed to
      // the method wrapper, which is good since this frame will no longer be in
      // the stack once the method is invoked. Note that Chai builtin assertion
      // properties such as `__flags` are skipped since this is only meant to
      // capture the starting point of an assertion. This step is also skipped
      // if the `lockSsfi` flag is set, thus indicating that this assertion is
      // being called from within another assertion. In that case, the `ssfi`
      // flag is already set to the outer assertion's starting point.
      if (builtins.indexOf(property) === -1 && !flag(target, 'lockSsfi')) {
        flag(target, 'ssfi', proxyGetter);
      }

      return Reflect.get(target, property);
    }
  });
};

/**
 * # stringDistanceCapped(strA, strB, cap)
 * Return the Levenshtein distance between two strings, but no more than cap.
 * @param {string} strA
 * @param {string} strB
 * @param {number} number
 * @return {number} min(string distance between strA and strB, cap)
 * @api private
 */

function stringDistanceCapped(strA, strB, cap) {
  if (Math.abs(strA.length - strB.length) >= cap) {
    return cap;
  }

  var memo = [];
  // `memo` is a two-dimensional array containing distances.
  // memo[i][j] is the distance between strA.slice(0, i) and
  // strB.slice(0, j).
  for (var i = 0; i <= strA.length; i++) {
    memo[i] = Array(strB.length + 1).fill(0);
    memo[i][0] = i;
  }
  for (var j = 0; j < strB.length; j++) {
    memo[0][j] = j;
  }

  for (var i = 1; i <= strA.length; i++) {
    var ch = strA.charCodeAt(i - 1);
    for (var j = 1; j <= strB.length; j++) {
      if (Math.abs(i - j) >= cap) {
        memo[i][j] = cap;
        continue;
      }
      memo[i][j] = Math.min(
        memo[i - 1][j] + 1,
        memo[i][j - 1] + 1,
        memo[i - 1][j - 1] +
          (ch === strB.charCodeAt(j - 1) ? 0 : 1)
      );
    }
  }

  return memo[strA.length][strB.length];
}

/*!
 * Chai - addMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */







/**
 * ### .addMethod(ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @namespace Utils
 * @name addMethod
 * @api public
 */

var addMethod = function addMethod(ctx, name, method) {
  var methodWrapper = function () {
    // Setting the `ssfi` flag to `methodWrapper` causes this function to be the
    // starting point for removing implementation frames from the stack trace of
    // a failed assertion.
    //
    // However, we only want to use this function as the starting point if the
    // `lockSsfi` flag isn't set.
    //
    // If the `lockSsfi` flag is set, then either this assertion has been
    // overwritten by another assertion, or this assertion is being invoked from
    // inside of another assertion. In the first case, the `ssfi` flag has
    // already been set by the overwriting assertion. In the second case, the
    // `ssfi` flag has already been set by the outer assertion.
    if (!flag(this, 'lockSsfi')) {
      flag(this, 'ssfi', methodWrapper);
    }

    var result = method.apply(this, arguments);
    if (result !== undefined)
      return result;

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };

  addLengthGuard(methodWrapper, name, false);
  ctx[name] = proxify(methodWrapper, name);
};

/*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */






/**
 * ### .overwriteProperty(ctx, name, fn)
 *
 * Overwrites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @namespace Utils
 * @name overwriteProperty
 * @api public
 */

var overwriteProperty = function overwriteProperty(ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};

  if (_get && 'function' === typeof _get.get)
    _super = _get.get;

  Object.defineProperty(ctx, name,
    { get: function overwritingPropertyGetter() {
        // Setting the `ssfi` flag to `overwritingPropertyGetter` causes this
        // function to be the starting point for removing implementation frames
        // from the stack trace of a failed assertion.
        //
        // However, we only want to use this function as the starting point if
        // the `lockSsfi` flag isn't set and proxy protection is disabled.
        //
        // If the `lockSsfi` flag is set, then either this assertion has been
        // overwritten by another assertion, or this assertion is being invoked
        // from inside of another assertion. In the first case, the `ssfi` flag
        // has already been set by the overwriting assertion. In the second
        // case, the `ssfi` flag has already been set by the outer assertion.
        //
        // If proxy protection is enabled, then the `ssfi` flag has already been
        // set by the proxy getter.
        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
          flag(this, 'ssfi', overwritingPropertyGetter);
        }

        // Setting the `lockSsfi` flag to `true` prevents the overwritten
        // assertion from changing the `ssfi` flag. By this point, the `ssfi`
        // flag is already set to the correct starting point for this assertion.
        var origLockSsfi = flag(this, 'lockSsfi');
        flag(this, 'lockSsfi', true);
        var result = getter(_super).call(this);
        flag(this, 'lockSsfi', origLockSsfi);

        if (result !== undefined) {
          return result;
        }

        var newAssertion = new chai.Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }
    , configurable: true
  });
};

/*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */







/**
 * ### .overwriteMethod(ctx, name, fn)
 *
 * Overwrites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @namespace Utils
 * @name overwriteMethod
 * @api public
 */

var overwriteMethod = function overwriteMethod(ctx, name, method) {
  var _method = ctx[name]
    , _super = function () {
      throw new Error(name + ' is not a function');
    };

  if (_method && 'function' === typeof _method)
    _super = _method;

  var overwritingMethodWrapper = function () {
    // Setting the `ssfi` flag to `overwritingMethodWrapper` causes this
    // function to be the starting point for removing implementation frames from
    // the stack trace of a failed assertion.
    //
    // However, we only want to use this function as the starting point if the
    // `lockSsfi` flag isn't set.
    //
    // If the `lockSsfi` flag is set, then either this assertion has been
    // overwritten by another assertion, or this assertion is being invoked from
    // inside of another assertion. In the first case, the `ssfi` flag has
    // already been set by the overwriting assertion. In the second case, the
    // `ssfi` flag has already been set by the outer assertion.
    if (!flag(this, 'lockSsfi')) {
      flag(this, 'ssfi', overwritingMethodWrapper);
    }

    // Setting the `lockSsfi` flag to `true` prevents the overwritten assertion
    // from changing the `ssfi` flag. By this point, the `ssfi` flag is already
    // set to the correct starting point for this assertion.
    var origLockSsfi = flag(this, 'lockSsfi');
    flag(this, 'lockSsfi', true);
    var result = method(_super).apply(this, arguments);
    flag(this, 'lockSsfi', origLockSsfi);

    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };

  addLengthGuard(overwritingMethodWrapper, name, false);
  ctx[name] = proxify(overwritingMethodWrapper, name);
};

/*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */







/*!
 * Module variables
 */

// Check whether `Object.setPrototypeOf` is supported
var canSetPrototype = typeof Object.setPrototypeOf === 'function';

// Without `Object.setPrototypeOf` support, this module will need to add properties to a function.
// However, some of functions' own props are not configurable and should be skipped.
var testFn = function() {};
var excludeNames = Object.getOwnPropertyNames(testFn).filter(function(name) {
  var propDesc = Object.getOwnPropertyDescriptor(testFn, name);

  // Note: PhantomJS 1.x includes `callee` as one of `testFn`'s own properties,
  // but then returns `undefined` as the property descriptor for `callee`. As a
  // workaround, we perform an otherwise unnecessary type-check for `propDesc`,
  // and then filter it out if it's not an object as it should be.
  if (typeof propDesc !== 'object')
    return true;

  return !propDesc.configurable;
});

// Cache `Function` properties
var call  = Function.prototype.call,
    apply = Function.prototype.apply;

/**
 * ### .addChainableMethod(ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

var addChainableMethod = function addChainableMethod(ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function') {
    chainingBehavior = function () { };
  }

  var chainableBehavior = {
      method: method
    , chainingBehavior: chainingBehavior
  };

  // save the methods so we can overwrite them later, if we need to.
  if (!ctx.__methods) {
    ctx.__methods = {};
  }
  ctx.__methods[name] = chainableBehavior;

  Object.defineProperty(ctx, name,
    { get: function chainableMethodGetter() {
        chainableBehavior.chainingBehavior.call(this);

        var chainableMethodWrapper = function () {
          // Setting the `ssfi` flag to `chainableMethodWrapper` causes this
          // function to be the starting point for removing implementation
          // frames from the stack trace of a failed assertion.
          //
          // However, we only want to use this function as the starting point if
          // the `lockSsfi` flag isn't set.
          //
          // If the `lockSsfi` flag is set, then this assertion is being
          // invoked from inside of another assertion. In this case, the `ssfi`
          // flag has already been set by the outer assertion.
          //
          // Note that overwriting a chainable method merely replaces the saved
          // methods in `ctx.__methods` instead of completely replacing the
          // overwritten assertion. Therefore, an overwriting assertion won't
          // set the `ssfi` or `lockSsfi` flags.
          if (!flag(this, 'lockSsfi')) {
            flag(this, 'ssfi', chainableMethodWrapper);
          }

          var result = chainableBehavior.method.apply(this, arguments);
          if (result !== undefined) {
            return result;
          }

          var newAssertion = new chai.Assertion();
          transferFlags(this, newAssertion);
          return newAssertion;
        };

        addLengthGuard(chainableMethodWrapper, name, true);

        // Use `Object.setPrototypeOf` if available
        if (canSetPrototype) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = Object.create(this);
          // Restore the `call` and `apply` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
          Object.setPrototypeOf(chainableMethodWrapper, prototype);
        }
        // Otherwise, redefine all properties (slow!)
        else {
          var asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function (asserterName) {
            if (excludeNames.indexOf(asserterName) !== -1) {
              return;
            }

            var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
            Object.defineProperty(chainableMethodWrapper, asserterName, pd);
          });
        }

        transferFlags(this, chainableMethodWrapper);
        return proxify(chainableMethodWrapper);
      }
    , configurable: true
  });
};

/*!
 * Chai - overwriteChainableMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */




/**
 * ### .overwriteChainableMethod(ctx, name, method, chainingBehavior)
 *
 * Overwrites an already existing chainable method
 * and provides access to the previous function or
 * property.  Must return functions to be used for
 * name.
 *
 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'lengthOf',
 *       function (_super) {
 *       }
 *     , function (_super) {
 *       }
 *     );
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.have.lengthOf(3);
 *     expect(myFoo).to.have.lengthOf.above(3);
 *
 * @param {Object} ctx object whose method / property is to be overwritten
 * @param {String} name of method / property to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @param {Function} chainingBehavior function that returns a function to be used for property
 * @namespace Utils
 * @name overwriteChainableMethod
 * @api public
 */

var overwriteChainableMethod = function overwriteChainableMethod(ctx, name, method, chainingBehavior) {
  var chainableBehavior = ctx.__methods[name];

  var _chainingBehavior = chainableBehavior.chainingBehavior;
  chainableBehavior.chainingBehavior = function overwritingChainableMethodGetter() {
    var result = chainingBehavior(_chainingBehavior).call(this);
    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };

  var _method = chainableBehavior.method;
  chainableBehavior.method = function overwritingChainableMethodWrapper() {
    var result = method(_method).apply(this, arguments);
    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };
};

/*!
 * Chai - compareByInspect utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */



/**
 * ### .compareByInspect(mixed, mixed)
 *
 * To be used as a compareFunction with Array.prototype.sort. Compares elements
 * using inspect instead of default behavior of using toString so that Symbols
 * and objects with irregular/missing toString can still be sorted without a
 * TypeError.
 *
 * @param {Mixed} first element to compare
 * @param {Mixed} second element to compare
 * @returns {Number} -1 if 'a' should come before 'b'; otherwise 1
 * @name compareByInspect
 * @namespace Utils
 * @api public
 */

var compareByInspect = function compareByInspect(a, b) {
  return inspect_1(a) < inspect_1(b) ? -1 : 1;
};

/*!
 * Chai - getOwnEnumerablePropertySymbols utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getOwnEnumerablePropertySymbols(object)
 *
 * This allows the retrieval of directly-owned enumerable property symbols of an
 * object. This function is necessary because Object.getOwnPropertySymbols
 * returns both enumerable and non-enumerable property symbols.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getOwnEnumerablePropertySymbols
 * @api public
 */

var getOwnEnumerablePropertySymbols = function getOwnEnumerablePropertySymbols(obj) {
  if (typeof Object.getOwnPropertySymbols !== 'function') return [];

  return Object.getOwnPropertySymbols(obj).filter(function (sym) {
    return Object.getOwnPropertyDescriptor(obj, sym).enumerable;
  });
};

/*!
 * Chai - getOwnEnumerableProperties utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */



/**
 * ### .getOwnEnumerableProperties(object)
 *
 * This allows the retrieval of directly-owned enumerable property names and
 * symbols of an object. This function is necessary because Object.keys only
 * returns enumerable property names, not enumerable property symbols.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getOwnEnumerableProperties
 * @api public
 */

var getOwnEnumerableProperties = function getOwnEnumerableProperties(obj) {
  return Object.keys(obj).concat(getOwnEnumerablePropertySymbols(obj));
};

/* !
 * Chai - checkError utility
 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .checkError
 *
 * Checks that an error conforms to a given set of criteria and/or retrieves information about it.
 *
 * @api public
 */

/**
 * ### .compatibleInstance(thrown, errorLike)
 *
 * Checks if two instances are compatible (strict equal).
 * Returns false if errorLike is not an instance of Error, because instances
 * can only be compatible if they're both error instances.
 *
 * @name compatibleInstance
 * @param {Error} thrown error
 * @param {Error|ErrorConstructor} errorLike object to compare against
 * @namespace Utils
 * @api public
 */

function compatibleInstance(thrown, errorLike) {
  return errorLike instanceof Error && thrown === errorLike;
}

/**
 * ### .compatibleConstructor(thrown, errorLike)
 *
 * Checks if two constructors are compatible.
 * This function can receive either an error constructor or
 * an error instance as the `errorLike` argument.
 * Constructors are compatible if they're the same or if one is
 * an instance of another.
 *
 * @name compatibleConstructor
 * @param {Error} thrown error
 * @param {Error|ErrorConstructor} errorLike object to compare against
 * @namespace Utils
 * @api public
 */

function compatibleConstructor(thrown, errorLike) {
  if (errorLike instanceof Error) {
    // If `errorLike` is an instance of any error we compare their constructors
    return thrown.constructor === errorLike.constructor || thrown instanceof errorLike.constructor;
  } else if (errorLike.prototype instanceof Error || errorLike === Error) {
    // If `errorLike` is a constructor that inherits from Error, we compare `thrown` to `errorLike` directly
    return thrown.constructor === errorLike || thrown instanceof errorLike;
  }

  return false;
}

/**
 * ### .compatibleMessage(thrown, errMatcher)
 *
 * Checks if an error's message is compatible with a matcher (String or RegExp).
 * If the message contains the String or passes the RegExp test,
 * it is considered compatible.
 *
 * @name compatibleMessage
 * @param {Error} thrown error
 * @param {String|RegExp} errMatcher to look for into the message
 * @namespace Utils
 * @api public
 */

function compatibleMessage(thrown, errMatcher) {
  var comparisonString = typeof thrown === 'string' ? thrown : thrown.message;
  if (errMatcher instanceof RegExp) {
    return errMatcher.test(comparisonString);
  } else if (typeof errMatcher === 'string') {
    return comparisonString.indexOf(errMatcher) !== -1; // eslint-disable-line no-magic-numbers
  }

  return false;
}

/**
 * ### .getFunctionName(constructorFn)
 *
 * Returns the name of a function.
 * This also includes a polyfill function if `constructorFn.name` is not defined.
 *
 * @name getFunctionName
 * @param {Function} constructorFn
 * @namespace Utils
 * @api private
 */

var functionNameMatch$1 = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\(\/]+)/;
function getFunctionName(constructorFn) {
  var name = '';
  if (typeof constructorFn.name === 'undefined') {
    // Here we run a polyfill if constructorFn.name is not defined
    var match = String(constructorFn).match(functionNameMatch$1);
    if (match) {
      name = match[1];
    }
  } else {
    name = constructorFn.name;
  }

  return name;
}

/**
 * ### .getConstructorName(errorLike)
 *
 * Gets the constructor name for an Error instance or constructor itself.
 *
 * @name getConstructorName
 * @param {Error|ErrorConstructor} errorLike
 * @namespace Utils
 * @api public
 */

function getConstructorName(errorLike) {
  var constructorName = errorLike;
  if (errorLike instanceof Error) {
    constructorName = getFunctionName(errorLike.constructor);
  } else if (typeof errorLike === 'function') {
    // If `err` is not an instance of Error it is an error constructor itself or another function.
    // If we've got a common function we get its name, otherwise we may need to create a new instance
    // of the error just in case it's a poorly-constructed error. Please see chaijs/chai/issues/45 to know more.
    constructorName = getFunctionName(errorLike).trim() ||
        getFunctionName(new errorLike()); // eslint-disable-line new-cap
  }

  return constructorName;
}

/**
 * ### .getMessage(errorLike)
 *
 * Gets the error message from an error.
 * If `err` is a String itself, we return it.
 * If the error has no message, we return an empty string.
 *
 * @name getMessage
 * @param {Error|String} errorLike
 * @namespace Utils
 * @api public
 */

function getMessage$1(errorLike) {
  var msg = '';
  if (errorLike && errorLike.message) {
    msg = errorLike.message;
  } else if (typeof errorLike === 'string') {
    msg = errorLike;
  }

  return msg;
}

var checkError = {
  compatibleInstance: compatibleInstance,
  compatibleConstructor: compatibleConstructor,
  compatibleMessage: compatibleMessage,
  getMessage: getMessage$1,
  getConstructorName: getConstructorName,
};

/*!
 * Chai - isNaN utility
 * Copyright(c) 2012-2015 Sakthipriyan Vairamani <thechargingvolcano@gmail.com>
 * MIT Licensed
 */

/**
 * ### .isNaN(value)
 *
 * Checks if the given value is NaN or not.
 *
 *     utils.isNaN(NaN); // true
 *
 * @param {Value} The value which has to be checked if it is NaN
 * @name isNaN
 * @api private
 */

function isNaN(value) {
  // Refer http://www.ecma-international.org/ecma-262/6.0/#sec-isnan-number
  // section's NOTE.
  return value !== value;
}

// If ECMAScript 6's Number.isNaN is present, prefer that.
var _isNaN = Number.isNaN || isNaN;

/*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Dependencies that are used for multiple exports are required here only once
 */



/*!
 * test utility
 */

var test$1 = test;

/*!
 * type utility
 */

var type = typeDetect;

/*!
 * expectTypes utility
 */
var expectTypes$1 = expectTypes;

/*!
 * message utility
 */

var getMessage$2 = getMessage;

/*!
 * actual utility
 */

var getActual$1 = getActual;

/*!
 * Inspect util
 */

var inspect = inspect_1;

/*!
 * Object Display util
 */

var objDisplay$1 = objDisplay;

/*!
 * Flag utility
 */

var flag$1 = flag;

/*!
 * Flag transferring utility
 */

var transferFlags$1 = transferFlags;

/*!
 * Deep equal utility
 */

var eql = deepEql;

/*!
 * Deep path info
 */

var getPathInfo$1 = pathval.getPathInfo;

/*!
 * Check if a property exists
 */

var hasProperty$1 = pathval.hasProperty;

/*!
 * Function name
 */

var getName = getFuncName_1;

/*!
 * add Property
 */

var addProperty$1 = addProperty;

/*!
 * add Method
 */

var addMethod$1 = addMethod;

/*!
 * overwrite Property
 */

var overwriteProperty$1 = overwriteProperty;

/*!
 * overwrite Method
 */

var overwriteMethod$1 = overwriteMethod;

/*!
 * Add a chainable method
 */

var addChainableMethod$1 = addChainableMethod;

/*!
 * Overwrite chainable method
 */

var overwriteChainableMethod$1 = overwriteChainableMethod;

/*!
 * Compare by inspect method
 */

var compareByInspect$1 = compareByInspect;

/*!
 * Get own enumerable property symbols method
 */

var getOwnEnumerablePropertySymbols$1 = getOwnEnumerablePropertySymbols;

/*!
 * Get own enumerable properties method
 */

var getOwnEnumerableProperties$1 = getOwnEnumerableProperties;

/*!
 * Checks error against a given set of criteria
 */

var checkError$1 = checkError;

/*!
 * Proxify util
 */

var proxify$1 = proxify;

/*!
 * addLengthGuard util
 */

var addLengthGuard$1 = addLengthGuard;

/*!
 * isProxyEnabled helper
 */

var isProxyEnabled$1 = isProxyEnabled;

/*!
 * isNaN method
 */

var isNaN$1 = _isNaN;

var utils = {
	test: test$1,
	type: type,
	expectTypes: expectTypes$1,
	getMessage: getMessage$2,
	getActual: getActual$1,
	inspect: inspect,
	objDisplay: objDisplay$1,
	flag: flag$1,
	transferFlags: transferFlags$1,
	eql: eql,
	getPathInfo: getPathInfo$1,
	hasProperty: hasProperty$1,
	getName: getName,
	addProperty: addProperty$1,
	addMethod: addMethod$1,
	overwriteProperty: overwriteProperty$1,
	overwriteMethod: overwriteMethod$1,
	addChainableMethod: addChainableMethod$1,
	overwriteChainableMethod: overwriteChainableMethod$1,
	compareByInspect: compareByInspect$1,
	getOwnEnumerablePropertySymbols: getOwnEnumerablePropertySymbols$1,
	getOwnEnumerableProperties: getOwnEnumerableProperties$1,
	checkError: checkError$1,
	proxify: proxify$1,
	addLengthGuard: addLengthGuard$1,
	isProxyEnabled: isProxyEnabled$1,
	isNaN: isNaN$1
};

/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */



var assertion = function (_chai, util) {
  /*!
   * Module dependencies.
   */

  var AssertionError = _chai.AssertionError
    , flag = util.flag;

  /*!
   * Module export.
   */

  _chai.Assertion = Assertion;

  /*!
   * Assertion Constructor
   *
   * Creates object for chaining.
   *
   * `Assertion` objects contain metadata in the form of flags. Three flags can
   * be assigned during instantiation by passing arguments to this constructor:
   *
   * - `object`: This flag contains the target of the assertion. For example, in
   *   the assertion `expect(numKittens).to.equal(7);`, the `object` flag will
   *   contain `numKittens` so that the `equal` assertion can reference it when
   *   needed.
   *
   * - `message`: This flag contains an optional custom error message to be
   *   prepended to the error message that's generated by the assertion when it
   *   fails.
   *
   * - `ssfi`: This flag stands for "start stack function indicator". It
   *   contains a function reference that serves as the starting point for
   *   removing frames from the stack trace of the error that's created by the
   *   assertion when it fails. The goal is to provide a cleaner stack trace to
   *   end users by removing Chai's internal functions. Note that it only works
   *   in environments that support `Error.captureStackTrace`, and only when
   *   `Chai.config.includeStack` hasn't been set to `false`.
   *
   * - `lockSsfi`: This flag controls whether or not the given `ssfi` flag
   *   should retain its current value, even as assertions are chained off of
   *   this object. This is usually set to `true` when creating a new assertion
   *   from within another assertion. It's also temporarily set to `true` before
   *   an overwritten assertion gets called by the overwriting assertion.
   *
   * @param {Mixed} obj target of the assertion
   * @param {String} msg (optional) custom error message
   * @param {Function} ssfi (optional) starting point for removing stack frames
   * @param {Boolean} lockSsfi (optional) whether or not the ssfi flag is locked
   * @api private
   */

  function Assertion (obj, msg, ssfi, lockSsfi) {
    flag(this, 'ssfi', ssfi || Assertion);
    flag(this, 'lockSsfi', lockSsfi);
    flag(this, 'object', obj);
    flag(this, 'message', msg);

    return util.proxify(this);
  }

  Object.defineProperty(Assertion, 'includeStack', {
    get: function() {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      return config.includeStack;
    },
    set: function(value) {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      config.includeStack = value;
    }
  });

  Object.defineProperty(Assertion, 'showDiff', {
    get: function() {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      return config.showDiff;
    },
    set: function(value) {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      config.showDiff = value;
    }
  });

  Assertion.addProperty = function (name, fn) {
    util.addProperty(this.prototype, name, fn);
  };

  Assertion.addMethod = function (name, fn) {
    util.addMethod(this.prototype, name, fn);
  };

  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  Assertion.overwriteProperty = function (name, fn) {
    util.overwriteProperty(this.prototype, name, fn);
  };

  Assertion.overwriteMethod = function (name, fn) {
    util.overwriteMethod(this.prototype, name, fn);
  };

  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  /**
   * ### .assert(expression, message, negateMessage, expected, actual, showDiff)
   *
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
   *
   * @name assert
   * @param {Philosophical} expression to be tested
   * @param {String|Function} message or function that returns message to display if expression fails
   * @param {String|Function} negatedMessage or function that returns negatedMessage to display if negated expression fails
   * @param {Mixed} expected value (remember to check for negation)
   * @param {Mixed} actual (optional) will default to `this.obj`
   * @param {Boolean} showDiff (optional) when set to `true`, assert will display a diff in addition to the message if expression fails
   * @api private
   */

  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (false !== showDiff) showDiff = true;
    if (undefined === expected && undefined === _actual) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    if (!ok) {
      msg = util.getMessage(this, arguments);
      var actual = util.getActual(this, arguments);
      throw new AssertionError(msg, {
          actual: actual
        , expected: expected
        , showDiff: showDiff
      }, (config.includeStack) ? this.assert : flag(this, 'ssfi'));
    }
  };

  /*!
   * ### ._obj
   *
   * Quick reference to stored `actual` value for plugin developers.
   *
   * @api private
   */

  Object.defineProperty(Assertion.prototype, '_obj',
    { get: function () {
        return flag(this, 'object');
      }
    , set: function (val) {
        flag(this, 'object', val);
      }
  });
};

/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var assertions = function (chai, _) {
  var Assertion = chai.Assertion
    , AssertionError = chai.AssertionError
    , flag = _.flag;

  /**
   * ### Language Chains
   *
   * The following are provided as chainable getters to improve the readability
   * of your assertions.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - which
   * - and
   * - has
   * - have
   * - with
   * - at
   * - of
   * - same
   * - but
   * - does
   * - still
   *
   * @name language chains
   * @namespace BDD
   * @api public
   */

  [ 'to', 'be', 'been', 'is'
  , 'and', 'has', 'have', 'with'
  , 'that', 'which', 'at', 'of'
  , 'same', 'but', 'does', 'still' ].forEach(function (chain) {
    Assertion.addProperty(chain);
  });

  /**
   * ### .not
   *
   * Negates all assertions that follow in the chain.
   *
   *     expect(function () {}).to.not.throw();
   *     expect({a: 1}).to.not.have.property('b');
   *     expect([1, 2]).to.be.an('array').that.does.not.include(3);
   *
   * Just because you can negate any assertion with `.not` doesn't mean you
   * should. With great power comes great responsibility. It's often best to
   * assert that the one expected output was produced, rather than asserting
   * that one of countless unexpected outputs wasn't produced. See individual
   * assertions for specific guidance.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.equal(1); // Not recommended
   *
   * @name not
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });

  /**
   * ### .deep
   *
   * Causes all `.equal`, `.include`, `.members`, `.keys`, and `.property`
   * assertions that follow in the chain to use deep equality instead of strict
   * (`===`) equality. See the `deep-eql` project page for info on the deep
   * equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) equals `{a: 1}`
   *     expect({a: 1}).to.deep.equal({a: 1});
   *     expect({a: 1}).to.not.equal({a: 1});
   *
   *     // Target array deeply (but not strictly) includes `{a: 1}`
   *     expect([{a: 1}]).to.deep.include({a: 1});
   *     expect([{a: 1}]).to.not.include({a: 1});
   *
   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
   *
   *     // Target array deeply (but not strictly) has member `{a: 1}`
   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
   *
   *     // Target set deeply (but not strictly) has key `{a: 1}`
   *     expect(new Set([{a: 1}])).to.have.deep.keys([{a: 1}]);
   *     expect(new Set([{a: 1}])).to.not.have.keys([{a: 1}]);
   *
   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
   *
   * @name deep
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });

  /**
   * ### .nested
   *
   * Enables dot- and bracket-notation in all `.property` and `.include`
   * assertions that follow in the chain.
   *
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
   *     expect({'.a': {'[b]': 'x'}}).to.nested.include({'\\.a.\\[b\\]': 'x'});
   *
   * `.nested` cannot be combined with `.own`.
   *
   * @name nested
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('nested', function () {
    flag(this, 'nested', true);
  });

  /**
   * ### .own
   *
   * Causes all `.property` and `.include` assertions that follow in the chain
   * to ignore inherited properties.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.have.own.property('a');
   *     expect({a: 1}).to.have.property('b');
   *     expect({a: 1}).to.not.have.own.property('b');
   *
   *     expect({a: 1}).to.own.include({a: 1});
   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
   *
   * `.own` cannot be combined with `.nested`.
   *
   * @name own
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('own', function () {
    flag(this, 'own', true);
  });

  /**
   * ### .ordered
   *
   * Causes all `.members` assertions that follow in the chain to require that
   * members be in the same order.
   *
   *     expect([1, 2]).to.have.ordered.members([1, 2])
   *       .but.not.have.ordered.members([2, 1]);
   *
   * When `.include` and `.ordered` are combined, the ordering begins at the
   * start of both arrays.
   *
   *     expect([1, 2, 3]).to.include.ordered.members([1, 2])
   *       .but.not.include.ordered.members([2, 3]);
   *
   * @name ordered
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ordered', function () {
    flag(this, 'ordered', true);
  });

  /**
   * ### .any
   *
   * Causes all `.keys` assertions that follow in the chain to only require that
   * the target have at least one of the given keys. This is the opposite of
   * `.all`, which requires that the target have all of the given keys.
   *
   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
   *
   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
   *
   * @name any
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('any', function () {
    flag(this, 'any', true);
    flag(this, 'all', false);
  });

  /**
   * ### .all
   *
   * Causes all `.keys` assertions that follow in the chain to require that the
   * target have all of the given keys. This is the opposite of `.any`, which
   * only requires that the target have at least one of the given keys.
   *
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *
   * Note that `.all` is used by default when neither `.all` nor `.any` are
   * added earlier in the chain. However, it's often best to add `.all` anyway
   * because it improves readability.
   *
   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
   *
   * @name all
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('all', function () {
    flag(this, 'all', true);
    flag(this, 'any', false);
  });

  /**
   * ### .a(type[, msg])
   *
   * Asserts that the target's type is equal to the given string `type`. Types
   * are case insensitive. See the `type-detect` project page for info on the
   * type detection algorithm: https://github.com/chaijs/type-detect.
   *
   *     expect('foo').to.be.a('string');
   *     expect({a: 1}).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *     expect(new Error).to.be.an('error');
   *     expect(Promise.resolve()).to.be.a('promise');
   *     expect(new Float32Array).to.be.a('float32array');
   *     expect(Symbol()).to.be.a('symbol');
   *
   * `.a` supports objects that have a custom type set via `Symbol.toStringTag`.
   *
   *     var myObj = {
   *       [Symbol.toStringTag]: 'myCustomType'
   *     };
   *
   *     expect(myObj).to.be.a('myCustomType').but.not.an('object');
   *
   * It's often best to use `.a` to check a target's type before making more
   * assertions on the same target. That way, you avoid unexpected behavior from
   * any assertion that does different things based on the target's type.
   *
   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
   *     expect([]).to.be.an('array').that.is.empty;
   *
   * Add `.not` earlier in the chain to negate `.a`. However, it's often best to
   * assert that the target is the expected type, rather than asserting that it
   * isn't one of many unexpected types.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.an('array'); // Not recommended
   *
   * `.a` accepts an optional `msg` argument which is a custom error message to
   * show when the assertion fails. The message can also be given as the second
   * argument to `expect`.
   *
   *     expect(1).to.be.a('string', 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.a('string');
   *
   * `.a` can also be used as a language chain to improve the readability of
   * your assertions.
   *
   *     expect({b: 2}).to.have.a.property('b');
   *
   * The alias `.an` can be used interchangeably with `.a`.
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function an (type, msg) {
    if (msg) flag(this, 'message', msg);
    type = type.toLowerCase();
    var obj = flag(this, 'object')
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    this.assert(
        type === _.type(obj).toLowerCase()
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }

  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);

  /**
   * ### .include(val[, msg])
   *
   * When the target is a string, `.include` asserts that the given string `val`
   * is a substring of the target.
   *
   *     expect('foobar').to.include('foo');
   *
   * When the target is an array, `.include` asserts that the given `val` is a
   * member of the target.
   *
   *     expect([1, 2, 3]).to.include(2);
   *
   * When the target is an object, `.include` asserts that the given object
   * `val`'s properties are a subset of the target's properties.
   *
   *     expect({a: 1, b: 2, c: 3}).to.include({a: 1, b: 2});
   *
   * When the target is a Set or WeakSet, `.include` asserts that the given `val` is a
   * member of the target. SameValueZero equality algorithm is used.
   *
   *     expect(new Set([1, 2])).to.include(2);
   *
   * When the target is a Map, `.include` asserts that the given `val` is one of
   * the values of the target. SameValueZero equality algorithm is used.
   *
   *     expect(new Map([['a', 1], ['b', 2]])).to.include(2);
   *
   * Because `.include` does different things based on the target's type, it's
   * important to check the target's type before using `.include`. See the `.a`
   * doc for info on testing a target's type.
   *
   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
   *
   * By default, strict (`===`) equality is used to compare array members and
   * object properties. Add `.deep` earlier in the chain to use deep equality
   * instead (WeakSet targets are not supported). See the `deep-eql` project
   * page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target array deeply (but not strictly) includes `{a: 1}`
   *     expect([{a: 1}]).to.deep.include({a: 1});
   *     expect([{a: 1}]).to.not.include({a: 1});
   *
   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
   *
   * By default, all of the target's properties are searched when working with
   * objects. This includes properties that are inherited and/or non-enumerable.
   * Add `.own` earlier in the chain to exclude the target's inherited
   * properties from the search.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.own.include({a: 1});
   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
   *
   * Note that a target object is always only searched for `val`'s own
   * enumerable properties.
   *
   * `.deep` and `.own` can be combined.
   *
   *     expect({a: {b: 2}}).to.deep.own.include({a: {b: 2}});
   *
   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
   * referencing nested properties.
   *
   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 2}}).to.nested.include({'\\.a.\\[b\\]': 2});
   *
   * `.deep` and `.nested` can be combined.
   *
   *     expect({a: {b: [{c: 3}]}}).to.deep.nested.include({'a.b[0]': {c: 3}});
   *
   * `.own` and `.nested` cannot be combined.
   *
   * Add `.not` earlier in the chain to negate `.include`.
   *
   *     expect('foobar').to.not.include('taco');
   *     expect([1, 2, 3]).to.not.include(4);
   *
   * However, it's dangerous to negate `.include` when the target is an object.
   * The problem is that it creates uncertain expectations by asserting that the
   * target object doesn't have all of `val`'s key/value pairs but may or may
   * not have some of them. It's often best to identify the exact output that's
   * expected, and then write an assertion that only accepts that exact output.
   *
   * When the target object isn't even expected to have `val`'s keys, it's
   * often best to assert exactly that.
   *
   *     expect({c: 3}).to.not.have.any.keys('a', 'b'); // Recommended
   *     expect({c: 3}).to.not.include({a: 1, b: 2}); // Not recommended
   *
   * When the target object is expected to have `val`'s keys, it's often best to
   * assert that each of the properties has its expected value, rather than
   * asserting that each property doesn't have one of many unexpected values.
   *
   *     expect({a: 3, b: 4}).to.include({a: 3, b: 4}); // Recommended
   *     expect({a: 3, b: 4}).to.not.include({a: 1, b: 2}); // Not recommended
   *
   * `.include` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2, 3]).to.include(4, 'nooo why fail??');
   *     expect([1, 2, 3], 'nooo why fail??').to.include(4);
   *
   * `.include` can also be used as a language chain, causing all `.members` and
   * `.keys` assertions that follow in the chain to require the target to be a
   * superset of the expected set, rather than an identical set. Note that
   * `.members` ignores duplicates in the subset when `.include` is added.
   *
   *     // Target object's keys are a superset of ['a', 'b'] but not identical
   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
   *
   *     // Target array is a superset of [1, 2] but not identical
   *     expect([1, 2, 3]).to.include.members([1, 2]);
   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
   *
   *     // Duplicates in the subset are ignored
   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
   *
   * Note that adding `.any` earlier in the chain causes the `.keys` assertion
   * to ignore `.include`.
   *
   *     // Both assertions are identical
   *     expect({a: 1}).to.include.any.keys('a', 'b');
   *     expect({a: 1}).to.have.any.keys('a', 'b');
   *
   * The aliases `.includes`, `.contain`, and `.contains` can be used
   * interchangeably with `.include`.
   *
   * @name include
   * @alias contain
   * @alias includes
   * @alias contains
   * @param {Mixed} val
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function SameValueZero(a, b) {
    return (_.isNaN(a) && _.isNaN(b)) || a === b;
  }

  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }

  function include (val, msg) {
    if (msg) flag(this, 'message', msg);

    var obj = flag(this, 'object')
      , objType = _.type(obj).toLowerCase()
      , flagMsg = flag(this, 'message')
      , negate = flag(this, 'negate')
      , ssfi = flag(this, 'ssfi')
      , isDeep = flag(this, 'deep')
      , descriptor = isDeep ? 'deep ' : '';

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    var included = false;

    switch (objType) {
      case 'string':
        included = obj.indexOf(val) !== -1;
        break;

      case 'weakset':
        if (isDeep) {
          throw new AssertionError(
            flagMsg + 'unable to use .deep.include with WeakSet',
            undefined,
            ssfi
          );
        }

        included = obj.has(val);
        break;

      case 'map':
        var isEql = isDeep ? _.eql : SameValueZero;
        obj.forEach(function (item) {
          included = included || isEql(item, val);
        });
        break;

      case 'set':
        if (isDeep) {
          obj.forEach(function (item) {
            included = included || _.eql(item, val);
          });
        } else {
          included = obj.has(val);
        }
        break;

      case 'array':
        if (isDeep) {
          included = obj.some(function (item) {
            return _.eql(item, val);
          });
        } else {
          included = obj.indexOf(val) !== -1;
        }
        break;

      default:
        // This block is for asserting a subset of properties in an object.
        // `_.expectTypes` isn't used here because `.include` should work with
        // objects with a custom `@@toStringTag`.
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + 'object tested must be an array, a map, an object,'
              + ' a set, a string, or a weakset, but ' + objType + ' given',
            undefined,
            ssfi
          );
        }

        var props = Object.keys(val)
          , firstErr = null
          , numErrs = 0;

        props.forEach(function (prop) {
          var propAssertion = new Assertion(obj);
          _.transferFlags(this, propAssertion, true);
          flag(propAssertion, 'lockSsfi', true);

          if (!negate || props.length === 1) {
            propAssertion.property(prop, val[prop]);
            return;
          }

          try {
            propAssertion.property(prop, val[prop]);
          } catch (err) {
            if (!_.checkError.compatibleConstructor(err, AssertionError)) {
              throw err;
            }
            if (firstErr === null) firstErr = err;
            numErrs++;
          }
        }, this);

        // When validating .not.include with multiple properties, we only want
        // to throw an assertion error if all of the properties are included,
        // in which case we throw the first property assertion error that we
        // encountered.
        if (negate && props.length > 1 && numErrs === props.length) {
          throw firstErr;
        }
        return;
    }

    // Assert inclusion in collection or substring in a string.
    this.assert(
      included
      , 'expected #{this} to ' + descriptor + 'include ' + _.inspect(val)
      , 'expected #{this} to not ' + descriptor + 'include ' + _.inspect(val));
  }

  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);
  Assertion.addChainableMethod('contains', include, includeChainingBehavior);
  Assertion.addChainableMethod('includes', include, includeChainingBehavior);

  /**
   * ### .ok
   *
   * Asserts that the target is a truthy value (considered `true` in boolean context).
   * However, it's often best to assert that the target is strictly (`===`) or
   * deeply equal to its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.ok; // Not recommended
   *
   *     expect(true).to.be.true; // Recommended
   *     expect(true).to.be.ok; // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.ok`.
   *
   *     expect(0).to.equal(0); // Recommended
   *     expect(0).to.not.be.ok; // Not recommended
   *
   *     expect(false).to.be.false; // Recommended
   *     expect(false).to.not.be.ok; // Not recommended
   *
   *     expect(null).to.be.null; // Recommended
   *     expect(null).to.not.be.ok; // Not recommended
   *
   *     expect(undefined).to.be.undefined; // Recommended
   *     expect(undefined).to.not.be.ok; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(false, 'nooo why fail??').to.be.ok;
   *
   * @name ok
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });

  /**
   * ### .true
   *
   * Asserts that the target is strictly (`===`) equal to `true`.
   *
   *     expect(true).to.be.true;
   *
   * Add `.not` earlier in the chain to negate `.true`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `true`.
   *
   *     expect(false).to.be.false; // Recommended
   *     expect(false).to.not.be.true; // Not recommended
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.true; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(false, 'nooo why fail??').to.be.true;
   *
   * @name true
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , flag(this, 'negate') ? false : true
    );
  });

  /**
   * ### .false
   *
   * Asserts that the target is strictly (`===`) equal to `false`.
   *
   *     expect(false).to.be.false;
   *
   * Add `.not` earlier in the chain to negate `.false`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to `false`.
   *
   *     expect(true).to.be.true; // Recommended
   *     expect(true).to.not.be.false; // Not recommended
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.false; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(true, 'nooo why fail??').to.be.false;
   *
   * @name false
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , flag(this, 'negate') ? true : false
    );
  });

  /**
   * ### .null
   *
   * Asserts that the target is strictly (`===`) equal to `null`.
   *
   *     expect(null).to.be.null;
   *
   * Add `.not` earlier in the chain to negate `.null`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `null`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.null; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.null;
   *
   * @name null
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });

  /**
   * ### .undefined
   *
   * Asserts that the target is strictly (`===`) equal to `undefined`.
   *
   *     expect(undefined).to.be.undefined;
   *
   * Add `.not` earlier in the chain to negate `.undefined`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to `undefined`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.undefined; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.undefined;
   *
   * @name undefined
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });

  /**
   * ### .NaN
   *
   * Asserts that the target is exactly `NaN`.
   *
   *     expect(NaN).to.be.NaN;
   *
   * Add `.not` earlier in the chain to negate `.NaN`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `NaN`.
   *
   *     expect('foo').to.equal('foo'); // Recommended
   *     expect('foo').to.not.be.NaN; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.NaN;
   *
   * @name NaN
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('NaN', function () {
    this.assert(
        _.isNaN(flag(this, 'object'))
        , 'expected #{this} to be NaN'
        , 'expected #{this} not to be NaN'
    );
  });

  /**
   * ### .exist
   *
   * Asserts that the target is not strictly (`===`) equal to either `null` or
   * `undefined`. However, it's often best to assert that the target is equal to
   * its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.exist; // Not recommended
   *
   *     expect(0).to.equal(0); // Recommended
   *     expect(0).to.exist; // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.exist`.
   *
   *     expect(null).to.be.null; // Recommended
   *     expect(null).to.not.exist; // Not recommended
   *
   *     expect(undefined).to.be.undefined; // Recommended
   *     expect(undefined).to.not.exist; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(null, 'nooo why fail??').to.exist;
   *
   * @name exist
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('exist', function () {
    var val = flag(this, 'object');
    this.assert(
        val !== null && val !== undefined
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  });

  /**
   * ### .empty
   *
   * When the target is a string or array, `.empty` asserts that the target's
   * `length` property is strictly (`===`) equal to `0`.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *
   * When the target is a map or set, `.empty` asserts that the target's `size`
   * property is strictly equal to `0`.
   *
   *     expect(new Set()).to.be.empty;
   *     expect(new Map()).to.be.empty;
   *
   * When the target is a non-function object, `.empty` asserts that the target
   * doesn't have any own enumerable properties. Properties with Symbol-based
   * keys are excluded from the count.
   *
   *     expect({}).to.be.empty;
   *
   * Because `.empty` does different things based on the target's type, it's
   * important to check the target's type before using `.empty`. See the `.a`
   * doc for info on testing a target's type.
   *
   *     expect([]).to.be.an('array').that.is.empty;
   *
   * Add `.not` earlier in the chain to negate `.empty`. However, it's often
   * best to assert that the target contains its expected number of values,
   * rather than asserting that it's not empty.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.not.be.empty; // Not recommended
   *
   *     expect(new Set([1, 2, 3])).to.have.property('size', 3); // Recommended
   *     expect(new Set([1, 2, 3])).to.not.be.empty; // Not recommended
   *
   *     expect(Object.keys({a: 1})).to.have.lengthOf(1); // Recommended
   *     expect({a: 1}).to.not.be.empty; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect([1, 2, 3], 'nooo why fail??').to.be.empty;
   *
   * @name empty
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('empty', function () {
    var val = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , flagMsg = flag(this, 'message')
      , itemsCount;

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    switch (_.type(val).toLowerCase()) {
      case 'array':
      case 'string':
        itemsCount = val.length;
        break;
      case 'map':
      case 'set':
        itemsCount = val.size;
        break;
      case 'weakmap':
      case 'weakset':
        throw new AssertionError(
          flagMsg + '.empty was passed a weak collection',
          undefined,
          ssfi
        );
      case 'function':
        var msg = flagMsg + '.empty was passed a function ' + _.getName(val);
        throw new AssertionError(msg.trim(), undefined, ssfi);
      default:
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + '.empty was passed non-string primitive ' + _.inspect(val),
            undefined,
            ssfi
          );
        }
        itemsCount = Object.keys(val).length;
    }

    this.assert(
        0 === itemsCount
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });

  /**
   * ### .arguments
   *
   * Asserts that the target is an `arguments` object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   *     test();
   *
   * Add `.not` earlier in the chain to negate `.arguments`. However, it's often
   * best to assert which type the target is expected to be, rather than
   * asserting that its not an `arguments` object.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.arguments; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({}, 'nooo why fail??').to.be.arguments;
   *
   * The alias `.Arguments` can be used interchangeably with `.arguments`.
   *
   * @name arguments
   * @alias Arguments
   * @namespace BDD
   * @api public
   */

  function checkArguments () {
    var obj = flag(this, 'object')
      , type = _.type(obj);
    this.assert(
        'Arguments' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }

  Assertion.addProperty('arguments', checkArguments);
  Assertion.addProperty('Arguments', checkArguments);

  /**
   * ### .equal(val[, msg])
   *
   * Asserts that the target is strictly (`===`) equal to the given `val`.
   *
   *     expect(1).to.equal(1);
   *     expect('foo').to.equal('foo');
   *
   * Add `.deep` earlier in the chain to use deep equality instead. See the
   * `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) equals `{a: 1}`
   *     expect({a: 1}).to.deep.equal({a: 1});
   *     expect({a: 1}).to.not.equal({a: 1});
   *
   *     // Target array deeply (but not strictly) equals `[1, 2]`
   *     expect([1, 2]).to.deep.equal([1, 2]);
   *     expect([1, 2]).to.not.equal([1, 2]);
   *
   * Add `.not` earlier in the chain to negate `.equal`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to one of countless unexpected values.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.equal(2); // Not recommended
   *
   * `.equal` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.equal(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.equal(2);
   *
   * The aliases `.equals` and `eq` can be used interchangeably with `.equal`.
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @param {Mixed} val
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      var prevLockSsfi = flag(this, 'lockSsfi');
      flag(this, 'lockSsfi', true);
      this.eql(val);
      flag(this, 'lockSsfi', prevLockSsfi);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
        , this._obj
        , true
      );
    }
  }

  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);

  /**
   * ### .eql(obj[, msg])
   *
   * Asserts that the target is deeply equal to the given `obj`. See the
   * `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target object is deeply (but not strictly) equal to {a: 1}
   *     expect({a: 1}).to.eql({a: 1}).but.not.equal({a: 1});
   *
   *     // Target array is deeply (but not strictly) equal to [1, 2]
   *     expect([1, 2]).to.eql([1, 2]).but.not.equal([1, 2]);
   *
   * Add `.not` earlier in the chain to negate `.eql`. However, it's often best
   * to assert that the target is deeply equal to its expected value, rather
   * than not deeply equal to one of countless unexpected values.
   *
   *     expect({a: 1}).to.eql({a: 1}); // Recommended
   *     expect({a: 1}).to.not.eql({b: 2}); // Not recommended
   *
   * `.eql` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect({a: 1}).to.eql({b: 2}, 'nooo why fail??');
   *     expect({a: 1}, 'nooo why fail??').to.eql({b: 2});
   *
   * The alias `.eqls` can be used interchangeably with `.eql`.
   *
   * The `.deep.equal` assertion is almost identical to `.eql` but with one
   * difference: `.deep.equal` causes deep equality comparisons to also be used
   * for any other assertions that follow in the chain.
   *
   * @name eql
   * @alias eqls
   * @param {Mixed} obj
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertEql(obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
      , this._obj
      , true
    );
  }

  Assertion.addMethod('eql', assertEql);
  Assertion.addMethod('eqls', assertEql);

  /**
   * ### .above(n[, msg])
   *
   * Asserts that the target is a number or a date greater than the given number or date `n` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.above(1); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is greater than the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.above(2); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.above(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.above`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(1).to.not.be.above(2); // Not recommended
   *
   * `.above` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.above(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.above(2);
   *
   * The aliases `.gt` and `.greaterThan` can be used interchangeably with
   * `.above`.
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to above must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to above must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount > n
        , 'expected #{this} to have a ' + descriptor + ' above #{exp} but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + ' above #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above #{exp}'
        , 'expected #{this} to be at most #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);

  /**
   * ### .least(n[, msg])
   *
   * Asserts that the target is a number or a date greater than or equal to the given
   * number or date `n` respectively. However, it's often best to assert that the target is equal to
   * its expected value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.at.least(1); // Not recommended
   *     expect(2).to.be.at.least(2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is greater than or equal to the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.at.least(2); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.at.least(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.least`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.at.least(2); // Not recommended
   *
   * `.least` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.at.least(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.at.least(2);
   *
   * The alias `.gte` can be used interchangeably with `.least`.
   *
   * @name least
   * @alias gte
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertLeast (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to least must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to least must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount >= n
        , 'expected #{this} to have a ' + descriptor + ' at least #{exp} but got #{act}'
        , 'expected #{this} to have a ' + descriptor + ' below #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj >= n
        , 'expected #{this} to be at least #{exp}'
        , 'expected #{this} to be below #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('least', assertLeast);
  Assertion.addMethod('gte', assertLeast);

  /**
   * ### .below(n[, msg])
   *
   * Asserts that the target is a number or a date less than the given number or date `n` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.below(2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is less than the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.below(4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.length(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.below(4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.below`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.be.below(1); // Not recommended
   *
   * `.below` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(2).to.be.below(1, 'nooo why fail??');
   *     expect(2, 'nooo why fail??').to.be.below(1);
   *
   * The aliases `.lt` and `.lessThan` can be used interchangeably with
   * `.below`.
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to below must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to below must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount < n
        , 'expected #{this} to have a ' + descriptor + ' below #{exp} but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + ' below #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below #{exp}'
        , 'expected #{this} to be at least #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);

  /**
   * ### .most(n[, msg])
   *
   * Asserts that the target is a number or a date less than or equal to the given number
   * or date `n` respectively. However, it's often best to assert that the target is equal to its
   * expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.at.most(2); // Not recommended
   *     expect(1).to.be.at.most(1); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is less than or equal to the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.at.most(4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.at.most(4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.most`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.be.at.most(1); // Not recommended
   *
   * `.most` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(2).to.be.at.most(1, 'nooo why fail??');
   *     expect(2, 'nooo why fail??').to.be.at.most(1);
   *
   * The alias `.lte` can be used interchangeably with `.most`.
   *
   * @name most
   * @alias lte
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertMost (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to most must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to most must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount <= n
        , 'expected #{this} to have a ' + descriptor + ' at most #{exp} but got #{act}'
        , 'expected #{this} to have a ' + descriptor + ' above #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj <= n
        , 'expected #{this} to be at most #{exp}'
        , 'expected #{this} to be above #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('most', assertMost);
  Assertion.addMethod('lte', assertMost);

  /**
   * ### .within(start, finish[, msg])
   *
   * Asserts that the target is a number or a date greater than or equal to the given
   * number or date `start`, and less than or equal to the given number or date `finish` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.within(1, 3); // Not recommended
   *     expect(2).to.be.within(2, 3); // Not recommended
   *     expect(2).to.be.within(1, 2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is greater than or equal to the given number `start`, and less
   * than or equal to the given number `finish`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.within(2, 4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.within(2, 4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.within`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.within(2, 4); // Not recommended
   *
   * `.within` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(4).to.be.within(1, 3, 'nooo why fail??');
   *     expect(4, 'nooo why fail??').to.be.within(1, 3);
   *
   * @name within
   * @param {Number} start lower bound inclusive
   * @param {Number} finish upper bound inclusive
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , startType = _.type(start).toLowerCase()
      , finishType = _.type(finish).toLowerCase()
      , errorMessage
      , shouldThrow = true
      , range = (startType === 'date' && finishType === 'date')
          ? start.toUTCString() + '..' + finish.toUTCString()
          : start + '..' + finish;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && (startType !== 'date' || finishType !== 'date'))) {
      errorMessage = msgPrefix + 'the arguments to within must be dates';
    } else if ((startType !== 'number' || finishType !== 'number') && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the arguments to within must be numbers';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount >= start && itemsCount <= finish
        , 'expected #{this} to have a ' + descriptor + ' within ' + range
        , 'expected #{this} to not have a ' + descriptor + ' within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });

  /**
   * ### .instanceof(constructor[, msg])
   *
   * Asserts that the target is an instance of the given `constructor`.
   *
   *     function Cat () { }
   *
   *     expect(new Cat()).to.be.an.instanceof(Cat);
   *     expect([1, 2]).to.be.an.instanceof(Array);
   *
   * Add `.not` earlier in the chain to negate `.instanceof`.
   *
   *     expect({a: 1}).to.not.be.an.instanceof(Array);
   *
   * `.instanceof` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1).to.be.an.instanceof(Array, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.an.instanceof(Array);
   *
   * Due to limitations in ES5, `.instanceof` may not always work as expected
   * when using a transpiler such as Babel or TypeScript. In particular, it may
   * produce unexpected results when subclassing built-in object such as
   * `Array`, `Error`, and `Map`. See your transpiler's docs for details:
   *
   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
   *
   * The alias `.instanceOf` can be used interchangeably with `.instanceof`.
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} msg _optional_
   * @alias instanceOf
   * @namespace BDD
   * @api public
   */

  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);

    var target = flag(this, 'object');
    var ssfi = flag(this, 'ssfi');
    var flagMsg = flag(this, 'message');

    try {
      var isInstanceOf = target instanceof constructor;
    } catch (err) {
      if (err instanceof TypeError) {
        flagMsg = flagMsg ? flagMsg + ': ' : '';
        throw new AssertionError(
          flagMsg + 'The instanceof assertion needs a constructor but '
            + _.type(constructor) + ' was given.',
          undefined,
          ssfi
        );
      }
      throw err;
    }

    var name = _.getName(constructor);
    if (name === null) {
      name = 'an unnamed constructor';
    }

    this.assert(
        isInstanceOf
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  }
  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);

  /**
   * ### .property(name[, val[, msg]])
   *
   * Asserts that the target has a property with the given key `name`.
   *
   *     expect({a: 1}).to.have.property('a');
   *
   * When `val` is provided, `.property` also asserts that the property's value
   * is equal to the given `val`.
   *
   *     expect({a: 1}).to.have.property('a', 1);
   *
   * By default, strict (`===`) equality is used. Add `.deep` earlier in the
   * chain to use deep equality instead. See the `deep-eql` project page for
   * info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
   *
   * The target's enumerable and non-enumerable properties are always included
   * in the search. By default, both own and inherited properties are included.
   * Add `.own` earlier in the chain to exclude inherited properties from the
   * search.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.have.own.property('a');
   *     expect({a: 1}).to.have.own.property('a', 1);
   *     expect({a: 1}).to.have.property('b');
   *     expect({a: 1}).to.not.have.own.property('b');
   *
   * `.deep` and `.own` can be combined.
   *
   *     expect({x: {a: 1}}).to.have.deep.own.property('x', {a: 1});
   *
   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
   * referencing nested properties.
   *
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]', 'y');
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
   *
   * `.deep` and `.nested` can be combined.
   *
   *     expect({a: {b: [{c: 3}]}})
   *       .to.have.deep.nested.property('a.b[0]', {c: 3});
   *
   * `.own` and `.nested` cannot be combined.
   *
   * Add `.not` earlier in the chain to negate `.property`.
   *
   *     expect({a: 1}).to.not.have.property('b');
   *
   * However, it's dangerous to negate `.property` when providing `val`. The
   * problem is that it creates uncertain expectations by asserting that the
   * target either doesn't have a property with the given key `name`, or that it
   * does have a property with the given key `name` but its value isn't equal to
   * the given `val`. It's often best to identify the exact output that's
   * expected, and then write an assertion that only accepts that exact output.
   *
   * When the target isn't expected to have a property with the given key
   * `name`, it's often best to assert exactly that.
   *
   *     expect({b: 2}).to.not.have.property('a'); // Recommended
   *     expect({b: 2}).to.not.have.property('a', 1); // Not recommended
   *
   * When the target is expected to have a property with the given key `name`,
   * it's often best to assert that the property has its expected value, rather
   * than asserting that it doesn't have one of many unexpected values.
   *
   *     expect({a: 3}).to.have.property('a', 3); // Recommended
   *     expect({a: 3}).to.not.have.property('a', 1); // Not recommended
   *
   * `.property` changes the target of any assertions that follow in the chain
   * to be the value of the property from the original target object.
   *
   *     expect({a: 1}).to.have.property('a').that.is.a('number');
   *
   * `.property` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing `val`, only use the
   * second form.
   *
   *     // Recommended
   *     expect({a: 1}).to.have.property('a', 2, 'nooo why fail??');
   *     expect({a: 1}, 'nooo why fail??').to.have.property('a', 2);
   *     expect({a: 1}, 'nooo why fail??').to.have.property('b');
   *
   *     // Not recommended
   *     expect({a: 1}).to.have.property('b', undefined, 'nooo why fail??');
   *
   * The above assertion isn't the same thing as not providing `val`. Instead,
   * it's asserting that the target object has a `b` property that's equal to
   * `undefined`.
   *
   * The assertions `.ownProperty` and `.haveOwnProperty` can be used
   * interchangeably with `.own.property`.
   *
   * @name property
   * @param {String} name
   * @param {Mixed} val (optional)
   * @param {String} msg _optional_
   * @returns value of property for chaining
   * @namespace BDD
   * @api public
   */

  function assertProperty (name, val, msg) {
    if (msg) flag(this, 'message', msg);

    var isNested = flag(this, 'nested')
      , isOwn = flag(this, 'own')
      , flagMsg = flag(this, 'message')
      , obj = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , nameType = typeof name;

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    if (isNested) {
      if (nameType !== 'string') {
        throw new AssertionError(
          flagMsg + 'the argument to property must be a string when using nested syntax',
          undefined,
          ssfi
        );
      }
    } else {
      if (nameType !== 'string' && nameType !== 'number' && nameType !== 'symbol') {
        throw new AssertionError(
          flagMsg + 'the argument to property must be a string, number, or symbol',
          undefined,
          ssfi
        );
      }
    }

    if (isNested && isOwn) {
      throw new AssertionError(
        flagMsg + 'The "nested" and "own" flags cannot be combined.',
        undefined,
        ssfi
      );
    }

    if (obj === null || obj === undefined) {
      throw new AssertionError(
        flagMsg + 'Target cannot be null or undefined.',
        undefined,
        ssfi
      );
    }

    var isDeep = flag(this, 'deep')
      , negate = flag(this, 'negate')
      , pathInfo = isNested ? _.getPathInfo(obj, name) : null
      , value = isNested ? pathInfo.value : obj[name];

    var descriptor = '';
    if (isDeep) descriptor += 'deep ';
    if (isOwn) descriptor += 'own ';
    if (isNested) descriptor += 'nested ';
    descriptor += 'property ';

    var hasProperty;
    if (isOwn) hasProperty = Object.prototype.hasOwnProperty.call(obj, name);
    else if (isNested) hasProperty = pathInfo.exists;
    else hasProperty = _.hasProperty(obj, name);

    // When performing a negated assertion for both name and val, merely having
    // a property with the given name isn't enough to cause the assertion to
    // fail. It must both have a property with the given name, and the value of
    // that property must equal the given val. Therefore, skip this assertion in
    // favor of the next.
    if (!negate || arguments.length === 1) {
      this.assert(
          hasProperty
        , 'expected #{this} to have ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }

    if (arguments.length > 1) {
      this.assert(
          hasProperty && (isDeep ? _.eql(val, value) : val === value)
        , 'expected #{this} to have ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }

    flag(this, 'object', value);
  }

  Assertion.addMethod('property', assertProperty);

  function assertOwnProperty (name, value, msg) {
    flag(this, 'own', true);
    assertProperty.apply(this, arguments);
  }

  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

  /**
   * ### .ownPropertyDescriptor(name[, descriptor[, msg]])
   *
   * Asserts that the target has its own property descriptor with the given key
   * `name`. Enumerable and non-enumerable properties are included in the
   * search.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a');
   *
   * When `descriptor` is provided, `.ownPropertyDescriptor` also asserts that
   * the property's descriptor is deeply equal to the given `descriptor`. See
   * the `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * Add `.not` earlier in the chain to negate `.ownPropertyDescriptor`.
   *
   *     expect({a: 1}).to.not.have.ownPropertyDescriptor('b');
   *
   * However, it's dangerous to negate `.ownPropertyDescriptor` when providing
   * a `descriptor`. The problem is that it creates uncertain expectations by
   * asserting that the target either doesn't have a property descriptor with
   * the given key `name`, or that it does have a property descriptor with the
   * given key `name` but its not deeply equal to the given `descriptor`. It's
   * often best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to have a property descriptor with the given
   * key `name`, it's often best to assert exactly that.
   *
   *     // Recommended
   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a');
   *
   *     // Not recommended
   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * When the target is expected to have a property descriptor with the given
   * key `name`, it's often best to assert that the property has its expected
   * descriptor, rather than asserting that it doesn't have one of many
   * unexpected descriptors.
   *
   *     // Recommended
   *     expect({a: 3}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 3,
   *     });
   *
   *     // Not recommended
   *     expect({a: 3}).to.not.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * `.ownPropertyDescriptor` changes the target of any assertions that follow
   * in the chain to be the value of the property descriptor from the original
   * target object.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a')
   *       .that.has.property('enumerable', true);
   *
   * `.ownPropertyDescriptor` accepts an optional `msg` argument which is a
   * custom error message to show when the assertion fails. The message can also
   * be given as the second argument to `expect`. When not providing
   * `descriptor`, only use the second form.
   *
   *     // Recommended
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 2,
   *     }, 'nooo why fail??');
   *
   *     // Recommended
   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 2,
   *     });
   *
   *     // Recommended
   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('b');
   *
   *     // Not recommended
   *     expect({a: 1})
   *       .to.have.ownPropertyDescriptor('b', undefined, 'nooo why fail??');
   *
   * The above assertion isn't the same thing as not providing `descriptor`.
   * Instead, it's asserting that the target object has a `b` property
   * descriptor that's deeply equal to `undefined`.
   *
   * The alias `.haveOwnPropertyDescriptor` can be used interchangeably with
   * `.ownPropertyDescriptor`.
   *
   * @name ownPropertyDescriptor
   * @alias haveOwnPropertyDescriptor
   * @param {String} name
   * @param {Object} descriptor _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertOwnPropertyDescriptor (name, descriptor, msg) {
    if (typeof descriptor === 'string') {
      msg = descriptor;
      descriptor = null;
    }
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var actualDescriptor = Object.getOwnPropertyDescriptor(Object(obj), name);
    if (actualDescriptor && descriptor) {
      this.assert(
          _.eql(descriptor, actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to match ' + _.inspect(descriptor) + ', got ' + _.inspect(actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to not match ' + _.inspect(descriptor)
        , descriptor
        , actualDescriptor
        , true
      );
    } else {
      this.assert(
          actualDescriptor
        , 'expected #{this} to have an own property descriptor for ' + _.inspect(name)
        , 'expected #{this} to not have an own property descriptor for ' + _.inspect(name)
      );
    }
    flag(this, 'object', actualDescriptor);
  }

  Assertion.addMethod('ownPropertyDescriptor', assertOwnPropertyDescriptor);
  Assertion.addMethod('haveOwnPropertyDescriptor', assertOwnPropertyDescriptor);

  /**
   * ### .lengthOf(n[, msg])
   *
   * Asserts that the target's `length` or `size` is equal to the given number
   * `n`.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3);
   *     expect('foo').to.have.lengthOf(3);
   *     expect(new Set([1, 2, 3])).to.have.lengthOf(3);
   *     expect(new Map([['a', 1], ['b', 2], ['c', 3]])).to.have.lengthOf(3);
   *
   * Add `.not` earlier in the chain to negate `.lengthOf`. However, it's often
   * best to assert that the target's `length` property is equal to its expected
   * value, rather than not equal to one of many unexpected values.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.not.have.lengthOf(4); // Not recommended
   *
   * `.lengthOf` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(2, 'nooo why fail??');
   *     expect([1, 2, 3], 'nooo why fail??').to.have.lengthOf(2);
   *
   * `.lengthOf` can also be used as a language chain, causing all `.above`,
   * `.below`, `.least`, `.most`, and `.within` assertions that follow in the
   * chain to use the target's `length` property as the target. However, it's
   * often best to assert that the target's `length` property is equal to its
   * expected length, rather than asserting that its `length` property falls
   * within some range of values.
   *
   *     // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf(3);
   *
   *     // Not recommended
   *     expect([1, 2, 3]).to.have.lengthOf.above(2);
   *     expect([1, 2, 3]).to.have.lengthOf.below(4);
   *     expect([1, 2, 3]).to.have.lengthOf.at.least(3);
   *     expect([1, 2, 3]).to.have.lengthOf.at.most(3);
   *     expect([1, 2, 3]).to.have.lengthOf.within(2,4);
   *
   * Due to a compatibility issue, the alias `.length` can't be chained directly
   * off of an uninvoked method such as `.a`. Therefore, `.length` can't be used
   * interchangeably with `.lengthOf` in every situation. It's recommended to
   * always use `.lengthOf` instead of `.length`.
   *
   *     expect([1, 2, 3]).to.have.a.length(3); // incompatible; throws error
   *     expect([1, 2, 3]).to.have.a.lengthOf(3);  // passes as expected
   *
   * @name lengthOf
   * @alias length
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertLengthChain () {
    flag(this, 'doLength', true);
  }

  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , objType = _.type(obj).toLowerCase()
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi')
      , descriptor = 'length'
      , itemsCount;

    switch (objType) {
      case 'map':
      case 'set':
        descriptor = 'size';
        itemsCount = obj.size;
        break;
      default:
        new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
        itemsCount = obj.length;
    }

    this.assert(
        itemsCount == n
      , 'expected #{this} to have a ' + descriptor + ' of #{exp} but got #{act}'
      , 'expected #{this} to not have a ' + descriptor + ' of #{act}'
      , n
      , itemsCount
    );
  }

  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addChainableMethod('lengthOf', assertLength, assertLengthChain);

  /**
   * ### .match(re[, msg])
   *
   * Asserts that the target matches the given regular expression `re`.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * Add `.not` earlier in the chain to negate `.match`.
   *
   *     expect('foobar').to.not.match(/taco/);
   *
   * `.match` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect('foobar').to.match(/taco/, 'nooo why fail??');
   *     expect('foobar', 'nooo why fail??').to.match(/taco/);
   *
   * The alias `.matches` can be used interchangeably with `.match`.
   *
   * @name match
   * @alias matches
   * @param {RegExp} re
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */
  function assertMatch(re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  }

  Assertion.addMethod('match', assertMatch);
  Assertion.addMethod('matches', assertMatch);

  /**
   * ### .string(str[, msg])
   *
   * Asserts that the target string contains the given substring `str`.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * Add `.not` earlier in the chain to negate `.string`.
   *
   *     expect('foobar').to.not.have.string('taco');
   *
   * `.string` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect('foobar').to.have.string('taco', 'nooo why fail??');
   *     expect('foobar', 'nooo why fail??').to.have.string('taco');
   *
   * @name string
   * @param {String} str
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(obj, flagMsg, ssfi, true).is.a('string');

    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });

  /**
   * ### .keys(key1[, key2[, ...]])
   *
   * Asserts that the target object, array, map, or set has the given keys. Only
   * the target's own inherited properties are included in the search.
   *
   * When the target is an object or array, keys can be provided as one or more
   * string arguments, a single array argument, or a single object argument. In
   * the latter case, only the keys in the given object matter; the values are
   * ignored.
   *
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *     expect(['x', 'y']).to.have.all.keys(0, 1);
   *
   *     expect({a: 1, b: 2}).to.have.all.keys(['a', 'b']);
   *     expect(['x', 'y']).to.have.all.keys([0, 1]);
   *
   *     expect({a: 1, b: 2}).to.have.all.keys({a: 4, b: 5}); // ignore 4 and 5
   *     expect(['x', 'y']).to.have.all.keys({0: 4, 1: 5}); // ignore 4 and 5
   *
   * When the target is a map or set, each key must be provided as a separate
   * argument.
   *
   *     expect(new Map([['a', 1], ['b', 2]])).to.have.all.keys('a', 'b');
   *     expect(new Set(['a', 'b'])).to.have.all.keys('a', 'b');
   *
   * Because `.keys` does different things based on the target's type, it's
   * important to check the target's type before using `.keys`. See the `.a` doc
   * for info on testing a target's type.
   *
   *     expect({a: 1, b: 2}).to.be.an('object').that.has.all.keys('a', 'b');
   *
   * By default, strict (`===`) equality is used to compare keys of maps and
   * sets. Add `.deep` earlier in the chain to use deep equality instead. See
   * the `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target set deeply (but not strictly) has key `{a: 1}`
   *     expect(new Set([{a: 1}])).to.have.all.deep.keys([{a: 1}]);
   *     expect(new Set([{a: 1}])).to.not.have.all.keys([{a: 1}]);
   *
   * By default, the target must have all of the given keys and no more. Add
   * `.any` earlier in the chain to only require that the target have at least
   * one of the given keys. Also, add `.not` earlier in the chain to negate
   * `.keys`. It's often best to add `.any` when negating `.keys`, and to use
   * `.all` when asserting `.keys` without negation.
   *
   * When negating `.keys`, `.any` is preferred because `.not.any.keys` asserts
   * exactly what's expected of the output, whereas `.not.all.keys` creates
   * uncertain expectations.
   *
   *     // Recommended; asserts that target doesn't have any of the given keys
   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
   *
   *     // Not recommended; asserts that target doesn't have all of the given
   *     // keys but may or may not have some of them
   *     expect({a: 1, b: 2}).to.not.have.all.keys('c', 'd');
   *
   * When asserting `.keys` without negation, `.all` is preferred because
   * `.all.keys` asserts exactly what's expected of the output, whereas
   * `.any.keys` creates uncertain expectations.
   *
   *     // Recommended; asserts that target has all the given keys
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *
   *     // Not recommended; asserts that target has at least one of the given
   *     // keys but may or may not have more of them
   *     expect({a: 1, b: 2}).to.have.any.keys('a', 'b');
   *
   * Note that `.all` is used by default when neither `.all` nor `.any` appear
   * earlier in the chain. However, it's often best to add `.all` anyway because
   * it improves readability.
   *
   *     // Both assertions are identical
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b'); // Recommended
   *     expect({a: 1, b: 2}).to.have.keys('a', 'b'); // Not recommended
   *
   * Add `.include` earlier in the chain to require that the target's keys be a
   * superset of the expected keys, rather than identical sets.
   *
   *     // Target object's keys are a superset of ['a', 'b'] but not identical
   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
   *
   * However, if `.any` and `.include` are combined, only the `.any` takes
   * effect. The `.include` is ignored in this case.
   *
   *     // Both assertions are identical
   *     expect({a: 1}).to.have.any.keys('a', 'b');
   *     expect({a: 1}).to.include.any.keys('a', 'b');
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.have.key('b');
   *
   * The alias `.key` can be used interchangeably with `.keys`.
   *
   * @name keys
   * @alias key
   * @param {...String|Array|Object} keys
   * @namespace BDD
   * @api public
   */

  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , objType = _.type(obj)
      , keysType = _.type(keys)
      , ssfi = flag(this, 'ssfi')
      , isDeep = flag(this, 'deep')
      , str
      , deepStr = ''
      , actual
      , ok = true
      , flagMsg = flag(this, 'message');

    flagMsg = flagMsg ? flagMsg + ': ' : '';
    var mixedArgsMsg = flagMsg + 'when testing keys against an object or an array you must give a single Array|Object|String argument or multiple String arguments';

    if (objType === 'Map' || objType === 'Set') {
      deepStr = isDeep ? 'deeply ' : '';
      actual = [];

      // Map and Set '.keys' aren't supported in IE 11. Therefore, use .forEach.
      obj.forEach(function (val, key) { actual.push(key); });

      if (keysType !== 'Array') {
        keys = Array.prototype.slice.call(arguments);
      }
    } else {
      actual = _.getOwnEnumerableProperties(obj);

      switch (keysType) {
        case 'Array':
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
          }
          break;
        case 'Object':
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
          }
          keys = Object.keys(keys);
          break;
        default:
          keys = Array.prototype.slice.call(arguments);
      }

      // Only stringify non-Symbols because Symbols would become "Symbol()"
      keys = keys.map(function (val) {
        return typeof val === 'symbol' ? val : String(val);
      });
    }

    if (!keys.length) {
      throw new AssertionError(flagMsg + 'keys required', undefined, ssfi);
    }

    var len = keys.length
      , any = flag(this, 'any')
      , all = flag(this, 'all')
      , expected = keys;

    if (!any && !all) {
      all = true;
    }

    // Has any
    if (any) {
      ok = expected.some(function(expectedKey) {
        return actual.some(function(actualKey) {
          if (isDeep) {
            return _.eql(expectedKey, actualKey);
          } else {
            return expectedKey === actualKey;
          }
        });
      });
    }

    // Has all
    if (all) {
      ok = expected.every(function(expectedKey) {
        return actual.some(function(actualKey) {
          if (isDeep) {
            return _.eql(expectedKey, actualKey);
          } else {
            return expectedKey === actualKey;
          }
        });
      });

      if (!flag(this, 'contains')) {
        ok = ok && keys.length == actual.length;
      }
    }

    // Key string
    if (len > 1) {
      keys = keys.map(function(key) {
        return _.inspect(key);
      });
      var last = keys.pop();
      if (all) {
        str = keys.join(', ') + ', and ' + last;
      }
      if (any) {
        str = keys.join(', ') + ', or ' + last;
      }
    } else {
      str = _.inspect(keys[0]);
    }

    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;

    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + deepStr + str
      , 'expected #{this} to not ' + deepStr + str
      , expected.slice(0).sort(_.compareByInspect)
      , actual.sort(_.compareByInspect)
      , true
    );
  }

  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);

  /**
   * ### .throw([errorLike], [errMsgMatcher], [msg])
   *
   * When no arguments are provided, `.throw` invokes the target function and
   * asserts that an error is thrown.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw();
   *
   * When one argument is provided, and it's an error constructor, `.throw`
   * invokes the target function and asserts that an error is thrown that's an
   * instance of that error constructor.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(TypeError);
   *
   * When one argument is provided, and it's an error instance, `.throw` invokes
   * the target function and asserts that an error is thrown that's strictly
   * (`===`) equal to that error instance.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(err);
   *
   * When one argument is provided, and it's a string, `.throw` invokes the
   * target function and asserts that an error is thrown with a message that
   * contains that string.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw('salmon');
   *
   * When one argument is provided, and it's a regular expression, `.throw`
   * invokes the target function and asserts that an error is thrown with a
   * message that matches that regular expression.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(/salmon/);
   *
   * When two arguments are provided, and the first is an error instance or
   * constructor, and the second is a string or regular expression, `.throw`
   * invokes the function and asserts that an error is thrown that fulfills both
   * conditions as described above.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(TypeError, 'salmon');
   *     expect(badFn).to.throw(TypeError, /salmon/);
   *     expect(badFn).to.throw(err, 'salmon');
   *     expect(badFn).to.throw(err, /salmon/);
   *
   * Add `.not` earlier in the chain to negate `.throw`.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.not.throw();
   *
   * However, it's dangerous to negate `.throw` when providing any arguments.
   * The problem is that it creates uncertain expectations by asserting that the
   * target either doesn't throw an error, or that it throws an error but of a
   * different type than the given type, or that it throws an error of the given
   * type but with a message that doesn't include the given string. It's often
   * best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to throw an error, it's often best to assert
   * exactly that.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.not.throw(); // Recommended
   *     expect(goodFn).to.not.throw(ReferenceError, 'x'); // Not recommended
   *
   * When the target is expected to throw an error, it's often best to assert
   * that the error is of its expected type, and has a message that includes an
   * expected string, rather than asserting that it doesn't have one of many
   * unexpected types, and doesn't have a message that includes some string.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(TypeError, 'salmon'); // Recommended
   *     expect(badFn).to.not.throw(ReferenceError, 'x'); // Not recommended
   *
   * `.throw` changes the target of any assertions that follow in the chain to
   * be the error object that's thrown.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     err.code = 42;
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(TypeError).with.property('code', 42);
   *
   * `.throw` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`. When not providing two arguments, always use
   * the second form.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.throw(TypeError, 'x', 'nooo why fail??');
   *     expect(goodFn, 'nooo why fail??').to.throw();
   *
   * Due to limitations in ES5, `.throw` may not always work as expected when
   * using a transpiler such as Babel or TypeScript. In particular, it may
   * produce unexpected results when subclassing the built-in `Error` object and
   * then passing the subclassed constructor to `.throw`. See your transpiler's
   * docs for details:
   *
   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
   *
   * Beware of some common mistakes when using the `throw` assertion. One common
   * mistake is to accidentally invoke the function yourself instead of letting
   * the `throw` assertion invoke the function for you. For example, when
   * testing if a function named `fn` throws, provide `fn` instead of `fn()` as
   * the target for the assertion.
   *
   *     expect(fn).to.throw();     // Good! Tests `fn` as desired
   *     expect(fn()).to.throw();   // Bad! Tests result of `fn()`, not `fn`
   *
   * If you need to assert that your function `fn` throws when passed certain
   * arguments, then wrap a call to `fn` inside of another function.
   *
   *     expect(function () { fn(42); }).to.throw();  // Function expression
   *     expect(() => fn(42)).to.throw();             // ES6 arrow function
   *
   * Another common mistake is to provide an object method (or any stand-alone
   * function that relies on `this`) as the target of the assertion. Doing so is
   * problematic because the `this` context will be lost when the function is
   * invoked by `.throw`; there's no way for it to know what `this` is supposed
   * to be. There are two ways around this problem. One solution is to wrap the
   * method or function call inside of another function. Another solution is to
   * use `bind`.
   *
   *     expect(function () { cat.meow(); }).to.throw();  // Function expression
   *     expect(() => cat.meow()).to.throw();             // ES6 arrow function
   *     expect(cat.meow.bind(cat)).to.throw();           // Bind
   *
   * Finally, it's worth mentioning that it's a best practice in JavaScript to
   * only throw `Error` and derivatives of `Error` such as `ReferenceError`,
   * `TypeError`, and user-defined objects that extend `Error`. No other type of
   * value will generate a stack trace when initialized. With that said, the
   * `throw` assertion does technically support any type of value being thrown,
   * not just `Error` and its derivatives.
   *
   * The aliases `.throws` and `.Throw` can be used interchangeably with
   * `.throw`.
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {Error|ErrorConstructor} errorLike
   * @param {String|RegExp} errMsgMatcher error message
   * @param {String} msg _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @returns error for chaining (null if no error)
   * @namespace BDD
   * @api public
   */

  function assertThrows (errorLike, errMsgMatcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , flagMsg = flag(this, 'message')
      , negate = flag(this, 'negate') || false;
    new Assertion(obj, flagMsg, ssfi, true).is.a('function');

    if (errorLike instanceof RegExp || typeof errorLike === 'string') {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    var caughtErr;
    try {
      obj();
    } catch (err) {
      caughtErr = err;
    }

    // If we have the negate flag enabled and at least one valid argument it means we do expect an error
    // but we want it to match a given set of criteria
    var everyArgIsUndefined = errorLike === undefined && errMsgMatcher === undefined;

    // If we've got the negate flag enabled and both args, we should only fail if both aren't compatible
    // See Issue #551 and PR #683@GitHub
    var everyArgIsDefined = Boolean(errorLike && errMsgMatcher);
    var errorLikeFail = false;
    var errMsgMatcherFail = false;

    // Checking if error was thrown
    if (everyArgIsUndefined || !everyArgIsUndefined && !negate) {
      // We need this to display results correctly according to their types
      var errorLikeString = 'an error';
      if (errorLike instanceof Error) {
        errorLikeString = '#{exp}';
      } else if (errorLike) {
        errorLikeString = _.checkError.getConstructorName(errorLike);
      }

      this.assert(
          caughtErr
        , 'expected #{this} to throw ' + errorLikeString
        , 'expected #{this} to not throw an error but #{act} was thrown'
        , errorLike && errorLike.toString()
        , (caughtErr instanceof Error ?
            caughtErr.toString() : (typeof caughtErr === 'string' ? caughtErr : caughtErr &&
                                    _.checkError.getConstructorName(caughtErr)))
      );
    }

    if (errorLike && caughtErr) {
      // We should compare instances only if `errorLike` is an instance of `Error`
      if (errorLike instanceof Error) {
        var isCompatibleInstance = _.checkError.compatibleInstance(caughtErr, errorLike);

        if (isCompatibleInstance === negate) {
          // These checks were created to ensure we won't fail too soon when we've got both args and a negate
          // See Issue #551 and PR #683@GitHub
          if (everyArgIsDefined && negate) {
            errorLikeFail = true;
          } else {
            this.assert(
                negate
              , 'expected #{this} to throw #{exp} but #{act} was thrown'
              , 'expected #{this} to not throw #{exp}' + (caughtErr && !negate ? ' but #{act} was thrown' : '')
              , errorLike.toString()
              , caughtErr.toString()
            );
          }
        }
      }

      var isCompatibleConstructor = _.checkError.compatibleConstructor(caughtErr, errorLike);
      if (isCompatibleConstructor === negate) {
        if (everyArgIsDefined && negate) {
            errorLikeFail = true;
        } else {
          this.assert(
              negate
            , 'expected #{this} to throw #{exp} but #{act} was thrown'
            , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
            , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
            , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
          );
        }
      }
    }

    if (caughtErr && errMsgMatcher !== undefined && errMsgMatcher !== null) {
      // Here we check compatible messages
      var placeholder = 'including';
      if (errMsgMatcher instanceof RegExp) {
        placeholder = 'matching';
      }

      var isCompatibleMessage = _.checkError.compatibleMessage(caughtErr, errMsgMatcher);
      if (isCompatibleMessage === negate) {
        if (everyArgIsDefined && negate) {
            errMsgMatcherFail = true;
        } else {
          this.assert(
            negate
            , 'expected #{this} to throw error ' + placeholder + ' #{exp} but got #{act}'
            , 'expected #{this} to throw error not ' + placeholder + ' #{exp}'
            ,  errMsgMatcher
            ,  _.checkError.getMessage(caughtErr)
          );
        }
      }
    }

    // If both assertions failed and both should've matched we throw an error
    if (errorLikeFail && errMsgMatcherFail) {
      this.assert(
        negate
        , 'expected #{this} to throw #{exp} but #{act} was thrown'
        , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
        , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
        , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
      );
    }

    flag(this, 'object', caughtErr);
  }
  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);

  /**
   * ### .respondTo(method[, msg])
   *
   * When the target is a non-function object, `.respondTo` asserts that the
   * target has a method with the given name `method`. The method can be own or
   * inherited, and it can be enumerable or non-enumerable.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(new Cat()).to.respondTo('meow');
   *
   * When the target is a function, `.respondTo` asserts that the target's
   * `prototype` property has a method with the given name `method`. Again, the
   * method can be own or inherited, and it can be enumerable or non-enumerable.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(Cat).to.respondTo('meow');
   *
   * Add `.itself` earlier in the chain to force `.respondTo` to treat the
   * target as a non-function object, even if it's a function. Thus, it asserts
   * that the target has a method with the given name `method`, rather than
   * asserting that the target's `prototype` property has a method with the
   * given name `method`.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *     Cat.hiss = function () {};
   *
   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
   *
   * When not adding `.itself`, it's important to check the target's type before
   * using `.respondTo`. See the `.a` doc for info on checking a target's type.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(new Cat()).to.be.an('object').that.respondsTo('meow');
   *
   * Add `.not` earlier in the chain to negate `.respondTo`.
   *
   *     function Dog () {}
   *     Dog.prototype.bark = function () {};
   *
   *     expect(new Dog()).to.not.respondTo('meow');
   *
   * `.respondTo` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect({}).to.respondTo('meow', 'nooo why fail??');
   *     expect({}, 'nooo why fail??').to.respondTo('meow');
   *
   * The alias `.respondsTo` can be used interchangeably with `.respondTo`.
   *
   * @name respondTo
   * @alias respondsTo
   * @param {String} method
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function respondTo (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === typeof obj && !itself)
        ? obj.prototype[method]
        : obj[method];

    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  }

  Assertion.addMethod('respondTo', respondTo);
  Assertion.addMethod('respondsTo', respondTo);

  /**
   * ### .itself
   *
   * Forces all `.respondTo` assertions that follow in the chain to behave as if
   * the target is a non-function object, even if it's a function. Thus, it
   * causes `.respondTo` to assert that the target has a method with the given
   * name, rather than asserting that the target's `prototype` property has a
   * method with the given name.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *     Cat.hiss = function () {};
   *
   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
   *
   * @name itself
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });

  /**
   * ### .satisfy(matcher[, msg])
   *
   * Invokes the given `matcher` function with the target being passed as the
   * first argument, and asserts that the value returned is truthy.
   *
   *     expect(1).to.satisfy(function(num) {
   *       return num > 0;
   *     });
   *
   * Add `.not` earlier in the chain to negate `.satisfy`.
   *
   *     expect(1).to.not.satisfy(function(num) {
   *       return num > 2;
   *     });
   *
   * `.satisfy` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1).to.satisfy(function(num) {
   *       return num > 2;
   *     }, 'nooo why fail??');
   *
   *     expect(1, 'nooo why fail??').to.satisfy(function(num) {
   *       return num > 2;
   *     });
   *
   * The alias `.satisfies` can be used interchangeably with `.satisfy`.
   *
   * @name satisfy
   * @alias satisfies
   * @param {Function} matcher
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function satisfy (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var result = matcher(obj);
    this.assert(
        result
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
      , flag(this, 'negate') ? false : true
      , result
    );
  }

  Assertion.addMethod('satisfy', satisfy);
  Assertion.addMethod('satisfies', satisfy);

  /**
   * ### .closeTo(expected, delta[, msg])
   *
   * Asserts that the target is a number that's within a given +/- `delta` range
   * of the given number `expected`. However, it's often best to assert that the
   * target is equal to its expected value.
   *
   *     // Recommended
   *     expect(1.5).to.equal(1.5);
   *
   *     // Not recommended
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *     expect(1.5).to.be.closeTo(2, 0.5);
   *     expect(1.5).to.be.closeTo(1, 1);
   *
   * Add `.not` earlier in the chain to negate `.closeTo`.
   *
   *     expect(1.5).to.equal(1.5); // Recommended
   *     expect(1.5).to.not.be.closeTo(3, 1); // Not recommended
   *
   * `.closeTo` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1.5).to.be.closeTo(3, 1, 'nooo why fail??');
   *     expect(1.5, 'nooo why fail??').to.be.closeTo(3, 1);
   *
   * The alias `.approximately` can be used interchangeably with `.closeTo`.
   *
   * @name closeTo
   * @alias approximately
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function closeTo(expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');

    new Assertion(obj, flagMsg, ssfi, true).is.a('number');
    if (typeof expected !== 'number' || typeof delta !== 'number') {
      flagMsg = flagMsg ? flagMsg + ': ' : '';
      throw new AssertionError(
          flagMsg + 'the arguments to closeTo or approximately must be numbers',
          undefined,
          ssfi
      );
    }

    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  }

  Assertion.addMethod('closeTo', closeTo);
  Assertion.addMethod('approximately', closeTo);

  // Note: Duplicates are ignored if testing for inclusion instead of sameness.
  function isSubsetOf(subset, superset, cmp, contains, ordered) {
    if (!contains) {
      if (subset.length !== superset.length) return false;
      superset = superset.slice();
    }

    return subset.every(function(elem, idx) {
      if (ordered) return cmp ? cmp(elem, superset[idx]) : elem === superset[idx];

      if (!cmp) {
        var matchIdx = superset.indexOf(elem);
        if (matchIdx === -1) return false;

        // Remove match from superset so not counted twice if duplicate in subset.
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      }

      return superset.some(function(elem2, matchIdx) {
        if (!cmp(elem, elem2)) return false;

        // Remove match from superset so not counted twice if duplicate in subset.
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      });
    });
  }

  /**
   * ### .members(set[, msg])
   *
   * Asserts that the target array has the same members as the given array
   * `set`.
   *
   *     expect([1, 2, 3]).to.have.members([2, 1, 3]);
   *     expect([1, 2, 2]).to.have.members([2, 1, 2]);
   *
   * By default, members are compared using strict (`===`) equality. Add `.deep`
   * earlier in the chain to use deep equality instead. See the `deep-eql`
   * project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target array deeply (but not strictly) has member `{a: 1}`
   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
   *
   * By default, order doesn't matter. Add `.ordered` earlier in the chain to
   * require that members appear in the same order.
   *
   *     expect([1, 2, 3]).to.have.ordered.members([1, 2, 3]);
   *     expect([1, 2, 3]).to.have.members([2, 1, 3])
   *       .but.not.ordered.members([2, 1, 3]);
   *
   * By default, both arrays must be the same size. Add `.include` earlier in
   * the chain to require that the target's members be a superset of the
   * expected members. Note that duplicates are ignored in the subset when
   * `.include` is added.
   *
   *     // Target array is a superset of [1, 2] but not identical
   *     expect([1, 2, 3]).to.include.members([1, 2]);
   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
   *
   *     // Duplicates in the subset are ignored
   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
   *
   * `.deep`, `.ordered`, and `.include` can all be combined. However, if
   * `.include` and `.ordered` are combined, the ordering begins at the start of
   * both arrays.
   *
   *     expect([{a: 1}, {b: 2}, {c: 3}])
   *       .to.include.deep.ordered.members([{a: 1}, {b: 2}])
   *       .but.not.include.deep.ordered.members([{b: 2}, {c: 3}]);
   *
   * Add `.not` earlier in the chain to negate `.members`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the target array doesn't have all of the same members as
   * the given array `set` but may or may not have some of them. It's often best
   * to identify the exact output that's expected, and then write an assertion
   * that only accepts that exact output.
   *
   *     expect([1, 2]).to.not.include(3).and.not.include(4); // Recommended
   *     expect([1, 2]).to.not.have.members([3, 4]); // Not recommended
   *
   * `.members` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2]).to.have.members([1, 2, 3], 'nooo why fail??');
   *     expect([1, 2], 'nooo why fail??').to.have.members([1, 2, 3]);
   *
   * @name members
   * @param {Array} set
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('members', function (subset, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');

    new Assertion(obj, flagMsg, ssfi, true).to.be.an('array');
    new Assertion(subset, flagMsg, ssfi, true).to.be.an('array');

    var contains = flag(this, 'contains');
    var ordered = flag(this, 'ordered');

    var subject, failMsg, failNegateMsg;

    if (contains) {
      subject = ordered ? 'an ordered superset' : 'a superset';
      failMsg = 'expected #{this} to be ' + subject + ' of #{exp}';
      failNegateMsg = 'expected #{this} to not be ' + subject + ' of #{exp}';
    } else {
      subject = ordered ? 'ordered members' : 'members';
      failMsg = 'expected #{this} to have the same ' + subject + ' as #{exp}';
      failNegateMsg = 'expected #{this} to not have the same ' + subject + ' as #{exp}';
    }

    var cmp = flag(this, 'deep') ? _.eql : undefined;

    this.assert(
        isSubsetOf(subset, obj, cmp, contains, ordered)
      , failMsg
      , failNegateMsg
      , subset
      , obj
      , true
    );
  });

  /**
   * ### .oneOf(list[, msg])
   *
   * Asserts that the target is a member of the given array `list`. However,
   * it's often best to assert that the target is equal to its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.oneOf([1, 2, 3]); // Not recommended
   *
   * Comparisons are performed using strict (`===`) equality.
   *
   * Add `.not` earlier in the chain to negate `.oneOf`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.oneOf([2, 3, 4]); // Not recommended
   *
   * `.oneOf` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.oneOf([2, 3, 4], 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.oneOf([2, 3, 4]);
   *
   * @name oneOf
   * @param {Array<*>} list
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function oneOf (list, msg) {
    if (msg) flag(this, 'message', msg);
    var expected = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(list, flagMsg, ssfi, true).to.be.an('array');

    this.assert(
        list.indexOf(expected) > -1
      , 'expected #{this} to be one of #{exp}'
      , 'expected #{this} to not be one of #{exp}'
      , list
      , expected
    );
  }

  Assertion.addMethod('oneOf', oneOf);

  /**
   * ### .change(subject[, prop[, msg]])
   *
   * When one argument is provided, `.change` asserts that the given function
   * `subject` returns a different value when it's invoked before the target
   * function compared to when it's invoked afterward. However, it's often best
   * to assert that `subject` is equal to its expected value.
   *
   *     var dots = ''
   *       , addDot = function () { dots += '.'; }
   *       , getDots = function () { return dots; };
   *
   *     // Recommended
   *     expect(getDots()).to.equal('');
   *     addDot();
   *     expect(getDots()).to.equal('.');
   *
   *     // Not recommended
   *     expect(addDot).to.change(getDots);
   *
   * When two arguments are provided, `.change` asserts that the value of the
   * given object `subject`'s `prop` property is different before invoking the
   * target function compared to afterward.
   *
   *     var myObj = {dots: ''}
   *       , addDot = function () { myObj.dots += '.'; };
   *
   *     // Recommended
   *     expect(myObj).to.have.property('dots', '');
   *     addDot();
   *     expect(myObj).to.have.property('dots', '.');
   *
   *     // Not recommended
   *     expect(addDot).to.change(myObj, 'dots');
   *
   * Strict (`===`) equality is used to compare before and after values.
   *
   * Add `.not` earlier in the chain to negate `.change`.
   *
   *     var dots = ''
   *       , noop = function () {}
   *       , getDots = function () { return dots; };
   *
   *     expect(noop).to.not.change(getDots);
   *
   *     var myObj = {dots: ''}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'dots');
   *
   * `.change` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {dots: ''}
   *       , addDot = function () { myObj.dots += '.'; };
   *
   *     expect(addDot).to.not.change(myObj, 'dots', 'nooo why fail??');
   *
   *     var dots = ''
   *       , addDot = function () { dots += '.'; }
   *       , getDots = function () { return dots; };
   *
   *     expect(addDot, 'nooo why fail??').to.not.change(getDots);
   *
   * `.change` also causes all `.by` assertions that follow in the chain to
   * assert how much a numeric subject was increased or decreased by. However,
   * it's dangerous to use `.change.by`. The problem is that it creates
   * uncertain expectations by asserting that the subject either increases by
   * the given delta, or that it decreases by the given delta. It's often best
   * to identify the exact output that's expected, and then write an assertion
   * that only accepts that exact output.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; }
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   * The alias `.changes` can be used interchangeably with `.change`.
   *
   * @name change
   * @alias changes
   * @param {String} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertChanges (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    // This gets flagged because of the .by(delta) assertion
    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'change');
    flag(this, 'realDelta', final !== initial);

    this.assert(
      initial !== final
      , 'expected ' + msgObj + ' to change'
      , 'expected ' + msgObj + ' to not change'
    );
  }

  Assertion.addMethod('change', assertChanges);
  Assertion.addMethod('changes', assertChanges);

  /**
   * ### .increase(subject[, prop[, msg]])
   *
   * When one argument is provided, `.increase` asserts that the given function
   * `subject` returns a greater number when it's invoked after invoking the
   * target function compared to when it's invoked beforehand. `.increase` also
   * causes all `.by` assertions that follow in the chain to assert how much
   * greater of a number is returned. It's often best to assert that the return
   * value increased by the expected amount, rather than asserting it increased
   * by any amount.
   *
   *     var val = 1
   *       , addTwo = function () { val += 2; }
   *       , getVal = function () { return val; };
   *
   *     expect(addTwo).to.increase(getVal).by(2); // Recommended
   *     expect(addTwo).to.increase(getVal); // Not recommended
   *
   * When two arguments are provided, `.increase` asserts that the value of the
   * given object `subject`'s `prop` property is greater after invoking the
   * target function compared to beforehand.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.increase(myObj, 'val'); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.increase`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either decreases, or that it stays the same.
   * It's often best to identify the exact output that's expected, and then
   * write an assertion that only accepts that exact output.
   *
   * When the subject is expected to decrease, it's often best to assert that it
   * decreased by the expected amount.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.not.increase(myObj, 'val'); // Not recommended
   *
   * When the subject is expected to stay the same, it's often best to assert
   * exactly that.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
   *     expect(noop).to.not.increase(myObj, 'val'); // Not recommended
   *
   * `.increase` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.increase(myObj, 'val', 'nooo why fail??');
   *
   *     var val = 1
   *       , noop = function () {}
   *       , getVal = function () { return val; };
   *
   *     expect(noop, 'nooo why fail??').to.increase(getVal);
   *
   * The alias `.increases` can be used interchangeably with `.increase`.
   *
   * @name increase
   * @alias increases
   * @param {String|Function} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertIncreases (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    // Make sure that the target is a number
    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'increase');
    flag(this, 'realDelta', final - initial);

    this.assert(
      final - initial > 0
      , 'expected ' + msgObj + ' to increase'
      , 'expected ' + msgObj + ' to not increase'
    );
  }

  Assertion.addMethod('increase', assertIncreases);
  Assertion.addMethod('increases', assertIncreases);

  /**
   * ### .decrease(subject[, prop[, msg]])
   *
   * When one argument is provided, `.decrease` asserts that the given function
   * `subject` returns a lesser number when it's invoked after invoking the
   * target function compared to when it's invoked beforehand. `.decrease` also
   * causes all `.by` assertions that follow in the chain to assert how much
   * lesser of a number is returned. It's often best to assert that the return
   * value decreased by the expected amount, rather than asserting it decreased
   * by any amount.
   *
   *     var val = 1
   *       , subtractTwo = function () { val -= 2; }
   *       , getVal = function () { return val; };
   *
   *     expect(subtractTwo).to.decrease(getVal).by(2); // Recommended
   *     expect(subtractTwo).to.decrease(getVal); // Not recommended
   *
   * When two arguments are provided, `.decrease` asserts that the value of the
   * given object `subject`'s `prop` property is lesser after invoking the
   * target function compared to beforehand.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.decrease(myObj, 'val'); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.decrease`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either increases, or that it stays the same.
   * It's often best to identify the exact output that's expected, and then
   * write an assertion that only accepts that exact output.
   *
   * When the subject is expected to increase, it's often best to assert that it
   * increased by the expected amount.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.not.decrease(myObj, 'val'); // Not recommended
   *
   * When the subject is expected to stay the same, it's often best to assert
   * exactly that.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
   *     expect(noop).to.not.decrease(myObj, 'val'); // Not recommended
   *
   * `.decrease` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.decrease(myObj, 'val', 'nooo why fail??');
   *
   *     var val = 1
   *       , noop = function () {}
   *       , getVal = function () { return val; };
   *
   *     expect(noop, 'nooo why fail??').to.decrease(getVal);
   *
   * The alias `.decreases` can be used interchangeably with `.decrease`.
   *
   * @name decrease
   * @alias decreases
   * @param {String|Function} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertDecreases (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    // Make sure that the target is a number
    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'decrease');
    flag(this, 'realDelta', initial - final);

    this.assert(
      final - initial < 0
      , 'expected ' + msgObj + ' to decrease'
      , 'expected ' + msgObj + ' to not decrease'
    );
  }

  Assertion.addMethod('decrease', assertDecreases);
  Assertion.addMethod('decreases', assertDecreases);

  /**
   * ### .by(delta[, msg])
   *
   * When following an `.increase` assertion in the chain, `.by` asserts that
   * the subject of the `.increase` assertion increased by the given `delta`.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2);
   *
   * When following a `.decrease` assertion in the chain, `.by` asserts that the
   * subject of the `.decrease` assertion decreased by the given `delta`.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2);
   *
   * When following a `.change` assertion in the chain, `.by` asserts that the
   * subject of the `.change` assertion either increased or decreased by the
   * given `delta`. However, it's dangerous to use `.change.by`. The problem is
   * that it creates uncertain expectations. It's often best to identify the
   * exact output that's expected, and then write an assertion that only accepts
   * that exact output.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; }
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.by`. However, it's often best
   * to assert that the subject changed by its expected delta, rather than
   * asserting that it didn't change by one of countless unexpected deltas.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     // Recommended
   *     expect(addTwo).to.increase(myObj, 'val').by(2);
   *
   *     // Not recommended
   *     expect(addTwo).to.increase(myObj, 'val').but.not.by(3);
   *
   * `.by` accepts an optional `msg` argument which is a custom error message to
   * show when the assertion fails. The message can also be given as the second
   * argument to `expect`.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(3, 'nooo why fail??');
   *     expect(addTwo, 'nooo why fail??').to.increase(myObj, 'val').by(3);
   *
   * @name by
   * @param {Number} delta
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertDelta(delta, msg) {
    if (msg) flag(this, 'message', msg);

    var msgObj = flag(this, 'deltaMsgObj');
    var initial = flag(this, 'initialDeltaValue');
    var final = flag(this, 'finalDeltaValue');
    var behavior = flag(this, 'deltaBehavior');
    var realDelta = flag(this, 'realDelta');

    var expression;
    if (behavior === 'change') {
      expression = Math.abs(final - initial) === Math.abs(delta);
    } else {
      expression = realDelta === Math.abs(delta);
    }

    this.assert(
      expression
      , 'expected ' + msgObj + ' to ' + behavior + ' by ' + delta
      , 'expected ' + msgObj + ' to not ' + behavior + ' by ' + delta
    );
  }

  Assertion.addMethod('by', assertDelta);

  /**
   * ### .extensible
   *
   * Asserts that the target is extensible, which means that new properties can
   * be added to it. Primitives are never extensible.
   *
   *     expect({a: 1}).to.be.extensible;
   *
   * Add `.not` earlier in the chain to negate `.extensible`.
   *
   *     var nonExtensibleObject = Object.preventExtensions({})
   *       , sealedObject = Object.seal({})
   *       , frozenObject = Object.freeze({});
   *
   *     expect(nonExtensibleObject).to.not.be.extensible;
   *     expect(sealedObject).to.not.be.extensible;
   *     expect(frozenObject).to.not.be.extensible;
   *     expect(1).to.not.be.extensible;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(1, 'nooo why fail??').to.be.extensible;
   *
   * @name extensible
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('extensible', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a non-extensible ordinary object, simply return false.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isExtensible
    // The following provides ES6 behavior for ES5 environments.

    var isExtensible = obj === Object(obj) && Object.isExtensible(obj);

    this.assert(
      isExtensible
      , 'expected #{this} to be extensible'
      , 'expected #{this} to not be extensible'
    );
  });

  /**
   * ### .sealed
   *
   * Asserts that the target is sealed, which means that new properties can't be
   * added to it, and its existing properties can't be reconfigured or deleted.
   * However, it's possible that its existing properties can still be reassigned
   * to different values. Primitives are always sealed.
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     expect(sealedObject).to.be.sealed;
   *     expect(frozenObject).to.be.sealed;
   *     expect(1).to.be.sealed;
   *
   * Add `.not` earlier in the chain to negate `.sealed`.
   *
   *     expect({a: 1}).to.not.be.sealed;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.be.sealed;
   *
   * @name sealed
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('sealed', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a sealed ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isSealed
    // The following provides ES6 behavior for ES5 environments.

    var isSealed = obj === Object(obj) ? Object.isSealed(obj) : true;

    this.assert(
      isSealed
      , 'expected #{this} to be sealed'
      , 'expected #{this} to not be sealed'
    );
  });

  /**
   * ### .frozen
   *
   * Asserts that the target is frozen, which means that new properties can't be
   * added to it, and its existing properties can't be reassigned to different
   * values, reconfigured, or deleted. Primitives are always frozen.
   *
   *     var frozenObject = Object.freeze({});
   *
   *     expect(frozenObject).to.be.frozen;
   *     expect(1).to.be.frozen;
   *
   * Add `.not` earlier in the chain to negate `.frozen`.
   *
   *     expect({a: 1}).to.not.be.frozen;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.be.frozen;
   *
   * @name frozen
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('frozen', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a frozen ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
    // The following provides ES6 behavior for ES5 environments.

    var isFrozen = obj === Object(obj) ? Object.isFrozen(obj) : true;

    this.assert(
      isFrozen
      , 'expected #{this} to be frozen'
      , 'expected #{this} to not be frozen'
    );
  });

  /**
   * ### .finite
   *
   * Asserts that the target is a number, and isn't `NaN` or positive/negative
   * `Infinity`.
   *
   *     expect(1).to.be.finite;
   *
   * Add `.not` earlier in the chain to negate `.finite`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either isn't a number, or that it's `NaN`, or
   * that it's positive `Infinity`, or that it's negative `Infinity`. It's often
   * best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to be a number, it's often best to assert
   * that it's the expected type, rather than asserting that it isn't one of
   * many unexpected types.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.finite; // Not recommended
   *
   * When the target is expected to be `NaN`, it's often best to assert exactly
   * that.
   *
   *     expect(NaN).to.be.NaN; // Recommended
   *     expect(NaN).to.not.be.finite; // Not recommended
   *
   * When the target is expected to be positive infinity, it's often best to
   * assert exactly that.
   *
   *     expect(Infinity).to.equal(Infinity); // Recommended
   *     expect(Infinity).to.not.be.finite; // Not recommended
   *
   * When the target is expected to be negative infinity, it's often best to
   * assert exactly that.
   *
   *     expect(-Infinity).to.equal(-Infinity); // Recommended
   *     expect(-Infinity).to.not.be.finite; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect('foo', 'nooo why fail??').to.be.finite;
   *
   * @name finite
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('finite', function(msg) {
    var obj = flag(this, 'object');

    this.assert(
        typeof obj === 'number' && isFinite(obj)
      , 'expected #{this} to be a finite number'
      , 'expected #{this} to not be a finite number'
    );
  });
};

/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var expect = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };

  /**
   * ### .fail([message])
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure.
   *
   *     expect.fail();
   *     expect.fail("custom error message");
   *     expect.fail(1, 2);
   *     expect.fail(1, 2, "custom error message");
   *     expect.fail(1, 2, "custom error message", ">");
   *     expect.fail(1, 2, undefined, ">");
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace BDD
   * @api public
   */

  chai.expect.fail = function (actual, expected, message, operator) {
    if (arguments.length < 2) {
        message = actual;
        actual = undefined;
    }

    message = message || 'expect.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, chai.expect.fail);
  };
};

/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var should = function (chai, util) {
  var Assertion = chai.Assertion;

  function loadShould () {
    // explicitly define this method as function as to have it's name to include as `ssfi`
    function shouldGetter() {
      if (this instanceof String
          || this instanceof Number
          || this instanceof Boolean
          || typeof Symbol === 'function' && this instanceof Symbol) {
        return new Assertion(this.valueOf(), null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    function shouldSetter(value) {
      // See https://github.com/chaijs/chai/issues/86: this makes
      // `whatever.should = someValue` actually set `someValue`, which is
      // especially useful for `global.should = require('chai').should()`.
      //
      // Note that we have to use [[DefineProperty]] instead of [[Put]]
      // since otherwise we would trigger this very setter!
      Object.defineProperty(this, 'should', {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should', {
      set: shouldSetter
      , get: shouldGetter
      , configurable: true
    });

    var should = {};

    /**
     * ### .fail([message])
     * ### .fail(actual, expected, [message], [operator])
     *
     * Throw a failure.
     *
     *     should.fail();
     *     should.fail("custom error message");
     *     should.fail(1, 2);
     *     should.fail(1, 2, "custom error message");
     *     should.fail(1, 2, "custom error message", ">");
     *     should.fail(1, 2, undefined, ">");
     *
     *
     * @name fail
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @param {String} operator
     * @namespace BDD
     * @api public
     */

    should.fail = function (actual, expected, message, operator) {
      if (arguments.length < 2) {
          message = actual;
          actual = undefined;
      }

      message = message || 'should.fail()';
      throw new chai.AssertionError(message, {
          actual: actual
        , expected: expected
        , operator: operator
      }, should.fail);
    };

    /**
     * ### .equal(actual, expected, [message])
     *
     * Asserts non-strict equality (`==`) of `actual` and `expected`.
     *
     *     should.equal(3, '3', '== coerces values to strings');
     *
     * @name equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/string/regexp], [string/regexp], [message])
     *
     * Asserts that `function` will throw an error that is an instance of
     * `constructor`, or alternately that it will throw an error with message
     * matching `regexp`.
     *
     *     should.throw(fn, 'function throws a reference error');
     *     should.throw(fn, /function throws a reference error/);
     *     should.throw(fn, ReferenceError);
     *     should.throw(fn, ReferenceError, 'function throws a reference error');
     *     should.throw(fn, ReferenceError, /function throws a reference error/);
     *
     * @name throw
     * @alias Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };

    /**
     * ### .exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var foo = 'hi';
     *
     *     should.exist(foo, 'foo exists');
     *
     * @name exist
     * @namespace Should
     * @api public
     */

    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    };

    // negation
    should.not = {};

    /**
     * ### .not.equal(actual, expected, [message])
     *
     * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
     *
     *     should.not.equal(3, 4, 'these numbers are not equal');
     *
     * @name not.equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/regexp], [message])
     *
     * Asserts that `function` will _not_ throw an error that is an instance of
     * `constructor`, or alternately that it will not throw an error with message
     * matching `regexp`.
     *
     *     should.not.throw(fn, Error, 'function does not throw');
     *
     * @name not.throw
     * @alias not.Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    /**
     * ### .not.exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var bar = null;
     *
     *     should.not.exist(bar, 'bar does not exist');
     *
     * @name not.exist
     * @namespace Should
     * @api public
     */

    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    };

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
  }
  chai.should = loadShould;
  chai.Should = loadShould;
};

/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var assert$1 = function (chai, util) {
  /*!
   * Chai dependencies.
   */

  var Assertion = chai.Assertion
    , flag = util.flag;

  /*!
   * Module export.
   */

  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @namespace Assert
   * @api public
   */

  var assert$$1 = chai.assert = function (express, errmsg) {
    var test = new Assertion(null, null, chai.assert, true);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };

  /**
   * ### .fail([message])
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   *     assert.fail();
   *     assert.fail("custom error message");
   *     assert.fail(1, 2);
   *     assert.fail(1, 2, "custom error message");
   *     assert.fail(1, 2, "custom error message", ">");
   *     assert.fail(1, 2, undefined, ">");
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace Assert
   * @api public
   */

  assert$$1.fail = function (actual, expected, message, operator) {
    if (arguments.length < 2) {
        // Comply with Node's fail([message]) interface

        message = actual;
        actual = undefined;
    }

    message = message || 'assert.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, assert$$1.fail);
  };

  /**
   * ### .isOk(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.isOk('everything', 'everything is ok');
   *     assert.isOk(false, 'this will fail');
   *
   * @name isOk
   * @alias ok
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isOk = function (val, msg) {
    new Assertion(val, msg, assert$$1.isOk, true).is.ok;
  };

  /**
   * ### .isNotOk(object, [message])
   *
   * Asserts that `object` is falsy.
   *
   *     assert.isNotOk('everything', 'this will fail');
   *     assert.isNotOk(false, 'this will pass');
   *
   * @name isNotOk
   * @alias notOk
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotOk = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotOk, true).is.not.ok;
  };

  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert$$1.equal, true);

    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
      , true
    );
  };

  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert$$1.notEqual, true);

    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
      , true
    );
  };

  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert$$1.strictEqual, true).to.equal(exp);
  };

  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert$$1.notStrictEqual, true).to.not.equal(exp);
  };

  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @alias deepStrictEqual
   * @namespace Assert
   * @api public
   */

  assert$$1.deepEqual = assert$$1.deepStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert$$1.deepEqual, true).to.eql(exp);
  };

  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert$$1.notDeepEqual, true).to.not.eql(exp);
  };

   /**
   * ### .isAbove(valueToCheck, valueToBeAbove, [message])
   *
   * Asserts `valueToCheck` is strictly greater than (>) `valueToBeAbove`.
   *
   *     assert.isAbove(5, 2, '5 is strictly greater than 2');
   *
   * @name isAbove
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAbove
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isAbove = function (val, abv, msg) {
    new Assertion(val, msg, assert$$1.isAbove, true).to.be.above(abv);
  };

   /**
   * ### .isAtLeast(valueToCheck, valueToBeAtLeast, [message])
   *
   * Asserts `valueToCheck` is greater than or equal to (>=) `valueToBeAtLeast`.
   *
   *     assert.isAtLeast(5, 2, '5 is greater or equal to 2');
   *     assert.isAtLeast(3, 3, '3 is greater or equal to 3');
   *
   * @name isAtLeast
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtLeast
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isAtLeast = function (val, atlst, msg) {
    new Assertion(val, msg, assert$$1.isAtLeast, true).to.be.least(atlst);
  };

   /**
   * ### .isBelow(valueToCheck, valueToBeBelow, [message])
   *
   * Asserts `valueToCheck` is strictly less than (<) `valueToBeBelow`.
   *
   *     assert.isBelow(3, 6, '3 is strictly less than 6');
   *
   * @name isBelow
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeBelow
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isBelow = function (val, blw, msg) {
    new Assertion(val, msg, assert$$1.isBelow, true).to.be.below(blw);
  };

   /**
   * ### .isAtMost(valueToCheck, valueToBeAtMost, [message])
   *
   * Asserts `valueToCheck` is less than or equal to (<=) `valueToBeAtMost`.
   *
   *     assert.isAtMost(3, 6, '3 is less than or equal to 6');
   *     assert.isAtMost(4, 4, '4 is less than or equal to 4');
   *
   * @name isAtMost
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtMost
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isAtMost = function (val, atmst, msg) {
    new Assertion(val, msg, assert$$1.isAtMost, true).to.be.most(atmst);
  };

  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isTrue = function (val, msg) {
    new Assertion(val, msg, assert$$1.isTrue, true).is['true'];
  };

  /**
   * ### .isNotTrue(value, [message])
   *
   * Asserts that `value` is not true.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotTrue(tea, 'great, time for tea!');
   *
   * @name isNotTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotTrue = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotTrue, true).to.not.equal(true);
  };

  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isFalse = function (val, msg) {
    new Assertion(val, msg, assert$$1.isFalse, true).is['false'];
  };

  /**
   * ### .isNotFalse(value, [message])
   *
   * Asserts that `value` is not false.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotFalse(tea, 'great, time for tea!');
   *
   * @name isNotFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotFalse = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotFalse, true).to.not.equal(false);
  };

  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNull = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNull, true).to.equal(null);
  };

  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotNull = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotNull, true).to.not.equal(null);
  };

  /**
   * ### .isNaN
   *
   * Asserts that value is NaN.
   *
   *     assert.isNaN(NaN, 'NaN is NaN');
   *
   * @name isNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNaN = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNaN, true).to.be.NaN;
  };

  /**
   * ### .isNotNaN
   *
   * Asserts that value is not NaN.
   *
   *     assert.isNotNaN(4, '4 is not NaN');
   *
   * @name isNotNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */
  assert$$1.isNotNaN = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotNaN, true).not.to.be.NaN;
  };

  /**
   * ### .exists
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi';
   *
   *     assert.exists(foo, 'foo is neither `null` nor `undefined`');
   *
   * @name exists
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.exists = function (val, msg) {
    new Assertion(val, msg, assert$$1.exists, true).to.exist;
  };

  /**
   * ### .notExists
   *
   * Asserts that the target is either `null` or `undefined`.
   *
   *     var bar = null
   *       , baz;
   *
   *     assert.notExists(bar);
   *     assert.notExists(baz, 'baz is either null or undefined');
   *
   * @name notExists
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notExists = function (val, msg) {
    new Assertion(val, msg, assert$$1.notExists, true).to.not.exist;
  };

  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isUndefined = function (val, msg) {
    new Assertion(val, msg, assert$$1.isUndefined, true).to.equal(undefined);
  };

  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isDefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isDefined = function (val, msg) {
    new Assertion(val, msg, assert$$1.isDefined, true).to.not.equal(undefined);
  };

  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isFunction = function (val, msg) {
    new Assertion(val, msg, assert$$1.isFunction, true).to.be.a('function');
  };

  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotFunction = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotFunction, true).to.not.be.a('function');
  };

  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object of type 'Object' (as revealed by `Object.prototype.toString`).
   * _The assertion does not match subclassed objects._
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isObject = function (val, msg) {
    new Assertion(val, msg, assert$$1.isObject, true).to.be.a('object');
  };

  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object of type 'Object' (as revealed by `Object.prototype.toString`).
   *
   *     var selection = 'chai'
   *     assert.isNotObject(selection, 'tea selection is not an object');
   *     assert.isNotObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotObject = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotObject, true).to.not.be.a('object');
  };

  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isArray = function (val, msg) {
    new Assertion(val, msg, assert$$1.isArray, true).to.be.an('array');
  };

  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotArray = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotArray, true).to.not.be.an('array');
  };

  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isString = function (val, msg) {
    new Assertion(val, msg, assert$$1.isString, true).to.be.a('string');
  };

  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotString = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotString, true).to.not.be.a('string');
  };

  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNumber = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNumber, true).to.be.a('number');
  };

  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotNumber = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotNumber, true).to.not.be.a('number');
  };

   /**
   * ### .isFinite(value, [message])
   *
   * Asserts that `value` is a finite number. Unlike `.isNumber`, this will fail for `NaN` and `Infinity`.
   *
   *     var cups = 2;
   *     assert.isFinite(cups, 'how many cups');
   *
   *     assert.isFinite(NaN); // throws
   *
   * @name isFinite
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isFinite = function (val, msg) {
    new Assertion(val, msg, assert$$1.isFinite, true).to.be.finite;
  };

  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isBoolean = function (val, msg) {
    new Assertion(val, msg, assert$$1.isBoolean, true).to.be.a('boolean');
  };

  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotBoolean = function (val, msg) {
    new Assertion(val, msg, assert$$1.isNotBoolean, true).to.not.be.a('boolean');
  };

  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.typeOf = function (val, type, msg) {
    new Assertion(val, msg, assert$$1.typeOf, true).to.be.a(type);
  };

  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg, assert$$1.notTypeOf, true).to.not.be.a(type);
  };

  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.instanceOf = function (val, type, msg) {
    new Assertion(val, msg, assert$$1.instanceOf, true).to.be.instanceOf(type);
  };

  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg, assert$$1.notInstanceOf, true)
      .to.not.be.instanceOf(type);
  };

  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Can be used to assert the
   * inclusion of a value in an array, a substring in a string, or a subset of
   * properties in an object.
   *
   *     assert.include([1,2,3], 2, 'array contains value');
   *     assert.include('foobar', 'foo', 'string contains substring');
   *     assert.include({ foo: 'bar', hello: 'universe' }, { foo: 'bar' }, 'object contains property');
   *
   * Strict equality (===) is used. When asserting the inclusion of a value in
   * an array, the array is searched for an element that's strictly equal to the
   * given value. When asserting a subset of properties in an object, the object
   * is searched for the given property keys, checking that each one is present
   * and strictly equal to the given property value. For instance:
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.include([obj1, obj2], obj1);
   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1});
   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1, bar: obj2});
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.include = function (exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.include, true).include(inc);
  };

  /**
   * ### .notInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Can be used to assert
   * the absence of a value in an array, a substring in a string, or a subset of
   * properties in an object.
   *
   *     assert.notInclude([1,2,3], 4, "array doesn't contain value");
   *     assert.notInclude('foobar', 'baz', "string doesn't contain substring");
   *     assert.notInclude({ foo: 'bar', hello: 'universe' }, { foo: 'baz' }, 'object doesn't contain property');
   *
   * Strict equality (===) is used. When asserting the absence of a value in an
   * array, the array is searched to confirm the absence of an element that's
   * strictly equal to the given value. When asserting a subset of properties in
   * an object, the object is searched to confirm that at least one of the given
   * property keys is either not present or not strictly equal to the given
   * property value. For instance:
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.notInclude([obj1, obj2], {a: 1});
   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: obj1, bar: {b: 2}});
   *
   * @name notInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.notInclude, true).not.include(inc);
  };

  /**
   * ### .deepInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Can be used to assert the
   * inclusion of a value in an array or a subset of properties in an object.
   * Deep equality is used.
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.deepInclude([obj1, obj2], {a: 1});
   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 2}});
   *
   * @name deepInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.deepInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.deepInclude, true).deep.include(inc);
  };

  /**
   * ### .notDeepInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Can be used to assert
   * the absence of a value in an array or a subset of properties in an object.
   * Deep equality is used.
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.notDeepInclude([obj1, obj2], {a: 9});
   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 9}});
   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 9}});
   *
   * @name notDeepInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notDeepInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.notDeepInclude, true).not.deep.include(inc);
  };

  /**
   * ### .nestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.nestedInclude({'.a': {'b': 'x'}}, {'\\.a.[b]': 'x'});
   *     assert.nestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'x'});
   *
   * @name nestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.nestedInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.nestedInclude, true).nested.include(inc);
  };

  /**
   * ### .notNestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' does not include 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.notNestedInclude({'.a': {'b': 'x'}}, {'\\.a.b': 'y'});
   *     assert.notNestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'y'});
   *
   * @name notNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notNestedInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.notNestedInclude, true)
      .not.nested.include(inc);
  };

  /**
   * ### .deepNestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object while checking for deep equality.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.deepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {x: 1}});
   *     assert.deepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {x: 1}});
   *
   * @name deepNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.deepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.deepNestedInclude, true)
      .deep.nested.include(inc);
  };

  /**
   * ### .notDeepNestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' does not include 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object while checking for deep equality.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.notDeepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {y: 1}})
   *     assert.notDeepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {y: 2}});
   *
   * @name notDeepNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notDeepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.notDeepNestedInclude, true)
      .not.deep.nested.include(inc);
  };

  /**
   * ### .ownInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object while ignoring inherited properties.
   *
   *     assert.ownInclude({ a: 1 }, { a: 1 });
   *
   * @name ownInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.ownInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.ownInclude, true).own.include(inc);
  };

  /**
   * ### .notOwnInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object while ignoring inherited properties.
   *
   *     Object.prototype.b = 2;
   *
   *     assert.notOwnInclude({ a: 1 }, { b: 2 });
   *
   * @name notOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.notOwnInclude, true).not.own.include(inc);
  };

  /**
   * ### .deepOwnInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object while ignoring inherited properties and checking for deep equality.
   *
   *      assert.deepOwnInclude({a: {b: 2}}, {a: {b: 2}});
   *
   * @name deepOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.deepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.deepOwnInclude, true)
      .deep.own.include(inc);
  };

   /**
   * ### .notDeepOwnInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object while ignoring inherited properties and checking for deep equality.
   *
   *      assert.notDeepOwnInclude({a: {b: 2}}, {a: {c: 3}});
   *
   * @name notDeepOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notDeepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert$$1.notDeepOwnInclude, true)
      .not.deep.own.include(inc);
  };

  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.match = function (exp, re, msg) {
    new Assertion(exp, msg, assert$$1.match, true).to.match(re);
  };

  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg, assert$$1.notMatch, true).to.not.match(re);
  };

  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *     assert.property({ tea: { green: 'matcha' }}, 'toString');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.property = function (obj, prop, msg) {
    new Assertion(obj, msg, assert$$1.property, true).to.have.property(prop);
  };

  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert$$1.notProperty, true)
      .to.not.have.property(prop);
  };

  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property` with a value given by `value`. Uses a strict equality check
   * (===).
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert$$1.propertyVal, true)
      .to.have.property(prop, val);
  };

  /**
   * ### .notPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property` with value given by `value`. Uses a strict equality check
   * (===).
   *
   *     assert.notPropertyVal({ tea: 'is good' }, 'tea', 'is bad');
   *     assert.notPropertyVal({ tea: 'is good' }, 'coffee', 'is good');
   *
   * @name notPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert$$1.notPropertyVal, true)
      .to.not.have.property(prop, val);
  };

  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property` with a value given by `value`. Uses a deep equality check.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert$$1.deepPropertyVal, true)
      .to.have.deep.property(prop, val);
  };

  /**
   * ### .notDeepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property` with value given by `value`. Uses a deep equality check.
   *
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
   *
   * @name notDeepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notDeepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert$$1.notDeepPropertyVal, true)
      .to.not.have.deep.property(prop, val);
  };

  /**
   * ### .ownProperty(object, property, [message])
   *
   * Asserts that `object` has a direct property named by `property`. Inherited
   * properties aren't checked.
   *
   *     assert.ownProperty({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name ownProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert$$1.ownProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert$$1.ownProperty, true)
      .to.have.own.property(prop);
  };

  /**
   * ### .notOwnProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by
   * `property`. Inherited properties aren't checked.
   *
   *     assert.notOwnProperty({ tea: { green: 'matcha' }}, 'coffee');
   *     assert.notOwnProperty({}, 'toString');
   *
   * @name notOwnProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert$$1.notOwnProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert$$1.notOwnProperty, true)
      .to.not.have.own.property(prop);
  };

  /**
   * ### .ownPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct property named by `property` and a value
   * equal to the provided `value`. Uses a strict equality check (===).
   * Inherited properties aren't checked.
   *
   *     assert.ownPropertyVal({ coffee: 'is good'}, 'coffee', 'is good');
   *
   * @name ownPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert$$1.ownPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert$$1.ownPropertyVal, true)
      .to.have.own.property(prop, value);
  };

  /**
   * ### .notOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by `property`
   * with a value equal to the provided `value`. Uses a strict equality check
   * (===). Inherited properties aren't checked.
   *
   *     assert.notOwnPropertyVal({ tea: 'is better'}, 'tea', 'is worse');
   *     assert.notOwnPropertyVal({}, 'toString', Object.prototype.toString);
   *
   * @name notOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert$$1.notOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert$$1.notOwnPropertyVal, true)
      .to.not.have.own.property(prop, value);
  };

  /**
   * ### .deepOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct property named by `property` and a value
   * equal to the provided `value`. Uses a deep equality check. Inherited
   * properties aren't checked.
   *
   *     assert.deepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
   *
   * @name deepOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert$$1.deepOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert$$1.deepOwnPropertyVal, true)
      .to.have.deep.own.property(prop, value);
  };

  /**
   * ### .notDeepOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by `property`
   * with a value equal to the provided `value`. Uses a deep equality check.
   * Inherited properties aren't checked.
   *
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
   *     assert.notDeepOwnPropertyVal({}, 'toString', Object.prototype.toString);
   *
   * @name notDeepOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert$$1.notDeepOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert$$1.notDeepOwnPropertyVal, true)
      .to.not.have.deep.own.property(prop, value);
  };

  /**
   * ### .nestedProperty(object, property, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property`, which can be a string using dot- and bracket-notation for
   * nested reference.
   *
   *     assert.nestedProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name nestedProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.nestedProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert$$1.nestedProperty, true)
      .to.have.nested.property(prop);
  };

  /**
   * ### .notNestedProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for nested reference. The
   * property cannot exist on the object nor anywhere in its prototype chain.
   *
   *     assert.notNestedProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notNestedProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notNestedProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert$$1.notNestedProperty, true)
      .to.not.have.nested.property(prop);
  };

  /**
   * ### .nestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for nested
   * reference. Uses a strict equality check (===).
   *
   *     assert.nestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name nestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.nestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert$$1.nestedPropertyVal, true)
      .to.have.nested.property(prop, val);
  };

  /**
   * ### .notNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property` with
   * value given by `value`. `property` can use dot- and bracket-notation for
   * nested reference. Uses a strict equality check (===).
   *
   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'coffee.green', 'matcha');
   *
   * @name notNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert$$1.notNestedPropertyVal, true)
      .to.not.have.nested.property(prop, val);
  };

  /**
   * ### .deepNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with a value given
   * by `value`. `property` can use dot- and bracket-notation for nested
   * reference. Uses a deep equality check.
   *
   *     assert.deepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yum' });
   *
   * @name deepNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.deepNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert$$1.deepNestedPropertyVal, true)
      .to.have.deep.nested.property(prop, val);
  };

  /**
   * ### .notDeepNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property` with
   * value given by `value`. `property` can use dot- and bracket-notation for
   * nested reference. Uses a deep equality check.
   *
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { oolong: 'yum' });
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yuck' });
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.black', { matcha: 'yum' });
   *
   * @name notDeepNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notDeepNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert$$1.notDeepNestedPropertyVal, true)
      .to.not.have.deep.nested.property(prop, val);
  };

  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` or `size` with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 6, 'string has length of 6');
   *     assert.lengthOf(new Set([1,2,3]), 3, 'set has size of 3');
   *     assert.lengthOf(new Map([['a',1],['b',2],['c',3]]), 3, 'map has size of 3');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg, assert$$1.lengthOf, true).to.have.lengthOf(len);
  };

  /**
   * ### .hasAnyKeys(object, [keys], [message])
   *
   * Asserts that `object` has at least one of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'iDontExist', 'baz']);
   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, iDontExist: 99, baz: 1337});
   *     assert.hasAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.hasAnyKeys(new Set([{foo: 'bar'}, 'anotherKey']), [{foo: 'bar'}, 'anotherKey']);
   *
   * @name hasAnyKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.hasAnyKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.hasAnyKeys, true).to.have.any.keys(keys);
  };

  /**
   * ### .hasAllKeys(object, [keys], [message])
   *
   * Asserts that `object` has all and only all of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337]);
   *     assert.hasAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.hasAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
   *
   * @name hasAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.hasAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.hasAllKeys, true).to.have.all.keys(keys);
  };

  /**
   * ### .containsAllKeys(object, [keys], [message])
   *
   * Asserts that `object` has all of the `keys` provided but may have more keys not listed.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'baz']);
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, baz: 1337});
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337});
   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}]);
   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}]);
   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
   *
   * @name containsAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.containsAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.containsAllKeys, true)
      .to.contain.all.keys(keys);
  };

  /**
   * ### .doesNotHaveAnyKeys(object, [keys], [message])
   *
   * Asserts that `object` has none of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
   *     assert.doesNotHaveAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
   *     assert.doesNotHaveAnyKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
   *
   * @name doesNotHaveAnyKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.doesNotHaveAnyKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.doesNotHaveAnyKeys, true)
      .to.not.have.any.keys(keys);
  };

  /**
   * ### .doesNotHaveAllKeys(object, [keys], [message])
   *
   * Asserts that `object` does not have at least one of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
   *     assert.doesNotHaveAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
   *     assert.doesNotHaveAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
   *
   * @name doesNotHaveAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.doesNotHaveAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.doesNotHaveAllKeys, true)
      .to.not.have.all.keys(keys);
  };

  /**
   * ### .hasAnyDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has at least one of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {three: 'three'}]);
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name doesNotHaveAllKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.hasAnyDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.hasAnyDeepKeys, true)
      .to.have.any.deep.keys(keys);
  };

 /**
   * ### .hasAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has all and only all of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne']]), {one: 'one'});
   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAllDeepKeys(new Set([{one: 'one'}]), {one: 'one'});
   *     assert.hasAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name hasAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.hasAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.hasAllDeepKeys, true)
      .to.have.all.deep.keys(keys);
  };

 /**
   * ### .containsAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` contains all of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name containsAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.containsAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.containsAllDeepKeys, true)
      .to.contain.all.deep.keys(keys);
  };

 /**
   * ### .doesNotHaveAnyDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has none of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
   *
   * @name doesNotHaveAnyDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.doesNotHaveAnyDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.doesNotHaveAnyDeepKeys, true)
      .to.not.have.any.deep.keys(keys);
  };

 /**
   * ### .doesNotHaveAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` does not have at least one of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {one: 'one'}]);
   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {fifty: 'fifty'}]);
   *
   * @name doesNotHaveAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.doesNotHaveAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert$$1.doesNotHaveAllDeepKeys, true)
      .to.not.have.all.deep.keys(keys);
  };

 /**
   * ### .throws(fn, [errorLike/string/regexp], [string/regexp], [message])
   *
   * If `errorLike` is an `Error` constructor, asserts that `fn` will throw an error that is an
   * instance of `errorLike`.
   * If `errorLike` is an `Error` instance, asserts that the error thrown is the same
   * instance as `errorLike`.
   * If `errMsgMatcher` is provided, it also asserts that the error thrown will have a
   * message matching `errMsgMatcher`.
   *
   *     assert.throws(fn, 'Error thrown must have this msg');
   *     assert.throws(fn, /Error thrown must have a msg that matches this/);
   *     assert.throws(fn, ReferenceError);
   *     assert.throws(fn, errorInstance);
   *     assert.throws(fn, ReferenceError, 'Error thrown must be a ReferenceError and have this msg');
   *     assert.throws(fn, errorInstance, 'Error thrown must be the same errorInstance and have this msg');
   *     assert.throws(fn, ReferenceError, /Error thrown must be a ReferenceError and match this/);
   *     assert.throws(fn, errorInstance, /Error thrown must be the same errorInstance and match this/);
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} fn
   * @param {ErrorConstructor|Error} errorLike
   * @param {RegExp|String} errMsgMatcher
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert$$1.throws = function (fn, errorLike, errMsgMatcher, msg) {
    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    var assertErr = new Assertion(fn, msg, assert$$1.throws, true)
      .to.throw(errorLike, errMsgMatcher);
    return flag(assertErr, 'object');
  };

  /**
   * ### .doesNotThrow(fn, [errorLike/string/regexp], [string/regexp], [message])
   *
   * If `errorLike` is an `Error` constructor, asserts that `fn` will _not_ throw an error that is an
   * instance of `errorLike`.
   * If `errorLike` is an `Error` instance, asserts that the error thrown is _not_ the same
   * instance as `errorLike`.
   * If `errMsgMatcher` is provided, it also asserts that the error thrown will _not_ have a
   * message matching `errMsgMatcher`.
   *
   *     assert.doesNotThrow(fn, 'Any Error thrown must not have this message');
   *     assert.doesNotThrow(fn, /Any Error thrown must not match this/);
   *     assert.doesNotThrow(fn, Error);
   *     assert.doesNotThrow(fn, errorInstance);
   *     assert.doesNotThrow(fn, Error, 'Error must not have this message');
   *     assert.doesNotThrow(fn, errorInstance, 'Error must not have this message');
   *     assert.doesNotThrow(fn, Error, /Error must not match this/);
   *     assert.doesNotThrow(fn, errorInstance, /Error must not match this/);
   *
   * @name doesNotThrow
   * @param {Function} fn
   * @param {ErrorConstructor} errorLike
   * @param {RegExp|String} errMsgMatcher
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert$$1.doesNotThrow = function (fn, errorLike, errMsgMatcher, msg) {
    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    new Assertion(fn, msg, assert$$1.doesNotThrow, true)
      .to.not.throw(errorLike, errMsgMatcher);
  };

  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.operator = function (val, operator, val2, msg) {
    var ok;
    switch(operator) {
      case '==':
        ok = val == val2;
        break;
      case '===':
        ok = val === val2;
        break;
      case '>':
        ok = val > val2;
        break;
      case '>=':
        ok = val >= val2;
        break;
      case '<':
        ok = val < val2;
        break;
      case '<=':
        ok = val <= val2;
        break;
      case '!=':
        ok = val != val2;
        break;
      case '!==':
        ok = val !== val2;
        break;
      default:
        msg = msg ? msg + ': ' : msg;
        throw new chai.AssertionError(
          msg + 'Invalid operator "' + operator + '"',
          undefined,
          assert$$1.operator
        );
    }
    var test = new Assertion(ok, msg, assert$$1.operator, true);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };

  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg, assert$$1.closeTo, true).to.be.closeTo(exp, delta);
  };

  /**
   * ### .approximately(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.approximately(1.5, 1, 0.5, 'numbers are close');
   *
   * @name approximately
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.approximately = function (act, exp, delta, msg) {
    new Assertion(act, msg, assert$$1.approximately, true)
      .to.be.approximately(exp, delta);
  };

  /**
   * ### .sameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in any order. Uses a
   * strict equality check (===).
   *
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
   *
   * @name sameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.sameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert$$1.sameMembers, true)
      .to.have.same.members(set2);
  };

  /**
   * ### .notSameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in any order.
   * Uses a strict equality check (===).
   *
   *     assert.notSameMembers([ 1, 2, 3 ], [ 5, 1, 3 ], 'not same members');
   *
   * @name notSameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notSameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert$$1.notSameMembers, true)
      .to.not.have.same.members(set2);
  };

  /**
   * ### .sameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in any order. Uses a
   * deep equality check.
   *
   *     assert.sameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { c: 3 }], 'same deep members');
   *
   * @name sameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.sameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert$$1.sameDeepMembers, true)
      .to.have.same.deep.members(set2);
  };

  /**
   * ### .notSameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in any order.
   * Uses a deep equality check.
   *
   *     assert.notSameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { f: 5 }], 'not same deep members');
   *
   * @name notSameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notSameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert$$1.notSameDeepMembers, true)
      .to.not.have.same.deep.members(set2);
  };

  /**
   * ### .sameOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in the same order.
   * Uses a strict equality check (===).
   *
   *     assert.sameOrderedMembers([ 1, 2, 3 ], [ 1, 2, 3 ], 'same ordered members');
   *
   * @name sameOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.sameOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert$$1.sameOrderedMembers, true)
      .to.have.same.ordered.members(set2);
  };

  /**
   * ### .notSameOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in the same
   * order. Uses a strict equality check (===).
   *
   *     assert.notSameOrderedMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'not same ordered members');
   *
   * @name notSameOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notSameOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert$$1.notSameOrderedMembers, true)
      .to.not.have.same.ordered.members(set2);
  };

  /**
   * ### .sameDeepOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in the same order.
   * Uses a deep equality check.
   *
   * assert.sameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { c: 3 } ], 'same deep ordered members');
   *
   * @name sameDeepOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.sameDeepOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert$$1.sameDeepOrderedMembers, true)
      .to.have.same.deep.ordered.members(set2);
  };

  /**
   * ### .notSameDeepOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in the same
   * order. Uses a deep equality check.
   *
   * assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { z: 5 } ], 'not same deep ordered members');
   * assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { c: 3 } ], 'not same deep ordered members');
   *
   * @name notSameDeepOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notSameDeepOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert$$1.notSameDeepOrderedMembers, true)
      .to.not.have.same.deep.ordered.members(set2);
  };

  /**
   * ### .includeMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in any order. Uses a
   * strict equality check (===). Duplicates are ignored.
   *
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1, 2 ], 'include members');
   *
   * @name includeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.includeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert$$1.includeMembers, true)
      .to.include.members(subset);
  };

  /**
   * ### .notIncludeMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in any order. Uses a
   * strict equality check (===). Duplicates are ignored.
   *
   *     assert.notIncludeMembers([ 1, 2, 3 ], [ 5, 1 ], 'not include members');
   *
   * @name notIncludeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notIncludeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert$$1.notIncludeMembers, true)
      .to.not.include.members(subset);
  };

  /**
   * ### .includeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in any order. Uses a deep
   * equality check. Duplicates are ignored.
   *
   *     assert.includeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { b: 2 } ], 'include deep members');
   *
   * @name includeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.includeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert$$1.includeDeepMembers, true)
      .to.include.deep.members(subset);
  };

  /**
   * ### .notIncludeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in any order. Uses a
   * deep equality check. Duplicates are ignored.
   *
   *     assert.notIncludeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { f: 5 } ], 'not include deep members');
   *
   * @name notIncludeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notIncludeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert$$1.notIncludeDeepMembers, true)
      .to.not.include.deep.members(subset);
  };

  /**
   * ### .includeOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a strict equality
   * check (===).
   *
   *     assert.includeOrderedMembers([ 1, 2, 3 ], [ 1, 2 ], 'include ordered members');
   *
   * @name includeOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.includeOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert$$1.includeOrderedMembers, true)
      .to.include.ordered.members(subset);
  };

  /**
   * ### .notIncludeOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a strict equality
   * check (===).
   *
   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 1 ], 'not include ordered members');
   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 3 ], 'not include ordered members');
   *
   * @name notIncludeOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notIncludeOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert$$1.notIncludeOrderedMembers, true)
      .to.not.include.ordered.members(subset);
  };

  /**
   * ### .includeDeepOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a deep equality
   * check.
   *
   *     assert.includeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 } ], 'include deep ordered members');
   *
   * @name includeDeepOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.includeDeepOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert$$1.includeDeepOrderedMembers, true)
      .to.include.deep.ordered.members(subset);
  };

  /**
   * ### .notIncludeDeepOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a deep equality
   * check.
   *
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { f: 5 } ], 'not include deep ordered members');
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 } ], 'not include deep ordered members');
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { c: 3 } ], 'not include deep ordered members');
   *
   * @name notIncludeDeepOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.notIncludeDeepOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert$$1.notIncludeDeepOrderedMembers, true)
      .to.not.include.deep.ordered.members(subset);
  };

  /**
   * ### .oneOf(inList, list, [message])
   *
   * Asserts that non-object, non-array value `inList` appears in the flat array `list`.
   *
   *     assert.oneOf(1, [ 2, 1 ], 'Not found in list');
   *
   * @name oneOf
   * @param {*} inList
   * @param {Array<*>} list
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert$$1.oneOf = function (inList, list, msg) {
    new Assertion(inList, msg, assert$$1.oneOf, true).to.be.oneOf(list);
  };

  /**
   * ### .changes(function, object, property, [message])
   *
   * Asserts that a function changes the value of a property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 22 };
   *     assert.changes(fn, obj, 'val');
   *
   * @name changes
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.changes = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert$$1.changes, true).to.change(obj, prop);
  };

   /**
   * ### .changesBy(function, object, property, delta, [message])
   *
   * Asserts that a function changes the value of a property by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 2 };
   *     assert.changesBy(fn, obj, 'val', 2);
   *
   * @name changesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.changesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert$$1.changesBy, true)
      .to.change(obj, prop).by(delta);
  };

   /**
   * ### .doesNotChange(function, object, property, [message])
   *
   * Asserts that a function does not change the value of a property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { console.log('foo'); };
   *     assert.doesNotChange(fn, obj, 'val');
   *
   * @name doesNotChange
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.doesNotChange = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert$$1.doesNotChange, true)
      .to.not.change(obj, prop);
  };

  /**
   * ### .changesButNotBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not change the value of a property or of a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 10 };
   *     assert.changesButNotBy(fn, obj, 'val', 5);
   *
   * @name changesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.changesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert$$1.changesButNotBy, true)
      .to.change(obj, prop).but.not.by(delta);
  };

  /**
   * ### .increases(function, object, property, [message])
   *
   * Asserts that a function increases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 13 };
   *     assert.increases(fn, obj, 'val');
   *
   * @name increases
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.increases = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert$$1.increases, true)
      .to.increase(obj, prop);
  };

  /**
   * ### .increasesBy(function, object, property, delta, [message])
   *
   * Asserts that a function increases a numeric object property or a function's return value by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 10 };
   *     assert.increasesBy(fn, obj, 'val', 10);
   *
   * @name increasesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.increasesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert$$1.increasesBy, true)
      .to.increase(obj, prop).by(delta);
  };

  /**
   * ### .doesNotIncrease(function, object, property, [message])
   *
   * Asserts that a function does not increase a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 8 };
   *     assert.doesNotIncrease(fn, obj, 'val');
   *
   * @name doesNotIncrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.doesNotIncrease = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert$$1.doesNotIncrease, true)
      .to.not.increase(obj, prop);
  };

  /**
   * ### .increasesButNotBy(function, object, property, [message])
   *
   * Asserts that a function does not increase a numeric object property or function's return value by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.increasesButNotBy(fn, obj, 'val', 10);
   *
   * @name increasesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.increasesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert$$1.increasesButNotBy, true)
      .to.increase(obj, prop).but.not.by(delta);
  };

  /**
   * ### .decreases(function, object, property, [message])
   *
   * Asserts that a function decreases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreases(fn, obj, 'val');
   *
   * @name decreases
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.decreases = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert$$1.decreases, true)
      .to.decrease(obj, prop);
  };

  /**
   * ### .decreasesBy(function, object, property, delta, [message])
   *
   * Asserts that a function decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val -= 5 };
   *     assert.decreasesBy(fn, obj, 'val', 5);
   *
   * @name decreasesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.decreasesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert$$1.decreasesBy, true)
      .to.decrease(obj, prop).by(delta);
  };

  /**
   * ### .doesNotDecrease(function, object, property, [message])
   *
   * Asserts that a function does not decreases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.doesNotDecrease(fn, obj, 'val');
   *
   * @name doesNotDecrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.doesNotDecrease = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert$$1.doesNotDecrease, true)
      .to.not.decrease(obj, prop);
  };

  /**
   * ### .doesNotDecreaseBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.doesNotDecreaseBy(fn, obj, 'val', 1);
   *
   * @name doesNotDecrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.doesNotDecreaseBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert$$1.doesNotDecreaseBy, true)
      .to.not.decrease(obj, prop).by(delta);
  };

  /**
   * ### .decreasesButNotBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreasesButNotBy(fn, obj, 'val', 1);
   *
   * @name decreasesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.decreasesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert$$1.decreasesButNotBy, true)
      .to.decrease(obj, prop).but.not.by(delta);
  };

  /*!
   * ### .ifError(object)
   *
   * Asserts if value is not a false value, and throws if it is a true value.
   * This is added to allow for chai to be a drop-in replacement for Node's
   * assert class.
   *
   *     var err = new Error('I am a custom error');
   *     assert.ifError(err); // Rethrows err!
   *
   * @name ifError
   * @param {Object} object
   * @namespace Assert
   * @api public
   */

  assert$$1.ifError = function (val) {
    if (val) {
      throw(val);
    }
  };

  /**
   * ### .isExtensible(object)
   *
   * Asserts that `object` is extensible (can have new properties added to it).
   *
   *     assert.isExtensible({});
   *
   * @name isExtensible
   * @alias extensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.isExtensible = function (obj, msg) {
    new Assertion(obj, msg, assert$$1.isExtensible, true).to.be.extensible;
  };

  /**
   * ### .isNotExtensible(object)
   *
   * Asserts that `object` is _not_ extensible.
   *
   *     var nonExtensibleObject = Object.preventExtensions({});
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     assert.isNotExtensible(nonExtensibleObject);
   *     assert.isNotExtensible(sealedObject);
   *     assert.isNotExtensible(frozenObject);
   *
   * @name isNotExtensible
   * @alias notExtensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotExtensible = function (obj, msg) {
    new Assertion(obj, msg, assert$$1.isNotExtensible, true).to.not.be.extensible;
  };

  /**
   * ### .isSealed(object)
   *
   * Asserts that `object` is sealed (cannot have new properties added to it
   * and its existing properties cannot be removed).
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.seal({});
   *
   *     assert.isSealed(sealedObject);
   *     assert.isSealed(frozenObject);
   *
   * @name isSealed
   * @alias sealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.isSealed = function (obj, msg) {
    new Assertion(obj, msg, assert$$1.isSealed, true).to.be.sealed;
  };

  /**
   * ### .isNotSealed(object)
   *
   * Asserts that `object` is _not_ sealed.
   *
   *     assert.isNotSealed({});
   *
   * @name isNotSealed
   * @alias notSealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotSealed = function (obj, msg) {
    new Assertion(obj, msg, assert$$1.isNotSealed, true).to.not.be.sealed;
  };

  /**
   * ### .isFrozen(object)
   *
   * Asserts that `object` is frozen (cannot have new properties added to it
   * and its existing properties cannot be modified).
   *
   *     var frozenObject = Object.freeze({});
   *     assert.frozen(frozenObject);
   *
   * @name isFrozen
   * @alias frozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.isFrozen = function (obj, msg) {
    new Assertion(obj, msg, assert$$1.isFrozen, true).to.be.frozen;
  };

  /**
   * ### .isNotFrozen(object)
   *
   * Asserts that `object` is _not_ frozen.
   *
   *     assert.isNotFrozen({});
   *
   * @name isNotFrozen
   * @alias notFrozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotFrozen = function (obj, msg) {
    new Assertion(obj, msg, assert$$1.isNotFrozen, true).to.not.be.frozen;
  };

  /**
   * ### .isEmpty(target)
   *
   * Asserts that the target does not contain any values.
   * For arrays and strings, it checks the `length` property.
   * For `Map` and `Set` instances, it checks the `size` property.
   * For non-function objects, it gets the count of own
   * enumerable string keys.
   *
   *     assert.isEmpty([]);
   *     assert.isEmpty('');
   *     assert.isEmpty(new Map);
   *     assert.isEmpty({});
   *
   * @name isEmpty
   * @alias empty
   * @param {Object|Array|String|Map|Set} target
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.isEmpty = function(val, msg) {
    new Assertion(val, msg, assert$$1.isEmpty, true).to.be.empty;
  };

  /**
   * ### .isNotEmpty(target)
   *
   * Asserts that the target contains values.
   * For arrays and strings, it checks the `length` property.
   * For `Map` and `Set` instances, it checks the `size` property.
   * For non-function objects, it gets the count of own
   * enumerable string keys.
   *
   *     assert.isNotEmpty([1, 2]);
   *     assert.isNotEmpty('34');
   *     assert.isNotEmpty(new Set([5, 6]));
   *     assert.isNotEmpty({ key: 7 });
   *
   * @name isNotEmpty
   * @alias notEmpty
   * @param {Object|Array|String|Map|Set} target
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert$$1.isNotEmpty = function(val, msg) {
    new Assertion(val, msg, assert$$1.isNotEmpty, true).to.not.be.empty;
  };

  /*!
   * Aliases.
   */

  (function alias(name, as){
    assert$$1[as] = assert$$1[name];
    return alias;
  })
  ('isOk', 'ok')
  ('isNotOk', 'notOk')
  ('throws', 'throw')
  ('throws', 'Throw')
  ('isExtensible', 'extensible')
  ('isNotExtensible', 'notExtensible')
  ('isSealed', 'sealed')
  ('isNotSealed', 'notSealed')
  ('isFrozen', 'frozen')
  ('isNotFrozen', 'notFrozen')
  ('isEmpty', 'empty')
  ('isNotEmpty', 'notEmpty');
};

var chai = createCommonjsModule(function (module, exports) {
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var used = [];

/*!
 * Chai version
 */

exports.version = '4.2.0';

/*!
 * Assertion Error
 */

exports.AssertionError = assertionError;

/*!
 * Utils for plugins (not exported)
 */



/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai.
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */

exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(exports, utils);
    used.push(fn);
  }

  return exports;
};

/*!
 * Utility Functions
 */

exports.util = utils;

/*!
 * Configuration
 */


exports.config = config;

/*!
 * Primary `Assertion` prototype
 */


exports.use(assertion);

/*!
 * Core Assertions
 */


exports.use(assertions);

/*!
 * Expect interface
 */


exports.use(expect);

/*!
 * Should interface
 */


exports.use(should);

/*!
 * Assert interface
 */


exports.use(assert$1);
});
var chai_1 = chai.version;
var chai_2 = chai.AssertionError;
var chai_3 = chai.use;
var chai_4 = chai.util;
var chai_5 = chai.config;

var chai$1 = chai;

var chaiAsPromised = createCommonjsModule(function (module) {
/* eslint-disable no-invalid-this */
let checkError$$1 = checkError;

module.exports = (chai, utils) => {
    const Assertion = chai.Assertion;
    const assert$$1 = chai.assert;
    const proxify = utils.proxify;

    // If we are using a version of Chai that has checkError on it,
    // we want to use that version to be consistent. Otherwise, we use
    // what was passed to the factory.
    if (utils.checkError) {
        checkError$$1 = utils.checkError;
    }

    function isLegacyJQueryPromise(thenable) {
        // jQuery promises are Promises/A+-compatible since 3.0.0. jQuery 3.0.0 is also the first version
        // to define the catch method.
        return typeof thenable.catch !== "function" &&
               typeof thenable.always === "function" &&
               typeof thenable.done === "function" &&
               typeof thenable.fail === "function" &&
               typeof thenable.pipe === "function" &&
               typeof thenable.progress === "function" &&
               typeof thenable.state === "function";
    }

    function assertIsAboutPromise(assertion) {
        if (typeof assertion._obj.then !== "function") {
            throw new TypeError(utils.inspect(assertion._obj) + " is not a thenable.");
        }
        if (isLegacyJQueryPromise(assertion._obj)) {
            throw new TypeError("Chai as Promised is incompatible with thenables of jQuery<3.0.0, sorry! Please " +
                                "upgrade jQuery or use another Promises/A+ compatible library (see " +
                                "http://promisesaplus.com/).");
        }
    }

    function proxifyIfSupported(assertion) {
        return proxify === undefined ? assertion : proxify(assertion);
    }

    function method(name, asserter) {
        utils.addMethod(Assertion.prototype, name, function () {
            assertIsAboutPromise(this);
            return asserter.apply(this, arguments);
        });
    }

    function property(name, asserter) {
        utils.addProperty(Assertion.prototype, name, function () {
            assertIsAboutPromise(this);
            return proxifyIfSupported(asserter.apply(this, arguments));
        });
    }

    function doNotify(promise, done) {
        promise.then(() => done(), done);
    }

    // These are for clarity and to bypass Chai refusing to allow `undefined` as actual when used with `assert`.
    function assertIfNegated(assertion, message, extra) {
        assertion.assert(true, null, message, extra.expected, extra.actual);
    }

    function assertIfNotNegated(assertion, message, extra) {
        assertion.assert(false, message, null, extra.expected, extra.actual);
    }

    function getBasePromise(assertion) {
        // We need to chain subsequent asserters on top of ones in the chain already (consider
        // `eventually.have.property("foo").that.equals("bar")`), only running them after the existing ones pass.
        // So the first base-promise is `assertion._obj`, but after that we use the assertions themselves, i.e.
        // previously derived promises, to chain off of.
        return typeof assertion.then === "function" ? assertion : assertion._obj;
    }

    function getReasonName(reason) {
        return reason instanceof Error ? reason.toString() : checkError$$1.getConstructorName(reason);
    }

    // Grab these first, before we modify `Assertion.prototype`.

    const propertyNames = Object.getOwnPropertyNames(Assertion.prototype);

    const propertyDescs = {};
    for (const name of propertyNames) {
        propertyDescs[name] = Object.getOwnPropertyDescriptor(Assertion.prototype, name);
    }

    property("fulfilled", function () {
        const derivedPromise = getBasePromise(this).then(
            value => {
                assertIfNegated(this,
                                "expected promise not to be fulfilled but it was fulfilled with #{act}",
                                { actual: value });
                return value;
            },
            reason => {
                assertIfNotNegated(this,
                                   "expected promise to be fulfilled but it was rejected with #{act}",
                                   { actual: getReasonName(reason) });
                return reason;
            }
        );

        module.exports.transferPromiseness(this, derivedPromise);
        return this;
    });

    property("rejected", function () {
        const derivedPromise = getBasePromise(this).then(
            value => {
                assertIfNotNegated(this,
                                   "expected promise to be rejected but it was fulfilled with #{act}",
                                   { actual: value });
                return value;
            },
            reason => {
                assertIfNegated(this,
                                "expected promise not to be rejected but it was rejected with #{act}",
                                { actual: getReasonName(reason) });

                // Return the reason, transforming this into a fulfillment, to allow further assertions, e.g.
                // `promise.should.be.rejected.and.eventually.equal("reason")`.
                return reason;
            }
        );

        module.exports.transferPromiseness(this, derivedPromise);
        return this;
    });

    method("rejectedWith", function (errorLike, errMsgMatcher, message) {
        let errorLikeName = null;
        const negate = utils.flag(this, "negate") || false;

        // rejectedWith with that is called without arguments is
        // the same as a plain ".rejected" use.
        if (errorLike === undefined && errMsgMatcher === undefined &&
            message === undefined) {
            /* eslint-disable no-unused-expressions */
            return this.rejected;
            /* eslint-enable no-unused-expressions */
        }

        if (message !== undefined) {
            utils.flag(this, "message", message);
        }

        if (errorLike instanceof RegExp || typeof errorLike === "string") {
            errMsgMatcher = errorLike;
            errorLike = null;
        } else if (errorLike && errorLike instanceof Error) {
            errorLikeName = errorLike.toString();
        } else if (typeof errorLike === "function") {
            errorLikeName = checkError$$1.getConstructorName(errorLike);
        } else {
            errorLike = null;
        }
        const everyArgIsDefined = Boolean(errorLike && errMsgMatcher);

        let matcherRelation = "including";
        if (errMsgMatcher instanceof RegExp) {
            matcherRelation = "matching";
        }

        const derivedPromise = getBasePromise(this).then(
            value => {
                let assertionMessage = null;
                let expected = null;

                if (errorLike) {
                    assertionMessage = "expected promise to be rejected with #{exp} but it was fulfilled with #{act}";
                    expected = errorLikeName;
                } else if (errMsgMatcher) {
                    assertionMessage = `expected promise to be rejected with an error ${matcherRelation} #{exp} but ` +
                                       `it was fulfilled with #{act}`;
                    expected = errMsgMatcher;
                }

                assertIfNotNegated(this, assertionMessage, { expected, actual: value });
                return value;
            },
            reason => {
                const errorLikeCompatible = errorLike && (errorLike instanceof Error ?
                                                        checkError$$1.compatibleInstance(reason, errorLike) :
                                                        checkError$$1.compatibleConstructor(reason, errorLike));

                const errMsgMatcherCompatible = errMsgMatcher && checkError$$1.compatibleMessage(reason, errMsgMatcher);

                const reasonName = getReasonName(reason);

                if (negate && everyArgIsDefined) {
                    if (errorLikeCompatible && errMsgMatcherCompatible) {
                        this.assert(true,
                                    null,
                                    "expected promise not to be rejected with #{exp} but it was rejected " +
                                    "with #{act}",
                                    errorLikeName,
                                    reasonName);
                    }
                } else {
                    if (errorLike) {
                        this.assert(errorLikeCompatible,
                                    "expected promise to be rejected with #{exp} but it was rejected with #{act}",
                                    "expected promise not to be rejected with #{exp} but it was rejected " +
                                    "with #{act}",
                                    errorLikeName,
                                    reasonName);
                    }

                    if (errMsgMatcher) {
                        this.assert(errMsgMatcherCompatible,
                                    `expected promise to be rejected with an error ${matcherRelation} #{exp} but got ` +
                                    `#{act}`,
                                    `expected promise not to be rejected with an error ${matcherRelation} #{exp}`,
                                    errMsgMatcher,
                                    checkError$$1.getMessage(reason));
                    }
                }

                return reason;
            }
        );

        module.exports.transferPromiseness(this, derivedPromise);
        return this;
    });

    property("eventually", function () {
        utils.flag(this, "eventually", true);
        return this;
    });

    method("notify", function (done) {
        doNotify(getBasePromise(this), done);
        return this;
    });

    method("become", function (value, message) {
        return this.eventually.deep.equal(value, message);
    });

    // ### `eventually`

    // We need to be careful not to trigger any getters, thus `Object.getOwnPropertyDescriptor` usage.
    const methodNames = propertyNames.filter(name => {
        return name !== "assert" && typeof propertyDescs[name].value === "function";
    });

    methodNames.forEach(methodName => {
        Assertion.overwriteMethod(methodName, originalMethod => function () {
            return doAsserterAsyncAndAddThen(originalMethod, this, arguments);
        });
    });

    const getterNames = propertyNames.filter(name => {
        return name !== "_obj" && typeof propertyDescs[name].get === "function";
    });

    getterNames.forEach(getterName => {
        // Chainable methods are things like `an`, which can work both for `.should.be.an.instanceOf` and as
        // `should.be.an("object")`. We need to handle those specially.
        const isChainableMethod = Assertion.prototype.__methods.hasOwnProperty(getterName);

        if (isChainableMethod) {
            Assertion.overwriteChainableMethod(
                getterName,
                originalMethod => function () {
                    return doAsserterAsyncAndAddThen(originalMethod, this, arguments);
                },
                originalGetter => function () {
                    return doAsserterAsyncAndAddThen(originalGetter, this);
                }
            );
        } else {
            Assertion.overwriteProperty(getterName, originalGetter => function () {
                return proxifyIfSupported(doAsserterAsyncAndAddThen(originalGetter, this));
            });
        }
    });

    function doAsserterAsyncAndAddThen(asserter, assertion, args) {
        // Since we're intercepting all methods/properties, we need to just pass through if they don't want
        // `eventually`, or if we've already fulfilled the promise (see below).
        if (!utils.flag(assertion, "eventually")) {
            asserter.apply(assertion, args);
            return assertion;
        }

        const derivedPromise = getBasePromise(assertion).then(value => {
            // Set up the environment for the asserter to actually run: `_obj` should be the fulfillment value, and
            // now that we have the value, we're no longer in "eventually" mode, so we won't run any of this code,
            // just the base Chai code that we get to via the short-circuit above.
            assertion._obj = value;
            utils.flag(assertion, "eventually", false);

            return args ? module.exports.transformAsserterArgs(args) : args;
        }).then(newArgs => {
            asserter.apply(assertion, newArgs);

            // Because asserters, for example `property`, can change the value of `_obj` (i.e. change the "object"
            // flag), we need to communicate this value change to subsequent chained asserters. Since we build a
            // promise chain paralleling the asserter chain, we can use it to communicate such changes.
            return assertion._obj;
        });

        module.exports.transferPromiseness(assertion, derivedPromise);
        return assertion;
    }

    // ### Now use the `Assertion` framework to build an `assert` interface.
    const originalAssertMethods = Object.getOwnPropertyNames(assert$$1).filter(propName => {
        return typeof assert$$1[propName] === "function";
    });

    assert$$1.isFulfilled = (promise, message) => (new Assertion(promise, message)).to.be.fulfilled;

    assert$$1.isRejected = (promise, errorLike, errMsgMatcher, message) => {
        const assertion = new Assertion(promise, message);
        return assertion.to.be.rejectedWith(errorLike, errMsgMatcher, message);
    };

    assert$$1.becomes = (promise, value, message) => assert$$1.eventually.deepEqual(promise, value, message);

    assert$$1.doesNotBecome = (promise, value, message) => assert$$1.eventually.notDeepEqual(promise, value, message);

    assert$$1.eventually = {};
    originalAssertMethods.forEach(assertMethodName => {
        assert$$1.eventually[assertMethodName] = function (promise) {
            const otherArgs = Array.prototype.slice.call(arguments, 1);

            let customRejectionHandler;
            const message = arguments[assert$$1[assertMethodName].length - 1];
            if (typeof message === "string") {
                customRejectionHandler = reason => {
                    throw new chai.AssertionError(`${message}\n\nOriginal reason: ${utils.inspect(reason)}`);
                };
            }

            const returnedPromise = promise.then(
                fulfillmentValue => assert$$1[assertMethodName].apply(assert$$1, [fulfillmentValue].concat(otherArgs)),
                customRejectionHandler
            );

            returnedPromise.notify = done => {
                doNotify(returnedPromise, done);
            };

            return returnedPromise;
        };
    });
};

module.exports.transferPromiseness = (assertion, promise) => {
    assertion.then = promise.then.bind(promise);
};

module.exports.transformAsserterArgs = values => values;
});
var chaiAsPromised_1 = chaiAsPromised.transferPromiseness;
var chaiAsPromised_2 = chaiAsPromised.transformAsserterArgs;

/* @flow */
/*::

type DotenvParseOptions = {
  debug?: boolean
}

// keys and values from src
type DotenvParseOutput = { [string]: string }

type DotenvConfigOptions = {
  path?: string, // path to .env file
  encoding?: string, // encoding of .env file
  debug?: string // turn on logging for debugging purposes
}

type DotenvConfigOutput = {
  parsed?: DotenvParseOutput,
  error?: Error
}

*/




function log (message /*: string */) {
  console.log(`[dotenv][DEBUG] ${message}`);
}

// Parses src into an Object
function parse (src /*: string | Buffer */, options /*: ?DotenvParseOptions */) /*: DotenvParseOutput */ {
  const debug = Boolean(options && options.debug);
  const obj = {};

  // convert Buffers before splitting into lines and processing
  src.toString().split('\n').forEach(function (line, idx) {
    // matching "KEY' and 'VAL' in 'KEY=VAL'
    const keyValueArr = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    // matched?
    if (keyValueArr != null) {
      const key = keyValueArr[1];

      // default undefined or missing values to empty string
      let value = keyValueArr[2] || '';

      // expand newlines in quoted values
      const len = value ? value.length : 0;
      if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {
        value = value.replace(/\\n/gm, '\n');
      }

      // remove any surrounding quotes and extra spaces
      value = value.replace(/(^['"]|['"]$)/g, '').trim();

      obj[key] = value;
    } else if (debug) {
      log(`did not match key and value when parsing line ${idx + 1}: ${line}`);
    }
  });

  return obj
}

// Populates process.env from .env file
function config$1 (options /*: ?DotenvConfigOptions */) /*: DotenvConfigOutput */ {
  let dotenvPath = path.resolve(process.cwd(), '.env');
  let encoding /*: string */ = 'utf8';
  let debug = false;

  if (options) {
    if (options.path != null) {
      dotenvPath = options.path;
    }
    if (options.encoding != null) {
      encoding = options.encoding;
    }
    if (options.debug != null) {
      debug = true;
    }
  }

  try {
    // specifying an encoding returns a string instead of a buffer
    const parsed = parse(fs.readFileSync(dotenvPath, { encoding }), { debug });

    Object.keys(parsed).forEach(function (key) {
      if (!process.env.hasOwnProperty(key)) {
        process.env[key] = parsed[key];
      } else if (debug) {
        log(`"${key}" is already defined in \`process.env\` and will not be overwritten`);
      }
    });

    return { parsed }
  } catch (e) {
    return { error: e }
  }
}

var config_1$1 = config$1;
var load = config$1;
var parse_1 = parse;

var main = {
	config: config_1$1,
	load: load,
	parse: parse_1
};

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * Describes the methods on the EventData interface.
 * @module EventData
 */
var EventData;
(function (EventData) {
    /**
     * Converts the AMQP message to an EventData.
     * @param {AmqpMessage} msg The AMQP message that needs to be converted to EventData.
     */
    function fromAmqpMessage(msg) {
        const data = {
            body: msg.body,
            _raw_amqp_mesage: msg
        };
        if (msg.message_annotations) {
            data.annotations = msg.message_annotations;
            if (msg.message_annotations[amqpCommon.Constants.partitionKey] != undefined)
                data.partitionKey = msg.message_annotations[amqpCommon.Constants.partitionKey];
            if (msg.message_annotations[amqpCommon.Constants.sequenceNumber] != undefined)
                data.sequenceNumber = msg.message_annotations[amqpCommon.Constants.sequenceNumber];
            if (msg.message_annotations[amqpCommon.Constants.enqueuedTime] != undefined)
                data.enqueuedTimeUtc = new Date(msg.message_annotations[amqpCommon.Constants.enqueuedTime]);
            if (msg.message_annotations[amqpCommon.Constants.offset] != undefined)
                data.offset = msg.message_annotations[amqpCommon.Constants.offset];
        }
        // Since rhea expects message properties as top level properties we will look for them and unflatten them inside properties.
        for (const prop of rheaPromise.messageProperties) {
            if (msg[prop] != undefined) {
                if (!data.properties) {
                    data.properties = {};
                }
                data.properties[prop] = msg[prop];
            }
        }
        // Since rhea expects message headers as top level properties we will look for them and unflatten them inside header.
        for (const prop of rheaPromise.messageHeader) {
            if (msg[prop] != undefined) {
                if (!data.header) {
                    data.header = {};
                }
                data.header[prop] = msg[prop];
            }
        }
        if (msg.application_properties) {
            data.applicationProperties = msg.application_properties;
        }
        if (msg.delivery_annotations) {
            data.lastEnqueuedOffset = msg.delivery_annotations.last_enqueued_offset;
            data.lastSequenceNumber = msg.delivery_annotations.last_enqueued_sequence_number;
            data.lastEnqueuedTime = new Date(msg.delivery_annotations.last_enqueued_time_utc);
            data.retrievalTime = new Date(msg.delivery_annotations.runtime_info_retrieval_time_utc);
        }
        return data;
    }
    EventData.fromAmqpMessage = fromAmqpMessage;
    /**
     * Converts an EventData object to an AMQP message.
     * @param {EventData} data The EventData object that needs to be converted to an AMQP message.
     */
    function toAmqpMessage(data) {
        const msg = {
            body: data.body,
        };
        // As per the AMQP 1.0 spec If the message-annotations or delivery-annotations section is omitted,
        // it is equivalent to a message-annotations section containing anempty map of annotations.
        msg.message_annotations = {};
        msg.delivery_annotations = {};
        if (data.annotations) {
            msg.message_annotations = data.annotations;
        }
        if (data.properties) {
            // Set amqp message properties as top level properties, since rhea sends them as top level properties.
            for (const prop in data.properties) {
                msg[prop] = data.properties[prop];
            }
        }
        if (data.applicationProperties) {
            msg.application_properties = data.applicationProperties;
        }
        if (data.partitionKey != undefined) {
            msg.message_annotations[amqpCommon.Constants.partitionKey] = data.partitionKey;
            // Event Hub service cannot route messages to a specific partition based on the partition key
            // if AMQP message header is an empty object. Hence we make sure that header is always present
            // with atleast one property. Setting durable to true, helps us achieve that.
            msg.durable = true;
        }
        if (data.sequenceNumber != undefined) {
            msg.message_annotations[amqpCommon.Constants.sequenceNumber] = data.sequenceNumber;
        }
        if (data.enqueuedTimeUtc != undefined) {
            msg.message_annotations[amqpCommon.Constants.enqueuedTime] = data.enqueuedTimeUtc.getTime();
        }
        if (data.offset != undefined) {
            msg.message_annotations[amqpCommon.Constants.offset] = data.offset;
        }
        if (data.lastEnqueuedOffset != undefined) {
            msg.delivery_annotations.last_enqueued_offset = data.lastEnqueuedOffset;
        }
        if (data.lastSequenceNumber != undefined) {
            msg.delivery_annotations.last_enqueued_sequence_number = data.lastSequenceNumber;
        }
        if (data.lastEnqueuedTime != undefined) {
            msg.delivery_annotations.last_enqueued_time_utc = data.lastEnqueuedTime.getTime();
        }
        if (data.retrievalTime != undefined) {
            msg.delivery_annotations.runtime_info_retrieval_time_utc = data.retrievalTime.getTime();
        }
        if (data.header) {
            // Set amqp message header as top level properties, since rhea expects them as top level properties.
            for (const prop in data.header) {
                msg[prop] = data.header[prop];
            }
        }
        return msg;
    }
    EventData.toAmqpMessage = toAmqpMessage;
})(EventData || (EventData = {}));

// Unique ID creation requires a high quality random # generator.  In node.js
// this is pretty straight-forward - we use the crypto API.



var rng = function nodeRNG() {
  return crypto.randomBytes(16);
};

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([bth[buf[i++]], bth[buf[i++]], 
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]],
	bth[buf[i++]], bth[buf[i++]],
	bth[buf[i++]], bth[buf[i++]]]).join('');
}

var bytesToUuid_1 = bytesToUuid;

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid_1(rnds);
}

var v4_1 = v4;

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * @ignore
 * log statements for error
 */
const error = debugModule("azure:event-hubs:error");
/**
 * @ignore
 * log statements for management
 */
const mgmt = debugModule("azure:event-hubs:management");
/**
 * @ignore
 * log statements for sender
 */
const sender = debugModule("azure:event-hubs:sender");
/**
 * @ignore
 * log statements for receiver
 */
const receiver = debugModule("azure:event-hubs:receiver");
/**
 * @ignore
 * log statements for receiverbatching
 */
const batching = debugModule("azure:event-hubs:receiverbatching");
/**
 * @ignore
 * log statements for receiverstreaming
 */
const streaming = debugModule("azure:event-hubs:receiverstreaming");
/**
 * @ignore
 * log statements for linkEntity
 */
const link = debugModule("azure:event-hubs:linkEntity");
/**
 * @ignore
 * log statements for connectionContext
 */
const context = debugModule("azure:event-hubs:connectionContext");
/**
 * @ignore
 * log statements for client
 */
const client = debugModule("azure:event-hubs:client");
/**
 * @ignore
 * log statements for iothub client
 */
const iotClient = debugModule("azure:event-hubs:iothubClient");

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * Describes the base class for entities like EventHub Sender, Receiver and Management link.
 * @ignore
 * @class LinkEntity
 */
class LinkEntity {
    /**
     * Creates a new LinkEntity instance.
     * @ignore
     * @constructor
     * @param {ConnectionContext} context The connection context.
     * @param {LinkEntityOptions} [options] Options that can be provided while creating the LinkEntity.
     */
    constructor(context$$1, options) {
        /**
         * @property {boolean} isConnecting Indicates whether the link is in the process of connecting
         * (establishing) itself. Default value: `false`.
         */
        this.isConnecting = false;
        if (!options)
            options = {};
        this._context = context$$1;
        this.address = options.address || "";
        this.audience = options.audience || "";
        this.name = options.name || v4_1();
        this.partitionId = options.partitionId;
    }
    /**
     * Negotiates cbs claim for the LinkEntity.
     * @ignore
     * @protected
     * @param {boolean} [setTokenRenewal] Set the token renewal timer. Default false.
     * @return {Promise<void>} Promise<void>
     */
    _negotiateClaim(setTokenRenewal) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Acquire the lock and establish a cbs session if it does not exist on the connection.
            // Although node.js is single threaded, we need a locking mechanism to ensure that a
            // race condition does not happen while creating a shared resource (in this case the
            // cbs session, since we want to have exactly 1 cbs session per connection).
            link("[%s] Acquiring cbs lock: '%s' for creating the cbs session while creating the %s: " +
                "'%s' with address: '%s'.", this._context.connectionId, this._context.cbsSession.cbsLock, this._type, this.name, this.address);
            yield amqpCommon.defaultLock.acquire(this._context.cbsSession.cbsLock, () => { return this._context.cbsSession.init(); });
            const tokenObject = yield this._context.tokenProvider.getToken(this.audience);
            link("[%s] %s: calling negotiateClaim for audience '%s'.", this._context.connectionId, this._type, this.audience);
            // Acquire the lock to negotiate the CBS claim.
            link("[%s] Acquiring cbs lock: '%s' for cbs auth for %s: '%s' with address '%s'.", this._context.connectionId, this._context.negotiateClaimLock, this._type, this.name, this.address);
            yield amqpCommon.defaultLock.acquire(this._context.negotiateClaimLock, () => {
                return this._context.cbsSession.negotiateClaim(this.audience, tokenObject);
            });
            link("[%s] Negotiated claim for %s '%s' with with address: %s", this._context.connectionId, this._type, this.name, this.address);
            if (setTokenRenewal) {
                yield this._ensureTokenRenewal();
            }
        });
    }
    /**
     * Ensures that the token is renewed within the predefined renewal margin.
     * @ignore
     * @protected
     * @returns {void}
     */
    _ensureTokenRenewal() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const tokenValidTimeInSeconds = this._context.tokenProvider.tokenValidTimeInSeconds;
            const tokenRenewalMarginInSeconds = this._context.tokenProvider.tokenRenewalMarginInSeconds;
            const nextRenewalTimeout = (tokenValidTimeInSeconds - tokenRenewalMarginInSeconds) * 1000;
            this._tokenRenewalTimer = setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    yield this._negotiateClaim(true);
                }
                catch (err) {
                    error("[%s] %s '%s' with address %s, an error occurred while renewing the token: %O", this._context.connectionId, this._type, this.name, this.address, err);
                }
            }), nextRenewalTimeout);
            link("[%s] %s '%s' with address %s, has next token renewal in %d seconds @(%s).", this._context.connectionId, this._type, this.name, this.address, nextRenewalTimeout / 1000, new Date(Date.now() + nextRenewalTimeout).toString());
        });
    }
    /**
     * Closes the Sender|Receiver link and it's underlying session and also removes it from the
     * internal map.
     * @ignore
     * @param {Sender | Receiver} [link] The Sender or Receiver link that needs to be closed and
     * removed.
     */
    _closeLink(link$$1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            clearTimeout(this._tokenRenewalTimer);
            if (link$$1) {
                try {
                    // This should take care of closing the link and it's underlying session. This should also
                    // remove them from the internal map.
                    yield link$$1.close();
                    link("[%s] %s '%s' with address '%s' closed.", this._context.connectionId, this._type, this.name, this.address);
                }
                catch (err) {
                    error("[%s] An error occurred while closing the %s '%s' with address '%s': %O", this._context.connectionId, this._type, this.name, this.address, err);
                }
            }
        });
    }
    /**
     * Provides the current type of the LinkEntity.
     * @return {string} The entity type.
     */
    get _type() {
        let result = "LinkEntity";
        if (this.constructor && this.constructor.name) {
            result = this.constructor.name;
        }
        return result;
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * Represents options can be set during the creation of a event hub receiver.
 * Defines a position of an @link~EventData in the event hub partition.
 * @class EventPosition
 */
class EventPosition {
    constructor(options) {
        /**
         * @property {boolean} isInclusive Indicates if the current event at the specified offset is
         * included or not. It is only applicable if offset is set. Default value: false.
         */
        this.isInclusive = false;
        if (options) {
            this.offset = options.offset;
            this.enqueuedTime = options.enqueuedTime;
            this.sequenceNumber = options.sequenceNumber;
            this.isInclusive = options.isInclusive || false;
            this.customFilter = options.customFilter;
        }
    }
    /**
     * Gets the expression (filter clause) that needs to be set on the source.
     * @return {string} filterExpression
     */
    getExpression() {
        let result;
        // order of preference
        if (this.offset != undefined) {
            result = this.isInclusive ?
                `${amqpCommon.Constants.offsetAnnotation} >= '${this.offset}'` :
                `${amqpCommon.Constants.offsetAnnotation} > '${this.offset}'`;
        }
        else if (this.sequenceNumber != undefined) {
            result = this.isInclusive ?
                `${amqpCommon.Constants.sequenceNumberAnnotation} >= '${this.sequenceNumber}'` :
                `${amqpCommon.Constants.sequenceNumberAnnotation} > '${this.sequenceNumber}'`;
        }
        else if (this.enqueuedTime != undefined) {
            const time = (this.enqueuedTime instanceof Date) ? this.enqueuedTime.getTime() : this.enqueuedTime;
            result = `${amqpCommon.Constants.enqueuedTimeAnnotation} > '${time}'`;
        }
        else if (this.customFilter != undefined) {
            result = this.customFilter;
        }
        if (!result) {
            throw amqpCommon.translate({
                condition: amqpCommon.ErrorNameConditionMapper.ArgumentError,
                description: "No starting position was set in the EventPosition."
            });
        }
        return result;
    }
    /**
     * Creates a position at the given offset.
     * @param {string} offset The offset of the data relative to the Event Hub partition stream.
     * The offset is a marker or identifier for an event within the Event Hubs stream.
     * The identifier is unique within a partition of the Event Hubs stream.
     * @param {boolean} isInclusive If true, the specified event is included;
     * otherwise the next event is returned. Default: false.
     * @return {EventPosition} EventPosition
     */
    static fromOffset(offset, isInclusive) {
        if (!offset || typeof offset !== "string") {
            throw new Error("'offset' is a required parameter and must be a non-empty string.");
        }
        return new EventPosition({ offset: offset, isInclusive: isInclusive });
    }
    /**
     * Creates a position at the given sequence number.
     * @param {number} sequenceNumber The logical sequence number of the event within the partition stream of the Event Hub.
     * @param {boolean} isInclusive If true, the specified event is included;
     * otherwise the next event is returned. Default false.
     * @return {EventPosition} EventPosition
     */
    static fromSequenceNumber(sequenceNumber, isInclusive) {
        if (sequenceNumber == undefined || typeof sequenceNumber !== "number") {
            throw new Error("'sequenceNumber' is a required parameter and must be of type 'number'.");
        }
        return new EventPosition({ sequenceNumber: sequenceNumber, isInclusive: isInclusive });
    }
    /**
     * Creates a position at the given enqueued time.
     * @param {Date | number} enqueuedTime The enqueue time. This value represents the actual time of enqueuing the message.
     * @param {boolean} isInclusive If true, the specified event is included; otherwise the next event is returned.
     * @return {EventPosition} EventPosition
     */
    static fromEnqueuedTime(enqueuedTime) {
        if (enqueuedTime == undefined || (typeof enqueuedTime !== "number" && !(enqueuedTime instanceof Date))) {
            throw new Error("'enqueuedTime' is a required parameter and must be an instance of 'Date' or of type 'number'.");
        }
        return new EventPosition({ enqueuedTime: enqueuedTime });
    }
    /**
     * Creates a position based on the given custom filter.
     * @param {string} customFilter The cutom filter expression that needs to be applied on the receiver. This should be used
     * only when one of the other methods `fromOffset()`, `fromSequenceNumber()`, `fromEnqueuedTime()` is not applicable for
     * your scenario.
     */
    static withCustomFilter(customFilter) {
        if (!customFilter || typeof customFilter !== "string") {
            throw new Error("'customFilter' is a required parameter and must be a non-empty string.");
        }
        return new EventPosition({ customFilter: customFilter });
    }
    /**
     * Returns the position for the start of a stream. Provide this position in receiver creation to
     * start receiving from the first available event in the partition.
     * @return {EventPosition} EventPosition
     */
    static fromStart() {
        return EventPosition.fromOffset(EventPosition.startOfStream);
    }
    /**
     * Returns the position for the end of a stream. Provide this position in receiver creation to
     * start receiving from the next available event in the partition after the receiver is created.
     * @return {EventPosition} EventPosition
     */
    static fromEnd() {
        return EventPosition.fromOffset(EventPosition.endOfStream);
    }
}
/**
 * @property {string} startOfStream The offset from which events would be received: `"-1"`.
 * @static
 * @readonly
 */
EventPosition.startOfStream = "-1";
/**
 * @property {string} endOfStream The offset from which events would be received: `"@latest"`.
 * @static
 * @readonly
 */
EventPosition.endOfStream = "@latest";

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * Describes the EventHubReceiver that will receive event data from EventHub.
 * @class EventHubReceiver
 * @ignore
 */
class EventHubReceiver extends LinkEntity {
    /**
     * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
     * @ignore
     * @constructor
     * @param {EventHubClient} client                            The EventHub client.
     * @param {string} partitionId                               Partition ID from which to receive.
     * @param {ReceiveOptions} [options]                         Receiver options.
     */
    constructor(context$$1, partitionId, options) {
        super(context$$1, { partitionId: partitionId, name: options ? options.name : undefined });
        /**
         * @property {number} [prefetchCount] The number of messages that the receiver can fetch/receive
         * initially. Defaults to 1000.
         */
        this.prefetchCount = amqpCommon.Constants.defaultPrefetchCount;
        /**
         * @property {boolean} receiverRuntimeMetricEnabled Indicates whether receiver runtime metric
         * is enabled. Default: false.
         */
        this.receiverRuntimeMetricEnabled = false;
        if (!options)
            options = {};
        this.consumerGroup = options.consumerGroup ? options.consumerGroup : amqpCommon.Constants.defaultConsumerGroup;
        this.address = context$$1.config.getReceiverAddress(partitionId, this.consumerGroup);
        this.audience = context$$1.config.getReceiverAudience(partitionId, this.consumerGroup);
        this.prefetchCount = options.prefetchCount != undefined ? options.prefetchCount : amqpCommon.Constants.defaultPrefetchCount;
        this.epoch = options.epoch;
        this.identifier = options.identifier;
        this.options = options;
        this.receiverRuntimeMetricEnabled = options.enableReceiverRuntimeMetric || false;
        this.runtimeInfo = {
            partitionId: `${partitionId}`
        };
        this._checkpoint = {
            enqueuedTimeUtc: new Date(),
            offset: "0",
            sequenceNumber: -1
        };
        this._onAmqpMessage = (context$$1) => {
            const evData = EventData.fromAmqpMessage(context$$1.message);
            evData.body = this._context.dataTransformer.decode(context$$1.message.body);
            this._checkpoint = {
                enqueuedTimeUtc: evData.enqueuedTimeUtc,
                offset: evData.offset,
                sequenceNumber: evData.sequenceNumber
            };
            if (this.receiverRuntimeMetricEnabled && evData) {
                this.runtimeInfo.lastSequenceNumber = evData.lastSequenceNumber;
                this.runtimeInfo.lastEnqueuedTimeUtc = evData.lastEnqueuedTime;
                this.runtimeInfo.lastEnqueuedOffset = evData.lastEnqueuedOffset;
                this.runtimeInfo.retrievalTime = evData.retrievalTime;
                receiver("[%s] RuntimeInfo of Receiver '%s' is %O", this._context.connectionId, this.name, this.runtimeInfo);
            }
            this._onMessage(evData);
        };
        this._onAmqpError = (context$$1) => {
            const receiver$$1 = this._receiver || context$$1.receiver;
            const receiverError = context$$1.receiver && context$$1.receiver.error;
            if (receiverError) {
                const ehError = amqpCommon.translate(receiverError);
                error("[%s] An error occurred for Receiver '%s': %O.", this._context.connectionId, this.name, ehError);
                if (!ehError.retryable) {
                    if (receiver$$1 && !receiver$$1.isItselfClosed()) {
                        error("[%s] Since the user did not close the receiver and the error is not " +
                            "retryable, we let the user know about it by calling the user's error handler.", this._context.connectionId);
                        this._onError(ehError);
                    }
                    else {
                        error("[%s] The received error is not retryable. However, the receiver was " +
                            "closed by the user. Hence not notifying the user's error handler.", this._context.connectionId);
                    }
                }
                else {
                    error("[%s] Since received error is retryable, we will NOT notify the user's " +
                        "error handler.", this._context.connectionId);
                }
            }
        };
        this._onSessionError = (context$$1) => {
            const receiver$$1 = this._receiver || context$$1.receiver;
            const sessionError = context$$1.session && context$$1.session.error;
            if (sessionError) {
                const ehError = amqpCommon.translate(sessionError);
                error("[%s] An error occurred on the session for Receiver '%s': %O.", this._context.connectionId, this.name, ehError);
                if (receiver$$1 && !receiver$$1.isSessionItselfClosed() && !ehError.retryable) {
                    error("[%s] Since the user did not close the receiver and the session error is not " +
                        "retryable, we let the user know about it by calling the user's error handler.", this._context.connectionId);
                    this._onError(ehError);
                }
            }
        };
        this._onAmqpClose = (context$$1) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const receiverError = context$$1.receiver && context$$1.receiver.error;
            const receiver$$1 = this._receiver || context$$1.receiver;
            if (receiverError) {
                error("[%s] 'receiver_close' event occurred for receiver '%s' with address '%s'. " +
                    "The associated error is: %O", this._context.connectionId, this.name, this.address, receiverError);
            }
            if (receiver$$1 && !receiver$$1.isItselfClosed()) {
                if (!this.isConnecting) {
                    error("[%s] 'receiver_close' event occurred on the receiver '%s' with address '%s' " +
                        "and the sdk did not initiate this. The receiver is not reconnecting. Hence, calling " +
                        "detached from the _onAmqpClose() handler.", this._context.connectionId, this.name, this.address);
                    yield this.detached(receiverError);
                }
                else {
                    error("[%s] 'receiver_close' event occurred on the receiver '%s' with address '%s' " +
                        "and the sdk did not initate this. Moreover the receiver is already re-connecting. " +
                        "Hence not calling detached from the _onAmqpClose() handler.", this._context.connectionId, this.name, this.address);
                }
            }
            else {
                error("[%s] 'receiver_close' event occurred on the receiver '%s' with address '%s' " +
                    "because the sdk initiated it. Hence not calling detached from the _onAmqpClose" +
                    "() handler.", this._context.connectionId, this.name, this.address);
            }
        });
        this._onSessionClose = (context$$1) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const receiver$$1 = this._receiver || context$$1.receiver;
            const sessionError = context$$1.session && context$$1.session.error;
            if (sessionError) {
                error("[%s] 'session_close' event occurred for receiver '%s' with address '%s'. " +
                    "The associated error is: %O", this._context.connectionId, this.name, this.address, sessionError);
            }
            if (receiver$$1 && !receiver$$1.isSessionItselfClosed()) {
                if (!this.isConnecting) {
                    error("[%s] 'session_close' event occurred on the session of receiver '%s' with " +
                        "address '%s' and the sdk did not initiate this. Hence calling detached from the " +
                        "_onSessionClose() handler.", this._context.connectionId, this.name, this.address);
                    yield this.detached(sessionError);
                }
                else {
                    error("[%s] 'session_close' event occurred on the session of receiver '%s' with " +
                        "address '%s' and the sdk did not initiate this. Moreover the receiver is already " +
                        "re-connecting. Hence not calling detached from the _onSessionClose() handler.", this._context.connectionId, this.name, this.address);
                }
            }
            else {
                error("[%s] 'session_close' event occurred on the session of receiver '%s' with address " +
                    "'%s' because the sdk initiated it. Hence not calling detached from the _onSessionClose" +
                    "() handler.", this._context.connectionId, this.name, this.address);
            }
        });
    }
    /**
     * Will reconnect the receiver link if necessary.
     * @ignore
     * @param {AmqpError | Error} [receiverError] The receiver error if any.
     * @returns {Promise<void>} Promise<void>.
     */
    detached(receiverError) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const wasCloseInitiated = this._receiver && this._receiver.isItselfClosed();
                // Clears the token renewal timer. Closes the link and its session if they are open.
                // Removes the link and its session if they are present in rhea's cache.
                yield this._closeLink(this._receiver);
                // We should attempt to reopen only when the receiver(sdk) did not initiate the close
                let shouldReopen = false;
                if (receiverError && !wasCloseInitiated) {
                    const translatedError = amqpCommon.translate(receiverError);
                    if (translatedError.retryable) {
                        shouldReopen = true;
                        error("[%s] close() method of Receiver '%s' with address '%s' was not called. There " +
                            "was an accompanying error and it is retryable. This is a candidate for re-establishing " +
                            "the receiver link.", this._context.connectionId, this.name, this.address);
                    }
                    else {
                        error("[%s] close() method of Receiver '%s' with address '%s' was not called. There " +
                            "was an accompanying error and it is NOT retryable. Hence NOT re-establishing " +
                            "the receiver link.", this._context.connectionId, this.name, this.address);
                    }
                }
                else if (!wasCloseInitiated) {
                    shouldReopen = true;
                    error("[%s] close() method of Receiver '%s' with address '%s' was not called. " +
                        "There was no accompanying error as well. This is a candidate for re-establishing " +
                        "the receiver link.", this._context.connectionId, this.name, this.address);
                }
                else {
                    const state = {
                        wasCloseInitiated: wasCloseInitiated,
                        receiverError: receiverError,
                        _receiver: this._receiver
                    };
                    error("[%s] Something is busted. State of Receiver '%s' with address '%s' is: %O", this._context.connectionId, this.name, this.address, state);
                }
                if (shouldReopen) {
                    const rcvrOptions = {
                        onMessage: this._onAmqpMessage,
                        onError: this._onAmqpError,
                        onClose: this._onAmqpClose,
                        onSessionError: this._onSessionError,
                        onSessionClose: this._onSessionClose,
                        newName: true // provide a new name to the link while re-connecting it. This ensures that
                        // the service does not send an error stating that the link is still open.
                    };
                    // reconnect the receiver link with sequenceNumber of the last received message as the offset
                    // if messages were received by the receiver before it got disconnected.
                    if (this._checkpoint.sequenceNumber > -1) {
                        rcvrOptions.eventPosition = EventPosition.fromSequenceNumber(this._checkpoint.sequenceNumber);
                    }
                    const options = this._createReceiverOptions(rcvrOptions);
                    // shall retry forever at an interval of 15 seconds if the error is a retryable error
                    // else bail out when the error is not retryable or the oepration succeeds.
                    const config = {
                        operation: () => this._init(options),
                        connectionId: this._context.connectionId,
                        operationType: amqpCommon.RetryOperationType.receiverLink,
                        times: amqpCommon.Constants.defaultConnectionRetryAttempts,
                        delayInSeconds: 15
                    };
                    yield amqpCommon.retry(config);
                }
            }
            catch (err) {
                error("[%s] An error occurred while processing detached() of Receiver '%s' with address " +
                    "'%s': %O", this._context.connectionId, this.name, this.address, err);
            }
        });
    }
    /**
     * Closes the underlying AMQP receiver.
     * @ignore
     * @returns {Promise<void>}
     */
    close() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._receiver) {
                const receiverLink = this._receiver;
                this._deleteFromCache();
                yield this._closeLink(receiverLink);
            }
        });
    }
    /**
     * Determines whether the AMQP receiver link is open. If open then returns true else returns false.
     * @ignore
     * @return {boolean} boolean
     */
    isOpen() {
        const result = this._receiver && this._receiver.isOpen();
        error("[%s] Receiver '%s' with address '%s' is open? -> %s", this._context.connectionId, this.name, this.address, result);
        return result;
    }
    _deleteFromCache() {
        this._receiver = undefined;
        delete this._context.receivers[this.name];
        error("[%s] Deleted the receiver '%s' from the client cache.", this._context.connectionId, this.name);
    }
    /**
     * Creates a new AMQP receiver under a new AMQP session.
     * @ignore
     * @returns {Promise<void>}
     */
    _init(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isOpen() && !this.isConnecting) {
                    error("[%s] The receiver '%s' with address '%s' is not open and is not currently " +
                        "establishing itself. Hence let's try to connect.", this._context.connectionId, this.name, this.address);
                    this.isConnecting = true;
                    yield this._negotiateClaim();
                    if (!options) {
                        options = this._createReceiverOptions({
                            onMessage: this._onAmqpMessage,
                            onError: this._onAmqpError,
                            onClose: this._onAmqpClose,
                            onSessionError: this._onSessionError,
                            onSessionClose: this._onSessionClose,
                        });
                    }
                    error("[%s] Trying to create receiver '%s' with options %O", this._context.connectionId, this.name, options);
                    this._receiver = yield this._context.connection.createReceiver(options);
                    this.isConnecting = false;
                    error("[%s] Receiver '%s' with address '%s' has established itself.", this._context.connectionId, this.name, this.address);
                    receiver("Promise to create the receiver resolved. Created receiver with name: ", this.name);
                    receiver("[%s] Receiver '%s' created with receiver options: %O", this._context.connectionId, this.name, options);
                    // It is possible for someone to close the receiver and then start it again.
                    // Thus make sure that the receiver is present in the client cache.
                    if (!this._context.receivers[this.name])
                        this._context.receivers[this.name] = this;
                    yield this._ensureTokenRenewal();
                }
                else {
                    error("[%s] The receiver '%s' with address '%s' is open -> %s and is connecting " +
                        "-> %s. Hence not reconnecting.", this._context.connectionId, this.name, this.address, this.isOpen(), this.isConnecting);
                }
            }
            catch (err) {
                this.isConnecting = false;
                err = amqpCommon.translate(err);
                error("[%s] An error occured while creating the receiver '%s': %O", this._context.connectionId, this.name, err);
                throw err;
            }
        });
    }
    /**
     * Creates the options that need to be specified while creating an AMQP receiver link.
     * @ignore
     */
    _createReceiverOptions(options) {
        if (options.newName)
            this.name = `${v4_1()}`;
        const rcvrOptions = {
            name: this.name,
            autoaccept: true,
            source: {
                address: this.address
            },
            credit_window: this.prefetchCount,
            onMessage: options.onMessage || this._onAmqpMessage,
            onError: options.onError || this._onAmqpError,
            onClose: options.onClose || this._onAmqpClose,
            onSessionError: options.onSessionError || this._onSessionError,
            onSessionClose: options.onSessionClose || this._onSessionClose
        };
        if (this.epoch !== undefined && this.epoch !== null) {
            if (!rcvrOptions.properties)
                rcvrOptions.properties = {};
            rcvrOptions.properties[amqpCommon.Constants.attachEpoch] = rheaPromise.types.wrap_long(this.epoch);
        }
        if (this.identifier) {
            if (!rcvrOptions.properties)
                rcvrOptions.properties = {};
            rcvrOptions.properties[amqpCommon.Constants.receiverIdentifierName] = this.identifier;
        }
        if (this.receiverRuntimeMetricEnabled) {
            rcvrOptions.desired_capabilities = amqpCommon.Constants.enableReceiverRuntimeMetricName;
        }
        const eventPosition = options.eventPosition || this.options.eventPosition;
        if (eventPosition) {
            // Set filter on the receiver if event position is specified.
            const filterClause = eventPosition.getExpression();
            if (filterClause) {
                rcvrOptions.source.filter = {
                    "apache.org:selector-filter:string": rheaPromise.types.wrap_described(filterClause, 0x468C00000004)
                };
            }
        }
        return rcvrOptions;
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * Describes the receive handler object that is returned from the receive() method with handlers is
 * called. The ReceiveHandler is used to stop receiving more messages.
 * @class ReceiveHandler
 */
class ReceiveHandler {
    /**
     * Creates an instance of the ReceiveHandler.
     * @constructor
     * @param {EventHubReceiver} receiver The underlying EventHubReceiver.
     */
    constructor(receiver$$1) {
        this._receiver = receiver$$1;
        this.name = receiver$$1 ? receiver$$1.name : "ReceiveHandler";
    }
    /**
     * @property {string | number} [partitionId] The partitionId from which the handler is receiving
     * events from.
     * @readonly
     */
    get partitionId() {
        return this._receiver ? this._receiver.partitionId : undefined;
    }
    /**
     * @property {string} [consumerGroup] The consumer group from which the handler is receiving
     * events from.
     * @readonly
     */
    get consumerGroup() {
        return this._receiver ? this._receiver.consumerGroup : undefined;
    }
    /**
     * @property {string} [address] The address of the underlying receiver.
     * @readonly
     */
    get address() {
        return this._receiver ? this._receiver.address : undefined;
    }
    /**
     * @property {number} [epoch] The epoch value of the underlying receiver, if present.
     * @readonly
     */
    get epoch() {
        return this._receiver ? this._receiver.epoch : undefined;
    }
    /**
     * @property {string} [identifier] The identifier of the underlying receiver, if present.
     * @readonly
     */
    get identifier() {
        return this._receiver ? this._receiver.identifier : undefined;
    }
    /**
     * @property {ReceiverRuntimeInfo} [runtimeInfo] The receiver runtime info. This property will only
     * be enabled when `enableReceiverRuntimeMetric` option is set to true in the
     * `client.receive()` method.
     * @readonly
     */
    get runtimeInfo() {
        return this._receiver ? this._receiver.runtimeInfo : undefined;
    }
    /**
     * @property {boolean} isReceiverOpen Indicates whether the receiver is connected/open.
     * `true` - is open; `false` otherwise.
     * @readonly
     */
    get isReceiverOpen() {
        return this._receiver ? this._receiver.isOpen() : false;
    }
    /**
     * Stops the underlying EventHubReceiver from receiving more messages.
     * @return {Promise<void>} Promise<void>
     */
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._receiver) {
                try {
                    yield this._receiver.close();
                }
                catch (err) {
                    error("An error occurred while stopping the receiver '%s' with address '%s': %O", this._receiver.name, this._receiver.address, err);
                }
            }
        });
    }
}
/**
 * Describes the streaming receiver where the user can receive the message
 * by providing handler functions.
 * @ignore
 * @class StreamingReceiver
 * @extends EventHubReceiver
 */
class StreamingReceiver extends EventHubReceiver {
    /**
     * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
     * @ignore
     * @constructor
     * @param {EventHubClient} client          The EventHub client.
     * @param {string} partitionId             Partition ID from which to receive.
     * @param {ReceiveOptions} [options]       Options for how you'd like to connect.
     */
    constructor(context$$1, partitionId, options) {
        super(context$$1, partitionId, options);
        this.receiveHandler = new ReceiveHandler(this);
    }
    /**
     * Starts the receiver by establishing an AMQP session and an AMQP receiver link on the session.
     * @ignore
     * @param {OnMessage} onMessage The message handler to receive event data objects.
     * @param {OnError} onError The error handler to receive an error that occurs while receivin messages.
     */
    receive(onMessage, onError) {
        if (!onMessage || typeof onMessage !== "function") {
            throw new Error("'onMessage' is a required parameter and must be of type 'function'.");
        }
        if (!onError || typeof onError !== "function") {
            throw new Error("'onError' is a required parameter and must be of type 'function'.");
        }
        this._onMessage = onMessage;
        this._onError = onError;
        if (!this.isOpen()) {
            this._init().catch((err) => {
                this._onError(err);
            });
        }
        else {
            // It is possible that the receiver link has been established due to a previous receive() call. If that
            // is the case then add message and error event handlers to the receiver. When the receiver will be closed
            // these handlers will be automatically removed.
            streaming("[%s] Receiver link is already present for '%s' due to previous receive() calls. " +
                "Hence reusing it and attaching message and error handlers.", this._context.connectionId, this.name);
            this._receiver.on(rheaPromise.ReceiverEvents.message, this._onAmqpMessage);
            this._receiver.on(rheaPromise.ReceiverEvents.receiverError, this._onAmqpError);
            this._receiver.setCreditWindow(amqpCommon.Constants.defaultPrefetchCount);
            this._receiver.addCredit(amqpCommon.Constants.defaultPrefetchCount);
            streaming("[%s] Receiver '%s', set the prefetch count to 1000 and " +
                "providing a credit of the same amount.", this._context.connectionId, this.name);
        }
        return this.receiveHandler;
    }
    /**
     * Creates a streaming receiver.
     * @static
     * @ignore
     * @param {ConnectionContext} context    The connection context.
     * @param {string | number} partitionId  The partitionId to receive events from.
     * @param {ReceiveOptions} [options]     Receive options.
     */
    static create(context$$1, partitionId, options) {
        const sReceiver = new StreamingReceiver(context$$1, partitionId, options);
        context$$1.receivers[sReceiver.name] = sReceiver;
        return sReceiver;
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const packageJsonInfo = {
    name: "@azure/event-hubs",
    version: "1.0.5"
};

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * @class ManagementClient
 * @ignore
 * Descibes the EventHubs Management Client that talks
 * to the $management endpoint over AMQP connection.
 */
class ManagementClient extends LinkEntity {
    /**
     * Instantiates the management client.
     * @constructor
     * @ignore
     * @param {BaseConnectionContext} context The connection context.
     * @param {string} [address] The address for the management endpoint. For IotHub it will be
     * `/messages/events/$management`.
     */
    constructor(context$$1, options) {
        super(context$$1, {
            address: options && options.address ? options.address : amqpCommon.Constants.management,
            audience: options && options.audience
                ? options.audience
                : context$$1.config.getManagementAudience()
        });
        this.managementLock = `${amqpCommon.Constants.managementRequestKey}-${v4_1()}`;
        /**
         * @property {string} replyTo The reply to Guid for the management client.
         */
        this.replyTo = v4_1();
        this._context = context$$1;
        this.entityPath = context$$1.config.entityPath;
    }
    /**
     * Provides the eventhub runtime information.
     * @ignore
     * @param {Connection} connection - The established amqp connection
     * @returns {Promise<EventHubRuntimeInformation>}
     */
    getHubRuntimeInformation() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const info = yield this._makeManagementRequest(amqpCommon.Constants.eventHub);
            const runtimeInfo = {
                path: info.name,
                createdAt: new Date(info.created_at),
                partitionCount: info.partition_count,
                partitionIds: info.partition_ids,
                type: info.type
            };
            mgmt("[%s] The hub runtime info is: %O", this._context.connectionId, runtimeInfo);
            return runtimeInfo;
        });
    }
    /**
     * Provides an array of partitionIds.
     * @ignore
     * @param {Connection} connection - The established amqp connection
     * @returns {Promise<Array<string>>}
     */
    getPartitionIds() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const runtimeInfo = yield this.getHubRuntimeInformation();
            return runtimeInfo.partitionIds;
        });
    }
    /**
     * Provides information about the specified partition.
     * @ignore
     * @param {Connection} connection - The established amqp connection
     * @param {(string|number)} partitionId Partition ID for which partition information is required.
     */
    getPartitionInformation(partitionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (typeof partitionId !== "string" && typeof partitionId !== "number") {
                throw new Error("'partitionId' is a required parameter and must be of " +
                    "type: 'string' | 'number'.");
            }
            const info = yield this._makeManagementRequest(amqpCommon.Constants.partition, partitionId);
            const partitionInfo = {
                beginningSequenceNumber: info.begin_sequence_number,
                hubPath: info.name,
                lastEnqueuedOffset: info.last_enqueued_offset,
                lastEnqueuedTimeUtc: new Date(info.last_enqueued_time_utc),
                lastSequenceNumber: info.last_enqueued_sequence_number,
                partitionId: info.partition,
                type: info.type
            };
            mgmt("[%s] The partition info is: %O.", this._context.connectionId, partitionInfo);
            return partitionInfo;
        });
    }
    /**
     * Closes the AMQP management session to the Event Hub for this client,
     * returning a promise that will be resolved when disconnection is completed.
     * @ignore
     * @return {Promise<void>}
     */
    close() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                if (this._isMgmtRequestResponseLinkOpen()) {
                    const mgmtLink = this._mgmtReqResLink;
                    this._mgmtReqResLink = undefined;
                    clearTimeout(this._tokenRenewalTimer);
                    yield mgmtLink.close();
                    mgmt("Successfully closed the management session.");
                }
            }
            catch (err) {
                const msg = `An error occurred while closing the management session: ${err}`;
                error(msg);
                throw new Error(msg);
            }
        });
    }
    _init() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                if (!this._isMgmtRequestResponseLinkOpen()) {
                    yield this._negotiateClaim();
                    const rxopt = {
                        source: { address: this.address },
                        name: this.replyTo,
                        target: { address: this.replyTo },
                        onSessionError: (context$$1) => {
                            const id = context$$1.connection.options.id;
                            const ehError = amqpCommon.translate(context$$1.session.error);
                            error("[%s] An error occurred on the session for request/response links for " +
                                "$management: %O", id, ehError);
                        }
                    };
                    const sropt = { target: { address: this.address } };
                    mgmt("[%s] Creating sender/receiver links on a session for $management endpoint with " +
                        "srOpts: %o, receiverOpts: %O.", this._context.connectionId, sropt, rxopt);
                    this._mgmtReqResLink =
                        yield amqpCommon.RequestResponseLink.create(this._context.connection, sropt, rxopt);
                    this._mgmtReqResLink.sender.on(rheaPromise.SenderEvents.senderError, (context$$1) => {
                        const id = context$$1.connection.options.id;
                        const ehError = amqpCommon.translate(context$$1.sender.error);
                        error("[%s] An error occurred on the $management sender link.. %O", id, ehError);
                    });
                    this._mgmtReqResLink.receiver.on(rheaPromise.ReceiverEvents.receiverError, (context$$1) => {
                        const id = context$$1.connection.options.id;
                        const ehError = amqpCommon.translate(context$$1.receiver.error);
                        error("[%s] An error occurred on the $management receiver link.. %O", id, ehError);
                    });
                    mgmt("[%s] Created sender '%s' and receiver '%s' links for $management endpoint.", this._context.connectionId, this._mgmtReqResLink.sender.name, this._mgmtReqResLink.receiver.name);
                    yield this._ensureTokenRenewal();
                }
            }
            catch (err) {
                err = amqpCommon.translate(err);
                error("[%s] An error occured while establishing the $management links: %O", this._context.connectionId, err);
                throw err;
            }
        });
    }
    /**
     * @private
     * Helper method to make the management request
     * @param {Connection} connection - The established amqp connection
     * @param {string} type - The type of entity requested for. Valid values are "eventhub", "partition"
     * @param {string | number} [partitionId] - The partitionId. Required only when type is "partition".
     */
    _makeManagementRequest(type, partitionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (partitionId != undefined && (typeof partitionId !== "string" && typeof partitionId !== "number")) {
                throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
            }
            try {
                const request = {
                    body: Buffer.from(JSON.stringify([])),
                    message_id: v4_1(),
                    reply_to: this.replyTo,
                    application_properties: {
                        operation: amqpCommon.Constants.readOperation,
                        name: this.entityPath,
                        type: `${amqpCommon.Constants.vendorString}:${type}`
                    }
                };
                if (partitionId != undefined && type === amqpCommon.Constants.partition) {
                    request.application_properties.partition = `${partitionId}`;
                }
                mgmt("[%s] Acquiring lock to get the management req res link.", this._context.connectionId);
                yield amqpCommon.defaultLock.acquire(this.managementLock, () => { return this._init(); });
                return (yield this._mgmtReqResLink.sendRequest(request)).body;
            }
            catch (err) {
                err = amqpCommon.translate(err);
                error("An error occurred while making the request to $management endpoint: %O", err);
                throw err;
            }
        });
    }
    _isMgmtRequestResponseLinkOpen() {
        return this._mgmtReqResLink && this._mgmtReqResLink.isOpen();
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
var ConnectionContext;
(function (ConnectionContext) {
    const userAgent = "/js-event-hubs";
    function getUserAgent(options) {
        const finalUserAgent = options.userAgent ? `${userAgent},${options.userAgent}` : userAgent;
        if (finalUserAgent.length > amqpCommon.Constants.maxUserAgentLength) {
            throw new Error(`The user-agent string cannot be more than 128 characters in length.` +
                `The given user-agent string is: ${finalUserAgent} with length: ${finalUserAgent.length}`);
        }
        return finalUserAgent;
    }
    ConnectionContext.getUserAgent = getUserAgent;
    function create(config, options) {
        if (!options)
            options = {};
        const parameters = {
            config: config,
            tokenProvider: options.tokenProvider,
            dataTransformer: options.dataTransformer,
            isEntityPathRequired: true,
            connectionProperties: {
                product: "MSJSClient",
                userAgent: getUserAgent(options),
                version: packageJsonInfo.version
            }
        };
        // Let us create the base context and then add EventHub specific ConnectionContext properties.
        const connectionContext = amqpCommon.ConnectionContextBase.create(parameters);
        connectionContext.wasConnectionCloseCalled = false;
        connectionContext.senders = {};
        connectionContext.receivers = {};
        const mOptions = {
            address: options.managementSessionAddress,
            audience: options.managementSessionAudience
        };
        connectionContext.managementSession = new ManagementClient(connectionContext, mOptions);
        // Define listeners to be added to the connection object for
        // "connection_open" and "connection_error" events.
        const onConnectionOpen = (context$$1) => {
            connectionContext.wasConnectionCloseCalled = false;
            context("[%s] setting 'wasConnectionCloseCalled' property of connection context to %s.", connectionContext.connection.id, connectionContext.wasConnectionCloseCalled);
        };
        const disconnected = (context$$1) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const connectionError = context$$1.connection && context$$1.connection.error
                ? context$$1.connection.error
                : undefined;
            if (connectionError) {
                error("[%s] Error (context.connection.error) occurred on the amqp connection: %O", connectionContext.connection.id, connectionError);
            }
            const contextError = context$$1.error;
            if (contextError) {
                error("[%s] Error (context.error) occurred on the amqp connection: %O", connectionContext.connection.id, contextError);
            }
            const state = {
                wasConnectionCloseCalled: connectionContext.wasConnectionCloseCalled,
                numSenders: Object.keys(connectionContext.senders).length,
                numReceivers: Object.keys(connectionContext.receivers).length
            };
            // The connection should always be brought back up if the sdk did not call connection.close()
            // and there was atleast one sender/receiver link on the connection before it went down.
            error("[%s] state: %O", connectionContext.connection.id, state);
            if (!state.wasConnectionCloseCalled && (state.numSenders || state.numReceivers)) {
                error("[%s] connection.close() was not called from the sdk and there were some " +
                    "sender or receiver links or both. We should reconnect.", connectionContext.connection.id);
                yield amqpCommon.delay(amqpCommon.Constants.connectionReconnectDelay);
                // reconnect senders if any
                for (const senderName of Object.keys(connectionContext.senders)) {
                    const sender$$1 = connectionContext.senders[senderName];
                    if (!sender$$1.isConnecting) {
                        error("[%s] calling detached on sender '%s' with address '%s'.", connectionContext.connection.id, sender$$1.name, sender$$1.address);
                        sender$$1.detached(connectionError || contextError).catch((err) => {
                            error("[%s] An error occurred while reconnecting the sender '%s' with adress '%s' %O.", connectionContext.connection.id, sender$$1.name, sender$$1.address, err);
                        });
                    }
                    else {
                        error("[%s] sender '%s' with address '%s' is already reconnecting. Hence not " +
                            "calling detached on the sender.", connectionContext.connection.id, sender$$1.name, sender$$1.address);
                    }
                }
                // reconnect receivers if any
                for (const receiverName of Object.keys(connectionContext.receivers)) {
                    const receiver$$1 = connectionContext.receivers[receiverName];
                    if (!receiver$$1.isConnecting) {
                        error("[%s] calling detached on receiver '%s' with address '%s'.", connectionContext.connection.id, receiver$$1.name, receiver$$1.address);
                        receiver$$1.detached(connectionError || contextError).catch((err) => {
                            error("[%s] An error occurred while reconnecting the receiver '%s' with adress '%s' %O.", connectionContext.connection.id, receiver$$1.name, receiver$$1.address, err);
                        });
                    }
                    else {
                        error("[%s] receiver '%s' with address '%s' is already reconnecting. Hence not " +
                            "calling detached on the receiver.", connectionContext.connection.id, receiver$$1.name, receiver$$1.address);
                    }
                }
            }
        });
        // Add listeners on the connection object.
        connectionContext.connection.on(rheaPromise.ConnectionEvents.connectionOpen, onConnectionOpen);
        connectionContext.connection.on(rheaPromise.ConnectionEvents.disconnected, disconnected);
        context("[%s] Created connection context successfully.", connectionContext.connectionId);
        return connectionContext;
    }
    ConnectionContext.create = create;
})(ConnectionContext || (ConnectionContext = {}));

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * Describes the EventHubSender that will send event data to EventHub.
 * @class EventHubSender
 * @ignore
 */
class EventHubSender extends LinkEntity {
    /**
     * Creates a new EventHubSender instance.
     * @ignore
     * @constructor
     * @param {ConnectionContext} context The connection context.
     * @param {string|number} [partitionId] The EventHub partition id to which the sender
     * wants to send the event data.
     */
    constructor(context$$1, partitionId, name) {
        super(context$$1, { name: name, partitionId: partitionId });
        /**
         * @property {string} senderLock The unqiue lock name per connection that is used to acquire the
         * lock for establishing a sender link by an entity on that connection.
         * @readonly
         */
        this.senderLock = `sender-${v4_1()}`;
        this.address = context$$1.config.getSenderAddress(partitionId);
        this.audience = context$$1.config.getSenderAudience(partitionId);
        this._onAmqpError = (context$$1) => {
            const senderError = context$$1.sender && context$$1.sender.error;
            if (senderError) {
                const err = amqpCommon.translate(senderError);
                error("[%s] An error occurred for sender '%s': %O.", this._context.connectionId, this.name, err);
            }
        };
        this._onSessionError = (context$$1) => {
            const sessionError = context$$1.session && context$$1.session.error;
            if (sessionError) {
                const err = amqpCommon.translate(sessionError);
                error("[%s] An error occurred on the session of sender '%s': %O.", this._context.connectionId, this.name, err);
            }
        };
        this._onAmqpClose = (context$$1) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sender$$1 = this._sender || context$$1.sender;
            const senderError = context$$1.sender && context$$1.sender.error;
            if (senderError) {
                error("[%s] 'sender_close' event occurred for sender '%s' with address '%s'. " +
                    "The associated error is: %O", this._context.connectionId, this.name, this.address, senderError);
            }
            if (sender$$1 && !sender$$1.isItselfClosed()) {
                if (!this.isConnecting) {
                    error("[%s] 'sender_close' event occurred on the sender '%s' with address '%s' " +
                        "and the sdk did not initiate this. The sender is not reconnecting. Hence, calling " +
                        "detached from the _onAmqpClose() handler.", this._context.connectionId, this.name, this.address);
                    yield this.detached(senderError);
                }
                else {
                    error("[%s] 'sender_close' event occurred on the sender '%s' with address '%s' " +
                        "and the sdk did not initate this. Moreover the sender is already re-connecting. " +
                        "Hence not calling detached from the _onAmqpClose() handler.", this._context.connectionId, this.name, this.address);
                }
            }
            else {
                error("[%s] 'sender_close' event occurred on the sender '%s' with address '%s' " +
                    "because the sdk initiated it. Hence not calling detached from the _onAmqpClose" +
                    "() handler.", this._context.connectionId, this.name, this.address);
            }
        });
        this._onSessionClose = (context$$1) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sender$$1 = this._sender || context$$1.sender;
            const sessionError = context$$1.session && context$$1.session.error;
            if (sessionError) {
                error("[%s] 'session_close' event occurred for sender '%s' with address '%s'. " +
                    "The associated error is: %O", this._context.connectionId, this.name, this.address, sessionError);
            }
            if (sender$$1 && !sender$$1.isSessionItselfClosed()) {
                if (!this.isConnecting) {
                    error("[%s] 'session_close' event occurred on the session of sender '%s' with " +
                        "address '%s' and the sdk did not initiate this. Hence calling detached from the " +
                        "_onSessionClose() handler.", this._context.connectionId, this.name, this.address);
                    yield this.detached(sessionError);
                }
                else {
                    error("[%s] 'session_close' event occurred on the session of sender '%s' with " +
                        "address '%s' and the sdk did not initiate this. Moreover the sender is already " +
                        "re-connecting. Hence not calling detached from the _onSessionClose() handler.", this._context.connectionId, this.name, this.address);
                }
            }
            else {
                error("[%s] 'session_close' event occurred on the session of sender '%s' with address " +
                    "'%s' because the sdk initiated it. Hence not calling detached from the _onSessionClose" +
                    "() handler.", this._context.connectionId, this.name, this.address);
            }
        });
    }
    /**
     * Will reconnect the sender link if necessary.
     * @ignore
     * @param {AmqpError | Error} [senderError] The sender error if any.
     * @returns {Promise<void>} Promise<void>.
     */
    detached(senderError) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const wasCloseInitiated = this._sender && this._sender.isItselfClosed();
                // Clears the token renewal timer. Closes the link and its session if they are open.
                // Removes the link and its session if they are present in rhea's cache.
                yield this._closeLink(this._sender);
                // We should attempt to reopen only when the sender(sdk) did not initiate the close
                let shouldReopen = false;
                if (senderError && !wasCloseInitiated) {
                    const translatedError = amqpCommon.translate(senderError);
                    if (translatedError.retryable) {
                        shouldReopen = true;
                        error("[%s] close() method of Sender '%s' with address '%s' was not called. There " +
                            "was an accompanying error an it is retryable. This is a candidate for re-establishing " +
                            "the sender link.", this._context.connectionId, this.name, this.address);
                    }
                    else {
                        error("[%s] close() method of Sender '%s' with address '%s' was not called. There " +
                            "was an accompanying error and it is NOT retryable. Hence NOT re-establishing " +
                            "the sender link.", this._context.connectionId, this.name, this.address);
                    }
                }
                else if (!wasCloseInitiated) {
                    shouldReopen = true;
                    error("[%s] close() method of Sender '%s' with address '%s' was not called. There " +
                        "was no accompanying error as well. This is a candidate for re-establishing " +
                        "the sender link.", this._context.connectionId, this.name, this.address);
                }
                else {
                    const state = {
                        wasCloseInitiated: wasCloseInitiated,
                        senderError: senderError,
                        _sender: this._sender
                    };
                    error("[%s] Something is busted. State of sender '%s' with address '%s' is: %O", this._context.connectionId, this.name, this.address, state);
                }
                if (shouldReopen) {
                    yield amqpCommon.defaultLock.acquire(this.senderLock, () => {
                        const options = this._createSenderOptions({
                            newName: true
                        });
                        // shall retry forever at an interval of 15 seconds if the error is a retryable error
                        // else bail out when the error is not retryable or the oepration succeeds.
                        const config = {
                            operation: () => this._init(options),
                            connectionId: this._context.connectionId,
                            operationType: amqpCommon.RetryOperationType.senderLink,
                            times: amqpCommon.Constants.defaultConnectionRetryAttempts,
                            delayInSeconds: 15
                        };
                        return amqpCommon.retry(config);
                    });
                }
            }
            catch (err) {
                error("[%s] An error occurred while processing detached() of Sender '%s' with address " +
                    "'%s': %O", this._context.connectionId, this.name, this.address, err);
            }
        });
    }
    /**
     * Deletes the sender fromt the context. Clears the token renewal timer. Closes the sender link.
     * @ignore
     * @return {Promise<void>} Promise<void>
     */
    close() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._sender) {
                const senderLink = this._sender;
                this._deleteFromCache();
                yield this._closeLink(senderLink);
            }
        });
    }
    /**
     * Determines whether the AMQP sender link is open. If open then returns true else returns false.
     * @ignore
     * @return {boolean} boolean
     */
    isOpen() {
        const result = this._sender && this._sender.isOpen();
        error("[%s] Sender '%s' with address '%s' is open? -> %s", this._context.connectionId, this.name, this.address, result);
        return result;
    }
    /**
     * Sends the given message, with the given options on this link
     * @ignore
     * @param {any} data Message to send.  Will be sent as UTF8-encoded JSON string.
     * @returns {Promise<Delivery>} Promise<Delivery>
     */
    send(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                if (!data || (data && typeof data !== "object")) {
                    throw new Error("data is required and it must be of type object.");
                }
                if (data.partitionKey && typeof data.partitionKey !== "string") {
                    throw new Error("'partitionKey' must be of type 'string'.");
                }
                if (!this.isOpen()) {
                    sender("Acquiring lock %s for initializing the session, sender and " +
                        "possibly the connection.", this.senderLock);
                    yield amqpCommon.defaultLock.acquire(this.senderLock, () => { return this._init(); });
                }
                const message = EventData.toAmqpMessage(data);
                message.body = this._context.dataTransformer.encode(data.body);
                return yield this._trySend(message, message.message_id);
            }
            catch (err) {
                error("An error occurred while sending the message %O", err);
                throw err;
            }
        });
    }
    /**
     * Send a batch of EventData to the EventHub. The "message_annotations",
     * "application_properties" and "properties" of the first message will be set as that
     * of the envelope (batch message).
     * @ignore
     * @param {Array<EventData>} datas  An array of EventData objects to be sent in a Batch message.
     * @return {Promise<Delivery>} Promise<Delivery>
     */
    sendBatch(datas) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                if (!datas || (datas && !Array.isArray(datas))) {
                    throw new Error("data is required and it must be an Array.");
                }
                if (!this.isOpen()) {
                    sender("Acquiring lock %s for initializing the session, sender and " +
                        "possibly the connection.", this.senderLock);
                    yield amqpCommon.defaultLock.acquire(this.senderLock, () => { return this._init(); });
                }
                sender("[%s] Sender '%s', trying to send EventData[].", this._context.connectionId, this.name);
                const messages = [];
                // Convert EventData to AmqpMessage.
                for (let i = 0; i < datas.length; i++) {
                    const message = EventData.toAmqpMessage(datas[i]);
                    message.body = this._context.dataTransformer.encode(datas[i].body);
                    messages[i] = message;
                }
                // Encode every amqp message and then convert every encoded message to amqp data section
                const batchMessage = {
                    body: rheaPromise.message.data_sections(messages.map(rheaPromise.message.encode))
                };
                // Set message_annotations, application_properties and properties of the first message as
                // that of the envelope (batch message).
                if (messages[0].message_annotations) {
                    batchMessage.message_annotations = messages[0].message_annotations;
                }
                if (messages[0].application_properties) {
                    batchMessage.application_properties = messages[0].application_properties;
                }
                for (const prop of rheaPromise.messageProperties) {
                    if (messages[0][prop]) {
                        batchMessage[prop] = messages[0][prop];
                    }
                }
                // Finally encode the envelope (batch message).
                const encodedBatchMessage = rheaPromise.message.encode(batchMessage);
                sender("[%s] Sender '%s', sending encoded batch message.", this._context.connectionId, this.name, encodedBatchMessage);
                return yield this._trySend(encodedBatchMessage, batchMessage.message_id, 0x80013700);
            }
            catch (err) {
                error("An error occurred while sending the batch message %O", err);
                throw err;
            }
        });
    }
    _deleteFromCache() {
        this._sender = undefined;
        delete this._context.senders[this.address];
        error("[%s] Deleted the sender '%s' with address '%s' from the client cache.", this._context.connectionId, this.name, this.address);
    }
    _createSenderOptions(options) {
        if (options.newName)
            this.name = `${v4_1()}`;
        const srOptions = {
            name: this.name,
            target: {
                address: this.address
            },
            onError: this._onAmqpError,
            onClose: this._onAmqpClose,
            onSessionError: this._onSessionError,
            onSessionClose: this._onSessionClose
        };
        sender("Creating sender with options: %O", srOptions);
        return srOptions;
    }
    /**
     * Tries to send the message to EventHub if there is enough credit to send them
     * and the circular buffer has available space to settle the message after sending them.
     *
     * We have implemented a synchronous send over here in the sense that we shall be waiting
     * for the message to be accepted or rejected and accordingly resolve or reject the promise.
     * @ignore
     * @param message The message to be sent to EventHub.
     * @return {Promise<Delivery>} Promise<Delivery>
     */
    _trySend(message, tag, format) {
        const sendEventPromise = () => new Promise((resolve, reject) => {
            let waitTimer;
            sender("[%s] Sender '%s', credit: %d available: %d", this._context.connectionId, this.name, this._sender.credit, this._sender.session.outgoing.available());
            if (this._sender.sendable()) {
                sender("[%s] Sender '%s', sending message with id '%s'.", this._context.connectionId, this.name, message.message_id || tag || '<not specified>');
                let onRejected;
                let onReleased;
                let onModified;
                let onAccepted;
                const removeListeners = () => {
                    clearTimeout(waitTimer);
                    this._sender.removeListener(rheaPromise.SenderEvents.rejected, onRejected);
                    this._sender.removeListener(rheaPromise.SenderEvents.accepted, onAccepted);
                    this._sender.removeListener(rheaPromise.SenderEvents.released, onReleased);
                    this._sender.removeListener(rheaPromise.SenderEvents.modified, onModified);
                };
                onAccepted = (context$$1) => {
                    // Since we will be adding listener for accepted and rejected event every time
                    // we send a message, we need to remove listener for both the events.
                    // This will ensure duplicate listeners are not added for the same event.
                    removeListeners();
                    sender("[%s] Sender '%s', got event accepted.", this._context.connectionId, this.name);
                    resolve(context$$1.delivery);
                };
                onRejected = (context$$1) => {
                    removeListeners();
                    error("[%s] Sender '%s', got event rejected.", this._context.connectionId, this.name);
                    const err = amqpCommon.translate(context$$1.delivery.remote_state.error);
                    error(err);
                    reject(err);
                };
                onReleased = (context$$1) => {
                    removeListeners();
                    error("[%s] Sender '%s', got event released.", this._context.connectionId, this.name);
                    let err;
                    if (context$$1.delivery.remote_state.error) {
                        err = amqpCommon.translate(context$$1.delivery.remote_state.error);
                    }
                    else {
                        err = new Error(`[${this._context.connectionId}] Sender '${this.name}', ` +
                            `received a release disposition.Hence we are rejecting the promise.`);
                    }
                    error(err);
                    reject(err);
                };
                onModified = (context$$1) => {
                    removeListeners();
                    error("[%s] Sender '%s', got event modified.", this._context.connectionId, this.name);
                    let err;
                    if (context$$1.delivery.remote_state.error) {
                        err = amqpCommon.translate(context$$1.delivery.remote_state.error);
                    }
                    else {
                        err = new Error(`[${this._context.connectionId}] Sender "${this.name}", ` +
                            `received a modified disposition.Hence we are rejecting the promise.`);
                    }
                    error(err);
                    reject(err);
                };
                const actionAfterTimeout = () => {
                    removeListeners();
                    const desc = `[${this._context.connectionId}] Sender "${this.name}" with ` +
                        `address "${this.address}", was not able to send the message right now, due ` +
                        `to operation timeout.`;
                    error(desc);
                    const e = {
                        condition: amqpCommon.ErrorNameConditionMapper.ServiceUnavailableError,
                        description: desc
                    };
                    return reject(amqpCommon.translate(e));
                };
                this._sender.on(rheaPromise.SenderEvents.accepted, onAccepted);
                this._sender.on(rheaPromise.SenderEvents.rejected, onRejected);
                this._sender.on(rheaPromise.SenderEvents.modified, onModified);
                this._sender.on(rheaPromise.SenderEvents.released, onReleased);
                waitTimer = setTimeout(actionAfterTimeout, amqpCommon.Constants.defaultOperationTimeoutInSeconds * 1000);
                const delivery = this._sender.send(message, tag, format);
                sender("[%s] Sender '%s', sent message with delivery id: %d and tag: %s", this._context.connectionId, this.name, delivery.id, delivery.tag.toString());
            }
            else {
                // let us retry to send the message after some time.
                const msg = `[${this._context.connectionId}] Sender "${this.name}", ` +
                    `cannot send the message right now. Please try later.`;
                error(msg);
                const amqpError = {
                    condition: amqpCommon.ErrorNameConditionMapper.SenderBusyError,
                    description: msg
                };
                reject(amqpCommon.translate(amqpError));
            }
        });
        const jitterInSeconds = amqpCommon.randomNumberFromInterval(1, 4);
        const config = {
            operation: sendEventPromise,
            connectionId: this._context.connectionId,
            operationType: amqpCommon.RetryOperationType.sendMessage,
            times: amqpCommon.Constants.defaultRetryAttempts,
            delayInSeconds: amqpCommon.Constants.defaultDelayBetweenOperationRetriesInSeconds + jitterInSeconds
        };
        return amqpCommon.retry(config);
    }
    /**
     * Initializes the sender session on the connection.
     * @ignore
     * @returns {Promise<void>}
     */
    _init(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                // isOpen isConnecting  Should establish
                // true     false          No
                // true     true           No
                // false    true           No
                // false    false          Yes
                if (!this.isOpen() && !this.isConnecting) {
                    error("[%s] The sender '%s' with address '%s' is not open and is not currently " +
                        "establishing itself. Hence let's try to connect.", this._context.connectionId, this.name, this.address);
                    this.isConnecting = true;
                    yield this._negotiateClaim();
                    error("[%s] Trying to create sender '%s'...", this._context.connectionId, this.name);
                    if (!options) {
                        options = this._createSenderOptions({});
                    }
                    this._sender = yield this._context.connection.createSender(options);
                    this.isConnecting = false;
                    error("[%s] Sender '%s' with address '%s' has established itself.", this._context.connectionId, this.name, this.address);
                    this._sender.setMaxListeners(1000);
                    error("[%s] Promise to create the sender resolved. Created sender with name: %s", this._context.connectionId, this.name);
                    error("[%s] Sender '%s' created with sender options: %O", this._context.connectionId, this.name, options);
                    // It is possible for someone to close the sender and then start it again.
                    // Thus make sure that the sender is present in the client cache.
                    if (!this._context.senders[this.address])
                        this._context.senders[this.address] = this;
                    yield this._ensureTokenRenewal();
                }
                else {
                    error("[%s] The sender '%s' with address '%s' is open -> %s and is connecting " +
                        "-> %s. Hence not reconnecting.", this._context.connectionId, this.name, this.address, this.isOpen(), this.isConnecting);
                }
            }
            catch (err) {
                this.isConnecting = false;
                err = amqpCommon.translate(err);
                error("[%s] An error occurred while creating the sender %s", this._context.connectionId, this.name, err);
                throw err;
            }
        });
    }
    /**
     * Creates a new sender to the given event hub, and optionally to a given partition if it is
     * not present in the context or returns the one present in the context.
     * @ignore
     * @static
     * @param {(string|number)} [partitionId] Partition ID to which it will send event data.
     * @returns {Promise<EventHubSender>}
     */
    static create(context$$1, partitionId) {
        if (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number") {
            throw new Error("'partitionId' must be of type: 'string' | 'number'.");
        }
        const ehSender = new EventHubSender(context$$1, partitionId);
        if (!context$$1.senders[ehSender.address]) {
            context$$1.senders[ehSender.address] = ehSender;
        }
        return context$$1.senders[ehSender.address];
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * Describes the batching receiver where the user can receive a specified number of messages for a predefined time.
 * @class BatchingReceiver
 * @extends EventHubReceiver
 * @ignore
 */
class BatchingReceiver extends EventHubReceiver {
    /**
     * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
     * @ignore
     * @constructor
     * @param {ConnectionContext} context                        The connection context.
     * @param {string} partitionId                               Partition ID from which to receive.
     * @param {ReceiveOptions} [options]                         Options for how you'd like to connect.
     */
    constructor(context$$1, partitionId, options) {
        super(context$$1, partitionId, options);
    }
    /**
     * Receive a batch of EventData objects from an EventHub partition for a given count and
     * a given max wait time in seconds, whichever happens first. This method can be used directly
     * after creating the receiver object.
     * @ignore
     * @param {number} maxMessageCount The maximum message count. Must be a value greater than 0.
     * @param {number} [maxWaitTimeInSeconds] The maximum wait time in seconds for which the Receiver
     * should wait to receiver the said amount of messages. If not provided, it defaults to 60 seconds.
     * @returns {Promise<EventData[]>} A promise that resolves with an array of EventData objects.
     */
    receive(maxMessageCount, maxWaitTimeInSeconds) {
        if (!maxMessageCount || (maxMessageCount && typeof maxMessageCount !== 'number')) {
            throw new Error("'maxMessageCount' is a required parameter of type number with a value greater than 0.");
        }
        if (maxWaitTimeInSeconds == undefined) {
            maxWaitTimeInSeconds = amqpCommon.Constants.defaultOperationTimeoutInSeconds;
        }
        const eventDatas = [];
        let timeOver = false;
        return new Promise((resolve, reject) => {
            let onReceiveMessage;
            let onReceiveError;
            let onReceiveClose;
            let onSessionError;
            let onSessionClose;
            let waitTimer;
            let actionAfterWaitTimeout;
            // Final action to be performed after maxMessageCount is reached or the maxWaitTime is over.
            const finalAction = (timeOver, data) => {
                // Resetting the mode. Now anyone can call start() or receive() again.
                if (this._receiver) {
                    this._receiver.removeListener(rheaPromise.ReceiverEvents.receiverError, onReceiveError);
                    this._receiver.removeListener(rheaPromise.ReceiverEvents.message, onReceiveMessage);
                }
                if (!data) {
                    data = eventDatas.length ? eventDatas[eventDatas.length - 1] : undefined;
                }
                if (!timeOver) {
                    clearTimeout(waitTimer);
                }
                if (this.receiverRuntimeMetricEnabled && data) {
                    this.runtimeInfo.lastSequenceNumber = data.lastSequenceNumber;
                    this.runtimeInfo.lastEnqueuedTimeUtc = data.lastEnqueuedTime;
                    this.runtimeInfo.lastEnqueuedOffset = data.lastEnqueuedOffset;
                    this.runtimeInfo.retrievalTime = data.retrievalTime;
                }
                resolve(eventDatas);
            };
            // Action to be performed after the max wait time is over.
            actionAfterWaitTimeout = () => {
                timeOver = true;
                batching("[%s] Batching Receiver '%s', %d messages received when max wait time in seconds %d is over.", this._context.connectionId, this.name, eventDatas.length, maxWaitTimeInSeconds);
                return finalAction(timeOver);
            };
            // Action to be performed on the "message" event.
            onReceiveMessage = (context$$1) => {
                const data = EventData.fromAmqpMessage(context$$1.message);
                data.body = this._context.dataTransformer.decode(context$$1.message.body);
                if (eventDatas.length <= maxMessageCount) {
                    eventDatas.push(data);
                }
                if (eventDatas.length === maxMessageCount) {
                    batching("[%s] Batching Receiver '%s', %d messages received within %d seconds.", this._context.connectionId, this.name, eventDatas.length, maxWaitTimeInSeconds);
                    finalAction(timeOver, data);
                }
            };
            // Action to be taken when an error is received.
            onReceiveError = (context$$1) => {
                const receiver$$1 = this._receiver || context$$1.receiver;
                receiver$$1.removeListener(rheaPromise.ReceiverEvents.receiverError, onReceiveError);
                receiver$$1.removeListener(rheaPromise.ReceiverEvents.message, onReceiveMessage);
                receiver$$1.session.removeListener(rheaPromise.SessionEvents.sessionError, onSessionError);
                const receiverError = context$$1.receiver && context$$1.receiver.error;
                let error$$1 = new amqpCommon.MessagingError("An error occuured while receiving messages.");
                if (receiverError) {
                    error$$1 = amqpCommon.translate(receiverError);
                    error("[%s] Receiver '%s' received an error:\n%O", this._context.connectionId, this.name, error$$1);
                }
                if (waitTimer) {
                    clearTimeout(waitTimer);
                }
                reject(error$$1);
            };
            onReceiveClose = (context$$1) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const receiverError = context$$1.receiver && context$$1.receiver.error;
                if (receiverError) {
                    error("[%s] 'receiver_close' event occurred. The associated error is: %O", this._context.connectionId, receiverError);
                }
            });
            onSessionClose = (context$$1) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const sessionError = context$$1.session && context$$1.session.error;
                if (sessionError) {
                    error("[%s] 'session_close' event occurred for receiver '%s'. The associated error is: %O", this._context.connectionId, this.name, sessionError);
                }
            });
            onSessionError = (context$$1) => {
                const receiver$$1 = this._receiver || context$$1.receiver;
                receiver$$1.removeListener(rheaPromise.ReceiverEvents.receiverError, onReceiveError);
                receiver$$1.removeListener(rheaPromise.ReceiverEvents.message, onReceiveMessage);
                receiver$$1.session.removeListener(rheaPromise.SessionEvents.sessionError, onReceiveError);
                const sessionError = context$$1.session && context$$1.session.error;
                let error$$1 = new amqpCommon.MessagingError("An error occuured while receiving messages.");
                if (sessionError) {
                    error$$1 = amqpCommon.translate(sessionError);
                    error("[%s] 'session_close' event occurred for Receiver '%s' received an error:\n%O", this._context.connectionId, this.name, error$$1);
                }
                if (waitTimer) {
                    clearTimeout(waitTimer);
                }
                reject(error$$1);
            };
            const addCreditAndSetTimer = (reuse) => {
                batching("[%s] Receiver '%s', adding credit for receiving %d messages.", this._context.connectionId, this.name, maxMessageCount);
                this._receiver.addCredit(maxMessageCount);
                let msg = "[%s] Setting the wait timer for %d seconds for receiver '%s'.";
                if (reuse)
                    msg += " Receiver link already present, hence reusing it.";
                batching(msg, this._context.connectionId, maxWaitTimeInSeconds, this.name);
                waitTimer = setTimeout(actionAfterWaitTimeout, maxWaitTimeInSeconds * 1000);
            };
            if (!this.isOpen()) {
                batching("[%s] Receiver '%s', setting the prefetch count to 0.", this._context.connectionId, this.name);
                this.prefetchCount = 0;
                const rcvrOptions = this._createReceiverOptions({
                    onMessage: onReceiveMessage,
                    onError: onReceiveError,
                    onClose: onReceiveClose,
                    onSessionError: onSessionError,
                    onSessionClose: onSessionClose
                });
                this._init(rcvrOptions).then(() => addCreditAndSetTimer()).catch(reject);
            }
            else {
                addCreditAndSetTimer(true);
                this._receiver.on(rheaPromise.ReceiverEvents.message, onReceiveMessage);
                this._receiver.on(rheaPromise.ReceiverEvents.receiverError, onReceiveError);
                this._receiver.session.on(rheaPromise.SessionEvents.sessionError, onReceiveError);
            }
        });
    }
    /**
     * Creates a batching receiver.
     * @static
     * @ignore
     * @param {ConnectionContext} context    The connection context.
     * @param {string | number} partitionId  The partitionId to receive events from.
     * @param {ReceiveOptions} [options]     Receive options.
     */
    static create(context$$1, partitionId, options) {
        const bReceiver = new BatchingReceiver(context$$1, partitionId, options);
        context$$1.receivers[bReceiver.name] = bReceiver;
        return bReceiver;
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * @class IotHubClient
 * @ignore
 */
class IotHubClient {
    constructor(connectionString) {
        this.connectionString = connectionString;
    }
    /**
     * Constructs the EventHub connection string by catching the redirect error and parsing the error
     * information.
     * @ignore
     * @param {ConnectionContextOptions} [options] optional parameters to be provided while creating
     * the connection context.
     * @return {Promise<string>} Promise<string>
     */
    getEventHubConnectionString(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const iothubconfig = amqpCommon.IotHubConnectionConfig.create(this.connectionString);
            const config = amqpCommon.IotHubConnectionConfig.convertToEventHubConnectionConfig(iothubconfig);
            let result = "";
            if (!options)
                options = {};
            options.tokenProvider = new amqpCommon.IotSasTokenProvider(config.endpoint, config.sharedAccessKeyName, config.sharedAccessKey);
            options.managementSessionAddress = `/messages/events/$management`;
            const context$$1 = ConnectionContext.create(config, options);
            try {
                iotClient("Getting the hub runtime info from the iothub connection string to get the redirect error.");
                yield context$$1.managementSession.getHubRuntimeInformation();
            }
            catch (err) {
                const error$$1 = amqpCommon.translate(err);
                error("IotHubClient received the error: %O", error$$1);
                const parsedInfo = this._parseRedirectError(err);
                error("Parsed info from redirect error is: %O", parsedInfo);
                result = this._buildConnectionString({
                    sharedAccessKey: config.sharedAccessKey,
                    sharedAccessKeyName: config.sharedAccessKeyName,
                    endpoint: parsedInfo.endpoint,
                    entityPath: parsedInfo.entityPath
                });
            }
            iotClient("The EventHub ConnectionString is: '%s'.", result);
            yield this.close(context$$1);
            return result;
        });
    }
    /**
     * Closes the AMQP connection to the Event Hub for this client,
     * returning a promise that will be resolved when disconnection is completed.
     * @ignore
     * @returns {Promise<any>}
     */
    close(context$$1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                if (context$$1.connection.isOpen()) {
                    iotClient("Closing the IotHubClient connection...");
                    // Close the cbs session;
                    yield context$$1.cbsSession.close();
                    iotClient("IotHub cbs session closed.");
                    // Close the management session
                    yield context$$1.managementSession.close();
                    iotClient("IotHub management client closed.");
                    yield context$$1.connection.close();
                    iotClient("Closed the amqp connection '%s' on the iothub client.", context$$1.connectionId);
                }
            }
            catch (err) {
                const msg = `An error occurred while closing the connection "${context$$1.connectionId}": ${err.stack}`;
                error(msg);
            }
        });
    }
    _parseRedirectError(error$$1) {
        if (!error$$1) {
            throw new Error("'error' is a required parameter and must be of type 'object'.");
        }
        if (error$$1.name !== "LinkRedirectError" || !error$$1.info) {
            throw error$$1;
        }
        if (!error$$1.info.hostname || !error$$1.info.address) {
            const msg = `The received redirect error from IotHub is malformed. ${error$$1.stack}\n${error$$1.info}`;
            throw new Error(msg);
        }
        const address = error$$1.info.address;
        const parsedResult = address.match(/5671\/(.*)\/\$management/i);
        if (parsedResult == undefined || parsedResult && parsedResult[1] == undefined) {
            const msg = `Cannot parse the EventHub name from the given address: ${address} in the error: ` +
                `${error$$1.stack}\n${JSON.stringify(error$$1.info)}.\nThe parsed result is: ${JSON.stringify(parsedResult)}.`;
            throw new Error(msg);
        }
        return {
            endpoint: error$$1.info.hostname,
            entityPath: parsedResult[1]
        };
    }
    _buildConnectionString(config) {
        const parts = new Map();
        parts.set("Endpoint", `sb://${config.endpoint}/`);
        parts.set("SharedAccessKeyName", config.sharedAccessKeyName);
        parts.set("SharedAccessKey", config.sharedAccessKey);
        parts.set("EntityPath", config.entityPath);
        return Array.from(parts).map((part) => `${part[0]}=${part[1]}`).join(";");
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
/**
 * @class EventHubClient
 * Describes the EventHub client.
 */
class EventHubClient {
    /**
     * @property {string} eventhubName The name of the Eventhub.
     * @readonly
     */
    get eventhubName() {
        return this._context.config.entityPath;
    }
    /**
     * Instantiates a client pointing to the Event Hub given by this configuration.
     *
     * @constructor
     * @param {EventHubConnectionConfig} config - The connection configuration to create the EventHub Client.
     * @param {ClientOptions} options - The optional parameters that can be provided to the EventHub
     * Client constructor.
     */
    constructor(config, options) {
        if (!options)
            options = {};
        this._context = ConnectionContext.create(config, options);
    }
    /**
     * Closes the AMQP connection to the Event Hub for this client,
     * returning a promise that will be resolved when disconnection is completed.
     * @returns {Promise<void>} Promise<void>
     */
    close() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                if (this._context.connection.isOpen()) {
                    // Close all the senders.
                    for (const senderName of Object.keys(this._context.senders)) {
                        yield this._context.senders[senderName].close();
                    }
                    // Close all the receivers.
                    for (const receiverName of Object.keys(this._context.receivers)) {
                        yield this._context.receivers[receiverName].close();
                    }
                    // Close the cbs session;
                    yield this._context.cbsSession.close();
                    // Close the management session
                    yield this._context.managementSession.close();
                    yield this._context.connection.close();
                    this._context.wasConnectionCloseCalled = true;
                    client("Closed the amqp connection '%s' on the client.", this._context.connectionId);
                }
            }
            catch (err) {
                const msg = `An error occurred while closing the connection "${this._context.connectionId}": ${JSON.stringify(err)}`;
                error(msg);
                throw new Error(msg);
            }
        });
    }
    /**
     * Sends the given message to the EventHub.
     *
     * @param {any} data                    Message to send.  Will be sent as UTF8-encoded JSON string.
     * @param {string|number} [partitionId] Partition ID to which the event data needs to be sent. This should only be specified
     * if you intend to send the event to a specific partition. When not specified EventHub will store the messages in a round-robin
     * fashion amongst the different partitions in the EventHub.
     *
     * @returns {Promise<Delivery>} Promise<Delivery>
     */
    send(data, partitionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sender$$1 = EventHubSender.create(this._context, partitionId);
            return sender$$1.send(data);
        });
    }
    /**
     * Send a batch of EventData to the EventHub. The "message_annotations", "application_properties" and "properties"
     * of the first message will be set as that of the envelope (batch message).
     *
     * @param {Array<EventData>} datas  An array of EventData objects to be sent in a Batch message.
     * @param {string|number} [partitionId] Partition ID to which the event data needs to be sent. This should only be specified
     * if you intend to send the event to a specific partition. When not specified EventHub will store the messages in a round-robin
     * fashion amongst the different partitions in the EventHub.
     *
     * @return {Promise<Delivery>} Promise<Delivery>
     */
    sendBatch(datas, partitionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sender$$1 = EventHubSender.create(this._context, partitionId);
            return sender$$1.sendBatch(datas);
        });
    }
    /**
     * Starts the receiver by establishing an AMQP session and an AMQP receiver link on the session. Messages will be passed to
     * the provided onMessage handler and error will be passed to the provided onError handler.
     *
     * @param {string|number} partitionId                        Partition ID from which to receive.
     * @param {OnMessage} onMessage                              The message handler to receive event data objects.
     * @param {OnError} onError                                  The error handler to receive an error that occurs
     * while receiving messages.
     * @param {ReceiveOptions} [options]                         Options for how you'd like to receive messages.
     *
     * @returns {ReceiveHandler} ReceiveHandler - An object that provides a mechanism to stop receiving more messages.
     */
    receive(partitionId, onMessage, onError, options) {
        if (typeof partitionId !== "string" && typeof partitionId !== "number") {
            throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
        }
        const sReceiver = StreamingReceiver.create(this._context, partitionId, options);
        this._context.receivers[sReceiver.name] = sReceiver;
        return sReceiver.receive(onMessage, onError);
    }
    /**
     * Receives a batch of EventData objects from an EventHub partition for a given count and a given max wait time in seconds, whichever
     * happens first. This method can be used directly after creating the receiver object and **MUST NOT** be used along with the `start()` method.
     *
     * @param {string|number} partitionId                        Partition ID from which to receive.
     * @param {number} maxMessageCount                           The maximum message count. Must be a value greater than 0.
     * @param {number} [maxWaitTimeInSeconds]                    The maximum wait time in seconds for which the Receiver should wait
     * to receiver the said amount of messages. If not provided, it defaults to 60 seconds.
     * @param {ReceiveOptions} [options]                         Options for how you'd like to receive messages.
     *
     * @returns {Promise<Array<EventData>>} Promise<Array<EventData>>.
     */
    receiveBatch(partitionId, maxMessageCount, maxWaitTimeInSeconds, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (typeof partitionId !== "string" && typeof partitionId !== "number") {
                throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
            }
            const bReceiver = BatchingReceiver.create(this._context, partitionId, options);
            this._context.receivers[bReceiver.name] = bReceiver;
            let error$$1;
            let result = [];
            try {
                result = yield bReceiver.receive(maxMessageCount, maxWaitTimeInSeconds);
            }
            catch (err) {
                error$$1 = err;
                error("[%s] Receiver '%s', an error occurred while receiving %d messages for %d max time:\n %O", this._context.connectionId, bReceiver.name, maxMessageCount, maxWaitTimeInSeconds, err);
            }
            try {
                yield bReceiver.close();
            }
            catch (err) {
                // do nothing about it.
            }
            if (error$$1) {
                throw error$$1;
            }
            return result;
        });
    }
    /**
     * Provides the eventhub runtime information.
     * @returns {Promise<EventHubRuntimeInformation>} A promise that resolves with EventHubRuntimeInformation.
     */
    getHubRuntimeInformation() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield this._context.managementSession.getHubRuntimeInformation();
            }
            catch (err) {
                error("An error occurred while getting the hub runtime information: %O", err);
                throw err;
            }
        });
    }
    /**
     * Provides an array of partitionIds.
     * @returns {Promise<Array<string>>} A promise that resolves with an Array of strings.
     */
    getPartitionIds() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const runtimeInfo = yield this.getHubRuntimeInformation();
                return runtimeInfo.partitionIds;
            }
            catch (err) {
                error("An error occurred while getting the partition ids: %O", err);
                throw err;
            }
        });
    }
    /**
     * Provides information about the specified partition.
     * @param {(string|number)} partitionId Partition ID for which partition information is required.
     * @returns {Promise<EventHubPartitionRuntimeInformation>} A promise that resoloves with EventHubPartitionRuntimeInformation.
     */
    getPartitionInformation(partitionId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (typeof partitionId !== "string" && typeof partitionId !== "number") {
                throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
            }
            try {
                return yield this._context.managementSession.getPartitionInformation(partitionId);
            }
            catch (err) {
                error("An error occurred while getting the partition information: %O", err);
                throw err;
            }
        });
    }
    /**
     * Creates an EventHub Client from connection string.
     * @param {string} connectionString - Connection string of the form 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {string} [path] - EventHub path of the form 'my-event-hub-name'
     * @param {ClientOptions} [options] Options that can be provided during client creation.
     * @returns {EventHubClient} - An instance of the eventhub client.
     */
    static createFromConnectionString(connectionString, path$$1, options) {
        if (!connectionString || (connectionString && typeof connectionString !== "string")) {
            throw new Error("'connectionString' is a required parameter and must be of type: 'string'.");
        }
        const config = amqpCommon.EventHubConnectionConfig.create(connectionString, path$$1);
        if (!config.entityPath) {
            throw new Error(`Either the connectionString must have "EntityPath=<path-to-entity>" or ` +
                `you must provide "path", while creating the client`);
        }
        return new EventHubClient(config, options);
    }
    /**
     * Creates an EventHub Client from connection string.
     * @param {string} iothubConnectionString - Connection string of the form 'HostName=iot-host-name;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {ClientOptions} [options] Options that can be provided during client creation.
     * @returns {Promise<EventHubClient>} - Promise<EventHubClient>.
     */
    static createFromIotHubConnectionString(iothubConnectionString, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!iothubConnectionString || (iothubConnectionString && typeof iothubConnectionString !== "string")) {
                throw new Error("'connectionString' is a required parameter and must be of type: 'string'.");
            }
            const connectionString = yield new IotHubClient(iothubConnectionString).getEventHubConnectionString();
            return EventHubClient.createFromConnectionString(connectionString, undefined, options);
        });
    }
    /**
     * Creates an EventHub Client from a generic token provider.
     * @param {string} host - Fully qualified domain name for Event Hubs. Most likely,
     * <yournamespace>.servicebus.windows.net
     * @param {string} entityPath - EventHub path of the form 'my-event-hub-name'
     * @param {TokenProvider} tokenProvider - Your token provider that implements the TokenProvider interface.
     * @param {ClientOptionsBase} options - The options that can be provided during client creation.
     * @returns {EventHubClient} An instance of the Eventhub client.
     */
    static createFromTokenProvider(host, entityPath, tokenProvider, options) {
        if (!host || (host && typeof host !== "string")) {
            throw new Error("'host' is a required parameter and must be of type: 'string'.");
        }
        if (!entityPath || (entityPath && typeof entityPath !== "string")) {
            throw new Error("'entityPath' is a required parameter and must be of type: 'string'.");
        }
        if (!tokenProvider || (tokenProvider && typeof tokenProvider !== "object")) {
            throw new Error("'tokenProvider' is a required parameter and must be of type: 'object'.");
        }
        if (!host.endsWith("/"))
            host += "/";
        const connectionString = `Endpoint=sb://${host};SharedAccessKeyName=defaultKeyName;` +
            `SharedAccessKey=defaultKeyValue`;
        if (!options)
            options = {};
        const clientOptions = options;
        clientOptions.tokenProvider = tokenProvider;
        return EventHubClient.createFromConnectionString(connectionString, entityPath, clientOptions);
    }
    /**
     * Creates an EventHub Client from AADTokenCredentials.
     * @param {string} host - Fully qualified domain name for Event Hubs. Most likely,
     * <yournamespace>.servicebus.windows.net
     * @param {string} entityPath - EventHub path of the form 'my-event-hub-name'
     * @param {TokenCredentials} credentials - The AAD Token credentials. It can be one of the following:
     * ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials.
     * @param {ClientOptionsBase} options - The options that can be provided during client creation.
     * @returns {EventHubClient} An instance of the Eventhub client.
     */
    static createFromAadTokenCredentials(host, entityPath, credentials, options) {
     /*   if (!credentials || (credentials && typeof credentials !== "object")) {
            throw new Error("'credentials' is a required parameter and must be an instance of " +
                "ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | " +
                "MSITokenCredentials.");
        }*/
        const tokenProvider = new amqpCommon.AadTokenProvider(credentials);
        return EventHubClient.createFromTokenProvider(host, entityPath, tokenProvider, options);
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
const aadEventHubsAudience = amqpCommon.Constants.aadEventHubsAudience;

// Copyright (c) Microsoft Corporation. All rights reserved.
const should$1 = chai$1.should();
main.config();
chai$1.use(chaiAsPromised);
const debug = debugModule("azure:event-hubs:client-spec");
function testFalsyValues(testFn) {
    // tslint:disable-next-line: no-null-keyword
    [null, undefined, "", 0].forEach(function (value) {
        testFn(value);
    });
}
describe("EventHubClient", function () {
    describe("#constructor", function () {
        ["endpoint", "entityPath", "sharedAccessKeyName", "sharedAccessKey"].forEach(function (prop) {
            it("throws if config." + prop + " is falsy", function () {
                testFalsyValues(function (falsyVal) {
                    const test = function () {
                        const config = { endpoint: "a", entityPath: "b", sharedAccessKey: "c", sharedAccessKeyName: "d" };
                        config[prop] = falsyVal;
                        return new EventHubClient(config);
                    };
                    test.should.throw(Error, `'${prop}' is a required property of ConnectionConfig.`);
                });
            });
        });
    });
    describe(".fromConnectionString", function () {
        it("throws when there is no connection string", function () {
            testFalsyValues(function (value) {
                const test = function () {
                    return EventHubClient.createFromConnectionString(value);
                };
                test.should.throw(Error, "'connectionString' is a required parameter and must be of type: 'string'.");
            });
        });
        it("throws when it cannot find the Event Hub path", function () {
            const endpoint = "Endpoint=sb://abc";
            const test = function () {
                return EventHubClient.createFromConnectionString(endpoint);
            };
            test.should.throw(Error, `Either provide "path" or the "connectionString": "${endpoint}", must contain EntityPath="<path-to-the-entity>".`);
        });
        it("creates an EventHubClient from a connection string", function () {
            const client = EventHubClient.createFromConnectionString("Endpoint=sb://a;SharedAccessKeyName=b;SharedAccessKey=c;EntityPath=d");
            client.should.be.an.instanceof(EventHubClient);
        });
        it("creates an EventHubClient from a connection string and an Event Hub path", function () {
            const client = EventHubClient.createFromConnectionString("Endpoint=sb://a;SharedAccessKeyName=b;SharedAccessKey=c", "path");
            client.should.be.an.instanceof(EventHubClient);
        });
    });
});
function arrayOfIncreasingNumbersFromZero(length) {
    // tslint:disable-next-line: no-null-keyword
    return Array.apply(null, new Array(length)).map((x, i) => { return `${i}`; });
}
before("validate environment", function () {
    should$1.exist(process.env.EVENTHUB_CONNECTION_STRING, "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
    should$1.exist(process.env.EVENTHUB_NAME, "define EVENTHUB_NAME in your environment before running integration tests.");
});
const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
describe("EventHubClient on ", function () {
    let client;
    afterEach('close the connection', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (client) {
                debug(">>>>>>>> afterEach: closing the client.");
                yield client.close();
            }
        });
    });
    describe("user-agent", function () {
        it("should correctly populate the default user agent", function (done) {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            const packageVersion = packageJsonInfo.version;
            const properties = client["_context"].connection.options.properties;
            should$1.equal(properties["user-agent"], "/js-event-hubs");
            should$1.equal(properties.product, "MSJSClient");
            should$1.equal(properties.version, packageVersion);
            should$1.equal(properties.framework, `Node/${process.version}`);
            should$1.equal(properties.platform, `(${os.arch()}-${os.type()}-${os.release()})`);
            done();
        });
        it("should correctly populate the custom user agent", function (done) {
            const customua = "/js-event-processor-host=0.2.0";
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path, { userAgent: customua });
            const packageVersion = packageJsonInfo.version;
            const properties = client["_context"].connection.options.properties;
            should$1.equal(properties["user-agent"], `/js-event-hubs,${customua}`);
            should$1.equal(properties.product, "MSJSClient");
            should$1.equal(properties.version, packageVersion);
            should$1.equal(properties.framework, `Node/${process.version}`);
            should$1.equal(properties.platform, `(${os.arch()}-${os.type()}-${os.release()})`);
            done();
        });
        it("should throw an error if the user-agent string is greater than 128 characters in length", function (done) {
            const customua = "/js-event-processor-host=0.2.0zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";
            try {
                client = EventHubClient.createFromConnectionString(service.connectionString, service.path, { userAgent: customua });
            }
            catch (err) {
                err.message.should.match(/The user-agent string cannot be more than 128 characters in length.*/ig);
                done();
            }
        });
    });
    describe("#close", function () {
        it("is a no-op when the connection is already closed", function () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            return client.close().should.be.fulfilled;
        });
    });
    describe("getPartitionIds", function () {
        it("returns an array of partition IDs", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
                const ids = yield client.getPartitionIds();
                ids.should.have.members(arrayOfIncreasingNumbersFromZero(ids.length));
            });
        });
    });
    describe("non existent eventhub", function () {
        it("should throw MessagingEntityNotFoundError while getting hub runtime info", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    client = EventHubClient.createFromConnectionString(service.connectionString, "bad" + Math.random());
                    yield client.getHubRuntimeInformation();
                }
                catch (err) {
                    debug(err);
                    should$1.equal(err.name, "MessagingEntityNotFoundError");
                }
            });
        });
        it("should throw MessagingEntityNotFoundError while getting partition runtime info", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    client = EventHubClient.createFromConnectionString(service.connectionString, "bad" + Math.random());
                    yield client.getPartitionInformation("0");
                }
                catch (err) {
                    debug(err);
                    should$1.equal(err.name, "MessagingEntityNotFoundError");
                }
            });
        });
        it("should throw MessagingEntityNotFoundError while creating a sender", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    client = EventHubClient.createFromConnectionString(service.connectionString, "bad" + Math.random());
                    yield client.send({ body: "Hello World" }, "0");
                }
                catch (err) {
                    debug(err);
                    should$1.equal(err.name, "MessagingEntityNotFoundError");
                }
            });
        });
        it("should throw MessagingEntityNotFoundError while creating a receiver", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    client = EventHubClient.createFromConnectionString(service.connectionString, "bad" + Math.random());
                    yield client.receiveBatch("0", 10, 5);
                }
                catch (err) {
                    debug(err);
                    should$1.equal(err.name, "MessagingEntityNotFoundError");
                }
            });
        });
    });
    describe("non existent consumer group", function () {
        it("should throw MessagingEntityNotFoundError while creating a receiver", function (done) {
            try {
                client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
                debug(">>>>>>>> client created.");
                const onMessage = (data) => {
                    debug(">>>>> data: ", data);
                };
                const onError = (error) => {
                    debug(">>>>>>>> error occurred", error);
                    // sleep for 3 seconds so that receiver link and the session can be closed properly then
                    // in aftereach the connection can be closed. closing the connection while the receiver
                    // link and it's session are being closed (and the session being removed from rhea's
                    // internal map) can create havoc.
                    setTimeout(() => { done(should$1.equal(error.name, "MessagingEntityNotFoundError")); }, 3000);
                };
                client.receive("0", onMessage, onError, { consumerGroup: "some-randome-name" });
                debug(">>>>>>>> attached the error handler on the receiver...");
            }
            catch (err) {
                debug(">>> Some error", err);
                throw new Error("This code path must not have hit.. " + JSON.stringify(err));
            }
        });
    });
    describe("on invalid partition ids like", function () {
        const invalidIds = ["XYZ", "-1", "1000", "-", " "];
        invalidIds.forEach(function (id) {
            it(`"${id}" should throw an error`, function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    try {
                        client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
                        yield client.getPartitionInformation(id);
                    }
                    catch (err) {
                        debug(`>>>> Received error - `, err);
                        should$1.exist(err);
                        err.message.should.match(/.*The specified partition is invalid for an EventHub partition sender or receiver.*/ig);
                    }
                });
            });
        });
        // tslint:disable-next-line: no-null-keyword
        const invalidIds2 = ["", null];
        invalidIds2.forEach(function (id) {
            it(`"${id}" should throw an error`, function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    try {
                        client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
                        yield client.getPartitionInformation(id);
                    }
                    catch (err) {
                        debug(`>>>> Received error - `, err);
                        should$1.exist(err);
                    }
                });
            });
        });
    });
}).timeout(60000);

// Copyright (c) Microsoft Corporation. All rights reserved.
chai$1.should();
const testAnnotations = {
    "x-opt-enqueued-time": Date.now(),
    "x-opt-offset": "42",
    "x-opt-sequence-number": 0,
    "x-opt-partition-key": "key"
};
const testBody = "{ \"foo\": \"bar\" }";
const messageProperties = {
    message_id: "test_id"
};
const applicationProperties = {
    propKey: "propValue"
};
const testMessage = {
    body: testBody,
    message_annotations: testAnnotations,
    message_id: "test_id",
    application_properties: applicationProperties
};
const testEventData = EventData.fromAmqpMessage(testMessage);
const messageFromED = EventData.toAmqpMessage(testEventData);
describe("EventData", function () {
    describe("fromAmqpMessage", function () {
        it("populates annotations with the message annotations", function () {
            testEventData.annotations.should.equal(testAnnotations);
        });
        it("populates body with the message body", function () {
            testEventData.body.should.equal(testBody);
        });
        it("populates the properties with the message properties", function () {
            testEventData.properties.message_id.should.equal(messageProperties.message_id);
        });
        it("populates the application properties with the message application properties", function () {
            testEventData.applicationProperties.should.equal(applicationProperties);
        });
        it("preserves the raw amqp message as-is.", function () {
            testEventData._raw_amqp_mesage.should.equal(testMessage);
        });
    });
    describe("toAmqpMessage", function () {
        it("populates annotations with the message annotations", function () {
            messageFromED.message_annotations.should.equal(testAnnotations);
        });
        it("populates body with the message body", function () {
            messageFromED.body.should.equal(testBody);
        });
        it("populates properties with the message properties", function () {
            messageFromED.message_id.should.equal(messageProperties.message_id);
        });
        it("populates application_properties of the message", function () {
            messageFromED.application_properties.should.equal(applicationProperties);
        });
    });
    describe("properties", function () {
        it("enqueuedTimeUtc gets the enqueued time from system properties", function () {
            const testEventData = EventData.fromAmqpMessage(testMessage);
            testEventData.enqueuedTimeUtc.getTime().should.equal(testAnnotations["x-opt-enqueued-time"]);
        });
        it("offset gets the offset from system properties", function () {
            const testEventData = EventData.fromAmqpMessage(testMessage);
            testEventData.offset.should.equal(testAnnotations["x-opt-offset"]);
        });
        it("sequenceNumber gets the sequence number from system properties", function () {
            const testEventData = EventData.fromAmqpMessage(testMessage);
            testEventData.sequenceNumber.should.equal(testAnnotations["x-opt-sequence-number"]);
        });
        it("partitionKey gets the sequence number from system properties", function () {
            const testEventData = EventData.fromAmqpMessage(testMessage);
            testEventData.partitionKey.should.equal(testAnnotations["x-opt-partition-key"]);
        });
    });
});

// Copyright (c) Microsoft Corporation. All rights reserved.
chai$1.should();
describe("EventPosition", function () {
    describe("happy", function () {
        it("should create from an offset with inclusive false", function (done) {
            const result = "amqp.annotation.x-opt-offset > '1234'";
            const pos = EventPosition.fromOffset("1234");
            result.should.equal(pos.getExpression());
            done();
        });
        it("should create from an offset with inclusive true", function (done) {
            const result = "amqp.annotation.x-opt-offset >= '1234'";
            const pos = EventPosition.fromOffset("1234", true);
            result.should.equal(pos.getExpression());
            done();
        });
        it("should create from a sequence with inclusive false", function (done) {
            const result = "amqp.annotation.x-opt-sequence-number > '0'";
            const pos = EventPosition.fromSequenceNumber(0);
            result.should.equal(pos.getExpression());
            done();
        });
        it("should create from a sequence with inclusive true", function (done) {
            const result = "amqp.annotation.x-opt-sequence-number >= '0'";
            const pos = EventPosition.fromSequenceNumber(0, true);
            result.should.equal(pos.getExpression());
            done();
        });
        it("should create from enqueuedTime with Date as Date", function (done) {
            const result = "amqp.annotation.x-opt-enqueued-time > '1537406052971'";
            const d = new Date("2018-09-20T01:14:12.971Z");
            const pos = EventPosition.fromEnqueuedTime(d);
            result.should.equal(pos.getExpression());
            done();
        });
        it("should create from enqueuedTime with Date as number", function (done) {
            const result = "amqp.annotation.x-opt-enqueued-time > '1537406052971'";
            const d = new Date("2018-09-20T01:14:12.971Z").getTime();
            const pos = EventPosition.fromEnqueuedTime(d);
            result.should.equal(pos.getExpression());
            done();
        });
        it("should create custom filter", function (done) {
            const custom = "amqp.annotation.x-opt-custom > 'foo-bar'";
            const pos = EventPosition.withCustomFilter(custom);
            custom.should.equal(pos.getExpression());
            done();
        });
        it("should create from an offset from start", function (done) {
            const result = "amqp.annotation.x-opt-offset > '-1'";
            const pos = EventPosition.fromStart();
            result.should.equal(pos.getExpression());
            done();
        });
        it("should create from an offset from end", function (done) {
            const result = "amqp.annotation.x-opt-offset > '@latest'";
            const pos = EventPosition.fromEnd();
            result.should.equal(pos.getExpression());
            done();
        });
    });
    describe("sad", function () {
        it("should fail if empty string is provided for offset", function (done) {
            try {
                EventPosition.fromOffset("");
            }
            catch (err) {
                err.message.should.match(/'offset' is a required parameter and must be a non-empty string.*/ig);
            }
            done();
        });
    });
});

// Copyright (c) Microsoft Corporation. All rights reserved.
const should$2 = chai$1.should();
chai$1.use(chaiAsPromised);
const debug$1 = debugModule("azure:event-hubs:hubruntime-spec");
main.config();
describe("RuntimeInformation", function () {
    let client;
    const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
    before("validate environment", function () {
        should$2.exist(process.env.EVENTHUB_CONNECTION_STRING, "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
        should$2.exist(process.env.EVENTHUB_NAME, "define EVENTHUB_NAME in your environment before running integration tests.");
    });
    afterEach('close the connection', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield client.close();
        });
    });
    function arrayOfIncreasingNumbersFromZero(length) {
        return Array.apply(undefined, new Array(length)).map((x, i) => { return `${i}`; });
    }
    it("gets the hub runtime information", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path, { userAgent: "/js-event-processor-host=0.2.0" });
            const hubRuntimeInfo = yield client.getHubRuntimeInformation();
            debug$1(hubRuntimeInfo);
            hubRuntimeInfo.path.should.equal(service.path);
            hubRuntimeInfo.type.should.equal("com.microsoft:eventhub");
            hubRuntimeInfo.partitionIds.should.have.members(arrayOfIncreasingNumbersFromZero(hubRuntimeInfo.partitionIds.length));
            hubRuntimeInfo.partitionCount.should.equal(hubRuntimeInfo.partitionIds.length);
            hubRuntimeInfo.createdAt.should.be.instanceof(Date);
        });
    });
    it("gets the partition runtime information with partitionId as a string", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            const partitionRuntimeInfo = yield client.getPartitionInformation("0");
            debug$1(partitionRuntimeInfo);
            partitionRuntimeInfo.partitionId.should.equal("0");
            partitionRuntimeInfo.type.should.equal("com.microsoft:partition");
            partitionRuntimeInfo.hubPath.should.equal(service.path);
            partitionRuntimeInfo.lastEnqueuedTimeUtc.should.be.instanceof(Date);
            should$2.exist(partitionRuntimeInfo.lastSequenceNumber);
            should$2.exist(partitionRuntimeInfo.lastEnqueuedOffset);
        });
    });
    it("gets the partition runtime information with partitionId as a number", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            const partitionRuntimeInfo = yield client.getPartitionInformation(0);
            debug$1(partitionRuntimeInfo);
            partitionRuntimeInfo.partitionId.should.equal("0");
            partitionRuntimeInfo.type.should.equal("com.microsoft:partition");
            partitionRuntimeInfo.hubPath.should.equal(service.path);
            partitionRuntimeInfo.lastEnqueuedTimeUtc.should.be.instanceof(Date);
            should$2.exist(partitionRuntimeInfo.lastSequenceNumber);
            should$2.exist(partitionRuntimeInfo.lastEnqueuedOffset);
        });
    });
    it("should fail the partition runtime information when partitionId is not a number or string", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            try {
                yield client.getPartitionInformation(true);
            }
            catch (err) {
                err.message.should.equal("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
            }
        });
    });
    it("should fail the partition runtime information when partitionId is empty string", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            try {
                yield client.getPartitionInformation("");
            }
            catch (err) {
                err.message.should.match(/.*The specified partition is invalid for an EventHub partition sender or receiver.*/ig);
            }
        });
    });
    it("should fail the partition runtime information when partitionId is a negative number", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
            try {
                yield client.getPartitionInformation(-1);
            }
            catch (err) {
                err.message.should.match(/.*The specified partition is invalid for an EventHub partition sender or receiver.*/ig);
            }
        });
    });
}).timeout(60000);

// Copyright (c) Microsoft Corporation. All rights reserved.
const should$3 = chai$1.should();
chai$1.use(chaiAsPromised);
const debug$2 = debugModule("azure:event-hubs:iothub-spec");
main.config();
describe("EventHub Client with iothub connection string", function () {
    const service = { connectionString: process.env.IOTHUB_CONNECTION_STRING };
    let client;
    before("validate environment", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            should$3.exist(process.env.IOTHUB_CONNECTION_STRING, "define IOTHUB_CONNECTION_STRING in your environment before running integration tests.");
        });
    });
    afterEach("close the connection", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (client) {
                debug$2(">>> After Each, closing the client...");
                yield client.close();
            }
        });
    });
    it("should be able to get hub runtime info", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = yield EventHubClient.createFromIotHubConnectionString(service.connectionString);
            const runtimeInfo = yield client.getHubRuntimeInformation();
            debug$2(">>> RuntimeInfo: ", runtimeInfo);
            should$3.exist(runtimeInfo);
            runtimeInfo.type.should.equal("com.microsoft:eventhub");
            runtimeInfo.partitionCount.should.be.greaterThan(0);
            runtimeInfo.partitionIds.length.should.be.greaterThan(0);
        });
    });
    it("should be able to receive messages from the event hub", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            client = yield EventHubClient.createFromIotHubConnectionString(service.connectionString);
            const datas = yield client.receiveBatch("0", 15, 10);
            debug$2(">>>> Received events from partition %s, %O", "0", datas);
        });
    });
}).timeout(30000);

// Copyright (c) Microsoft Corporation. All rights reserved.
const should$4 = chai$1.should();
chai$1.use(chaiAsPromised);
const debug$3 = debugModule("azure:event-hubs:misc-spec");
main.config();
describe("Misc tests", function () {
    const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
    const client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
    let breceiver;
    let hubInfo;
    before("validate environment", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            should$4.exist(process.env.EVENTHUB_CONNECTION_STRING, "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
            should$4.exist(process.env.EVENTHUB_NAME, "define EVENTHUB_NAME in your environment before running integration tests.");
            hubInfo = yield client.getHubRuntimeInformation();
        });
    });
    after("close the connection", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield client.close();
        });
    });
    it("should be able to send and receive a large message correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const bodysize = 220 * 1024;
            const partitionId = hubInfo.partitionIds[0];
            const msgString = "A".repeat(220 * 1024);
            const msgBody = Buffer.from(msgString);
            const obj = { body: msgBody };
            const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
            debug$3(`Partition ${partitionId} has last message with offset ${offset}.`);
            debug$3("Sending one message with %d bytes.", bodysize);
            breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
            let data = yield breceiver.receive(5, 10);
            data.length.should.equal(0, "Unexpected to receive message before client sends it");
            yield client.send(obj, partitionId);
            debug$3("Successfully sent the large message.");
            data = yield breceiver.receive(5, 30);
            debug$3("Closing the receiver..");
            yield breceiver.close();
            debug$3("received message: ", data.length);
            should$4.exist(data);
            data.length.should.equal(1);
            data[0].body.toString().should.equal(msgString);
            should$4.not.exist((data[0].properties || {}).message_id);
        });
    });
    it("should be able to send and receive a JSON object as a message correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const partitionId = hubInfo.partitionIds[0];
            const msgBody = {
                id: '123-456-789',
                weight: 10,
                isBlue: true,
                siblings: [
                    {
                        id: '098-789-564',
                        weight: 20,
                        isBlue: false,
                    }
                ]
            };
            const obj = { body: msgBody };
            const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
            debug$3(`Partition ${partitionId} has last message with offset ${offset}.`);
            debug$3("Sending one message %O", obj);
            breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
            yield client.send(obj, partitionId);
            debug$3("Successfully sent the large message.");
            const data = yield breceiver.receive(5, 30);
            yield breceiver.close();
            debug$3("received message: ", data);
            should$4.exist(data);
            data.length.should.equal(1);
            debug$3("Received message: %O", data);
            assert.deepEqual(data[0].body, msgBody);
            should$4.not.exist((data[0].properties || {}).message_id);
        });
    });
    it("should be able to send and receive an array as a message correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const partitionId = hubInfo.partitionIds[0];
            const msgBody = [
                {
                    id: '098-789-564',
                    weight: 20,
                    isBlue: false,
                },
                10,
                20,
                "some string"
            ];
            const obj = { body: msgBody, properties: { message_id: v4_1() } };
            const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
            debug$3(`Partition ${partitionId} has last message with offset ${offset}.`);
            debug$3("Sending one message %O", obj);
            breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
            yield client.send(obj, partitionId);
            debug$3("Successfully sent the large message.");
            const data = yield breceiver.receive(5, 30);
            yield breceiver.close();
            debug$3("received message: ", data);
            should$4.exist(data);
            data.length.should.equal(1);
            debug$3("Received message: %O", data);
            assert.deepEqual(data[0].body, msgBody);
            assert.strictEqual(data[0].properties.message_id, obj.properties.message_id);
        });
    });
    it("should be able to send a boolean as a message correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const partitionId = hubInfo.partitionIds[0];
            const msgBody = true;
            const obj = { body: msgBody };
            const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
            debug$3(`Partition ${partitionId} has last message with offset ${offset}.`);
            debug$3("Sending one message %O", obj);
            breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
            yield client.send(obj, partitionId);
            debug$3("Successfully sent the large message.");
            const data = yield breceiver.receive(5, 30);
            yield breceiver.close();
            debug$3("received message: ", data);
            should$4.exist(data);
            data.length.should.equal(1);
            debug$3("Received message: %O", data);
            assert.deepEqual(data[0].body, msgBody);
            should$4.not.exist((data[0].properties || {}).message_id);
        });
    });
    it("should be able to send and receive batched messages correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const partitionId = hubInfo.partitionIds[0];
                const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
                debug$3(`Partition ${partitionId} has last message with offset ${offset}.`);
                breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
                let data = yield breceiver.receive(5, 10);
                data.length.should.equal(0, "Unexpected to receive message before client sends it");
                const messageCount = 5;
                const d = [];
                for (let i = 0; i < messageCount; i++) {
                    const obj = { body: `Hello EH ${i}` };
                    d.push(obj);
                }
                d[0].partitionKey = 'pk1234656';
                yield client.sendBatch(d, partitionId);
                debug$3("Successfully sent 5 messages batched together.");
                data = yield breceiver.receive(5, 30);
                yield breceiver.close();
                debug$3("received message: ", data);
                should$4.exist(data);
                data.length.should.equal(5);
                for (const message of data) {
                    should$4.not.exist((message.properties || {}).message_id);
                }
            }
            catch (err) {
                debug$3("should not have happened, uber catch....", err);
                throw err;
            }
        });
    });
    it("should be able to send and receive batched messages as JSON objects correctly", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const partitionId = hubInfo.partitionIds[0];
                const offset = (yield client.getPartitionInformation(partitionId)).lastEnqueuedOffset;
                debug$3(`Partition ${partitionId} has last message with offset ${offset}.`);
                breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(offset) });
                let data = yield breceiver.receive(5, 10);
                data.length.should.equal(0, "Unexpected to receive message before client sends it");
                const messageCount = 5;
                const d = [];
                for (let i = 0; i < messageCount; i++) {
                    const obj = {
                        body: {
                            id: '123-456-789',
                            count: i,
                            weight: 10,
                            isBlue: true,
                            siblings: [
                                {
                                    id: '098-789-564',
                                    weight: 20,
                                    isBlue: false,
                                }
                            ]
                        },
                        properties: {
                            message_id: v4_1()
                        }
                    };
                    d.push(obj);
                }
                d[0].partitionKey = 'pk1234656';
                yield client.sendBatch(d, partitionId);
                debug$3("Successfully sent 5 messages batched together.");
                data = yield breceiver.receive(5, 30);
                yield breceiver.close();
                debug$3("received message: ", data);
                should$4.exist(data);
                data[0].body.count.should.equal(0);
                data.length.should.equal(5);
                for (const [index, message] of data.entries()) {
                    assert.strictEqual(message.properties.message_id, d[index].properties.message_id);
                }
            }
            catch (err) {
                debug$3("should not have happened, uber catch....", err);
                throw err;
            }
        });
    });
    it("should consistently send messages with partitionkey to a partitionId", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const msgToSendCount = 50;
            const partitionOffsets = {};
            debug$3("Discovering end of stream on each partition.");
            const partitionIds = hubInfo.partitionIds;
            for (const id of partitionIds) {
                const pInfo = yield client.getPartitionInformation(id);
                partitionOffsets[id] = pInfo.lastEnqueuedOffset;
                debug$3(`Partition ${id} has last message with offset ${pInfo.lastEnqueuedOffset}.`);
            }
            debug$3("Sending %d messages.", msgToSendCount);
            function getRandomInt(max) {
                return Math.floor(Math.random() * Math.floor(max));
            }
            for (let i = 0; i < msgToSendCount; i++) {
                const partitionKey = getRandomInt(10);
                yield client.send({ body: "Hello EventHub " + i, partitionKey: partitionKey.toString() });
            }
            debug$3("Starting to receive all messages from each partition.");
            const partitionMap = {};
            let totalReceived = 0;
            for (const id of partitionIds) {
                const data = yield client.receiveBatch(id, 50, 10, { eventPosition: EventPosition.fromOffset(partitionOffsets[id]) });
                debug$3(`Received ${data.length} messages from partition ${id}.`);
                for (const d of data) {
                    debug$3(">>>> _raw_amqp_mesage: ", d._raw_amqp_mesage);
                    const pk = d.partitionKey;
                    debug$3("pk: ", pk);
                    if (partitionMap[pk] && partitionMap[pk] !== id) {
                        debug$3(`#### Error: Received a message from partition ${id} with partition key ${pk}, whereas the same key was observed on partition ${partitionMap[pk]} before.`);
                        assert(partitionMap[pk] === id);
                    }
                    partitionMap[pk] = id;
                    debug$3("partitionMap ", partitionMap);
                }
                totalReceived += data.length;
            }
            totalReceived.should.equal(msgToSendCount);
        });
    });
}).timeout(60000);

// Copyright (c) Microsoft Corporation. All rights reserved.
const should$5 = chai$1.should();
chai$1.use(chaiAsPromised);
const debug$4 = debugModule("azure:event-hubs:receiver-spec");
main.config();
describe("EventHub Receiver", function () {
    const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
    const client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
    let breceiver;
    let hubInfo;
    before("validate environment", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            should$5.exist(process.env.EVENTHUB_CONNECTION_STRING, "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
            should$5.exist(process.env.EVENTHUB_NAME, "define EVENTHUB_NAME in your environment before running integration tests.");
            hubInfo = yield client.getHubRuntimeInformation();
        });
    });
    after("close the connection", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield client.close();
        });
    });
    afterEach("close the sender link", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (breceiver) {
                yield breceiver.close();
                debug$4("After each - Batching Receiver closed.");
            }
        });
    });
    describe("with partitionId 0 as number", function () {
        it("should work for receiveBatch", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const result = yield client.receiveBatch(0, 10, 20, { eventPosition: EventPosition.fromSequenceNumber(0) });
                should$5.equal(true, Array.isArray(result));
            });
        });
        it("should work for receive", function (done) {
            let rcvHandler;
            let stopCalled = false;
            const onError = (error) => {
                debug$4(">>>> An error occurred: %O", error);
            };
            const onMsg = (data) => {
                debug$4(">>>> Received Data: %O", data);
                if (!stopCalled) {
                    stopCalled = true;
                    rcvHandler.stop().then(() => {
                        done();
                    }).catch(() => {
                        done();
                    });
                }
            };
            rcvHandler = client.receive(0, onMsg, onError, { epoch: 1, eventPosition: EventPosition.fromOffset("0") });
        });
    });
    describe("with EventPosition specified as", function () {
        it("'from end of stream' should receive messages correctly", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const partitionId = hubInfo.partitionIds[0];
                for (let i = 0; i < 10; i++) {
                    const ed = {
                        body: "Hello awesome world " + i
                    };
                    yield client.send(ed, partitionId);
                    debug$4("sent message - " + i);
                }
                debug$4("Creating new receiver with offset EndOfStream");
                breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromEnd() });
                const data1 = yield breceiver.receive(10, 10);
                data1.length.should.equal(0, "Unexpected message received when using EventPosition.fromEnd()");
                // send a new message. We should only receive this new message.
                const uid = v4_1();
                const ed = {
                    body: "New message",
                    applicationProperties: {
                        stamp: uid
                    }
                };
                yield client.send(ed, partitionId);
                debug$4(">>>>>>> Sent the new message after creating the receiver. We should only receive this message.");
                const data2 = yield breceiver.receive(10, 20);
                debug$4("received messages: ", data2);
                data2.length.should.equal(1, "Failed to receive the expected one single message");
                data2[0].applicationProperties.stamp.should.equal(uid, "Message received with unexpected uid");
                debug$4("Next receive on this partition should not receive any messages.");
                const data3 = yield breceiver.receive(10, 10);
                data3.length.should.equal(0, "Unexpected message received");
            });
        });
        it("'after a particular offset' should receive messages correctly", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const partitionId = hubInfo.partitionIds[0];
                const pInfo = yield client.getPartitionInformation(partitionId);
                debug$4(`Creating new receiver with last enqueued offset: "${pInfo.lastEnqueuedOffset}".`);
                breceiver = BatchingReceiver.create(client._context, parseInt(partitionId), { eventPosition: EventPosition.fromOffset(pInfo.lastEnqueuedOffset) });
                debug$4("Establishing the receiver link...");
                const d = yield breceiver.receive(10, 10);
                d.length.should.equal(0);
                // send a new message. We should only receive this new message.
                const uid = v4_1();
                const ed = {
                    body: "New message after last enqueued offset",
                    applicationProperties: {
                        stamp: uid
                    }
                };
                yield client.send(ed, "0");
                debug$4("Sent the new message after creating the receiver. We should only receive this message.");
                const data = yield breceiver.receive(10, 20);
                debug$4("received messages: ", data);
                data.length.should.equal(1);
                data[0].applicationProperties.stamp.should.equal(uid);
                debug$4("Next receive on this partition should not receive any messages.");
                const data2 = yield breceiver.receive(10, 10);
                data2.length.should.equal(0);
            });
        });
        it("'after a particular offset with isInclusive true' should receive messages correctly", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const partitionId = hubInfo.partitionIds[0];
                const uid = v4_1();
                const ed = {
                    body: "New message after last enqueued offset",
                    applicationProperties: {
                        stamp: uid
                    }
                };
                yield client.send(ed, partitionId);
                debug$4(`Sent message 1 with stamp: ${uid}.`);
                const pInfo = yield client.getPartitionInformation(partitionId);
                const uid2 = v4_1();
                const ed2 = {
                    body: "New message after last enqueued offset",
                    applicationProperties: {
                        stamp: uid2
                    }
                };
                yield client.send(ed2, partitionId);
                debug$4(`Sent message 2 with stamp: ${uid} after getting the enqueued offset.`);
                debug$4(`Creating new receiver with last enqueued offset: "${pInfo.lastEnqueuedOffset}".`);
                breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromOffset(pInfo.lastEnqueuedOffset, true) });
                debug$4("We should receive the last 2 messages.");
                const data = yield breceiver.receive(10, 30);
                debug$4("received messages: ", data);
                data.length.should.equal(2, "Failed to receive the two expected messages");
                data[0].applicationProperties.stamp.should.equal(uid, "First message has unexpected uid");
                data[1].applicationProperties.stamp.should.equal(uid2, "Second message has unexpected uid");
                debug$4("Next receive on this partition should not receive any messages.");
                const data2 = yield breceiver.receive(10, 10);
                data2.length.should.equal(0, "Unexpected message received");
            });
        });
        it("'from a particular enqueued time' should receive messages correctly", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const partitionId = hubInfo.partitionIds[0];
                const pInfo = yield client.getPartitionInformation(partitionId);
                debug$4(`Creating new receiver with last enqueued time: "${pInfo.lastEnqueuedTimeUtc}".`);
                breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromEnqueuedTime(pInfo.lastEnqueuedTimeUtc) });
                debug$4("Establishing the receiver link...");
                const d = yield breceiver.receive(10, 10);
                d.length.should.equal(0, "Unexpected message received before sending any message");
                // send a new message. We should only receive this new message.
                const uid = v4_1();
                const ed = {
                    body: "New message after last enqueued time " + pInfo.lastEnqueuedTimeUtc,
                    applicationProperties: {
                        stamp: uid
                    }
                };
                yield client.send(ed, partitionId);
                debug$4("Sent the new message after creating the receiver. We should only receive this message.");
                const data = yield breceiver.receive(10, 20);
                debug$4("received messages: ", data);
                data.length.should.equal(1, "Failed to received the expected single message");
                data[0].applicationProperties.stamp.should.equal(uid);
                debug$4("Next receive on this partition should not receive any messages.");
                const data2 = yield breceiver.receive(10, 10);
                data2.length.should.equal(0, "Unexpected message received");
            });
        });
        it("'after the particular sequence number' should receive messages correctly", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const partitionId = hubInfo.partitionIds[0];
                const pInfo = yield client.getPartitionInformation(partitionId);
                // send a new message. We should only receive this new message.
                const uid = v4_1();
                const ed = {
                    body: "New message after last enqueued sequence number " + pInfo.lastSequenceNumber,
                    applicationProperties: {
                        stamp: uid
                    }
                };
                yield client.send(ed, partitionId);
                debug$4("Sent the new message after getting the partition runtime information. We should only receive this message.");
                debug$4(`Creating new receiver with last enqueued sequence number: "${pInfo.lastSequenceNumber}".`);
                breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromSequenceNumber(pInfo.lastSequenceNumber) });
                const data = yield breceiver.receive(10, 20);
                debug$4("received messages: ", data);
                data.length.should.equal(1, "Failed to receive the expected single message");
                data[0].applicationProperties.stamp.should.equal(uid, "Received message has unexpected uid");
                debug$4("Next receive on this partition should not receive any messages.");
                const data2 = yield breceiver.receive(10, 10);
                data2.length.should.equal(0, "Unexpected message received");
            });
        });
        it("'after the particular sequence number' with isInclusive true should receive messages correctly", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const partitionId = hubInfo.partitionIds[0];
                const uid = v4_1();
                const ed = {
                    body: "New message before getting the last sequence number",
                    applicationProperties: {
                        stamp: uid
                    }
                };
                yield client.send(ed, partitionId);
                debug$4(`Sent message 1 with stamp: ${uid}.`);
                const pInfo = yield client.getPartitionInformation(partitionId);
                const uid2 = v4_1();
                const ed2 = {
                    body: "New message after the last enqueued offset",
                    applicationProperties: {
                        stamp: uid2
                    }
                };
                yield client.send(ed2, partitionId);
                debug$4(`Sent message 2 with stamp: ${uid}.`);
                debug$4(`Creating new receiver with last sequence number: "${pInfo.lastSequenceNumber}".`);
                breceiver = BatchingReceiver.create(client._context, partitionId, { eventPosition: EventPosition.fromSequenceNumber(pInfo.lastSequenceNumber, true) });
                debug$4("We should receive the last 2 messages.");
                const data = yield breceiver.receive(10, 30);
                debug$4("received messages: ", data);
                data.length.should.equal(2, "Failed to received two expected messages");
                data[0].applicationProperties.stamp.should.equal(uid, "Message 1 has unexpected uid");
                data[1].applicationProperties.stamp.should.equal(uid2, "Message 2 has unexpected uid");
                debug$4("Next receive on this partition should not receive any messages.");
                const data2 = yield breceiver.receive(10, 10);
                data2.length.should.equal(0, "Unexpected message received");
            });
        });
    });
    describe("in batch mode", function () {
        it("should receive messages correctly", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const partitionId = hubInfo.partitionIds[0];
                const data = yield client.receiveBatch(partitionId, 5, 10);
                debug$4("received messages: ", data);
                data.length.should.equal(5, "Failed to receive five expected messages");
            });
        });
    });
    // describe("with receiverRuntimeMetricEnabled", function (): void {
    //   it("should have ReceiverRuntimeInfo populated", async function (): Promise<void> {
    //     const partitionId = hubInfo.partitionIds[0];
    //     sender = client.createSender(partitionId);
    //     for (let i = 0; i < 10; i++) {
    //       const ed: EventData = {
    //         body: "Hello awesome world " + i
    //       }
    //       await sender.send(ed);
    //       debug("sent message - " + i);
    //     }
    //     debug("Getting the partition information");
    //     const pInfo = await client.getPartitionInformation(partitionId);
    //     debug("partition info: ", pInfo);
    //     debug("Creating new receiver with offset EndOfStream");
    //     receiver = client.createReceiver(partitionId, { eventPosition: EventPosition.fromStart(), enableReceiverRuntimeMetric: true });
    //     let data = await receiver.receive(1, 10);
    //     debug("receiver.runtimeInfo ", receiver.runtimeInfo);
    //     data.length.should.equal(1);
    //     should.exist(receiver.runtimeInfo);
    //     receiver.runtimeInfo!.lastEnqueuedOffset!.should.equal(pInfo.lastEnqueuedOffset);
    //     receiver.runtimeInfo!.lastSequenceNumber!.should.equal(pInfo.lastSequenceNumber);
    //     receiver.runtimeInfo!.lastEnqueuedTimeUtc!.getTime().should.equal(pInfo.lastEnqueuedTimeUtc.getTime());
    //     receiver.runtimeInfo!.partitionId!.should.equal(pInfo.partitionId);
    //     receiver.runtimeInfo!.retrievalTime!.getTime().should.be.greaterThan(Date.now() - 60000);
    //   });
    // });
    describe("with epoch", function () {
        it("should behave correctly when a receiver with lower epoch value is connected after a receiver with higher epoch value to a partition in a consumer group", function (done) {
            const partitionId = hubInfo.partitionIds[0];
            let epochRcvr1;
            let epochRcvr2;
            const onError = (error) => {
                debug$4(">>>> epoch Receiver 1", error);
                throw new Error("An Error should not have happened for epoch receiver with epoch value 2.");
            };
            const onMsg = (data) => {
                debug$4(">>>> epoch Receiver 1", data);
            };
            epochRcvr1 = client.receive(partitionId, onMsg, onError, { epoch: 2, eventPosition: EventPosition.fromEnd() });
            debug$4("Created epoch receiver 1 %s", epochRcvr1.name);
            setTimeout(() => {
                const onError2 = (error) => {
                    debug$4(">>>> epoch Receiver 2", error);
                    should$5.exist(error);
                    should$5.equal(error.name, "ReceiverDisconnectedError");
                    epochRcvr2.stop()
                        .then(() => epochRcvr1.stop())
                        .then(() => {
                        debug$4("Successfully closed the epoch receivers 1 and 2.");
                        done();
                    })
                        .catch((err) => {
                        debug$4("error occurred while closing the receivers... ", err);
                        done();
                    });
                };
                const onMsg2 = (data) => {
                    debug$4(">>>> epoch Receiver 2", data);
                };
                epochRcvr2 = client.receive(partitionId, onMsg2, onError2, { epoch: 1, eventPosition: EventPosition.fromEnd() });
                debug$4("Created epoch receiver 2 %s", epochRcvr2.name);
            }, 3000);
        });
        it("should behave correctly when a receiver with higher epoch value is connected after a receiver with lower epoch value to a partition in a consumer group", function (done) {
            const partitionId = hubInfo.partitionIds[0];
            let epochRcvr1;
            let epochRcvr2;
            const onError = (error) => {
                debug$4(">>>> epoch Receiver 1", error);
                should$5.exist(error);
                should$5.equal(error.name, "ReceiverDisconnectedError");
                epochRcvr1.stop()
                    .then(() => epochRcvr2.stop())
                    .then(() => {
                    debug$4("Successfully closed the epoch receivers 1 and 2.");
                    done();
                })
                    .catch((err) => {
                    debug$4("error occurred while closing the receivers... ", err);
                    done();
                });
            };
            const onMsg = (data) => {
                debug$4(">>>> epoch Receiver 1", data);
            };
            epochRcvr1 = client.receive(partitionId, onMsg, onError, { epoch: 1, eventPosition: EventPosition.fromEnd() });
            debug$4("Created epoch receiver 1 %s", epochRcvr1.name);
            setTimeout(() => {
                const onError2 = (error) => {
                    debug$4(">>>> epoch Receiver 2", error);
                    throw new Error("An Error should not have happened for epoch receiver with epoch value 2.");
                };
                const onMsg2 = (data) => {
                    debug$4(">>>> epoch Receiver 2", data);
                };
                epochRcvr2 = client.receive(partitionId, onMsg2, onError2, { epoch: 2, eventPosition: EventPosition.fromEnd() });
                debug$4("Created epoch receiver 2 %s", epochRcvr2.name);
            }, 3000);
        });
        it("should behave correctly when a non epoch receiver is created after an epoch receiver", function (done) {
            const partitionId = hubInfo.partitionIds[0];
            let epochRcvr;
            let nonEpochRcvr;
            const onerr1 = (error) => {
                debug$4(">>>> epoch Receiver ", error);
                throw new Error("An Error should not have happened for epoch receiver with epoch value 1.");
            };
            const onmsg1 = (data) => {
                debug$4(">>>> epoch Receiver ", data);
            };
            epochRcvr = client.receive(partitionId, onmsg1, onerr1, { epoch: 1, eventPosition: EventPosition.fromEnd() });
            debug$4("Created epoch receiver %s", epochRcvr.name);
            const onerr2 = (error) => {
                debug$4(">>>> non epoch Receiver", error);
                should$5.exist(error);
                should$5.equal(error.name, "ReceiverDisconnectedError");
                nonEpochRcvr.stop()
                    .then(() => epochRcvr.stop())
                    .then(() => {
                    debug$4("Successfully closed the nonEpoch and epoch receivers");
                    done();
                })
                    .catch((err) => {
                    debug$4("error occurred while closing the receivers... ", err);
                    done();
                });
            };
            const onmsg2 = (data) => {
                debug$4(">>>> non epoch Receiver", data);
            };
            nonEpochRcvr = client.receive(partitionId, onmsg2, onerr2, { eventPosition: EventPosition.fromEnd() });
            debug$4("Created non epoch receiver %s", nonEpochRcvr.name);
        });
        it("should behave correctly when an epoch receiver is created after a non epoch receiver", function (done) {
            const partitionId = hubInfo.partitionIds[0];
            let epochRcvr;
            let nonEpochRcvr;
            const onerr3 = (error) => {
                debug$4(">>>> non epoch Receiver", error);
                should$5.exist(error);
                should$5.equal(error.name, "ReceiverDisconnectedError");
                nonEpochRcvr.stop()
                    .then(() => epochRcvr.stop())
                    .then(() => {
                    debug$4("Successfully closed the nonEpoch and epoch receivers");
                    done();
                })
                    .catch((err) => {
                    debug$4("error occurred while closing the receivers... ", err);
                    done();
                });
            };
            const onmsg3 = (data) => {
                debug$4(">>>> non epoch Receiver", data);
            };
            nonEpochRcvr = client.receive(partitionId, onmsg3, onerr3, { eventPosition: EventPosition.fromEnd() });
            debug$4("Created non epoch receiver %s", nonEpochRcvr.name);
            setTimeout(() => {
                const onerr4 = (error) => {
                    debug$4(">>>> epoch Receiver ", error);
                    throw new Error("OnErr4 >> An Error should not have happened for epoch receiver with epoch value 1.");
                };
                const onmsg4 = (data) => {
                    debug$4(">>>> epoch Receiver ", data);
                };
                epochRcvr = client.receive(partitionId, onmsg4, onerr4, { epoch: 1, eventPosition: EventPosition.fromEnd() });
                debug$4("Created epoch receiver %s", epochRcvr.name);
            }, 3000);
        });
    });
    describe("Negative scenarios", function () {
        describe("on invalid partition ids like", function () {
            const invalidIds = ["XYZ", "-1", "1000", "-"];
            invalidIds.forEach(function (id) {
                it(`"${id}" should throw an error`, function () {
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        try {
                            debug$4("Created receiver and will be receiving messages from partition id ...", id);
                            const d = yield client.receiveBatch(id, 10, 3);
                            debug$4("received messages ", d.length);
                        }
                        catch (err) {
                            debug$4("Receiver received an error", err);
                            should$5.exist(err);
                            err.message.should.match(/.*The specified partition is invalid for an EventHub partition sender or receiver.*/ig);
                        }
                    });
                });
            });
            it(`" " should throw an invalid EventHub address error`, function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    try {
                        const id = " ";
                        debug$4("Created receiver and will be receiving messages from partition id ...", id);
                        const d = yield client.receiveBatch(id, 10, 3);
                        debug$4("received messages ", d.length);
                    }
                    catch (err) {
                        debug$4("Receiver received an error", err);
                        should$5.exist(err);
                        err.message.should.match(/.*Invalid EventHub address. It must be either of the following.*/ig);
                    }
                });
            });
            const invalidIds2 = [""];
            invalidIds2.forEach(function (id) {
                it(`"${id}" should throw an error`, function () {
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        try {
                            yield client.receiveBatch(id, 10, 3);
                        }
                        catch (err) {
                            debug$4(`>>>> Received error - `, err);
                            should$5.exist(err);
                        }
                    });
                });
            });
        });
        it("should receive 'QuotaExceededError' when attempting to connect more than 5 receivers to a partition in a consumer group", function (done) {
            const partitionId = hubInfo.partitionIds[0];
            const rcvHndlrs = [];
            const rcvrs = [];
            debug$4(">>> Receivers length: ", rcvHndlrs.length);
            for (let i = 1; i <= 5; i++) {
                const rcvrId = `rcvr-${i}`;
                debug$4(rcvrId);
                const onMsg = (data) => {
                    if (!rcvrs[i]) {
                        rcvrs[i] = rcvrId;
                        debug$4("receiver id %s", rcvrId);
                    }
                };
                const onError = (err) => {
                    debug$4("@@@@ Error received by receiver %s", rcvrId);
                    debug$4(err);
                };
                const rcvHndlr = client.receive(partitionId, onMsg, onError, { eventPosition: EventPosition.fromStart(), identifier: rcvrId });
                rcvHndlrs.push(rcvHndlr);
            }
            debug$4(">>> Attached message handlers to each receiver.");
            setTimeout(() => {
                debug$4(`Created 6th receiver - "rcvr-6"`);
                const onmsg2 = (data) => {
                    // debug(data);
                };
                const onerr2 = (err) => {
                    debug$4("@@@@ Error received by receiver rcvr-6");
                    debug$4(err);
                    should$5.equal(err.name, "QuotaExceededError");
                    const promises = [];
                    for (const rcvr of rcvHndlrs) {
                        promises.push(rcvr.stop());
                    }
                    Promise.all(promises).then(() => {
                        debug$4("Successfully closed all the receivers..");
                        done();
                    }).catch((err) => {
                        debug$4("An error occurred while closing the receiver in the 'QuotaExceededError' test.", err);
                        done();
                    });
                };
                const failedRcvHandler = client.receive(partitionId, onmsg2, onerr2, { eventPosition: EventPosition.fromStart(), identifier: "rcvr-6" });
                rcvHndlrs.push(failedRcvHandler);
            }, 5000);
        });
    });
}).timeout(90000);

// Copyright (c) Microsoft Corporation. All rights reserved.
const should$6 = chai$1.should();
chai$1.use(chaiAsPromised);
const debug$5 = debugModule("azure:event-hubs:sender-spec");
main.config();
describe("EventHub Sender", function () {
    const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
    const client = EventHubClient.createFromConnectionString(service.connectionString, service.path);
    before("validate environment", function () {
        should$6.exist(process.env.EVENTHUB_CONNECTION_STRING, "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
        should$6.exist(process.env.EVENTHUB_NAME, "define EVENTHUB_NAME in your environment before running integration tests.");
    });
    after("close the connection", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            debug$5("Closing the client..");
            yield client.close();
        });
    });
    describe("Single message", function () {
        it("should be sent successfully.", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const data = {
                    body: "Hello World"
                };
                const delivery = yield client.send(data);
                // debug(delivery);
                delivery.format.should.equal(0);
                delivery.settled.should.equal(true);
                delivery.remote_settled.should.equal(true);
            });
        });
        it("with partition key should be sent successfully.", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const data = {
                    body: "Hello World with partition key",
                    partitionKey: "p1234"
                };
                const delivery = yield client.send(data);
                // debug(delivery);
                delivery.format.should.equal(0);
                delivery.settled.should.equal(true);
                delivery.remote_settled.should.equal(true);
            });
        });
        it("should be sent successfully to a specific partition.", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const data = {
                    body: "Hello World"
                };
                const delivery = yield client.send(data, "0");
                // debug(delivery);
                delivery.format.should.equal(0);
                delivery.settled.should.equal(true);
                delivery.remote_settled.should.equal(true);
            });
        });
    });
    describe("Batch message", function () {
        it("should be sent successfully.", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const data = [
                    {
                        body: "Hello World 1"
                    },
                    {
                        body: "Hello World 2"
                    }
                ];
                const delivery = yield client.sendBatch(data);
                // debug(delivery);
                delivery.format.should.equal(0x80013700);
                delivery.settled.should.equal(true);
                delivery.remote_settled.should.equal(true);
            });
        });
        it("with partition key should be sent successfully.", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const data = [
                    {
                        body: "Hello World 1",
                        partitionKey: "p1234"
                    },
                    {
                        body: "Hello World 2"
                    }
                ];
                const delivery = yield client.sendBatch(data);
                // debug(delivery);
                delivery.format.should.equal(0x80013700);
                delivery.settled.should.equal(true);
                delivery.remote_settled.should.equal(true);
            });
        });
        it("should be sent successfully to a specific partition.", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const data = [
                    {
                        body: "Hello World 1"
                    },
                    {
                        body: "Hello World 2"
                    }
                ];
                const delivery = yield client.sendBatch(data, "0");
                // debug(delivery);
                delivery.format.should.equal(0x80013700);
                delivery.settled.should.equal(true);
                delivery.remote_settled.should.equal(true);
            });
        });
    });
    describe("Multiple messages", function () {
        it("should be sent successfully in parallel", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const promises = [];
                for (let i = 0; i < 5; i++) {
                    promises.push(client.send({ body: `Hello World ${i}` }));
                }
                const result = yield Promise.all(promises);
                for (let i = 0; i < result.length; i++) {
                    const delivery = result[i];
                    // debug("delivery %d: %O", i, delivery);
                    delivery.format.should.equal(0);
                    delivery.settled.should.equal(true);
                    delivery.remote_settled.should.equal(true);
                }
            });
        });
        it("should be sent successfully in parallel by multiple senders", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const senderCount = 3;
                try {
                    const promises = [];
                    for (let i = 0; i < senderCount; i++) {
                        if (i === 0) {
                            debug$5(">>>>> Sending a message to partition %d", i);
                            promises.push(client.send({ body: `Hello World ${i}` }, i));
                        }
                        else if (i === 1) {
                            debug$5(">>>>> Sending a message to partition %d", i);
                            promises.push(client.send({ body: `Hello World ${i}` }, i));
                        }
                        else {
                            debug$5(">>>>> Sending a message to the hub when i == %d", i);
                            promises.push(client.send({ body: `Hello World ${i}` }));
                        }
                    }
                    const result = yield Promise.all(promises);
                    for (let i = 0; i < result.length; i++) {
                        const delivery = result[i];
                        // debug("delivery %d: %O", i, delivery);
                        delivery.format.should.equal(0);
                        delivery.settled.should.equal(true);
                        delivery.remote_settled.should.equal(true);
                    }
                }
                catch (err) {
                    debug$5("An error occurred while running the test: ", err);
                    throw err;
                }
            });
        });
        it("should fail when a message greater than 256 KB is sent and succeed when a normal message is sent after that on the same link.", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const data = {
                    body: Buffer.from("Z".repeat(300000))
                };
                try {
                    debug$5("Sendina message of 300KB...");
                    yield client.send(data, "0");
                }
                catch (err) {
                    debug$5(err);
                    should$6.exist(err);
                    should$6.equal(err.name, "MessageTooLargeError");
                    err.message.should.match(/.*The received message \(delivery-id:(\d+), size:3000\d\d bytes\) exceeds the limit \(262144 bytes\) currently allowed on the link\..*/ig);
                }
                const delivery = yield client.send({ body: "Hello World EventHub!!" }, "0");
                debug$5("Sent the message successfully on the same link..");
                delivery.format.should.equal(0);
                delivery.settled.should.equal(true);
                delivery.remote_settled.should.equal(true);
            });
        });
    });
    describe("Negative scenarios", function () {
        it("a message greater than 256 KB should fail.", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const data = {
                    body: Buffer.from("Z".repeat(300000))
                };
                try {
                    yield client.send(data);
                }
                catch (err) {
                    debug$5(err);
                    should$6.exist(err);
                    should$6.equal(err.name, "MessageTooLargeError");
                    err.message.should.match(/.*The received message \(delivery-id:(\d+), size:3000\d\d bytes\) exceeds the limit \(262144 bytes\) currently allowed on the link\..*/ig);
                }
            });
        });
        it.only("Error thrown when the 'partitionKey' is not of type 'string'", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const data = {
                    body: "Hello World",
                    partitionKey: 1
                };
                try {
                    yield client.send(data, "0");
                }
                catch (err) {
                    debug$5(err);
                    should$6.exist(err);
                    err.message.should.match(/.*'partitionKey' must be of type 'string'.*/ig);
                }
            });
        });
        describe("on invalid partition ids like", function () {
            // tslint:disable-next-line: no-null-keyword
            const invalidIds = ["XYZ", "-1", "1000", "-", null];
            invalidIds.forEach(function (id) {
                it(`"${id}" should throw an error`, function () {
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        try {
                            debug$5("Created sender and will be sending a message to partition id ...", id);
                            yield client.send({ body: "Hello world!" }, id);
                            debug$5("sent the message.");
                        }
                        catch (err) {
                            debug$5(`>>>> Received error for invalid partition id "${id}" - `, err);
                            should$6.exist(err);
                            err.message.should.match(/.*The specified partition is invalid for an EventHub partition sender or receiver.*/ig);
                        }
                    });
                });
            });
            const invalidIds2 = ["", " "];
            invalidIds2.forEach(function (id) {
                it(`"${id}" should throw an invalid EventHub address error`, function () {
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        try {
                            debug$5("Created sender and will be sending a message to partition id ...", id);
                            yield client.send({ body: "Hello world!" }, id);
                            debug$5("sent the message.");
                        }
                        catch (err) {
                            debug$5(`>>>> Received invalid EventHub address error for partition id "${id}" - `, err);
                            should$6.exist(err);
                            err.message.should.match(/.*Invalid EventHub address. It must be either of the following.*/ig);
                        }
                    });
                });
            });
        });
    });
}).timeout(20000);
//# sourceMappingURL=index.js.map
