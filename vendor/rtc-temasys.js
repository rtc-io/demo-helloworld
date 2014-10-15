!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),(f.RTC||(f.RTC={})).Temasys=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
exports.mimetype = 'application/x-temwebrtcplugin';

exports.genId = function() {
  return Math.random().toString(36).slice(2);
};

},{}],3:[function(require,module,exports){
/* jshint node: true */
'use strict';

var crel = require('crel');
var config = require('./config');
var loader = require('./loader');

/**
  # rtc-plugin-temasys

  This is an experimental plugin for bridging the functionality provided by
  the [Temasys IE plugin](http://bit.ly/1lnlEIK) into the rtc.io module
  suite.

  ## Example Usage (Capture)

  A simple capture example is shown below:

  <<< examples/capture.js

  ## Example Usage (Conferencing)

  A slightly more complicated example demonstrating conferencing between
  machines is displayed below.

  <<< examples/conference.js

  ## Reference

  Documented below is an number of plugin functions that are used to
  both determine plugin suitability for a browser / platform and also
  ensure that the plugin is correctly loaded into the HTML document.

**/

/**
  ### supported(platform) => Boolean

  The supported function returns true if the platform (as detected using
  `rtc-core/detect`) is compatible with the plugin. By doing this prelimenary
  detection you can specify a number of plugins to be loaded but only
  the first the is supported on the current platform will be used.

**/
exports.supported = function(platform) {
  return ['ie', 'safari'].indexOf(platform.browser.toLowerCase()) >= 0;
};

/**
  ### init(opts, callback)

  The `init` function is reponsible for ensuring that the current HTML
  document is prepared correctly.

**/
var init = exports.init = function(opts, callback) {
  if (loader.plugin) {
    return callback(null, loader.plugin);
  }

  loader.once('init', function() {
    callback(null, loader.plugin);
  });
};

exports.attach = function(stream, opts) {
  var element = (opts || {}).el;

  // determine whether we are dealing with a target we need to replace
  // or a container
  var shouldReplace = (element instanceof HTMLVideoElement) ||
      (element instanceof HTMLAudioElement);

  // if we should replace the element, then find the parent
  var container = shouldReplace ? element.parentNode : element;
  var rendererId = config.genId();
  var params = [
    { name: 'pluginId', value: rendererId },
    { name: 'pageId', value: loader.pageId },
    { name: 'windowless', value: true }
  ];

  function createRenderSurface(stream) {
    var renderParams = params.concat([{ name: 'streamId', value: stream.id }]);
    var renderer = crel('object', {
      id: rendererId,
      type: config.mimetype
    });

    var el = crel('div', renderer);

    stream.enableSoundTracks(true);

    // initialise the params we will inject into the renderer
    renderParams.forEach(function(data) {
      renderer.appendChild(crel('param', data));
    });

    // TODO: make these sensible
    renderer.width = 640;
    renderer.height = 320;

    // inject the renderer into the dom
    if (shouldReplace) {
      container.insertBefore(el);
      container.removeChild(element);
    }

    return el;
  }

  return createRenderSurface(stream);
};

/**
  ### attachStream(stream, bindings)

**/
exports.attachStream = function(stream, bindings) {
  // get the elements
  var createRenderSurfaces = bindings.map(function(binding) {
    return typeof binding.el == 'function' && binding.el;
  }).filter(Boolean);

  stream.enableSoundTracks(true);

  // set the stream id for each of the matching elements
  createRenderSurfaces.forEach(function(fn) {
    fn(stream);
  });
};

/**
  ### prepareElement(opts, element) => HTMLElement

  The `prepareElement` function is used to prepare the video container
  for receiving a video stream.  If the plugin is able to work with
  standard `<video>` and `<audio>` elements then a plugin should simply
  not implement this function.

**/
exports.prepareElement = function(opts, element) {

};

/* peer connection plugin interfaces */

exports.createIceCandidate = function(opts) {
  return loader.plugin && loader.plugin.ConstructIceCandidate(
    (opts || {}).sdpMid || '',
    (opts || {}).sdpMLineIndex,
    (opts || {}).candidate
  );
};

exports.createConnection = function(config, constraints) {
  return loader.plugin && loader.plugin.PeerConnection(
    loader.pageId,
    (config || {}).iceServers || [],
    (constraints || {}).mandatory || null,
    (constraints || {}).optional || null
  );
};

exports.createSessionDescription = function(opts) {
  return loader.plugin && loader.plugin.ConstructSessionDescription(opts.type, opts.sdp);
};

},{"./config":2,"./loader":4,"crel":5}],4:[function(require,module,exports){
var crel = require('crel');
var config = require('./config');
var EventEmitter = require('events').EventEmitter;
var loader = module.exports = new EventEmitter();

// initialise the loader plugin id
var pluginId = loader.pluginId = '__temasys_plugin_' + config.genId();

// initialise the loader pageid
var pageId = loader.pageId = config.genId();

// patch in the onload handler into the window object
window['__load' + pluginId] = function() {
  // deference the window handler
  window['__load' + pluginId] = undefined;

  // if the plugin instance hasn't been bound the abort
  if (! loader.plugin) {
    return;
  }

  // set the plugin page id
  loader.plugin.setPluginId(pageId, pluginId);
  loader.plugin.setLogFunction(console);

  // patch navigator getUserMedia function to the plugin
  navigator.getUserMedia = getUserMedia;
  loader.emit('init');
};

function createPlugin() {
  var plugin = crel('object', {
    width: 0,
    height: 0,
    type: config.mimetype,
    id: pluginId
  });

  var params = [
    { name: 'onload', value: '__load' + pluginId },
    { name: 'pluginId', value: pluginId },
    { name: 'windowless', value: false },
    { name: 'pageId', value: pageId }
  ];

  // create the plugin parameters
  params.forEach(function(data) {
    plugin.appendChild(crel('param', data));
  });

  // add the plugin to the document body
  document.body.appendChild(plugin);
  return plugin;
}

function getUserMedia(constraints, successCb, failureCb) {
  if (! loader.plugin) {
    return failureCb && failureCb(new Error('plugin not loaded'));
  }

  loader.plugin.getUserMedia.call(
    loader.plugin,
    constraints,
    function(stream) {
      if (typeof successCb == 'function') {
        successCb(stream);
      }
    },
    function(err) {
      if (typeof failureCb == 'function') {
        failureCb(err);
      }
    }
  );
}

window.addEventListener('load', function() {
  loader.plugin = createPlugin(); // document.querySelector('object[type="' + config.mimetype + '"]');
});

},{"./config":2,"crel":5,"events":1}],5:[function(require,module,exports){
//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/*

    This code is not formatted for readability, but rather run-speed and to assist compilers.

    However, the code's intention should be transparent.

    *** IE SUPPORT ***

    If you require this library to work in IE7, add the following after declaring crel.

    var testDiv = document.createElement('div'),
        testLabel = document.createElement('label');

    testDiv.setAttribute('class', 'a');
    testDiv['className'] !== 'a' ? crel.attrMap['class'] = 'className':undefined;
    testDiv.setAttribute('name','a');
    testDiv['name'] !== 'a' ? crel.attrMap['name'] = function(element, value){
        element.id = value;
    }:undefined;


    testLabel.setAttribute('for', 'a');
    testLabel['htmlFor'] !== 'a' ? crel.attrMap['for'] = 'htmlFor':undefined;



*/

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.crel = factory();
    }
}(this, function () {
    var fn = 'function',
        obj = 'object',
        isType = function(a, type){
            return typeof a === type;
        },
        isNode = typeof Node === fn ? function (object) {
            return object instanceof Node;
        } :
        // in IE <= 8 Node is an object, obviously..
        function(object){
            return object &&
                isType(object, obj) &&
                ('nodeType' in object) &&
                isType(object.ownerDocument,obj);
        },
        isElement = function (object) {
            return crel.isNode(object) && object.nodeType === 1;
        },
        isArray = function(a){
            return a instanceof Array;
        },
        appendChild = function(element, child) {
          if(!isNode(child)){
              child = document.createTextNode(child);
          }
          element.appendChild(child);
        };


    function crel(){
        var args = arguments, //Note: assigned to a variable to assist compilers. Saves about 40 bytes in closure compiler. Has negligable effect on performance.
            element = args[0],
            child,
            settings = args[1],
            childIndex = 2,
            argumentsLength = args.length,
            attributeMap = crel.attrMap;

        element = crel.isElement(element) ? element : document.createElement(element);
        // shortcut
        if(argumentsLength === 1){
            return element;
        }

        if(!isType(settings,obj) || crel.isNode(settings) || isArray(settings)) {
            --childIndex;
            settings = null;
        }

        // shortcut if there is only one child that is a string
        if((argumentsLength - childIndex) === 1 && isType(args[childIndex], 'string') && element.textContent !== undefined){
            element.textContent = args[childIndex];
        }else{
            for(; childIndex < argumentsLength; ++childIndex){
                child = args[childIndex];

                if(child == null){
                    continue;
                }

                if (isArray(child)) {
                  for (var i=0; i < child.length; ++i) {
                    appendChild(element, child[i]);
                  }
                } else {
                  appendChild(element, child);
                }
            }
        }

        for(var key in settings){
            if(!attributeMap[key]){
                element.setAttribute(key, settings[key]);
            }else{
                var attr = crel.attrMap[key];
                if(typeof attr === fn){
                    attr(element, settings[key]);
                }else{
                    element.setAttribute(attr, settings[key]);
                }
            }
        }

        return element;
    }

    // Used for mapping one kind of attribute to the supported version of that in bad browsers.
    // String referenced so that compilers maintain the property name.
    crel['attrMap'] = {};

    // String referenced so that compilers maintain the property name.
    crel["isElement"] = isElement;
    crel["isNode"] = isNode;

    return crel;
}));

},{}]},{},[3])(3)
});


//# sourceMappingURL=rtc-temasys.js.map