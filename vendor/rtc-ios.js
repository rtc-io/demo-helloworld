!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),(f.RTC||(f.RTC={})).IOS=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* jshint node: true */
'use strict';

var ProxyMediaStream = require('rtc-proxy/mediastream');
var ProxyPeerConnection = require('rtc-proxy/peerconnection');
var reNICTAUserAgent = /\(iOS\;.*Mobile\/NICTA/;
var deviceReady = false;
var initialized = false;

/**
  # rtc-plugin-nicta-ios

  This is an experimental plugin for bridging the functionality provided
  an in-progress NICTA iOS webkit plugin.  While this plugin integration
  layer is provided opensource the iOS plugin is a commercial project
  currently under development.

  ## Getting More Information

  If you are after more information regarding the plugin feel free to
  reach out to either of the following people, and we will do our best
  to answer your questions:

  - Damon Oehlman <damon.oehlman@nicta.com.au>
  - Silvia Pfeiffer <silvia.pfeiffer@nicta.com.au>

**/

/**
  ### supported(platform) => Boolean

  The supported function returns true if the platform (as detected using
  `rtc-core/detect`) is compatible with the plugin. By doing this prelimenary
  detection you can specify a number of plugins to be loaded but only
  the first the is supported on the current platform will be used.

**/
exports.supported = function(platform) {
  return typeof navigator != 'undefined' && reNICTAUserAgent.test(navigator.userAgent);
};

/**
  ### init(callback)

  The `init` function is reponsible for ensuring that the current HTML
  document is prepared correctly.

**/
var init = exports.init = function(opts, callback) {
  function ready(evt) {
    var oldLogger;

    if (initialized) {
      return callback();
    }

    document.removeEventListener('deviceready', ready);

    // override the console.log implementation to report back to the iOS console
    oldLogger = window.console.log;
    window.console.log = function(msg) {
      var nativeMessage = [].slice.call(arguments).join(' ');

      try {
        NativeLog(nativeMessage);
      }
      catch (e) {
        alert(nativeMessage);
      }

      oldLogger.apply(window.console, arguments);
    };

    if (typeof getUserMedia == 'function') {
      navigator.getUserMedia = function(constraints, successCb, failureCb) {
        getUserMedia(constraints, function(stream) {
          successCb(new ProxyMediaStream(stream));
        }, failureCb);
      };
    }

    initialized = true;
    console.log('iOS plugin initialized, getUserMedia available = ' + (!!navigator.getUserMedia));

    callback();
  }

  // if the device is ready, then initialise immediately
  if (deviceReady) {
    // initialise after a 10ms timeout
    return setTimeout(ready, 10);
  }

  // wait for the device ready call
  document.addEventListener('deviceready', ready);
};

exports.attach = function(stream, opts) {
  var canvas = prepareElement(opts, (opts || {}).el);
  var context = canvas.getContext('2d');
  var lastWidth = 0;
  var lastHeight = 0;

  // if we are a proxyied stream, get the original stream
  if (stream && stream.__orig) {
    stream = stream.__orig;
  }

  iOSRTC_onDrawRegi(stream, function(imgData, width, height) {
    var resized = false;

    try {
      var img = new Image();
      resized = width !== lastWidth || height !== lastHeight;

      img.onload = function() {
        if (resized) {
          context.canvas.width = width;
          context.canvas.height = height;
        }
        context.drawImage(img, 0, 0, width, height);
      };
      img.src = imgData;
    }
    catch (e) {
      console.log('encountered error while drawing video');
      console.log('error: ' + e.message);
    }

    // update the last width and height
    lastWidth = width;
    lastHeight = height;
  });

  return canvas;
};

/**
  ### attachStream(stream, bindings)

**/
exports.attachStream = function(stream, bindings) {
  var contexts = [];
  var lastWidth = 0;
  var lastHeight = 0;

  // get the contexts for each of the bindings
  contexts = bindings.map(function(binding) {
    return binding.el.getContext('2d');
  });

  // if we are a proxyied stream, get the original stream
  if (stream && stream.__orig) {
    stream = stream.__orig;
  }

  iOSRTC_onDrawRegi(stream, function(imgData, width, height) {
    var resized = false;
    try {
      var img = new Image();
      resized = width !== lastWidth || height !== lastHeight;

      img.onload = function() {
        contexts.forEach(function(context) {
          if (resized) {
            context.canvas.width = width;
            context.canvas.height = height;
          }
          context.drawImage(img, 0, 0, width, height);
        });
      };
      img.src = imgData;
    }
    catch (e) {
      console.log('encountered error while drawing video');
      console.log('error: ' + e.message);
    }

    // update the last width and height
    lastWidth = width;
    lastHeight = height;
  });
};

/**
  ### prepareElement(opts, element) => HTMLElement

  The `prepareElement` function is used to prepare the video container
  for receiving a video stream.  If the plugin is able to work with
  standard `<video>` and `<audio>` elements then a plugin should simply
  not implement this function.

**/
var prepareElement = exports.prepareElement = function(opts, element) {
  var shouldReplace = (element instanceof HTMLVideoElement) ||
      (element instanceof HTMLAudioElement);

  // create our canvas
  var canvas = document.createElement('canvas');
  var srcStyle;
  var bounds;

  // if we should replace the element, then find the parent
  var container = shouldReplace ? element.parentNode : element;
  console.log('preparing element, created canvas');

  // if we should replace the target element, then do that now
  if (shouldReplace) {
    console.log('getting computed style for the element');
    srcStyle = window.getComputedStyle(element);

    console.log('getting client bounding rect');
    bounds = element.getBoundingClientRect();

    console.log('setting w and h');
    canvas.width = bounds.width;
    canvas.height = bounds.height;

    // add the classes from the source element to the canvas
    canvas.className = element.className;

    console.log('inserting canvas');
    container.insertBefore(canvas, element);
    container.removeChild(element);
  }
  // if we have an existing DOM node, then append to the container
  else if (container) {
    container.appendChild(canvas);
  }

  return canvas;
};

/* peer connection plugin interfaces */

exports.createIceCandidate = function(opts) {
  console.log('creating ice candidate, keys: ' + Object.keys(opts).join(' '));

  return getRTCIceCandidate({
    sdpMLineIndex: (opts || {}).sdpMLineIndex,
    candidate: (opts || {}).candidate
  });
};

exports.createConnection = function(config, constraints) {
  config.iceServers = (config.iceServers || []).map(function(details) {
    var url = (details || {}).url;
    console.log('specifying ice url: ' + url);

    return { url: url };
  });

  return new ProxyPeerConnection(getPeerConnection(config, constraints));
};

exports.createSessionDescription = function(opts) {
  return getRTCSessionDescription(opts);
};

// listen for deviceready in case it happens before the plugin is called
if (typeof document != 'undefined') {
  document.addEventListener('deviceready', function() {
    deviceReady = true;
  });
}

},{"rtc-proxy/mediastream":3,"rtc-proxy/peerconnection":6}],2:[function(require,module,exports){
var EventEmitter = require('eventemitter3');
var extend = require('cog/extend');

/**
  # rtc-proxy

  This is a set of simple proxy classes that are designed to provide a
  minimal layer between a WebRTC plugin and browser run JS.

  ## Why?

  This package exists because during the development of an iOS plugin, we
  have found that frameworks such as angular don't work as nicely with
  the plugin interface.  Primarily the problem is that Angular is unable
  to get any metainformation about the object (using `Object.keys` or
  similar).

  This layer provides that information when required.

**/
module.exports = function(prot, methods, attributes, events) {

  function capEvents(target, name) {
    var events = emitter(target);

    if (typeof target.__orig['on' + name] != 'function') {
      target.__orig['on' + name] = function() {
        events.emit.apply(events, [name].concat([].slice.call(arguments)));
      };
    }

    return events;
  }

  function emitter(target) {
    if (! target.__emitter) {
      target.__emitter = new EventEmitter();
    }

    return target.__emitter;
  }

  // patch methods
  (methods || []).forEach(function(method) {
    prot[method] = function() {
      var fn = this.__orig && this.__orig[method];

      if (typeof fn == 'function') {
        return fn.apply(this.__orig, arguments);
      }

      console.warn('could not invoke: ' + method);
    };
  });

  // patch properties
  (attributes || []).forEach(function(attrData) {
    var key = attrData[0];
    var flags = extend({
      get: function() {
        return this.__orig && this.__orig[key];
      }
    }, attrData[1]);

    if (flags.writable && (! flags.set)) {
      flags.set = function(value) {
        if (this.__orig) {
          this.__orig[key] = value;
        }
      }
    }

    Object.defineProperty(prot, key, flags);
  });

  (events || []).forEach(function(name) {
    Object.defineProperty(prot, 'on' + name, {
      get: function() {
        return emitter(this).listeners(name)[0];
      },

      set: function(handler) {
        var events = capEvents(this, name);

        if (! handler) {
          return events.removeAllListeners(name);
        }

        events.on(name, handler);
      }
    });
  });

  if (events) {
    prot.addEventListener = function(name, handler) {
      capEvents(this, name).on(name, handler);
    };

    prot.removeEventListener = function(name, handler) {
      emitter(this).removeListener(name, handler);
    };
  }

  return prot;
};

},{"cog/extend":4,"eventemitter3":5}],3:[function(require,module,exports){
var proxy = require('./index');

function ProxyMediaStream(original) {
  if (! (this instanceof ProxyMediaStream)) {
    return new ProxyMediaStream(original);
  }

  this.__orig = original;

  proxy(
    this,
    [],
    [
      [ 'id', { enumerable: true } ],
      [ 'ended', { enumerable: true } ]
    ]
  );
}

module.exports = ProxyMediaStream;
var prot = proxy(
  ProxyMediaStream.prototype,
  // methods
  [
    'getAudioTracks',
    'getVideoTracks',
    'getTrackById',
    'addTrack',
    'removeTrack'
  ],

  // properties [ name, attributes ]
  [],

  // events
  [
    'ended',
    'addtrack',
    'removetrack'
  ]
);

prot.clone = function() {
  return new ProxyMediaStream(this.__orig);
};

},{"./index":2}],4:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
## cog/extend

