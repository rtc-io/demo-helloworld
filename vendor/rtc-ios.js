!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),(f.RTC||(f.RTC={})).IOS=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* jshint node: true */
'use strict';

var objectfit = require('objectfit');
var raf = require('fdom/raf');
var reNICTAUserAgent = /\(iOS\;.*Mobile\/NICTA/;
var deviceReady = false;
var initialized = false;

/**
  # rtc-plugin-nicta-ios

  This is a plugin for bridging the functionality provided by a NICTA iOS webkit plugin.
  While this plugin integration layer is provided opensource, the iOS plugin itself is
  part of http://build.rtc.io/.

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
        getUserMedia(constraints, successCb, failureCb);
      };
    }

    initialized = true;
    console.log('iOS plugin initialized, getUserMedia available = ' + (!!navigator.getUserMedia));

    callback();
  }

  // check if we missed the device ready
  deviceReady = deviceReady || typeof getPeerConnection != 'undefined';

  // if the device is ready, then initialise immediately
  if (deviceReady) {
    // initialise after a 10ms timeout
    return setTimeout(ready, 10);
  }

  // wait for the device ready call
  document.addEventListener('deviceready', ready);
};

exports.attach = function(stream, opts) {
  var canvas = prepareElement(opts, (opts || {}).el || (opts || {}).target);
  var context = canvas.getContext('2d');
  var maxfps = parseInt((opts || {}).maxfps, 10) || 0;
  var drawInterval = maxfps && (1000 / maxfps);
  var lastDraw = 0;
  var fitter;
  var img;

  function handleImageData(imgData, width, height) {
    var tick = Date.now();
    if (drawInterval && (tick < lastDraw + drawInterval)) {
      return;
    }

    img = new Image();
    img.onload = function() {
      raf(drawImage);
    };
    img.src = imgData;
  }

  function handleWindowResize(evt) {
    var bounds = canvas.getBoundingClientRect();
    var style = window.getComputedStyle(canvas);
    var fit = objectfit[style.objectFit] || objectfit.contain;

    canvas.width = bounds.width;
    canvas.height = bounds.height;
    context.clearRect(0, 0, canvas.width, canvas.height);

    // get the fitter function
    fitter = fit([0, 0, bounds.width, bounds.height]);
    drawImage();
  }

  function drawImage() {
    if (! img) {
      return;
    }

    context.drawImage.apply(context, [img].concat(fitter([0, 0, img.width, img.height])));
    lastDraw = Date.now();
  }

  // handle window resizes and resize the canvas appropriately
  window.addEventListener('resize', handleWindowResize, false);
  window.addEventListener('load', handleWindowResize, false);

  iOSRTC_onDrawRegi(stream, handleImageData);

  // handle the initial window resize
  setTimeout(handleWindowResize, 10);

  return canvas;
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
  if (shouldReplace && element.parentNode) {
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
  return getPeerConnection(config, constraints);
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

},{"fdom/raf":2,"objectfit":5}],2:[function(require,module,exports){
/* jshint node: true */
/* global window: false */
'use strict';

var TEST_PROPS = ['r', 'webkitR', 'mozR', 'oR', 'msR'];

/**
  ### raf(callback)

  Request animation frame helper.

  <<< examples/raf.js

**/

module.exports = typeof window != 'undefined' && (function() {
  for (var ii = 0; ii < TEST_PROPS.length; ii++) {
    window.animFrame = window.animFrame ||
      window[TEST_PROPS[ii] + 'equestAnimationFrame'];
  } // for

  return animFrame;
})();
},{}],3:[function(require,module,exports){
/**
  ### contain

  Use [letterboxing](http://en.wikipedia.org/wiki/Letterbox) or
  [pillarboxing](http://en.wikipedia.org/wiki/Pillar_box_(film)) to resize
  an object to fit within another containing rect, without affecting the
  aspect ratio.

**/
module.exports = function(container, subject) {
  var cw = container[2];
  var ch = container[3];
  var cr = cw / ch;

  function contain(subject) {
    var sw = subject[2];
    var sh = subject[3];
    var sr = sw / sh;
    var result = [];

    if (sr < cr) {
      result[2] = (ch * sr) | 0;
      result[3] = ch;
      result[0] = (cw - result[2]) >> 1;
      result[1] = 0;
    }
    else {
      result[2] = cw;
      result[3] = (cw / sr) | 0;
      result[0] = 0;
      result[1] = (ch - result[3]) >> 1;
    }

    // apply the offset
    result[0] += container[0];
    result[1] += container[1];

    return result;
  }

  return subject ? contain(subject) : contain;
};

},{}],4:[function(require,module,exports){
/**
  ### cover

  Ensure the subject completely fills the container leaving no whitespace
  visible in the container.

**/
module.exports = function(container, subject) {
  var cw = container[2];
  var ch = container[3];
  var cr = cw / ch;

  function fit(subject) {
    var sw = subject[2];
    var sh = subject[3];
    var sr = sw / sh;
    var result = [];

    if (sr < cr) {
      result[2] = cw;
      result[3] = (cw / sr) | 0;
      result[0] = 1;
      result[1] = -(result[3] - ch) >> 1;
    }
    else {
      result[2] = (ch * sr) | 0;
      result[3] = ch;
      result[0] = -(result[2] - cw) >> 1;
      result[1] = 0;
    }

    // apply the offset
    result[0] += container[0];
    result[1] += container[1];

    return result;
  }

  return subject ? fit(subject) : fit;
};

},{}],5:[function(require,module,exports){
/**
  # objectfit

  This is a suite of functions for fitting (possibly overflowing depending on
  the technique) one rectangular shape into another rectangular region,
  preserving aspect ratio.

  ## Example Usage

  Displayed below is an example of drawing an image on a canvas using the
  `objectfit/contain` function.  It should be noted that as the functions
  all use the same function signature, `objectfit/cover` could be used in
  it's place.

  <<< examples/contain.js

  ## Reference

  All objectfit functions use the following function signature:

  ```
  fit(container, => subject) => [x, y, width, height]
  ```

  ## Implementations

**/
exports.contain = require('./contain');
exports.cover = require('./cover');

},{"./contain":3,"./cover":4}]},{},[1])(1)
});


//# sourceMappingURL=rtc-ios.js.map