```js
var extend = require('cog/extend');
```

### extend(target, *)

Shallow copy object properties from the supplied source objects (*) into
the target object, returning the target object once completed:

```js
extend({ a: 1, b: 2 }, { c: 3 }, { d: 4 }, { b: 5 }));
```

See an example on [requirebin](http://requirebin.com/?gist=6079475).
**/
module.exports = function(target) {
  [].slice.call(arguments, 1).forEach(function(source) {
    if (! source) {
      return;
    }

    for (var prop in source) {
      target[prop] = source[prop];
    }
  });

  return target;
};
},{}],5:[function(require,module,exports){
'use strict';

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  if (!this._events || !this._events[event]) return [];

  for (var i = 0, l = this._events[event].length, ee = []; i < l; i++) {
    ee.push(this._events[event][i].fn);
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , length = listeners.length
    , len = arguments.length
    , ee = listeners[0]
    , args
    , i, j;

  if (1 === length) {
    if (ee.once) this.removeListener(event, ee.fn, true);

    switch (len) {
      case 1: return ee.fn.call(ee.context), true;
      case 2: return ee.fn.call(ee.context, a1), true;
      case 3: return ee.fn.call(ee.context, a1, a2), true;
      case 4: return ee.fn.call(ee.context, a1, a2, a3), true;
      case 5: return ee.fn.call(ee.context, a1, a2, a3, a4), true;
      case 6: return ee.fn.call(ee.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    ee.fn.apply(ee.context, args);
  } else {
    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = [];
  this._events[event].push(new EE( fn, context || this ));

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = [];
  this._events[event].push(new EE(fn, context || this, true ));

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  if (fn) for (var i = 0, length = listeners.length; i < length; i++) {
    if (listeners[i].fn !== fn && listeners[i].once !== once) {
      events.push(listeners[i]);
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) this._events[event] = events;
  else this._events[event] = null;

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) this._events[event] = null;
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the module.
//
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.EventEmitter2 = EventEmitter;
EventEmitter.EventEmitter3 = EventEmitter;

if ('object' === typeof module && module.exports) {
  module.exports = EventEmitter;
}

},{}],6:[function(require,module,exports){
var proxy = require('./index');
var ProxyMediaStream = require('./mediastream');

function ProxyPeerConnection(original) {
  if (! (this instanceof ProxyPeerConnection)) {
    return new ProxyPeerConnection(original);
  }

  this.__orig = original;

  proxy(
    this,
    [],
    [
      [ 'localDescription', { enumerable: true } ],
      [ 'remoteDescription', { enumerable: true } ],
      [ 'signalingState', { enumerable: true } ],
      [ 'iceGatheringState', { enumerable: true } ],
      [ 'iceConnectionState', { enumerable: true } ]
    ]
  );
}

module.exports = ProxyPeerConnection;

var prot = proxy(
  ProxyPeerConnection.prototype,

  // methods
  [
    'createOffer',
    'createAnswer',
    'createDataChannel',
    'setLocalDescription',
    'setRemoteDescription',
    'updateIce',
    'addIceCandidate',
    'close'
  ],

  // properties [ name, readonly? ]
  [],

  // events
  [
    'negotiationneeded',
    'icecandidate',
    'signalingstatechange',
    'addstream',
    'removestream',
    'iceconnectionstatechange',
    'datachannel'
  ]
);

prot.addStream = function(stream) {
  if (! stream) {
    return;
  }

  return this.__orig.addStream(stream.__orig || stream);
};

prot.removeStream = function(stream) {
  if (! stream) {
    return;
  }

  return this.__orig.removeStream(stream.__orig || stream);
};

prot.getLocalStreams = function() {
  return this.__orig.getLocalStreams().map(ProxyMediaStream);
};

prot.getRemoteStreams = function() {
  return this.__orig.getRemoteStreams().map(ProxyMediaStream);
};

prot.getStreamById = function(id) {
  var stream = this.__orig.getStreamById(id);

  if (stream) {
    stream = new ProxyMediaStream(stream);
  }

  return stream;
};

},{"./index":2,"./mediastream":3}]},{},[1])(1)
});


//# sourceMappingURL=rtc-ios.js.map