(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

},{}],2:[function(require,module,exports){
"use strict";

},{}],3:[function(require,module,exports){
'use strict';

var _evothings = require('./../libs/evothings/evothings');

var _Sortable = require('./../libs/sortable/Sortable');

require('./app');

var attachFastClick = require('fastclick');

// avoid the 300ms click delay on mobile devices
attachFastClick(document.body);

},{"./../libs/evothings/evothings":4,"./../libs/sortable/Sortable":5,"./app":2,"fastclick":1}],4:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// Dynamic script loader that tracks loaded scripts.
// Can also use an event (similar to 'devireready' in Cordova)
// to notify when scripts are loaded (by using a script loading
// counter to track progress).

/**
* @namespace 
*/
var evothings = window.evothings || {};
(function () {
	/* ------------------ Script loading ------------------ */

	var scriptLoadingCounter = 0;
	var loadedScripts = {};
	var scriptsLoadedCallbacks = [];

	/**
  * Load a script.
  * @param {String} url - URL or path to the script. Relative paths are
  * relative to the HTML file that initiated script loading.
  * @param {function} callback - optional parameterless function that will
  * be called when the script has loaded.
  */
	evothings.loadScript = function (url, callback) {
		// If script is already loaded call callback directly and return.
		if (loadedScripts[url]) {
			callback && callback();
			return;
		}

		// Add script to dictionaly of loaded scripts.
		loadedScripts[url] = 'loadingstarted';
		++scriptLoadingCounter;

		// Create script tag.
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;

		// Bind the onload event.
		script.onload = function () {
			// Mark as loaded.
			loadedScripts[url] = 'loadingcomplete';
			--scriptLoadingCounter;

			// Call callback if given.
			callback && callback();

			// Call scripts loaded callbacks if this was the last script loaded.
			if (0 == scriptLoadingCounter) {
				for (var i = 0; i < scriptsLoadedCallbacks.length; ++i) {
					scriptsLoadedCallbacks[i]();
				}

				// Clear callbacks - should we do this???
				scriptsLoadedCallbacks = [];
			}
		};

		// onerror fires for things like malformed URLs and 404's.
		// If this function is called, the matching onload will not be called and
		// scriptsLoaded will not fire.
		script.onerror = function () {
			throw "Could not load script '" + url + "'";
		};

		// Attaching the script tag to the document starts loading the script.
		document.head.appendChild(script);
	};

	/**
  * Add a callback that will be called when all scripts are loaded.
  * @param callback - parameterless function that will
  * be called when all scripts have finished loading.
  */
	evothings.scriptsLoaded = function (callback) {
		// If scripts are already loaded call the callback directly,
		// else add the callback to the callbacks array.
		if (0 != Object.keys(loadedScripts).length && 0 == scriptLoadingCounter) {
			callback();
		} else {
			scriptsLoadedCallbacks.push(callback);
		}
	};

	/* ------------------ Debugging ------------------ */

	/**
  * Print a JavaScript object (dictionary).
  *
  * @param {Object} obj - Object to print.
  * @param {function} printFun - print function (optional - defaults to
  * console.log if not given).
  *
  * @example
  *   var obj = { company: 'Evothings', field: 'IoT' };
  *   evothings.easyble.printObject(obj);
  *   evothings.easyble.printObject(obj, console.log);
  */
	evothings.printObject = function (obj, printFun) {
		printFun = printFun || console.log;
		function print(obj, level) {
			var indent = new Array(level + 1).join('  ');
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					var value = obj[prop];
					if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object') {
						printFun(indent + prop + ':');
						print(value, level + 1);
					} else {
						printFun(indent + prop + ': ' + value);
					}
				}
			}
		}
		print(obj, 0);
	};

	/* ------------------ Platform check ------------------ */

	evothings.os = {};

	evothings.os.isIOS = function () {
		return (/iP(hone|ad|od)/.test(navigator.userAgent)
		);
	};

	evothings.os.isIOS7 = function () {
		return (/iP(hone|ad|od).*OS 7/.test(navigator.userAgent)
		);
	};

	evothings.os.isAndroid = function () {
		return (/Android|android/.test(navigator.userAgent)
		);
	};

	evothings.os.isWP = function () {
		return (/Windows Phone/.test(navigator.userAgent)
		);
	};

	return evothings;

	// If for some reason the global evothings variable is already defined we use it.
})();

window.addEventListener('DOMContentLoaded', function (e) {
	/* Set an absolute base font size in iOS 7 due to that viewport-relative
 font sizes doesn't work properly caused by the WebKit bug described at
 https://bugs.webkit.org/show_bug.cgi?id=131863. */
	if (evothings.os.isIOS7()) {
		document.body.style.fontSize = '20pt';
	}
});

},{}],5:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @license MIT
 */

(function (factory) {
	"use strict";

	if (typeof define === "function" && define.amd) {
		define(factory);
	} else if (typeof module != "undefined" && typeof module.exports != "undefined") {
		module.exports = factory();
	} else if (typeof Package !== "undefined") {
		Sortable = factory(); // export for Meteor.js
	} else {
			/* jshint sub:true */
			window["Sortable"] = factory();
		}
})(function () {
	"use strict";

	if (typeof window == "undefined" || typeof window.document == "undefined") {
		return function () {
			throw new Error("Sortable.js requires a window with a document");
		};
	}

	var dragEl,
	    parentEl,
	    ghostEl,
	    cloneEl,
	    rootEl,
	    nextEl,
	    scrollEl,
	    scrollParentEl,
	    lastEl,
	    lastCSS,
	    lastParentCSS,
	    oldIndex,
	    newIndex,
	    activeGroup,
	    autoScroll = {},
	    tapEvt,
	    touchEvt,
	    moved,


	/** @const */
	RSPACE = /\s+/g,
	    expando = 'Sortable' + new Date().getTime(),
	    win = window,
	    document = win.document,
	    parseInt = win.parseInt,
	    supportDraggable = !!('draggable' in document.createElement('div')),
	    supportCssPointerEvents = function (el) {
		el = document.createElement('x');
		el.style.cssText = 'pointer-events:auto';
		return el.style.pointerEvents === 'auto';
	}(),
	    _silent = false,
	    abs = Math.abs,
	    slice = [].slice,
	    touchDragOverListeners = [],
	    _autoScroll = _throttle(function ( /**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl) {
		// Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
		if (rootEl && options.scroll) {
			var el,
			    rect,
			    sens = options.scrollSensitivity,
			    speed = options.scrollSpeed,
			    x = evt.clientX,
			    y = evt.clientY,
			    winWidth = window.innerWidth,
			    winHeight = window.innerHeight,
			    vx,
			    vy;

			// Delect scrollEl
			if (scrollParentEl !== rootEl) {
				scrollEl = options.scroll;
				scrollParentEl = rootEl;

				if (scrollEl === true) {
					scrollEl = rootEl;

					do {
						if (scrollEl.offsetWidth < scrollEl.scrollWidth || scrollEl.offsetHeight < scrollEl.scrollHeight) {
							break;
						}
						/* jshint boss:true */
					} while (scrollEl = scrollEl.parentNode);
				}
			}

			if (scrollEl) {
				el = scrollEl;
				rect = scrollEl.getBoundingClientRect();
				vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
				vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
			}

			if (!(vx || vy)) {
				vx = (winWidth - x <= sens) - (x <= sens);
				vy = (winHeight - y <= sens) - (y <= sens);

				/* jshint expr:true */
				(vx || vy) && (el = win);
			}

			if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
				autoScroll.el = el;
				autoScroll.vx = vx;
				autoScroll.vy = vy;

				clearInterval(autoScroll.pid);

				if (el) {
					autoScroll.pid = setInterval(function () {
						if (el === win) {
							win.scrollTo(win.pageXOffset + vx * speed, win.pageYOffset + vy * speed);
						} else {
							vy && (el.scrollTop += vy * speed);
							vx && (el.scrollLeft += vx * speed);
						}
					}, 24);
				}
			}
		}
	}, 30),
	    _prepareGroup = function _prepareGroup(options) {
		var group = options.group;

		if (!group || (typeof group === "undefined" ? "undefined" : _typeof(group)) != 'object') {
			group = options.group = { name: group };
		}

		['pull', 'put'].forEach(function (key) {
			if (!(key in group)) {
				group[key] = true;
			}
		});

		options.groups = ' ' + group.name + (group.put.join ? ' ' + group.put.join(' ') : '') + ' ';
	};

	/**
  * @class  Sortable
  * @param  {HTMLElement}  el
  * @param  {Object}       [options]
  */
	function Sortable(el, options) {
		if (!(el && el.nodeType && el.nodeType === 1)) {
			throw 'Sortable: `el` must be HTMLElement, and not ' + {}.toString.call(el);
		}

		this.el = el; // root element
		this.options = options = _extend({}, options);

		// Export instance
		el[expando] = this;

		// Default options
		var defaults = {
			group: Math.random(),
			sort: true,
			disabled: false,
			store: null,
			handle: null,
			scroll: true,
			scrollSensitivity: 30,
			scrollSpeed: 10,
			draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',
			ghostClass: 'sortable-ghost',
			chosenClass: 'sortable-chosen',
			ignore: 'a, img',
			filter: null,
			animation: 0,
			setData: function setData(dataTransfer, dragEl) {
				dataTransfer.setData('Text', dragEl.textContent);
			},
			dropBubble: false,
			dragoverBubble: false,
			dataIdAttr: 'data-id',
			delay: 0,
			forceFallback: false,
			fallbackClass: 'sortable-fallback',
			fallbackOnBody: false
		};

		// Set default options
		for (var name in defaults) {
			!(name in options) && (options[name] = defaults[name]);
		}

		_prepareGroup(options);

		// Bind all private methods
		for (var fn in this) {
			if (fn.charAt(0) === '_') {
				this[fn] = this[fn].bind(this);
			}
		}

		// Setup drag mode
		this.nativeDraggable = options.forceFallback ? false : supportDraggable;

		// Bind events
		_on(el, 'mousedown', this._onTapStart);
		_on(el, 'touchstart', this._onTapStart);

		if (this.nativeDraggable) {
			_on(el, 'dragover', this);
			_on(el, 'dragenter', this);
		}

		touchDragOverListeners.push(this._onDragOver);

		// Restore sorting
		options.store && this.sort(options.store.get(this));
	}

	Sortable.prototype = /** @lends Sortable.prototype */{
		constructor: Sortable,

		_onTapStart: function _onTapStart( /** Event|TouchEvent */evt) {
			var _this = this,
			    el = this.el,
			    options = this.options,
			    type = evt.type,
			    touch = evt.touches && evt.touches[0],
			    target = (touch || evt).target,
			    originalTarget = target,
			    filter = options.filter;

			if (type === 'mousedown' && evt.button !== 0 || options.disabled) {
				return; // only left button or enabled
			}

			target = _closest(target, options.draggable, el);

			if (!target) {
				return;
			}

			// get the index of the dragged element within its parent
			oldIndex = _index(target, options.draggable);

			// Check filter
			if (typeof filter === 'function') {
				if (filter.call(this, evt, target, this)) {
					_dispatchEvent(_this, originalTarget, 'filter', target, el, oldIndex);
					evt.preventDefault();
					return; // cancel dnd
				}
			} else if (filter) {
					filter = filter.split(',').some(function (criteria) {
						criteria = _closest(originalTarget, criteria.trim(), el);

						if (criteria) {
							_dispatchEvent(_this, criteria, 'filter', target, el, oldIndex);
							return true;
						}
					});

					if (filter) {
						evt.preventDefault();
						return; // cancel dnd
					}
				}

			if (options.handle && !_closest(originalTarget, options.handle, el)) {
				return;
			}

			// Prepare `dragstart`
			this._prepareDragStart(evt, touch, target);
		},

		_prepareDragStart: function _prepareDragStart( /** Event */evt, /** Touch */touch, /** HTMLElement */target) {
			var _this = this,
			    el = _this.el,
			    options = _this.options,
			    ownerDocument = el.ownerDocument,
			    dragStartFn;

			if (target && !dragEl && target.parentNode === el) {
				tapEvt = evt;

				rootEl = el;
				dragEl = target;
				parentEl = dragEl.parentNode;
				nextEl = dragEl.nextSibling;
				activeGroup = options.group;

				dragStartFn = function dragStartFn() {
					// Delayed drag has been triggered
					// we can re-enable the events: touchmove/mousemove
					_this._disableDelayedDrag();

					// Make the element draggable
					dragEl.draggable = true;

					// Chosen item
					_toggleClass(dragEl, _this.options.chosenClass, true);

					// Bind the events: dragstart/dragend
					_this._triggerDragStart(touch);
				};

				// Disable "draggable"
				options.ignore.split(',').forEach(function (criteria) {
					_find(dragEl, criteria.trim(), _disableDraggable);
				});

				_on(ownerDocument, 'mouseup', _this._onDrop);
				_on(ownerDocument, 'touchend', _this._onDrop);
				_on(ownerDocument, 'touchcancel', _this._onDrop);

				if (options.delay) {
					// If the user moves the pointer or let go the click or touch
					// before the delay has been reached:
					// disable the delayed drag
					_on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchend', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
					_on(ownerDocument, 'mousemove', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchmove', _this._disableDelayedDrag);

					_this._dragStartTimer = setTimeout(dragStartFn, options.delay);
				} else {
					dragStartFn();
				}
			}
		},

		_disableDelayedDrag: function _disableDelayedDrag() {
			var ownerDocument = this.el.ownerDocument;

			clearTimeout(this._dragStartTimer);
			_off(ownerDocument, 'mouseup', this._disableDelayedDrag);
			_off(ownerDocument, 'touchend', this._disableDelayedDrag);
			_off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
			_off(ownerDocument, 'mousemove', this._disableDelayedDrag);
			_off(ownerDocument, 'touchmove', this._disableDelayedDrag);
		},

		_triggerDragStart: function _triggerDragStart( /** Touch */touch) {
			if (touch) {
				// Touch device support
				tapEvt = {
					target: dragEl,
					clientX: touch.clientX,
					clientY: touch.clientY
				};

				this._onDragStart(tapEvt, 'touch');
			} else if (!this.nativeDraggable) {
				this._onDragStart(tapEvt, true);
			} else {
				_on(dragEl, 'dragend', this);
				_on(rootEl, 'dragstart', this._onDragStart);
			}

			try {
				if (document.selection) {
					document.selection.empty();
				} else {
					window.getSelection().removeAllRanges();
				}
			} catch (err) {}
		},

		_dragStarted: function _dragStarted() {
			if (rootEl && dragEl) {
				// Apply effect
				_toggleClass(dragEl, this.options.ghostClass, true);

				Sortable.active = this;

				// Drag start event
				_dispatchEvent(this, rootEl, 'start', dragEl, rootEl, oldIndex);
			}
		},

		_emulateDragOver: function _emulateDragOver() {
			if (touchEvt) {
				if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {
					return;
				}

				this._lastX = touchEvt.clientX;
				this._lastY = touchEvt.clientY;

				if (!supportCssPointerEvents) {
					_css(ghostEl, 'display', 'none');
				}

				var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY),
				    parent = target,
				    groupName = ' ' + this.options.group.name + '',
				    i = touchDragOverListeners.length;

				if (parent) {
					do {
						if (parent[expando] && parent[expando].options.groups.indexOf(groupName) > -1) {
							while (i--) {
								touchDragOverListeners[i]({
									clientX: touchEvt.clientX,
									clientY: touchEvt.clientY,
									target: target,
									rootEl: parent
								});
							}

							break;
						}

						target = parent; // store last element
					}
					/* jshint boss:true */
					while (parent = parent.parentNode);
				}

				if (!supportCssPointerEvents) {
					_css(ghostEl, 'display', '');
				}
			}
		},

		_onTouchMove: function _onTouchMove( /**TouchEvent*/evt) {
			if (tapEvt) {
				// only set the status to dragging, when we are actually dragging
				if (!Sortable.active) {
					this._dragStarted();
				}

				// as well as creating the ghost element on the document body
				this._appendGhost();

				var touch = evt.touches ? evt.touches[0] : evt,
				    dx = touch.clientX - tapEvt.clientX,
				    dy = touch.clientY - tapEvt.clientY,
				    translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

				moved = true;
				touchEvt = touch;

				_css(ghostEl, 'webkitTransform', translate3d);
				_css(ghostEl, 'mozTransform', translate3d);
				_css(ghostEl, 'msTransform', translate3d);
				_css(ghostEl, 'transform', translate3d);

				evt.preventDefault();
			}
		},

		_appendGhost: function _appendGhost() {
			if (!ghostEl) {
				var rect = dragEl.getBoundingClientRect(),
				    css = _css(dragEl),
				    options = this.options,
				    ghostRect;

				ghostEl = dragEl.cloneNode(true);

				_toggleClass(ghostEl, options.ghostClass, false);
				_toggleClass(ghostEl, options.fallbackClass, true);

				_css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
				_css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
				_css(ghostEl, 'width', rect.width);
				_css(ghostEl, 'height', rect.height);
				_css(ghostEl, 'opacity', '0.8');
				_css(ghostEl, 'position', 'fixed');
				_css(ghostEl, 'zIndex', '100000');
				_css(ghostEl, 'pointerEvents', 'none');

				options.fallbackOnBody && document.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);

				// Fixing dimensions.
				ghostRect = ghostEl.getBoundingClientRect();
				_css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
				_css(ghostEl, 'height', rect.height * 2 - ghostRect.height);
			}
		},

		_onDragStart: function _onDragStart( /**Event*/evt, /**boolean*/useFallback) {
			var dataTransfer = evt.dataTransfer,
			    options = this.options;

			this._offUpEvents();

			if (activeGroup.pull == 'clone') {
				cloneEl = dragEl.cloneNode(true);
				_css(cloneEl, 'display', 'none');
				rootEl.insertBefore(cloneEl, dragEl);
			}

			if (useFallback) {

				if (useFallback === 'touch') {
					// Bind touch events
					_on(document, 'touchmove', this._onTouchMove);
					_on(document, 'touchend', this._onDrop);
					_on(document, 'touchcancel', this._onDrop);
				} else {
					// Old brwoser
					_on(document, 'mousemove', this._onTouchMove);
					_on(document, 'mouseup', this._onDrop);
				}

				this._loopId = setInterval(this._emulateDragOver, 50);
			} else {
				if (dataTransfer) {
					dataTransfer.effectAllowed = 'move';
					options.setData && options.setData.call(this, dataTransfer, dragEl);
				}

				_on(document, 'drop', this);
				setTimeout(this._dragStarted, 0);
			}
		},

		_onDragOver: function _onDragOver( /**Event*/evt) {
			var el = this.el,
			    target,
			    dragRect,
			    revert,
			    options = this.options,
			    group = options.group,
			    groupPut = group.put,
			    isOwner = activeGroup === group,
			    canSort = options.sort;

			if (evt.preventDefault !== void 0) {
				evt.preventDefault();
				!options.dragoverBubble && evt.stopPropagation();
			}

			moved = true;

			if (activeGroup && !options.disabled && (isOwner ? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
			: activeGroup.pull && groupPut && (activeGroup.name === group.name || // by Name
			groupPut.indexOf && ~groupPut.indexOf(activeGroup.name) // by Array
			)) && (evt.rootEl === void 0 || evt.rootEl === this.el) // touch fallback
			) {
					// Smart auto-scrolling
					_autoScroll(evt, options, this.el);

					if (_silent) {
						return;
					}

					target = _closest(evt.target, options.draggable, el);
					dragRect = dragEl.getBoundingClientRect();

					if (revert) {
						_cloneHide(true);

						if (cloneEl || nextEl) {
							rootEl.insertBefore(dragEl, cloneEl || nextEl);
						} else if (!canSort) {
							rootEl.appendChild(dragEl);
						}

						return;
					}

					if (el.children.length === 0 || el.children[0] === ghostEl || el === evt.target && (target = _ghostIsLast(el, evt))) {

						if (target) {
							if (target.animated) {
								return;
							}

							targetRect = target.getBoundingClientRect();
						}

						_cloneHide(isOwner);

						if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect) !== false) {
							if (!dragEl.contains(el)) {
								el.appendChild(dragEl);
								parentEl = el; // actualization
							}

							this._animate(dragRect, dragEl);
							target && this._animate(targetRect, target);
						}
					} else if (target && !target.animated && target !== dragEl && target.parentNode[expando] !== void 0) {
						if (lastEl !== target) {
							lastEl = target;
							lastCSS = _css(target);
							lastParentCSS = _css(target.parentNode);
						}

						var targetRect = target.getBoundingClientRect(),
						    width = targetRect.right - targetRect.left,
						    height = targetRect.bottom - targetRect.top,
						    floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display) || lastParentCSS.display == 'flex' && lastParentCSS['flex-direction'].indexOf('row') === 0,
						    isWide = target.offsetWidth > dragEl.offsetWidth,
						    isLong = target.offsetHeight > dragEl.offsetHeight,
						    halfway = (floating ? (evt.clientX - targetRect.left) / width : (evt.clientY - targetRect.top) / height) > 0.5,
						    nextSibling = target.nextElementSibling,
						    moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect),
						    after;

						if (moveVector !== false) {
							_silent = true;
							setTimeout(_unsilent, 30);

							_cloneHide(isOwner);

							if (moveVector === 1 || moveVector === -1) {
								after = moveVector === 1;
							} else if (floating) {
								var elTop = dragEl.offsetTop,
								    tgTop = target.offsetTop;

								if (elTop === tgTop) {
									after = target.previousElementSibling === dragEl && !isWide || halfway && isWide;
								} else {
									after = tgTop > elTop;
								}
							} else {
								after = nextSibling !== dragEl && !isLong || halfway && isLong;
							}

							if (!dragEl.contains(el)) {
								if (after && !nextSibling) {
									el.appendChild(dragEl);
								} else {
									target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
								}
							}

							parentEl = dragEl.parentNode; // actualization

							this._animate(dragRect, dragEl);
							this._animate(targetRect, target);
						}
					}
				}
		},

		_animate: function _animate(prevRect, target) {
			var ms = this.options.animation;

			if (ms) {
				var currentRect = target.getBoundingClientRect();

				_css(target, 'transition', 'none');
				_css(target, 'transform', 'translate3d(' + (prevRect.left - currentRect.left) + 'px,' + (prevRect.top - currentRect.top) + 'px,0)');

				target.offsetWidth; // repaint

				_css(target, 'transition', 'all ' + ms + 'ms');
				_css(target, 'transform', 'translate3d(0,0,0)');

				clearTimeout(target.animated);
				target.animated = setTimeout(function () {
					_css(target, 'transition', '');
					_css(target, 'transform', '');
					target.animated = false;
				}, ms);
			}
		},

		_offUpEvents: function _offUpEvents() {
			var ownerDocument = this.el.ownerDocument;

			_off(document, 'touchmove', this._onTouchMove);
			_off(ownerDocument, 'mouseup', this._onDrop);
			_off(ownerDocument, 'touchend', this._onDrop);
			_off(ownerDocument, 'touchcancel', this._onDrop);
		},

		_onDrop: function _onDrop( /**Event*/evt) {
			var el = this.el,
			    options = this.options;

			clearInterval(this._loopId);
			clearInterval(autoScroll.pid);
			clearTimeout(this._dragStartTimer);

			// Unbind events
			_off(document, 'mousemove', this._onTouchMove);

			if (this.nativeDraggable) {
				_off(document, 'drop', this);
				_off(el, 'dragstart', this._onDragStart);
			}

			this._offUpEvents();

			if (evt) {
				if (moved) {
					evt.preventDefault();
					!options.dropBubble && evt.stopPropagation();
				}

				ghostEl && ghostEl.parentNode.removeChild(ghostEl);

				if (dragEl) {
					if (this.nativeDraggable) {
						_off(dragEl, 'dragend', this);
					}

					_disableDraggable(dragEl);

					// Remove class's
					_toggleClass(dragEl, this.options.ghostClass, false);
					_toggleClass(dragEl, this.options.chosenClass, false);

					if (rootEl !== parentEl) {
						newIndex = _index(dragEl, options.draggable);

						if (newIndex >= 0) {
							// drag from one list and drop into another
							_dispatchEvent(null, parentEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
							_dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);

							// Add event
							_dispatchEvent(null, parentEl, 'add', dragEl, rootEl, oldIndex, newIndex);

							// Remove event
							_dispatchEvent(this, rootEl, 'remove', dragEl, rootEl, oldIndex, newIndex);
						}
					} else {
						// Remove clone
						cloneEl && cloneEl.parentNode.removeChild(cloneEl);

						if (dragEl.nextSibling !== nextEl) {
							// Get the index of the dragged element within its parent
							newIndex = _index(dragEl, options.draggable);

							if (newIndex >= 0) {
								// drag & drop within the same list
								_dispatchEvent(this, rootEl, 'update', dragEl, rootEl, oldIndex, newIndex);
								_dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
							}
						}
					}

					if (Sortable.active) {
						if (newIndex === null || newIndex === -1) {
							newIndex = oldIndex;
						}

						_dispatchEvent(this, rootEl, 'end', dragEl, rootEl, oldIndex, newIndex);

						// Save sorting
						this.save();
					}
				}
			}
			this._nulling();
		},

		_nulling: function _nulling() {
			// Nulling
			rootEl = dragEl = parentEl = ghostEl = nextEl = cloneEl = scrollEl = scrollParentEl = tapEvt = touchEvt = moved = newIndex = lastEl = lastCSS = activeGroup = Sortable.active = null;
		},

		handleEvent: function handleEvent( /**Event*/evt) {
			var type = evt.type;

			if (type === 'dragover' || type === 'dragenter') {
				if (dragEl) {
					this._onDragOver(evt);
					_globalDragOver(evt);
				}
			} else if (type === 'drop' || type === 'dragend') {
				this._onDrop(evt);
			}
		},

		/**
   * Serializes the item into an array of string.
   * @returns {String[]}
   */
		toArray: function toArray() {
			var order = [],
			    el,
			    children = this.el.children,
			    i = 0,
			    n = children.length,
			    options = this.options;

			for (; i < n; i++) {
				el = children[i];
				if (_closest(el, options.draggable, this.el)) {
					order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
				}
			}

			return order;
		},

		/**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
		sort: function sort(order) {
			var items = {},
			    rootEl = this.el;

			this.toArray().forEach(function (id, i) {
				var el = rootEl.children[i];

				if (_closest(el, this.options.draggable, rootEl)) {
					items[id] = el;
				}
			}, this);

			order.forEach(function (id) {
				if (items[id]) {
					rootEl.removeChild(items[id]);
					rootEl.appendChild(items[id]);
				}
			});
		},

		/**
   * Save the current sorting
   */
		save: function save() {
			var store = this.options.store;
			store && store.set(this);
		},

		/**
   * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
   * @param   {HTMLElement}  el
   * @param   {String}       [selector]  default: `options.draggable`
   * @returns {HTMLElement|null}
   */
		closest: function closest(el, selector) {
			return _closest(el, selector || this.options.draggable, this.el);
		},

		/**
   * Set/get option
   * @param   {string} name
   * @param   {*}      [value]
   * @returns {*}
   */
		option: function option(name, value) {
			var options = this.options;

			if (value === void 0) {
				return options[name];
			} else {
				options[name] = value;

				if (name === 'group') {
					_prepareGroup(options);
				}
			}
		},

		/**
   * Destroy
   */
		destroy: function destroy() {
			var el = this.el;

			el[expando] = null;

			_off(el, 'mousedown', this._onTapStart);
			_off(el, 'touchstart', this._onTapStart);

			if (this.nativeDraggable) {
				_off(el, 'dragover', this);
				_off(el, 'dragenter', this);
			}

			// Remove draggable attributes
			Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
				el.removeAttribute('draggable');
			});

			touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

			this._onDrop();

			this.el = el = null;
		}
	};

	function _cloneHide(state) {
		if (cloneEl && cloneEl.state !== state) {
			_css(cloneEl, 'display', state ? 'none' : '');
			!state && cloneEl.state && rootEl.insertBefore(cloneEl, dragEl);
			cloneEl.state = state;
		}
	}

	function _closest( /**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx) {
		if (el) {
			ctx = ctx || document;

			do {
				if (selector === '>*' && el.parentNode === ctx || _matches(el, selector)) {
					return el;
				}
			} while (el !== ctx && (el = el.parentNode));
		}

		return null;
	}

	function _globalDragOver( /**Event*/evt) {
		if (evt.dataTransfer) {
			evt.dataTransfer.dropEffect = 'move';
		}
		evt.preventDefault();
	}

	function _on(el, event, fn) {
		el.addEventListener(event, fn, false);
	}

	function _off(el, event, fn) {
		el.removeEventListener(event, fn, false);
	}

	function _toggleClass(el, name, state) {
		if (el) {
			if (el.classList) {
				el.classList[state ? 'add' : 'remove'](name);
			} else {
				var className = (' ' + el.className + ' ').replace(RSPACE, ' ').replace(' ' + name + ' ', ' ');
				el.className = (className + (state ? ' ' + name : '')).replace(RSPACE, ' ');
			}
		}
	}

	function _css(el, prop, val) {
		var style = el && el.style;

		if (style) {
			if (val === void 0) {
				if (document.defaultView && document.defaultView.getComputedStyle) {
					val = document.defaultView.getComputedStyle(el, '');
				} else if (el.currentStyle) {
					val = el.currentStyle;
				}

				return prop === void 0 ? val : val[prop];
			} else {
				if (!(prop in style)) {
					prop = '-webkit-' + prop;
				}

				style[prop] = val + (typeof val === 'string' ? '' : 'px');
			}
		}
	}

	function _find(ctx, tagName, iterator) {
		if (ctx) {
			var list = ctx.getElementsByTagName(tagName),
			    i = 0,
			    n = list.length;

			if (iterator) {
				for (; i < n; i++) {
					iterator(list[i], i);
				}
			}

			return list;
		}

		return [];
	}

	function _dispatchEvent(sortable, rootEl, name, targetEl, fromEl, startIndex, newIndex) {
		var evt = document.createEvent('Event'),
		    options = (sortable || rootEl[expando]).options,
		    onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);

		evt.initEvent(name, true, true);

		evt.to = rootEl;
		evt.from = fromEl || rootEl;
		evt.item = targetEl || rootEl;
		evt.clone = cloneEl;

		evt.oldIndex = startIndex;
		evt.newIndex = newIndex;

		rootEl.dispatchEvent(evt);

		if (options[onName]) {
			options[onName].call(sortable, evt);
		}
	}

	function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect) {
		var evt,
		    sortable = fromEl[expando],
		    onMoveFn = sortable.options.onMove,
		    retVal;

		evt = document.createEvent('Event');
		evt.initEvent('move', true, true);

		evt.to = toEl;
		evt.from = fromEl;
		evt.dragged = dragEl;
		evt.draggedRect = dragRect;
		evt.related = targetEl || toEl;
		evt.relatedRect = targetRect || toEl.getBoundingClientRect();

		fromEl.dispatchEvent(evt);

		if (onMoveFn) {
			retVal = onMoveFn.call(sortable, evt);
		}

		return retVal;
	}

	function _disableDraggable(el) {
		el.draggable = false;
	}

	function _unsilent() {
		_silent = false;
	}

	/** @returns {HTMLElement|false} */
	function _ghostIsLast(el, evt) {
		var lastEl = el.lastElementChild,
		    rect = lastEl.getBoundingClientRect();

		return (evt.clientY - (rect.top + rect.height) > 5 || evt.clientX - (rect.right + rect.width) > 5) && lastEl; // min delta
	}

	/**
  * Generate id
  * @param   {HTMLElement} el
  * @returns {String}
  * @private
  */
	function _generateId(el) {
		var str = el.tagName + el.className + el.src + el.href + el.textContent,
		    i = str.length,
		    sum = 0;

		while (i--) {
			sum += str.charCodeAt(i);
		}

		return sum.toString(36);
	}

	/**
  * Returns the index of an element within its parent for a selected set of
  * elements
  * @param  {HTMLElement} el
  * @param  {selector} selector
  * @return {number}
  */
	function _index(el, selector) {
		var index = 0;

		if (!el || !el.parentNode) {
			return -1;
		}

		while (el && (el = el.previousElementSibling)) {
			if (el.nodeName.toUpperCase() !== 'TEMPLATE' && _matches(el, selector)) {
				index++;
			}
		}

		return index;
	}

	function _matches( /**HTMLElement*/el, /**String*/selector) {
		if (el) {
			selector = selector.split('.');

			var tag = selector.shift().toUpperCase(),
			    re = new RegExp('\\s(' + selector.join('|') + ')(?=\\s)', 'g');

			return (tag === '' || el.nodeName.toUpperCase() == tag) && (!selector.length || ((' ' + el.className + ' ').match(re) || []).length == selector.length);
		}

		return false;
	}

	function _throttle(callback, ms) {
		var args, _this;

		return function () {
			if (args === void 0) {
				args = arguments;
				_this = this;

				setTimeout(function () {
					if (args.length === 1) {
						callback.call(_this, args[0]);
					} else {
						callback.apply(_this, args);
					}

					args = void 0;
				}, ms);
			}
		};
	}

	function _extend(dst, src) {
		if (dst && src) {
			for (var key in src) {
				if (src.hasOwnProperty(key)) {
					dst[key] = src[key];
				}
			}
		}

		return dst;
	}

	// Export utils
	Sortable.utils = {
		on: _on,
		off: _off,
		css: _css,
		find: _find,
		is: function is(el, selector) {
			return !!_closest(el, selector, el);
		},
		extend: _extend,
		throttle: _throttle,
		closest: _closest,
		toggleClass: _toggleClass,
		index: _index
	};

	/**
  * Create sortable instance
  * @param {HTMLElement}  el
  * @param {Object}      [options]
  */
	Sortable.create = function (el, options) {
		return new Sortable(el, options);
	};

	// Export
	Sortable.version = '1.4.2';
	return Sortable;
});

},{}]},{},[3])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmFzdGNsaWNrL2xpYi9mYXN0Y2xpY2suanMiLCJ3d3cvanMvYXBwLmpzIiwid3d3L2pzL21haW4uanMiLCJ3d3cvbGlicy9ldm90aGluZ3MvZXZvdGhpbmdzLmpzIiwid3d3L2xpYnMvc29ydGFibGUvU29ydGFibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3owQkE7QUFDQTs7OztBQ0RBOztBQUNBOztBQUNB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QUFVLEVBQVYsRUFBYyxPQUFkLEVBQXVCO0FBQ3hDLFNBQU8sSUFBSSxRQUFKLENBQWEsRUFBYixFQUFpQixPQUFqQixDQUFQO0FBQ0EsRUFGRDs7O0FBTUEsVUFBUyxPQUFULEdBQW1CLE9BQW5CO0FBQ0EsUUFBTyxRQUFQO0FBQ0EsQ0EvdUNEIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiOyhmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvKipcblx0ICogQHByZXNlcnZlIEZhc3RDbGljazogcG9seWZpbGwgdG8gcmVtb3ZlIGNsaWNrIGRlbGF5cyBvbiBicm93c2VycyB3aXRoIHRvdWNoIFVJcy5cblx0ICpcblx0ICogQGNvZGluZ3N0YW5kYXJkIGZ0bGFicy1qc3YyXG5cdCAqIEBjb3B5cmlnaHQgVGhlIEZpbmFuY2lhbCBUaW1lcyBMaW1pdGVkIFtBbGwgUmlnaHRzIFJlc2VydmVkXVxuXHQgKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoc2VlIExJQ0VOU0UudHh0KVxuXHQgKi9cblxuXHQvKmpzbGludCBicm93c2VyOnRydWUsIG5vZGU6dHJ1ZSovXG5cdC8qZ2xvYmFsIGRlZmluZSwgRXZlbnQsIE5vZGUqL1xuXG5cblx0LyoqXG5cdCAqIEluc3RhbnRpYXRlIGZhc3QtY2xpY2tpbmcgbGlzdGVuZXJzIG9uIHRoZSBzcGVjaWZpZWQgbGF5ZXIuXG5cdCAqXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHNcblx0ICovXG5cdGZ1bmN0aW9uIEZhc3RDbGljayhsYXllciwgb3B0aW9ucykge1xuXHRcdHZhciBvbGRPbkNsaWNrO1xuXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHQvKipcblx0XHQgKiBXaGV0aGVyIGEgY2xpY2sgaXMgY3VycmVudGx5IGJlaW5nIHRyYWNrZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBib29sZWFuXG5cdFx0ICovXG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRpbWVzdGFtcCBmb3Igd2hlbiBjbGljayB0cmFja2luZyBzdGFydGVkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50cmFja2luZ0NsaWNrU3RhcnQgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaGUgZWxlbWVudCBiZWluZyB0cmFja2VkIGZvciBhIGNsaWNrLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgRXZlbnRUYXJnZXRcblx0XHQgKi9cblx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXG5cblx0XHQvKipcblx0XHQgKiBYLWNvb3JkaW5hdGUgb2YgdG91Y2ggc3RhcnQgZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoU3RhcnRYID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogWS1jb29yZGluYXRlIG9mIHRvdWNoIHN0YXJ0IGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaFN0YXJ0WSA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIElEIG9mIHRoZSBsYXN0IHRvdWNoLCByZXRyaWV2ZWQgZnJvbSBUb3VjaC5pZGVudGlmaWVyLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy5sYXN0VG91Y2hJZGVudGlmaWVyID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogVG91Y2htb3ZlIGJvdW5kYXJ5LCBiZXlvbmQgd2hpY2ggYSBjbGljayB3aWxsIGJlIGNhbmNlbGxlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hCb3VuZGFyeSA9IG9wdGlvbnMudG91Y2hCb3VuZGFyeSB8fCAxMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIEZhc3RDbGljayBsYXllci5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIEVsZW1lbnRcblx0XHQgKi9cblx0XHR0aGlzLmxheWVyID0gbGF5ZXI7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgbWluaW11bSB0aW1lIGJldHdlZW4gdGFwKHRvdWNoc3RhcnQgYW5kIHRvdWNoZW5kKSBldmVudHNcblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudGFwRGVsYXkgPSBvcHRpb25zLnRhcERlbGF5IHx8IDIwMDtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBtYXhpbXVtIHRpbWUgZm9yIGEgdGFwXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRhcFRpbWVvdXQgPSBvcHRpb25zLnRhcFRpbWVvdXQgfHwgNzAwO1xuXG5cdFx0aWYgKEZhc3RDbGljay5ub3ROZWVkZWQobGF5ZXIpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gU29tZSBvbGQgdmVyc2lvbnMgb2YgQW5kcm9pZCBkb24ndCBoYXZlIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kXG5cdFx0ZnVuY3Rpb24gYmluZChtZXRob2QsIGNvbnRleHQpIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ldGhvZC5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpOyB9O1xuXHRcdH1cblxuXG5cdFx0dmFyIG1ldGhvZHMgPSBbJ29uTW91c2UnLCAnb25DbGljaycsICdvblRvdWNoU3RhcnQnLCAnb25Ub3VjaE1vdmUnLCAnb25Ub3VjaEVuZCcsICdvblRvdWNoQ2FuY2VsJ107XG5cdFx0dmFyIGNvbnRleHQgPSB0aGlzO1xuXHRcdGZvciAodmFyIGkgPSAwLCBsID0gbWV0aG9kcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRcdGNvbnRleHRbbWV0aG9kc1tpXV0gPSBiaW5kKGNvbnRleHRbbWV0aG9kc1tpXV0sIGNvbnRleHQpO1xuXHRcdH1cblxuXHRcdC8vIFNldCB1cCBldmVudCBoYW5kbGVycyBhcyByZXF1aXJlZFxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRydWUpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydCwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmUsIGZhbHNlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZCwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5vblRvdWNoQ2FuY2VsLCBmYWxzZSk7XG5cblx0XHQvLyBIYWNrIGlzIHJlcXVpcmVkIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgRXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIChlLmcuIEFuZHJvaWQgMilcblx0XHQvLyB3aGljaCBpcyBob3cgRmFzdENsaWNrIG5vcm1hbGx5IHN0b3BzIGNsaWNrIGV2ZW50cyBidWJibGluZyB0byBjYWxsYmFja3MgcmVnaXN0ZXJlZCBvbiB0aGUgRmFzdENsaWNrXG5cdFx0Ly8gbGF5ZXIgd2hlbiB0aGV5IGFyZSBjYW5jZWxsZWQuXG5cdFx0aWYgKCFFdmVudC5wcm90b3R5cGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKSB7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpIHtcblx0XHRcdFx0dmFyIHJtdiA9IE5vZGUucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG5cdFx0XHRcdGlmICh0eXBlID09PSAnY2xpY2snKSB7XG5cdFx0XHRcdFx0cm12LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLmhpamFja2VkIHx8IGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRybXYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpIHtcblx0XHRcdFx0dmFyIGFkdiA9IE5vZGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG5cdFx0XHRcdGlmICh0eXBlID09PSAnY2xpY2snKSB7XG5cdFx0XHRcdFx0YWR2LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLmhpamFja2VkIHx8IChjYWxsYmFjay5oaWphY2tlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdFx0XHRpZiAoIWV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCkge1xuXHRcdFx0XHRcdFx0XHRjYWxsYmFjayhldmVudCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSksIGNhcHR1cmUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGFkdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gSWYgYSBoYW5kbGVyIGlzIGFscmVhZHkgZGVjbGFyZWQgaW4gdGhlIGVsZW1lbnQncyBvbmNsaWNrIGF0dHJpYnV0ZSwgaXQgd2lsbCBiZSBmaXJlZCBiZWZvcmVcblx0XHQvLyBGYXN0Q2xpY2sncyBvbkNsaWNrIGhhbmRsZXIuIEZpeCB0aGlzIGJ5IHB1bGxpbmcgb3V0IHRoZSB1c2VyLWRlZmluZWQgaGFuZGxlciBmdW5jdGlvbiBhbmRcblx0XHQvLyBhZGRpbmcgaXQgYXMgbGlzdGVuZXIuXG5cdFx0aWYgKHR5cGVvZiBsYXllci5vbmNsaWNrID09PSAnZnVuY3Rpb24nKSB7XG5cblx0XHRcdC8vIEFuZHJvaWQgYnJvd3NlciBvbiBhdCBsZWFzdCAzLjIgcmVxdWlyZXMgYSBuZXcgcmVmZXJlbmNlIHRvIHRoZSBmdW5jdGlvbiBpbiBsYXllci5vbmNsaWNrXG5cdFx0XHQvLyAtIHRoZSBvbGQgb25lIHdvbid0IHdvcmsgaWYgcGFzc2VkIHRvIGFkZEV2ZW50TGlzdGVuZXIgZGlyZWN0bHkuXG5cdFx0XHRvbGRPbkNsaWNrID0gbGF5ZXIub25jbGljaztcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0b2xkT25DbGljayhldmVudCk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cdFx0XHRsYXllci5vbmNsaWNrID0gbnVsbDtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0KiBXaW5kb3dzIFBob25lIDguMSBmYWtlcyB1c2VyIGFnZW50IHN0cmluZyB0byBsb29rIGxpa2UgQW5kcm9pZCBhbmQgaVBob25lLlxuXHQqXG5cdCogQHR5cGUgYm9vbGVhblxuXHQqL1xuXHR2YXIgZGV2aWNlSXNXaW5kb3dzUGhvbmUgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJXaW5kb3dzIFBob25lXCIpID49IDA7XG5cblx0LyoqXG5cdCAqIEFuZHJvaWQgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzQW5kcm9pZCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQW5kcm9pZCcpID4gMCAmJiAhZGV2aWNlSXNXaW5kb3dzUGhvbmU7XG5cblxuXHQvKipcblx0ICogaU9TIHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0lPUyA9IC9pUChhZHxob25lfG9kKS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAhZGV2aWNlSXNXaW5kb3dzUGhvbmU7XG5cblxuXHQvKipcblx0ICogaU9TIDQgcmVxdWlyZXMgYW4gZXhjZXB0aW9uIGZvciBzZWxlY3QgZWxlbWVudHMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0lPUzQgPSBkZXZpY2VJc0lPUyAmJiAoL09TIDRfXFxkKF9cXGQpPy8pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cblxuXHQvKipcblx0ICogaU9TIDYuMC03LiogcmVxdWlyZXMgdGhlIHRhcmdldCBlbGVtZW50IHRvIGJlIG1hbnVhbGx5IGRlcml2ZWRcblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TV2l0aEJhZFRhcmdldCA9IGRldmljZUlzSU9TICYmICgvT1MgWzYtN11fXFxkLykudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuXHQvKipcblx0ICogQmxhY2tCZXJyeSByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNCbGFja0JlcnJ5MTAgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0JCMTAnKSA+IDA7XG5cblx0LyoqXG5cdCAqIERldGVybWluZSB3aGV0aGVyIGEgZ2l2ZW4gZWxlbWVudCByZXF1aXJlcyBhIG5hdGl2ZSBjbGljay5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXQgVGFyZ2V0IERPTSBlbGVtZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgbmVlZHMgYSBuYXRpdmUgY2xpY2tcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUubmVlZHNDbGljayA9IGZ1bmN0aW9uKHRhcmdldCkge1xuXHRcdHN3aXRjaCAodGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcblxuXHRcdC8vIERvbid0IHNlbmQgYSBzeW50aGV0aWMgY2xpY2sgdG8gZGlzYWJsZWQgaW5wdXRzIChpc3N1ZSAjNjIpXG5cdFx0Y2FzZSAnYnV0dG9uJzpcblx0XHRjYXNlICdzZWxlY3QnOlxuXHRcdGNhc2UgJ3RleHRhcmVhJzpcblx0XHRcdGlmICh0YXJnZXQuZGlzYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2lucHV0JzpcblxuXHRcdFx0Ly8gRmlsZSBpbnB1dHMgbmVlZCByZWFsIGNsaWNrcyBvbiBpT1MgNiBkdWUgdG8gYSBicm93c2VyIGJ1ZyAoaXNzdWUgIzY4KVxuXHRcdFx0aWYgKChkZXZpY2VJc0lPUyAmJiB0YXJnZXQudHlwZSA9PT0gJ2ZpbGUnKSB8fCB0YXJnZXQuZGlzYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2xhYmVsJzpcblx0XHRjYXNlICdpZnJhbWUnOiAvLyBpT1M4IGhvbWVzY3JlZW4gYXBwcyBjYW4gcHJldmVudCBldmVudHMgYnViYmxpbmcgaW50byBmcmFtZXNcblx0XHRjYXNlICd2aWRlbyc6XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKC9cXGJuZWVkc2NsaWNrXFxiLykudGVzdCh0YXJnZXQuY2xhc3NOYW1lKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgd2hldGhlciBhIGdpdmVuIGVsZW1lbnQgcmVxdWlyZXMgYSBjYWxsIHRvIGZvY3VzIHRvIHNpbXVsYXRlIGNsaWNrIGludG8gZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXQgVGFyZ2V0IERPTSBlbGVtZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgcmVxdWlyZXMgYSBjYWxsIHRvIGZvY3VzIHRvIHNpbXVsYXRlIG5hdGl2ZSBjbGljay5cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUubmVlZHNGb2N1cyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuXHRcdHN3aXRjaCAodGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRjYXNlICd0ZXh0YXJlYSc6XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRjYXNlICdzZWxlY3QnOlxuXHRcdFx0cmV0dXJuICFkZXZpY2VJc0FuZHJvaWQ7XG5cdFx0Y2FzZSAnaW5wdXQnOlxuXHRcdFx0c3dpdGNoICh0YXJnZXQudHlwZSkge1xuXHRcdFx0Y2FzZSAnYnV0dG9uJzpcblx0XHRcdGNhc2UgJ2NoZWNrYm94Jzpcblx0XHRcdGNhc2UgJ2ZpbGUnOlxuXHRcdFx0Y2FzZSAnaW1hZ2UnOlxuXHRcdFx0Y2FzZSAncmFkaW8nOlxuXHRcdFx0Y2FzZSAnc3VibWl0Jzpcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBObyBwb2ludCBpbiBhdHRlbXB0aW5nIHRvIGZvY3VzIGRpc2FibGVkIGlucHV0c1xuXHRcdFx0cmV0dXJuICF0YXJnZXQuZGlzYWJsZWQgJiYgIXRhcmdldC5yZWFkT25seTtcblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuICgvXFxibmVlZHNmb2N1c1xcYi8pLnRlc3QodGFyZ2V0LmNsYXNzTmFtZSk7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFNlbmQgYSBjbGljayBldmVudCB0byB0aGUgc3BlY2lmaWVkIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5zZW5kQ2xpY2sgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50LCBldmVudCkge1xuXHRcdHZhciBjbGlja0V2ZW50LCB0b3VjaDtcblxuXHRcdC8vIE9uIHNvbWUgQW5kcm9pZCBkZXZpY2VzIGFjdGl2ZUVsZW1lbnQgbmVlZHMgdG8gYmUgYmx1cnJlZCBvdGhlcndpc2UgdGhlIHN5bnRoZXRpYyBjbGljayB3aWxsIGhhdmUgbm8gZWZmZWN0ICgjMjQpXG5cdFx0aWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gdGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0fVxuXG5cdFx0dG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdC8vIFN5bnRoZXNpc2UgYSBjbGljayBldmVudCwgd2l0aCBhbiBleHRyYSBhdHRyaWJ1dGUgc28gaXQgY2FuIGJlIHRyYWNrZWRcblx0XHRjbGlja0V2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnRzJyk7XG5cdFx0Y2xpY2tFdmVudC5pbml0TW91c2VFdmVudCh0aGlzLmRldGVybWluZUV2ZW50VHlwZSh0YXJnZXRFbGVtZW50KSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCAxLCB0b3VjaC5zY3JlZW5YLCB0b3VjaC5zY3JlZW5ZLCB0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMCwgbnVsbCk7XG5cdFx0Y2xpY2tFdmVudC5mb3J3YXJkZWRUb3VjaEV2ZW50ID0gdHJ1ZTtcblx0XHR0YXJnZXRFbGVtZW50LmRpc3BhdGNoRXZlbnQoY2xpY2tFdmVudCk7XG5cdH07XG5cblx0RmFzdENsaWNrLnByb3RvdHlwZS5kZXRlcm1pbmVFdmVudFR5cGUgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cblx0XHQvL0lzc3VlICMxNTk6IEFuZHJvaWQgQ2hyb21lIFNlbGVjdCBCb3ggZG9lcyBub3Qgb3BlbiB3aXRoIGEgc3ludGhldGljIGNsaWNrIGV2ZW50XG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCAmJiB0YXJnZXRFbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3NlbGVjdCcpIHtcblx0XHRcdHJldHVybiAnbW91c2Vkb3duJztcblx0XHR9XG5cblx0XHRyZXR1cm4gJ2NsaWNrJztcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldEVsZW1lbnRcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZm9jdXMgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cdFx0dmFyIGxlbmd0aDtcblxuXHRcdC8vIElzc3VlICMxNjA6IG9uIGlPUyA3LCBzb21lIGlucHV0IGVsZW1lbnRzIChlLmcuIGRhdGUgZGF0ZXRpbWUgbW9udGgpIHRocm93IGEgdmFndWUgVHlwZUVycm9yIG9uIHNldFNlbGVjdGlvblJhbmdlLiBUaGVzZSBlbGVtZW50cyBkb24ndCBoYXZlIGFuIGludGVnZXIgdmFsdWUgZm9yIHRoZSBzZWxlY3Rpb25TdGFydCBhbmQgc2VsZWN0aW9uRW5kIHByb3BlcnRpZXMsIGJ1dCB1bmZvcnR1bmF0ZWx5IHRoYXQgY2FuJ3QgYmUgdXNlZCBmb3IgZGV0ZWN0aW9uIGJlY2F1c2UgYWNjZXNzaW5nIHRoZSBwcm9wZXJ0aWVzIGFsc28gdGhyb3dzIGEgVHlwZUVycm9yLiBKdXN0IGNoZWNrIHRoZSB0eXBlIGluc3RlYWQuIEZpbGVkIGFzIEFwcGxlIGJ1ZyAjMTUxMjI3MjQuXG5cdFx0aWYgKGRldmljZUlzSU9TICYmIHRhcmdldEVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UgJiYgdGFyZ2V0RWxlbWVudC50eXBlLmluZGV4T2YoJ2RhdGUnKSAhPT0gMCAmJiB0YXJnZXRFbGVtZW50LnR5cGUgIT09ICd0aW1lJyAmJiB0YXJnZXRFbGVtZW50LnR5cGUgIT09ICdtb250aCcpIHtcblx0XHRcdGxlbmd0aCA9IHRhcmdldEVsZW1lbnQudmFsdWUubGVuZ3RoO1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZShsZW5ndGgsIGxlbmd0aCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRhcmdldEVsZW1lbnQuZm9jdXMoKTtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogQ2hlY2sgd2hldGhlciB0aGUgZ2l2ZW4gdGFyZ2V0IGVsZW1lbnQgaXMgYSBjaGlsZCBvZiBhIHNjcm9sbGFibGUgbGF5ZXIgYW5kIGlmIHNvLCBzZXQgYSBmbGFnIG9uIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldEVsZW1lbnRcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUudXBkYXRlU2Nyb2xsUGFyZW50ID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCkge1xuXHRcdHZhciBzY3JvbGxQYXJlbnQsIHBhcmVudEVsZW1lbnQ7XG5cblx0XHRzY3JvbGxQYXJlbnQgPSB0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblxuXHRcdC8vIEF0dGVtcHQgdG8gZGlzY292ZXIgd2hldGhlciB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgY29udGFpbmVkIHdpdGhpbiBhIHNjcm9sbGFibGUgbGF5ZXIuIFJlLWNoZWNrIGlmIHRoZVxuXHRcdC8vIHRhcmdldCBlbGVtZW50IHdhcyBtb3ZlZCB0byBhbm90aGVyIHBhcmVudC5cblx0XHRpZiAoIXNjcm9sbFBhcmVudCB8fCAhc2Nyb2xsUGFyZW50LmNvbnRhaW5zKHRhcmdldEVsZW1lbnQpKSB7XG5cdFx0XHRwYXJlbnRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcblx0XHRcdGRvIHtcblx0XHRcdFx0aWYgKHBhcmVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gcGFyZW50RWxlbWVudC5vZmZzZXRIZWlnaHQpIHtcblx0XHRcdFx0XHRzY3JvbGxQYXJlbnQgPSBwYXJlbnRFbGVtZW50O1xuXHRcdFx0XHRcdHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50ID0gcGFyZW50RWxlbWVudDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQgPSBwYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0XHR9IHdoaWxlIChwYXJlbnRFbGVtZW50KTtcblx0XHR9XG5cblx0XHQvLyBBbHdheXMgdXBkYXRlIHRoZSBzY3JvbGwgdG9wIHRyYWNrZXIgaWYgcG9zc2libGUuXG5cdFx0aWYgKHNjcm9sbFBhcmVudCkge1xuXHRcdFx0c2Nyb2xsUGFyZW50LmZhc3RDbGlja0xhc3RTY3JvbGxUb3AgPSBzY3JvbGxQYXJlbnQuc2Nyb2xsVG9wO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRFbGVtZW50XG5cdCAqIEByZXR1cm5zIHtFbGVtZW50fEV2ZW50VGFyZ2V0fVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0ID0gZnVuY3Rpb24oZXZlbnRUYXJnZXQpIHtcblxuXHRcdC8vIE9uIHNvbWUgb2xkZXIgYnJvd3NlcnMgKG5vdGFibHkgU2FmYXJpIG9uIGlPUyA0LjEgLSBzZWUgaXNzdWUgIzU2KSB0aGUgZXZlbnQgdGFyZ2V0IG1heSBiZSBhIHRleHQgbm9kZS5cblx0XHRpZiAoZXZlbnRUYXJnZXQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG5cdFx0XHRyZXR1cm4gZXZlbnRUYXJnZXQucGFyZW50Tm9kZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZXZlbnRUYXJnZXQ7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggc3RhcnQsIHJlY29yZCB0aGUgcG9zaXRpb24gYW5kIHNjcm9sbCBvZmZzZXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoU3RhcnQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciB0YXJnZXRFbGVtZW50LCB0b3VjaCwgc2VsZWN0aW9uO1xuXG5cdFx0Ly8gSWdub3JlIG11bHRpcGxlIHRvdWNoZXMsIG90aGVyd2lzZSBwaW5jaC10by16b29tIGlzIHByZXZlbnRlZCBpZiBib3RoIGZpbmdlcnMgYXJlIG9uIHRoZSBGYXN0Q2xpY2sgZWxlbWVudCAoaXNzdWUgIzExMSkuXG5cdFx0aWYgKGV2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0dGFyZ2V0RWxlbWVudCA9IHRoaXMuZ2V0VGFyZ2V0RWxlbWVudEZyb21FdmVudFRhcmdldChldmVudC50YXJnZXQpO1xuXHRcdHRvdWNoID0gZXZlbnQudGFyZ2V0VG91Y2hlc1swXTtcblxuXHRcdGlmIChkZXZpY2VJc0lPUykge1xuXG5cdFx0XHQvLyBPbmx5IHRydXN0ZWQgZXZlbnRzIHdpbGwgZGVzZWxlY3QgdGV4dCBvbiBpT1MgKGlzc3VlICM0OSlcblx0XHRcdHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcblx0XHRcdGlmIChzZWxlY3Rpb24ucmFuZ2VDb3VudCAmJiAhc2VsZWN0aW9uLmlzQ29sbGFwc2VkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWRldmljZUlzSU9TNCkge1xuXG5cdFx0XHRcdC8vIFdlaXJkIHRoaW5ncyBoYXBwZW4gb24gaU9TIHdoZW4gYW4gYWxlcnQgb3IgY29uZmlybSBkaWFsb2cgaXMgb3BlbmVkIGZyb20gYSBjbGljayBldmVudCBjYWxsYmFjayAoaXNzdWUgIzIzKTpcblx0XHRcdFx0Ly8gd2hlbiB0aGUgdXNlciBuZXh0IHRhcHMgYW55d2hlcmUgZWxzZSBvbiB0aGUgcGFnZSwgbmV3IHRvdWNoc3RhcnQgYW5kIHRvdWNoZW5kIGV2ZW50cyBhcmUgZGlzcGF0Y2hlZFxuXHRcdFx0XHQvLyB3aXRoIHRoZSBzYW1lIGlkZW50aWZpZXIgYXMgdGhlIHRvdWNoIGV2ZW50IHRoYXQgcHJldmlvdXNseSB0cmlnZ2VyZWQgdGhlIGNsaWNrIHRoYXQgdHJpZ2dlcmVkIHRoZSBhbGVydC5cblx0XHRcdFx0Ly8gU2FkbHksIHRoZXJlIGlzIGFuIGlzc3VlIG9uIGlPUyA0IHRoYXQgY2F1c2VzIHNvbWUgbm9ybWFsIHRvdWNoIGV2ZW50cyB0byBoYXZlIHRoZSBzYW1lIGlkZW50aWZpZXIgYXMgYW5cblx0XHRcdFx0Ly8gaW1tZWRpYXRlbHkgcHJlY2VlZGluZyB0b3VjaCBldmVudCAoaXNzdWUgIzUyKSwgc28gdGhpcyBmaXggaXMgdW5hdmFpbGFibGUgb24gdGhhdCBwbGF0Zm9ybS5cblx0XHRcdFx0Ly8gSXNzdWUgMTIwOiB0b3VjaC5pZGVudGlmaWVyIGlzIDAgd2hlbiBDaHJvbWUgZGV2IHRvb2xzICdFbXVsYXRlIHRvdWNoIGV2ZW50cycgaXMgc2V0IHdpdGggYW4gaU9TIGRldmljZSBVQSBzdHJpbmcsXG5cdFx0XHRcdC8vIHdoaWNoIGNhdXNlcyBhbGwgdG91Y2ggZXZlbnRzIHRvIGJlIGlnbm9yZWQuIEFzIHRoaXMgYmxvY2sgb25seSBhcHBsaWVzIHRvIGlPUywgYW5kIGlPUyBpZGVudGlmaWVycyBhcmUgYWx3YXlzIGxvbmcsXG5cdFx0XHRcdC8vIHJhbmRvbSBpbnRlZ2VycywgaXQncyBzYWZlIHRvIHRvIGNvbnRpbnVlIGlmIHRoZSBpZGVudGlmaWVyIGlzIDAgaGVyZS5cblx0XHRcdFx0aWYgKHRvdWNoLmlkZW50aWZpZXIgJiYgdG91Y2guaWRlbnRpZmllciA9PT0gdGhpcy5sYXN0VG91Y2hJZGVudGlmaWVyKSB7XG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIgPSB0b3VjaC5pZGVudGlmaWVyO1xuXG5cdFx0XHRcdC8vIElmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIGEgc2Nyb2xsYWJsZSBsYXllciAodXNpbmcgLXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6IHRvdWNoKSBhbmQ6XG5cdFx0XHRcdC8vIDEpIHRoZSB1c2VyIGRvZXMgYSBmbGluZyBzY3JvbGwgb24gdGhlIHNjcm9sbGFibGUgbGF5ZXJcblx0XHRcdFx0Ly8gMikgdGhlIHVzZXIgc3RvcHMgdGhlIGZsaW5nIHNjcm9sbCB3aXRoIGFub3RoZXIgdGFwXG5cdFx0XHRcdC8vIHRoZW4gdGhlIGV2ZW50LnRhcmdldCBvZiB0aGUgbGFzdCAndG91Y2hlbmQnIGV2ZW50IHdpbGwgYmUgdGhlIGVsZW1lbnQgdGhhdCB3YXMgdW5kZXIgdGhlIHVzZXIncyBmaW5nZXJcblx0XHRcdFx0Ly8gd2hlbiB0aGUgZmxpbmcgc2Nyb2xsIHdhcyBzdGFydGVkLCBjYXVzaW5nIEZhc3RDbGljayB0byBzZW5kIGEgY2xpY2sgZXZlbnQgdG8gdGhhdCBsYXllciAtIHVubGVzcyBhIGNoZWNrXG5cdFx0XHRcdC8vIGlzIG1hZGUgdG8gZW5zdXJlIHRoYXQgYSBwYXJlbnQgbGF5ZXIgd2FzIG5vdCBzY3JvbGxlZCBiZWZvcmUgc2VuZGluZyBhIHN5bnRoZXRpYyBjbGljayAoaXNzdWUgIzQyKS5cblx0XHRcdFx0dGhpcy51cGRhdGVTY3JvbGxQYXJlbnQodGFyZ2V0RWxlbWVudCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gdHJ1ZTtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IGV2ZW50LnRpbWVTdGFtcDtcblx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXG5cdFx0dGhpcy50b3VjaFN0YXJ0WCA9IHRvdWNoLnBhZ2VYO1xuXHRcdHRoaXMudG91Y2hTdGFydFkgPSB0b3VjaC5wYWdlWTtcblxuXHRcdC8vIFByZXZlbnQgcGhhbnRvbSBjbGlja3Mgb24gZmFzdCBkb3VibGUtdGFwIChpc3N1ZSAjMzYpXG5cdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0aGlzLmxhc3RDbGlja1RpbWUpIDwgdGhpcy50YXBEZWxheSkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBCYXNlZCBvbiBhIHRvdWNobW92ZSBldmVudCBvYmplY3QsIGNoZWNrIHdoZXRoZXIgdGhlIHRvdWNoIGhhcyBtb3ZlZCBwYXN0IGEgYm91bmRhcnkgc2luY2UgaXQgc3RhcnRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnRvdWNoSGFzTW92ZWQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciB0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLCBib3VuZGFyeSA9IHRoaXMudG91Y2hCb3VuZGFyeTtcblxuXHRcdGlmIChNYXRoLmFicyh0b3VjaC5wYWdlWCAtIHRoaXMudG91Y2hTdGFydFgpID4gYm91bmRhcnkgfHwgTWF0aC5hYnModG91Y2gucGFnZVkgLSB0aGlzLnRvdWNoU3RhcnRZKSA+IGJvdW5kYXJ5KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogVXBkYXRlIHRoZSBsYXN0IHBvc2l0aW9uLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaE1vdmUgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdGlmICghdGhpcy50cmFja2luZ0NsaWNrKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgdG91Y2ggaGFzIG1vdmVkLCBjYW5jZWwgdGhlIGNsaWNrIHRyYWNraW5nXG5cdFx0aWYgKHRoaXMudGFyZ2V0RWxlbWVudCAhPT0gdGhpcy5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0KGV2ZW50LnRhcmdldCkgfHwgdGhpcy50b3VjaEhhc01vdmVkKGV2ZW50KSkge1xuXHRcdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEF0dGVtcHQgdG8gZmluZCB0aGUgbGFiZWxsZWQgY29udHJvbCBmb3IgdGhlIGdpdmVuIGxhYmVsIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8SFRNTExhYmVsRWxlbWVudH0gbGFiZWxFbGVtZW50XG5cdCAqIEByZXR1cm5zIHtFbGVtZW50fG51bGx9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmZpbmRDb250cm9sID0gZnVuY3Rpb24obGFiZWxFbGVtZW50KSB7XG5cblx0XHQvLyBGYXN0IHBhdGggZm9yIG5ld2VyIGJyb3dzZXJzIHN1cHBvcnRpbmcgdGhlIEhUTUw1IGNvbnRyb2wgYXR0cmlidXRlXG5cdFx0aWYgKGxhYmVsRWxlbWVudC5jb250cm9sICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBsYWJlbEVsZW1lbnQuY29udHJvbDtcblx0XHR9XG5cblx0XHQvLyBBbGwgYnJvd3NlcnMgdW5kZXIgdGVzdCB0aGF0IHN1cHBvcnQgdG91Y2ggZXZlbnRzIGFsc28gc3VwcG9ydCB0aGUgSFRNTDUgaHRtbEZvciBhdHRyaWJ1dGVcblx0XHRpZiAobGFiZWxFbGVtZW50Lmh0bWxGb3IpIHtcblx0XHRcdHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChsYWJlbEVsZW1lbnQuaHRtbEZvcik7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgbm8gZm9yIGF0dHJpYnV0ZSBleGlzdHMsIGF0dGVtcHQgdG8gcmV0cmlldmUgdGhlIGZpcnN0IGxhYmVsbGFibGUgZGVzY2VuZGFudCBlbGVtZW50XG5cdFx0Ly8gdGhlIGxpc3Qgb2Ygd2hpY2ggaXMgZGVmaW5lZCBoZXJlOiBodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sNS9mb3Jtcy5odG1sI2NhdGVnb3J5LWxhYmVsXG5cdFx0cmV0dXJuIGxhYmVsRWxlbWVudC5xdWVyeVNlbGVjdG9yKCdidXR0b24sIGlucHV0Om5vdChbdHlwZT1oaWRkZW5dKSwga2V5Z2VuLCBtZXRlciwgb3V0cHV0LCBwcm9ncmVzcywgc2VsZWN0LCB0ZXh0YXJlYScpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIGVuZCwgZGV0ZXJtaW5lIHdoZXRoZXIgdG8gc2VuZCBhIGNsaWNrIGV2ZW50IGF0IG9uY2UuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoRW5kID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgZm9yRWxlbWVudCwgdHJhY2tpbmdDbGlja1N0YXJ0LCB0YXJnZXRUYWdOYW1lLCBzY3JvbGxQYXJlbnQsIHRvdWNoLCB0YXJnZXRFbGVtZW50ID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXG5cdFx0aWYgKCF0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFByZXZlbnQgcGhhbnRvbSBjbGlja3Mgb24gZmFzdCBkb3VibGUtdGFwIChpc3N1ZSAjMzYpXG5cdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0aGlzLmxhc3RDbGlja1RpbWUpIDwgdGhpcy50YXBEZWxheSkge1xuXHRcdFx0dGhpcy5jYW5jZWxOZXh0Q2xpY2sgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCkgPiB0aGlzLnRhcFRpbWVvdXQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFJlc2V0IHRvIHByZXZlbnQgd3JvbmcgY2xpY2sgY2FuY2VsIG9uIGlucHV0IChpc3N1ZSAjMTU2KS5cblx0XHR0aGlzLmNhbmNlbE5leHRDbGljayA9IGZhbHNlO1xuXG5cdFx0dGhpcy5sYXN0Q2xpY2tUaW1lID0gZXZlbnQudGltZVN0YW1wO1xuXG5cdFx0dHJhY2tpbmdDbGlja1N0YXJ0ID0gdGhpcy50cmFja2luZ0NsaWNrU3RhcnQ7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrU3RhcnQgPSAwO1xuXG5cdFx0Ly8gT24gc29tZSBpT1MgZGV2aWNlcywgdGhlIHRhcmdldEVsZW1lbnQgc3VwcGxpZWQgd2l0aCB0aGUgZXZlbnQgaXMgaW52YWxpZCBpZiB0aGUgbGF5ZXJcblx0XHQvLyBpcyBwZXJmb3JtaW5nIGEgdHJhbnNpdGlvbiBvciBzY3JvbGwsIGFuZCBoYXMgdG8gYmUgcmUtZGV0ZWN0ZWQgbWFudWFsbHkuIE5vdGUgdGhhdFxuXHRcdC8vIGZvciB0aGlzIHRvIGZ1bmN0aW9uIGNvcnJlY3RseSwgaXQgbXVzdCBiZSBjYWxsZWQgKmFmdGVyKiB0aGUgZXZlbnQgdGFyZ2V0IGlzIGNoZWNrZWQhXG5cdFx0Ly8gU2VlIGlzc3VlICM1NzsgYWxzbyBmaWxlZCBhcyByZGFyOi8vMTMwNDg1ODkgLlxuXHRcdGlmIChkZXZpY2VJc0lPU1dpdGhCYWRUYXJnZXQpIHtcblx0XHRcdHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHRcdC8vIEluIGNlcnRhaW4gY2FzZXMgYXJndW1lbnRzIG9mIGVsZW1lbnRGcm9tUG9pbnQgY2FuIGJlIG5lZ2F0aXZlLCBzbyBwcmV2ZW50IHNldHRpbmcgdGFyZ2V0RWxlbWVudCB0byBudWxsXG5cdFx0XHR0YXJnZXRFbGVtZW50ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5wYWdlWCAtIHdpbmRvdy5wYWdlWE9mZnNldCwgdG91Y2gucGFnZVkgLSB3aW5kb3cucGFnZVlPZmZzZXQpIHx8IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHR0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudCA9IHRoaXMudGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cdFx0fVxuXG5cdFx0dGFyZ2V0VGFnTmFtZSA9IHRhcmdldEVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICh0YXJnZXRUYWdOYW1lID09PSAnbGFiZWwnKSB7XG5cdFx0XHRmb3JFbGVtZW50ID0gdGhpcy5maW5kQ29udHJvbCh0YXJnZXRFbGVtZW50KTtcblx0XHRcdGlmIChmb3JFbGVtZW50KSB7XG5cdFx0XHRcdHRoaXMuZm9jdXModGFyZ2V0RWxlbWVudCk7XG5cdFx0XHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0YXJnZXRFbGVtZW50ID0gZm9yRWxlbWVudDtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRoaXMubmVlZHNGb2N1cyh0YXJnZXRFbGVtZW50KSkge1xuXG5cdFx0XHQvLyBDYXNlIDE6IElmIHRoZSB0b3VjaCBzdGFydGVkIGEgd2hpbGUgYWdvIChiZXN0IGd1ZXNzIGlzIDEwMG1zIGJhc2VkIG9uIHRlc3RzIGZvciBpc3N1ZSAjMzYpIHRoZW4gZm9jdXMgd2lsbCBiZSB0cmlnZ2VyZWQgYW55d2F5LiBSZXR1cm4gZWFybHkgYW5kIHVuc2V0IHRoZSB0YXJnZXQgZWxlbWVudCByZWZlcmVuY2Ugc28gdGhhdCB0aGUgc3Vic2VxdWVudCBjbGljayB3aWxsIGJlIGFsbG93ZWQgdGhyb3VnaC5cblx0XHRcdC8vIENhc2UgMjogV2l0aG91dCB0aGlzIGV4Y2VwdGlvbiBmb3IgaW5wdXQgZWxlbWVudHMgdGFwcGVkIHdoZW4gdGhlIGRvY3VtZW50IGlzIGNvbnRhaW5lZCBpbiBhbiBpZnJhbWUsIHRoZW4gYW55IGlucHV0dGVkIHRleHQgd29uJ3QgYmUgdmlzaWJsZSBldmVuIHRob3VnaCB0aGUgdmFsdWUgYXR0cmlidXRlIGlzIHVwZGF0ZWQgYXMgdGhlIHVzZXIgdHlwZXMgKGlzc3VlICMzNykuXG5cdFx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRyYWNraW5nQ2xpY2tTdGFydCkgPiAxMDAgfHwgKGRldmljZUlzSU9TICYmIHdpbmRvdy50b3AgIT09IHdpbmRvdyAmJiB0YXJnZXRUYWdOYW1lID09PSAnaW5wdXQnKSkge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZm9jdXModGFyZ2V0RWxlbWVudCk7XG5cdFx0XHR0aGlzLnNlbmRDbGljayh0YXJnZXRFbGVtZW50LCBldmVudCk7XG5cblx0XHRcdC8vIFNlbGVjdCBlbGVtZW50cyBuZWVkIHRoZSBldmVudCB0byBnbyB0aHJvdWdoIG9uIGlPUyA0LCBvdGhlcndpc2UgdGhlIHNlbGVjdG9yIG1lbnUgd29uJ3Qgb3Blbi5cblx0XHRcdC8vIEFsc28gdGhpcyBicmVha3Mgb3BlbmluZyBzZWxlY3RzIHdoZW4gVm9pY2VPdmVyIGlzIGFjdGl2ZSBvbiBpT1M2LCBpT1M3IChhbmQgcG9zc2libHkgb3RoZXJzKVxuXHRcdFx0aWYgKCFkZXZpY2VJc0lPUyB8fCB0YXJnZXRUYWdOYW1lICE9PSAnc2VsZWN0Jykge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKGRldmljZUlzSU9TICYmICFkZXZpY2VJc0lPUzQpIHtcblxuXHRcdFx0Ly8gRG9uJ3Qgc2VuZCBhIHN5bnRoZXRpYyBjbGljayBldmVudCBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgY29udGFpbmVkIHdpdGhpbiBhIHBhcmVudCBsYXllciB0aGF0IHdhcyBzY3JvbGxlZFxuXHRcdFx0Ly8gYW5kIHRoaXMgdGFwIGlzIGJlaW5nIHVzZWQgdG8gc3RvcCB0aGUgc2Nyb2xsaW5nICh1c3VhbGx5IGluaXRpYXRlZCBieSBhIGZsaW5nIC0gaXNzdWUgIzQyKS5cblx0XHRcdHNjcm9sbFBhcmVudCA9IHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXHRcdFx0aWYgKHNjcm9sbFBhcmVudCAmJiBzY3JvbGxQYXJlbnQuZmFzdENsaWNrTGFzdFNjcm9sbFRvcCAhPT0gc2Nyb2xsUGFyZW50LnNjcm9sbFRvcCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBQcmV2ZW50IHRoZSBhY3R1YWwgY2xpY2sgZnJvbSBnb2luZyB0aG91Z2ggLSB1bmxlc3MgdGhlIHRhcmdldCBub2RlIGlzIG1hcmtlZCBhcyByZXF1aXJpbmdcblx0XHQvLyByZWFsIGNsaWNrcyBvciBpZiBpdCBpcyBpbiB0aGUgd2hpdGVsaXN0IGluIHdoaWNoIGNhc2Ugb25seSBub24tcHJvZ3JhbW1hdGljIGNsaWNrcyBhcmUgcGVybWl0dGVkLlxuXHRcdGlmICghdGhpcy5uZWVkc0NsaWNrKHRhcmdldEVsZW1lbnQpKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5zZW5kQ2xpY2sodGFyZ2V0RWxlbWVudCwgZXZlbnQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBjYW5jZWwsIHN0b3AgdHJhY2tpbmcgdGhlIGNsaWNrLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaENhbmNlbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdH07XG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIG1vdXNlIGV2ZW50cyB3aGljaCBzaG91bGQgYmUgcGVybWl0dGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Nb3VzZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cblx0XHQvLyBJZiBhIHRhcmdldCBlbGVtZW50IHdhcyBuZXZlciBzZXQgKGJlY2F1c2UgYSB0b3VjaCBldmVudCB3YXMgbmV2ZXIgZmlyZWQpIGFsbG93IHRoZSBldmVudFxuXHRcdGlmICghdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoZXZlbnQuZm9yd2FyZGVkVG91Y2hFdmVudCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUHJvZ3JhbW1hdGljYWxseSBnZW5lcmF0ZWQgZXZlbnRzIHRhcmdldGluZyBhIHNwZWNpZmljIGVsZW1lbnQgc2hvdWxkIGJlIHBlcm1pdHRlZFxuXHRcdGlmICghZXZlbnQuY2FuY2VsYWJsZSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gRGVyaXZlIGFuZCBjaGVjayB0aGUgdGFyZ2V0IGVsZW1lbnQgdG8gc2VlIHdoZXRoZXIgdGhlIG1vdXNlIGV2ZW50IG5lZWRzIHRvIGJlIHBlcm1pdHRlZDtcblx0XHQvLyB1bmxlc3MgZXhwbGljaXRseSBlbmFibGVkLCBwcmV2ZW50IG5vbi10b3VjaCBjbGljayBldmVudHMgZnJvbSB0cmlnZ2VyaW5nIGFjdGlvbnMsXG5cdFx0Ly8gdG8gcHJldmVudCBnaG9zdC9kb3VibGVjbGlja3MuXG5cdFx0aWYgKCF0aGlzLm5lZWRzQ2xpY2sodGhpcy50YXJnZXRFbGVtZW50KSB8fCB0aGlzLmNhbmNlbE5leHRDbGljaykge1xuXG5cdFx0XHQvLyBQcmV2ZW50IGFueSB1c2VyLWFkZGVkIGxpc3RlbmVycyBkZWNsYXJlZCBvbiBGYXN0Q2xpY2sgZWxlbWVudCBmcm9tIGJlaW5nIGZpcmVkLlxuXHRcdFx0aWYgKGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbikge1xuXHRcdFx0XHRldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0Ly8gUGFydCBvZiB0aGUgaGFjayBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IEV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoZS5nLiBBbmRyb2lkIDIpXG5cdFx0XHRcdGV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENhbmNlbCB0aGUgZXZlbnRcblx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSBtb3VzZSBldmVudCBpcyBwZXJtaXR0ZWQsIHJldHVybiB0cnVlIGZvciB0aGUgYWN0aW9uIHRvIGdvIHRocm91Z2guXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gYWN0dWFsIGNsaWNrcywgZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBpcyBhIHRvdWNoLWdlbmVyYXRlZCBjbGljaywgYSBjbGljayBhY3Rpb24gb2NjdXJyaW5nXG5cdCAqIG5hdHVyYWxseSBhZnRlciBhIGRlbGF5IGFmdGVyIGEgdG91Y2ggKHdoaWNoIG5lZWRzIHRvIGJlIGNhbmNlbGxlZCB0byBhdm9pZCBkdXBsaWNhdGlvbiksIG9yXG5cdCAqIGFuIGFjdHVhbCBjbGljayB3aGljaCBzaG91bGQgYmUgcGVybWl0dGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHBlcm1pdHRlZDtcblxuXHRcdC8vIEl0J3MgcG9zc2libGUgZm9yIGFub3RoZXIgRmFzdENsaWNrLWxpa2UgbGlicmFyeSBkZWxpdmVyZWQgd2l0aCB0aGlyZC1wYXJ0eSBjb2RlIHRvIGZpcmUgYSBjbGljayBldmVudCBiZWZvcmUgRmFzdENsaWNrIGRvZXMgKGlzc3VlICM0NCkuIEluIHRoYXQgY2FzZSwgc2V0IHRoZSBjbGljay10cmFja2luZyBmbGFnIGJhY2sgdG8gZmFsc2UgYW5kIHJldHVybiBlYXJseS4gVGhpcyB3aWxsIGNhdXNlIG9uVG91Y2hFbmQgdG8gcmV0dXJuIGVhcmx5LlxuXHRcdGlmICh0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFZlcnkgb2RkIGJlaGF2aW91ciBvbiBpT1MgKGlzc3VlICMxOCk6IGlmIGEgc3VibWl0IGVsZW1lbnQgaXMgcHJlc2VudCBpbnNpZGUgYSBmb3JtIGFuZCB0aGUgdXNlciBoaXRzIGVudGVyIGluIHRoZSBpT1Mgc2ltdWxhdG9yIG9yIGNsaWNrcyB0aGUgR28gYnV0dG9uIG9uIHRoZSBwb3AtdXAgT1Mga2V5Ym9hcmQgdGhlIGEga2luZCBvZiAnZmFrZScgY2xpY2sgZXZlbnQgd2lsbCBiZSB0cmlnZ2VyZWQgd2l0aCB0aGUgc3VibWl0LXR5cGUgaW5wdXQgZWxlbWVudCBhcyB0aGUgdGFyZ2V0LlxuXHRcdGlmIChldmVudC50YXJnZXQudHlwZSA9PT0gJ3N1Ym1pdCcgJiYgZXZlbnQuZGV0YWlsID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRwZXJtaXR0ZWQgPSB0aGlzLm9uTW91c2UoZXZlbnQpO1xuXG5cdFx0Ly8gT25seSB1bnNldCB0YXJnZXRFbGVtZW50IGlmIHRoZSBjbGljayBpcyBub3QgcGVybWl0dGVkLiBUaGlzIHdpbGwgZW5zdXJlIHRoYXQgdGhlIGNoZWNrIGZvciAhdGFyZ2V0RWxlbWVudCBpbiBvbk1vdXNlIGZhaWxzIGFuZCB0aGUgYnJvd3NlcidzIGNsaWNrIGRvZXNuJ3QgZ28gdGhyb3VnaC5cblx0XHRpZiAoIXBlcm1pdHRlZCkge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHR9XG5cblx0XHQvLyBJZiBjbGlja3MgYXJlIHBlcm1pdHRlZCwgcmV0dXJuIHRydWUgZm9yIHRoZSBhY3Rpb24gdG8gZ28gdGhyb3VnaC5cblx0XHRyZXR1cm4gcGVybWl0dGVkO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFJlbW92ZSBhbGwgRmFzdENsaWNrJ3MgZXZlbnQgbGlzdGVuZXJzLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsYXllciA9IHRoaXMubGF5ZXI7XG5cblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdH1cblxuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLCB0cnVlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnQsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlLCBmYWxzZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmQsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMub25Ub3VjaENhbmNlbCwgZmFsc2UpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIENoZWNrIHdoZXRoZXIgRmFzdENsaWNrIGlzIG5lZWRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFbGVtZW50fSBsYXllciBUaGUgbGF5ZXIgdG8gbGlzdGVuIG9uXG5cdCAqL1xuXHRGYXN0Q2xpY2subm90TmVlZGVkID0gZnVuY3Rpb24obGF5ZXIpIHtcblx0XHR2YXIgbWV0YVZpZXdwb3J0O1xuXHRcdHZhciBjaHJvbWVWZXJzaW9uO1xuXHRcdHZhciBibGFja2JlcnJ5VmVyc2lvbjtcblx0XHR2YXIgZmlyZWZveFZlcnNpb247XG5cblx0XHQvLyBEZXZpY2VzIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0b3VjaCBkb24ndCBuZWVkIEZhc3RDbGlja1xuXHRcdGlmICh0eXBlb2Ygd2luZG93Lm9udG91Y2hzdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIENocm9tZSB2ZXJzaW9uIC0gemVybyBmb3Igb3RoZXIgYnJvd3NlcnNcblx0XHRjaHJvbWVWZXJzaW9uID0gKygvQ2hyb21lXFwvKFswLTldKykvLmV4ZWMobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgWywwXSlbMV07XG5cblx0XHRpZiAoY2hyb21lVmVyc2lvbikge1xuXG5cdFx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblxuXHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0Ly8gQ2hyb21lIG9uIEFuZHJvaWQgd2l0aCB1c2VyLXNjYWxhYmxlPVwibm9cIiBkb2Vzbid0IG5lZWQgRmFzdENsaWNrIChpc3N1ZSAjODkpXG5cdFx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydC5jb250ZW50LmluZGV4T2YoJ3VzZXItc2NhbGFibGU9bm8nKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBDaHJvbWUgMzIgYW5kIGFib3ZlIHdpdGggd2lkdGg9ZGV2aWNlLXdpZHRoIG9yIGxlc3MgZG9uJ3QgbmVlZCBGYXN0Q2xpY2tcblx0XHRcdFx0XHRpZiAoY2hyb21lVmVyc2lvbiA+IDMxICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdC8vIENocm9tZSBkZXNrdG9wIGRvZXNuJ3QgbmVlZCBGYXN0Q2xpY2sgKGlzc3VlICMxNSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChkZXZpY2VJc0JsYWNrQmVycnkxMCkge1xuXHRcdFx0YmxhY2tiZXJyeVZlcnNpb24gPSBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9WZXJzaW9uXFwvKFswLTldKilcXC4oWzAtOV0qKS8pO1xuXG5cdFx0XHQvLyBCbGFja0JlcnJ5IDEwLjMrIGRvZXMgbm90IHJlcXVpcmUgRmFzdGNsaWNrIGxpYnJhcnkuXG5cdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vZnRsYWJzL2Zhc3RjbGljay9pc3N1ZXMvMjUxXG5cdFx0XHRpZiAoYmxhY2tiZXJyeVZlcnNpb25bMV0gPj0gMTAgJiYgYmxhY2tiZXJyeVZlcnNpb25bMl0gPj0gMykge1xuXHRcdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cblx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydCkge1xuXHRcdFx0XHRcdC8vIHVzZXItc2NhbGFibGU9bm8gZWxpbWluYXRlcyBjbGljayBkZWxheS5cblx0XHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHdpZHRoPWRldmljZS13aWR0aCAob3IgbGVzcyB0aGFuIGRldmljZS13aWR0aCkgZWxpbWluYXRlcyBjbGljayBkZWxheS5cblx0XHRcdFx0XHRpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJRTEwIHdpdGggLW1zLXRvdWNoLWFjdGlvbjogbm9uZSBvciBtYW5pcHVsYXRpb24sIHdoaWNoIGRpc2FibGVzIGRvdWJsZS10YXAtdG8tem9vbSAoaXNzdWUgIzk3KVxuXHRcdGlmIChsYXllci5zdHlsZS5tc1RvdWNoQWN0aW9uID09PSAnbm9uZScgfHwgbGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdtYW5pcHVsYXRpb24nKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBGaXJlZm94IHZlcnNpb24gLSB6ZXJvIGZvciBvdGhlciBicm93c2Vyc1xuXHRcdGZpcmVmb3hWZXJzaW9uID0gKygvRmlyZWZveFxcLyhbMC05XSspLy5leGVjKG5hdmlnYXRvci51c2VyQWdlbnQpIHx8IFssMF0pWzFdO1xuXG5cdFx0aWYgKGZpcmVmb3hWZXJzaW9uID49IDI3KSB7XG5cdFx0XHQvLyBGaXJlZm94IDI3KyBkb2VzIG5vdCBoYXZlIHRhcCBkZWxheSBpZiB0aGUgY29udGVudCBpcyBub3Qgem9vbWFibGUgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD05MjI4OTZcblxuXHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXHRcdFx0aWYgKG1ldGFWaWV3cG9ydCAmJiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElFMTE6IHByZWZpeGVkIC1tcy10b3VjaC1hY3Rpb24gaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCBhbmQgaXQncyByZWNvbWVuZGVkIHRvIHVzZSBub24tcHJlZml4ZWQgdmVyc2lvblxuXHRcdC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS93aW5kb3dzL2FwcHMvSGg3NjczMTMuYXNweFxuXHRcdGlmIChsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ25vbmUnIHx8IGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbWFuaXB1bGF0aW9uJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIGZvciBjcmVhdGluZyBhIEZhc3RDbGljayBvYmplY3Rcblx0ICpcblx0ICogQHBhcmFtIHtFbGVtZW50fSBsYXllciBUaGUgbGF5ZXIgdG8gbGlzdGVuIG9uXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHRzXG5cdCAqL1xuXHRGYXN0Q2xpY2suYXR0YWNoID0gZnVuY3Rpb24obGF5ZXIsIG9wdGlvbnMpIHtcblx0XHRyZXR1cm4gbmV3IEZhc3RDbGljayhsYXllciwgb3B0aW9ucyk7XG5cdH07XG5cblxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXG5cdFx0Ly8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuXHRcdGRlZmluZShmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBGYXN0Q2xpY2s7XG5cdFx0fSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IEZhc3RDbGljay5hdHRhY2g7XG5cdFx0bW9kdWxlLmV4cG9ydHMuRmFzdENsaWNrID0gRmFzdENsaWNrO1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5GYXN0Q2xpY2sgPSBGYXN0Q2xpY2s7XG5cdH1cbn0oKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklpSXNJbVpwYkdVaU9pSmhjSEF1YW5NaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNlcxMTkiLCJpbXBvcnQgeyBldm90aGluZ3MgfSBmcm9tICcuLy4uL2xpYnMvZXZvdGhpbmdzL2V2b3RoaW5ncyc7XG5pbXBvcnQgeyBzb3J0YWJsZSB9IGZyb20gJy4vLi4vbGlicy9zb3J0YWJsZS9Tb3J0YWJsZSc7XG5pbXBvcnQgJy4vYXBwJztcbnZhciBhdHRhY2hGYXN0Q2xpY2sgPSByZXF1aXJlKCdmYXN0Y2xpY2snKTsgXG5cbi8vIGF2b2lkIHRoZSAzMDBtcyBjbGljayBkZWxheSBvbiBtb2JpbGUgZGV2aWNlc1xuYXR0YWNoRmFzdENsaWNrKGRvY3VtZW50LmJvZHkpOyBcblxuIiwiLy8gRHluYW1pYyBzY3JpcHQgbG9hZGVyIHRoYXQgdHJhY2tzIGxvYWRlZCBzY3JpcHRzLlxuLy8gQ2FuIGFsc28gdXNlIGFuIGV2ZW50IChzaW1pbGFyIHRvICdkZXZpcmVyZWFkeScgaW4gQ29yZG92YSlcbi8vIHRvIG5vdGlmeSB3aGVuIHNjcmlwdHMgYXJlIGxvYWRlZCAoYnkgdXNpbmcgYSBzY3JpcHQgbG9hZGluZ1xuLy8gY291bnRlciB0byB0cmFjayBwcm9ncmVzcykuXG5cbi8qKlxuKiBAbmFtZXNwYWNlIFxuKi9cbnZhciBldm90aGluZ3MgPSB3aW5kb3cuZXZvdGhpbmdzIHx8IHt9O1xuKGZ1bmN0aW9uKClcbntcblx0LyogLS0tLS0tLS0tLS0tLS0tLS0tIFNjcmlwdCBsb2FkaW5nIC0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5cdHZhciBzY3JpcHRMb2FkaW5nQ291bnRlciA9IDA7XG5cdHZhciBsb2FkZWRTY3JpcHRzID0ge307XG5cdHZhciBzY3JpcHRzTG9hZGVkQ2FsbGJhY2tzID0gW107XG5cblx0LyoqXG5cdCAqIExvYWQgYSBzY3JpcHQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgLSBVUkwgb3IgcGF0aCB0byB0aGUgc2NyaXB0LiBSZWxhdGl2ZSBwYXRocyBhcmVcblx0ICogcmVsYXRpdmUgdG8gdGhlIEhUTUwgZmlsZSB0aGF0IGluaXRpYXRlZCBzY3JpcHQgbG9hZGluZy5cblx0ICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBvcHRpb25hbCBwYXJhbWV0ZXJsZXNzIGZ1bmN0aW9uIHRoYXQgd2lsbFxuXHQgKiBiZSBjYWxsZWQgd2hlbiB0aGUgc2NyaXB0IGhhcyBsb2FkZWQuXG5cdCAqL1xuXHRldm90aGluZ3MubG9hZFNjcmlwdCA9IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2spXG5cdHtcblx0XHQvLyBJZiBzY3JpcHQgaXMgYWxyZWFkeSBsb2FkZWQgY2FsbCBjYWxsYmFjayBkaXJlY3RseSBhbmQgcmV0dXJuLlxuXHRcdGlmIChsb2FkZWRTY3JpcHRzW3VybF0pXG5cdFx0e1xuXHRcdFx0Y2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBBZGQgc2NyaXB0IHRvIGRpY3Rpb25hbHkgb2YgbG9hZGVkIHNjcmlwdHMuXG5cdFx0bG9hZGVkU2NyaXB0c1t1cmxdID0gJ2xvYWRpbmdzdGFydGVkJztcblx0XHQrK3NjcmlwdExvYWRpbmdDb3VudGVyO1xuXG5cdFx0Ly8gQ3JlYXRlIHNjcmlwdCB0YWcuXG5cdFx0dmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXHRcdHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG5cdFx0c2NyaXB0LnNyYyA9IHVybDtcblxuXHRcdC8vIEJpbmQgdGhlIG9ubG9hZCBldmVudC5cblx0XHRzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdC8vIE1hcmsgYXMgbG9hZGVkLlxuXHRcdFx0bG9hZGVkU2NyaXB0c1t1cmxdID0gJ2xvYWRpbmdjb21wbGV0ZSc7XG5cdFx0XHQtLXNjcmlwdExvYWRpbmdDb3VudGVyO1xuXG5cdFx0XHQvLyBDYWxsIGNhbGxiYWNrIGlmIGdpdmVuLlxuXHRcdFx0Y2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcblxuXHRcdFx0Ly8gQ2FsbCBzY3JpcHRzIGxvYWRlZCBjYWxsYmFja3MgaWYgdGhpcyB3YXMgdGhlIGxhc3Qgc2NyaXB0IGxvYWRlZC5cblx0XHRcdGlmICgwID09IHNjcmlwdExvYWRpbmdDb3VudGVyKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHNMb2FkZWRDYWxsYmFja3MubGVuZ3RoOyArK2kpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQoc2NyaXB0c0xvYWRlZENhbGxiYWNrc1tpXSkoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIENsZWFyIGNhbGxiYWNrcyAtIHNob3VsZCB3ZSBkbyB0aGlzPz8/XG5cdFx0XHRcdHNjcmlwdHNMb2FkZWRDYWxsYmFja3MgPSBbXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBvbmVycm9yIGZpcmVzIGZvciB0aGluZ3MgbGlrZSBtYWxmb3JtZWQgVVJMcyBhbmQgNDA0J3MuXG5cdFx0Ly8gSWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQsIHRoZSBtYXRjaGluZyBvbmxvYWQgd2lsbCBub3QgYmUgY2FsbGVkIGFuZFxuXHRcdC8vIHNjcmlwdHNMb2FkZWQgd2lsbCBub3QgZmlyZS5cblx0XHRzY3JpcHQub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhyb3cgXCJDb3VsZCBub3QgbG9hZCBzY3JpcHQgJ1wiK3VybCtcIidcIjtcblx0XHR9O1xuXG5cdFx0Ly8gQXR0YWNoaW5nIHRoZSBzY3JpcHQgdGFnIHRvIHRoZSBkb2N1bWVudCBzdGFydHMgbG9hZGluZyB0aGUgc2NyaXB0LlxuXHRcdGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBZGQgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW4gYWxsIHNjcmlwdHMgYXJlIGxvYWRlZC5cblx0ICogQHBhcmFtIGNhbGxiYWNrIC0gcGFyYW1ldGVybGVzcyBmdW5jdGlvbiB0aGF0IHdpbGxcblx0ICogYmUgY2FsbGVkIHdoZW4gYWxsIHNjcmlwdHMgaGF2ZSBmaW5pc2hlZCBsb2FkaW5nLlxuXHQgKi9cblx0ZXZvdGhpbmdzLnNjcmlwdHNMb2FkZWQgPSBmdW5jdGlvbihjYWxsYmFjaylcblx0e1xuXHRcdC8vIElmIHNjcmlwdHMgYXJlIGFscmVhZHkgbG9hZGVkIGNhbGwgdGhlIGNhbGxiYWNrIGRpcmVjdGx5LFxuXHRcdC8vIGVsc2UgYWRkIHRoZSBjYWxsYmFjayB0byB0aGUgY2FsbGJhY2tzIGFycmF5LlxuXHRcdGlmICgwICE9IE9iamVjdC5rZXlzKGxvYWRlZFNjcmlwdHMpLmxlbmd0aCAmJlxuXHRcdFx0MCA9PSBzY3JpcHRMb2FkaW5nQ291bnRlcilcblx0XHR7XG5cdFx0XHRjYWxsYmFjaygpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0c2NyaXB0c0xvYWRlZENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcblx0XHR9XG5cdH07XG5cblx0LyogLS0tLS0tLS0tLS0tLS0tLS0tIERlYnVnZ2luZyAtLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuXHQvKipcblx0ICogUHJpbnQgYSBKYXZhU2NyaXB0IG9iamVjdCAoZGljdGlvbmFyeSkuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvYmogLSBPYmplY3QgdG8gcHJpbnQuXG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb259IHByaW50RnVuIC0gcHJpbnQgZnVuY3Rpb24gKG9wdGlvbmFsIC0gZGVmYXVsdHMgdG9cblx0ICogY29uc29sZS5sb2cgaWYgbm90IGdpdmVuKS5cblx0ICpcblx0ICogQGV4YW1wbGVcblx0ICogICB2YXIgb2JqID0geyBjb21wYW55OiAnRXZvdGhpbmdzJywgZmllbGQ6ICdJb1QnIH07XG5cdCAqICAgZXZvdGhpbmdzLmVhc3libGUucHJpbnRPYmplY3Qob2JqKTtcblx0ICogICBldm90aGluZ3MuZWFzeWJsZS5wcmludE9iamVjdChvYmosIGNvbnNvbGUubG9nKTtcblx0ICovXG5cdGV2b3RoaW5ncy5wcmludE9iamVjdCA9IGZ1bmN0aW9uKG9iaiwgcHJpbnRGdW4pXG5cdHtcblx0XHRwcmludEZ1biA9IHByaW50RnVuIHx8IGNvbnNvbGUubG9nO1xuXHRcdGZ1bmN0aW9uIHByaW50KG9iaiwgbGV2ZWwpXG5cdFx0e1xuXHRcdFx0dmFyIGluZGVudCA9IG5ldyBBcnJheShsZXZlbCArIDEpLmpvaW4oJyAgJyk7XG5cdFx0XHRmb3IgKHZhciBwcm9wIGluIG9iailcblx0XHRcdHtcblx0XHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IG9ialtwcm9wXTtcblx0XHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHByaW50RnVuKGluZGVudCArIHByb3AgKyAnOicpO1xuXHRcdFx0XHRcdFx0cHJpbnQodmFsdWUsIGxldmVsICsgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRwcmludEZ1bihpbmRlbnQgKyBwcm9wICsgJzogJyArIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cHJpbnQob2JqLCAwKTtcblx0fTtcblxuXHQvKiAtLS0tLS0tLS0tLS0tLS0tLS0gUGxhdGZvcm0gY2hlY2sgLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cblx0ZXZvdGhpbmdzLm9zID0ge307XG5cblx0ZXZvdGhpbmdzLm9zLmlzSU9TID0gZnVuY3Rpb24oKVxuXHR7XG5cdFx0cmV0dXJuIC9pUChob25lfGFkfG9kKS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblx0fTtcblxuXHRldm90aGluZ3Mub3MuaXNJT1M3ID0gZnVuY3Rpb24oKVxuXHR7XG5cdFx0cmV0dXJuIC9pUChob25lfGFkfG9kKS4qT1MgNy8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblx0fTtcblxuXHRldm90aGluZ3Mub3MuaXNBbmRyb2lkID0gZnVuY3Rpb24oKVxuXHR7XG5cdFx0cmV0dXJuIC9BbmRyb2lkfGFuZHJvaWQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cdH07XG5cblx0ZXZvdGhpbmdzLm9zLmlzV1AgPSBmdW5jdGlvbigpXG5cdHtcblx0XHRyZXR1cm4gL1dpbmRvd3MgUGhvbmUvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cdH07XG5cblx0cmV0dXJuIGV2b3RoaW5ncztcblxuLy8gSWYgZm9yIHNvbWUgcmVhc29uIHRoZSBnbG9iYWwgZXZvdGhpbmdzIHZhcmlhYmxlIGlzIGFscmVhZHkgZGVmaW5lZCB3ZSB1c2UgaXQuXG59KSgpO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKGUpIHtcblx0LyogU2V0IGFuIGFic29sdXRlIGJhc2UgZm9udCBzaXplIGluIGlPUyA3IGR1ZSB0byB0aGF0IHZpZXdwb3J0LXJlbGF0aXZlXG5cdGZvbnQgc2l6ZXMgZG9lc24ndCB3b3JrIHByb3Blcmx5IGNhdXNlZCBieSB0aGUgV2ViS2l0IGJ1ZyBkZXNjcmliZWQgYXRcblx0aHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTEzMTg2My4gKi9cblx0aWYgKGV2b3RoaW5ncy5vcy5pc0lPUzcoKSlcblx0e1xuXHRcdGRvY3VtZW50LmJvZHkuc3R5bGUuZm9udFNpemUgPSAnMjBwdCdcblx0fVxufSlcbiIsIi8qKiFcbiAqIFNvcnRhYmxlXG4gKiBAYXV0aG9yXHRSdWJhWGEgICA8dHJhc2hAcnViYXhhLm9yZz5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cblxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9IFwidW5kZWZpbmVkXCIpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgUGFja2FnZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFNvcnRhYmxlID0gZmFjdG9yeSgpOyAgLy8gZXhwb3J0IGZvciBNZXRlb3IuanNcblx0fVxuXHRlbHNlIHtcblx0XHQvKiBqc2hpbnQgc3ViOnRydWUgKi9cblx0XHR3aW5kb3dbXCJTb3J0YWJsZVwiXSA9IGZhY3RvcnkoKTtcblx0fVxufSkoZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0XG5cdGlmICh0eXBlb2Ygd2luZG93ID09IFwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIHdpbmRvdy5kb2N1bWVudCA9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCBcIlNvcnRhYmxlLmpzIHJlcXVpcmVzIGEgd2luZG93IHdpdGggYSBkb2N1bWVudFwiICk7XG5cdFx0fVxuXHR9XG5cblx0dmFyIGRyYWdFbCxcblx0XHRwYXJlbnRFbCxcblx0XHRnaG9zdEVsLFxuXHRcdGNsb25lRWwsXG5cdFx0cm9vdEVsLFxuXHRcdG5leHRFbCxcblxuXHRcdHNjcm9sbEVsLFxuXHRcdHNjcm9sbFBhcmVudEVsLFxuXG5cdFx0bGFzdEVsLFxuXHRcdGxhc3RDU1MsXG5cdFx0bGFzdFBhcmVudENTUyxcblxuXHRcdG9sZEluZGV4LFxuXHRcdG5ld0luZGV4LFxuXG5cdFx0YWN0aXZlR3JvdXAsXG5cdFx0YXV0b1Njcm9sbCA9IHt9LFxuXG5cdFx0dGFwRXZ0LFxuXHRcdHRvdWNoRXZ0LFxuXG5cdFx0bW92ZWQsXG5cblx0XHQvKiogQGNvbnN0ICovXG5cdFx0UlNQQUNFID0gL1xccysvZyxcblxuXHRcdGV4cGFuZG8gPSAnU29ydGFibGUnICsgKG5ldyBEYXRlKS5nZXRUaW1lKCksXG5cblx0XHR3aW4gPSB3aW5kb3csXG5cdFx0ZG9jdW1lbnQgPSB3aW4uZG9jdW1lbnQsXG5cdFx0cGFyc2VJbnQgPSB3aW4ucGFyc2VJbnQsXG5cblx0XHRzdXBwb3J0RHJhZ2dhYmxlID0gISEoJ2RyYWdnYWJsZScgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpLFxuXHRcdHN1cHBvcnRDc3NQb2ludGVyRXZlbnRzID0gKGZ1bmN0aW9uIChlbCkge1xuXHRcdFx0ZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd4Jyk7XG5cdFx0XHRlbC5zdHlsZS5jc3NUZXh0ID0gJ3BvaW50ZXItZXZlbnRzOmF1dG8nO1xuXHRcdFx0cmV0dXJuIGVsLnN0eWxlLnBvaW50ZXJFdmVudHMgPT09ICdhdXRvJztcblx0XHR9KSgpLFxuXG5cdFx0X3NpbGVudCA9IGZhbHNlLFxuXG5cdFx0YWJzID0gTWF0aC5hYnMsXG5cdFx0c2xpY2UgPSBbXS5zbGljZSxcblxuXHRcdHRvdWNoRHJhZ092ZXJMaXN0ZW5lcnMgPSBbXSxcblxuXHRcdF9hdXRvU2Nyb2xsID0gX3Rocm90dGxlKGZ1bmN0aW9uICgvKipFdmVudCovZXZ0LCAvKipPYmplY3QqL29wdGlvbnMsIC8qKkhUTUxFbGVtZW50Ki9yb290RWwpIHtcblx0XHRcdC8vIEJ1ZzogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTA1NTIxXG5cdFx0XHRpZiAocm9vdEVsICYmIG9wdGlvbnMuc2Nyb2xsKSB7XG5cdFx0XHRcdHZhciBlbCxcblx0XHRcdFx0XHRyZWN0LFxuXHRcdFx0XHRcdHNlbnMgPSBvcHRpb25zLnNjcm9sbFNlbnNpdGl2aXR5LFxuXHRcdFx0XHRcdHNwZWVkID0gb3B0aW9ucy5zY3JvbGxTcGVlZCxcblxuXHRcdFx0XHRcdHggPSBldnQuY2xpZW50WCxcblx0XHRcdFx0XHR5ID0gZXZ0LmNsaWVudFksXG5cblx0XHRcdFx0XHR3aW5XaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoLFxuXHRcdFx0XHRcdHdpbkhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCxcblxuXHRcdFx0XHRcdHZ4LFxuXHRcdFx0XHRcdHZ5XG5cdFx0XHRcdDtcblxuXHRcdFx0XHQvLyBEZWxlY3Qgc2Nyb2xsRWxcblx0XHRcdFx0aWYgKHNjcm9sbFBhcmVudEVsICE9PSByb290RWwpIHtcblx0XHRcdFx0XHRzY3JvbGxFbCA9IG9wdGlvbnMuc2Nyb2xsO1xuXHRcdFx0XHRcdHNjcm9sbFBhcmVudEVsID0gcm9vdEVsO1xuXG5cdFx0XHRcdFx0aWYgKHNjcm9sbEVsID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHRzY3JvbGxFbCA9IHJvb3RFbDtcblxuXHRcdFx0XHRcdFx0ZG8ge1xuXHRcdFx0XHRcdFx0XHRpZiAoKHNjcm9sbEVsLm9mZnNldFdpZHRoIDwgc2Nyb2xsRWwuc2Nyb2xsV2lkdGgpIHx8XG5cdFx0XHRcdFx0XHRcdFx0KHNjcm9sbEVsLm9mZnNldEhlaWdodCA8IHNjcm9sbEVsLnNjcm9sbEhlaWdodClcblx0XHRcdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0LyoganNoaW50IGJvc3M6dHJ1ZSAqL1xuXHRcdFx0XHRcdFx0fSB3aGlsZSAoc2Nyb2xsRWwgPSBzY3JvbGxFbC5wYXJlbnROb2RlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoc2Nyb2xsRWwpIHtcblx0XHRcdFx0XHRlbCA9IHNjcm9sbEVsO1xuXHRcdFx0XHRcdHJlY3QgPSBzY3JvbGxFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdFx0XHR2eCA9IChhYnMocmVjdC5yaWdodCAtIHgpIDw9IHNlbnMpIC0gKGFicyhyZWN0LmxlZnQgLSB4KSA8PSBzZW5zKTtcblx0XHRcdFx0XHR2eSA9IChhYnMocmVjdC5ib3R0b20gLSB5KSA8PSBzZW5zKSAtIChhYnMocmVjdC50b3AgLSB5KSA8PSBzZW5zKTtcblx0XHRcdFx0fVxuXG5cblx0XHRcdFx0aWYgKCEodnggfHwgdnkpKSB7XG5cdFx0XHRcdFx0dnggPSAod2luV2lkdGggLSB4IDw9IHNlbnMpIC0gKHggPD0gc2Vucyk7XG5cdFx0XHRcdFx0dnkgPSAod2luSGVpZ2h0IC0geSA8PSBzZW5zKSAtICh5IDw9IHNlbnMpO1xuXG5cdFx0XHRcdFx0LyoganNoaW50IGV4cHI6dHJ1ZSAqL1xuXHRcdFx0XHRcdCh2eCB8fCB2eSkgJiYgKGVsID0gd2luKTtcblx0XHRcdFx0fVxuXG5cblx0XHRcdFx0aWYgKGF1dG9TY3JvbGwudnggIT09IHZ4IHx8IGF1dG9TY3JvbGwudnkgIT09IHZ5IHx8IGF1dG9TY3JvbGwuZWwgIT09IGVsKSB7XG5cdFx0XHRcdFx0YXV0b1Njcm9sbC5lbCA9IGVsO1xuXHRcdFx0XHRcdGF1dG9TY3JvbGwudnggPSB2eDtcblx0XHRcdFx0XHRhdXRvU2Nyb2xsLnZ5ID0gdnk7XG5cblx0XHRcdFx0XHRjbGVhckludGVydmFsKGF1dG9TY3JvbGwucGlkKTtcblxuXHRcdFx0XHRcdGlmIChlbCkge1xuXHRcdFx0XHRcdFx0YXV0b1Njcm9sbC5waWQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChlbCA9PT0gd2luKSB7XG5cdFx0XHRcdFx0XHRcdFx0d2luLnNjcm9sbFRvKHdpbi5wYWdlWE9mZnNldCArIHZ4ICogc3BlZWQsIHdpbi5wYWdlWU9mZnNldCArIHZ5ICogc3BlZWQpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdHZ5ICYmIChlbC5zY3JvbGxUb3AgKz0gdnkgKiBzcGVlZCk7XG5cdFx0XHRcdFx0XHRcdFx0dnggJiYgKGVsLnNjcm9sbExlZnQgKz0gdnggKiBzcGVlZCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sIDI0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LCAzMCksXG5cblx0XHRfcHJlcGFyZUdyb3VwID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0XHRcdHZhciBncm91cCA9IG9wdGlvbnMuZ3JvdXA7XG5cblx0XHRcdGlmICghZ3JvdXAgfHwgdHlwZW9mIGdyb3VwICE9ICdvYmplY3QnKSB7XG5cdFx0XHRcdGdyb3VwID0gb3B0aW9ucy5ncm91cCA9IHtuYW1lOiBncm91cH07XG5cdFx0XHR9XG5cblx0XHRcdFsncHVsbCcsICdwdXQnXS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdFx0aWYgKCEoa2V5IGluIGdyb3VwKSkge1xuXHRcdFx0XHRcdGdyb3VwW2tleV0gPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0b3B0aW9ucy5ncm91cHMgPSAnICcgKyBncm91cC5uYW1lICsgKGdyb3VwLnB1dC5qb2luID8gJyAnICsgZ3JvdXAucHV0LmpvaW4oJyAnKSA6ICcnKSArICcgJztcblx0XHR9XG5cdDtcblxuXG5cblx0LyoqXG5cdCAqIEBjbGFzcyAgU29ydGFibGVcblx0ICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICBlbFxuXHQgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgIFtvcHRpb25zXVxuXHQgKi9cblx0ZnVuY3Rpb24gU29ydGFibGUoZWwsIG9wdGlvbnMpIHtcblx0XHRpZiAoIShlbCAmJiBlbC5ub2RlVHlwZSAmJiBlbC5ub2RlVHlwZSA9PT0gMSkpIHtcblx0XHRcdHRocm93ICdTb3J0YWJsZTogYGVsYCBtdXN0IGJlIEhUTUxFbGVtZW50LCBhbmQgbm90ICcgKyB7fS50b1N0cmluZy5jYWxsKGVsKTtcblx0XHR9XG5cblx0XHR0aGlzLmVsID0gZWw7IC8vIHJvb3QgZWxlbWVudFxuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgPSBfZXh0ZW5kKHt9LCBvcHRpb25zKTtcblxuXG5cdFx0Ly8gRXhwb3J0IGluc3RhbmNlXG5cdFx0ZWxbZXhwYW5kb10gPSB0aGlzO1xuXG5cblx0XHQvLyBEZWZhdWx0IG9wdGlvbnNcblx0XHR2YXIgZGVmYXVsdHMgPSB7XG5cdFx0XHRncm91cDogTWF0aC5yYW5kb20oKSxcblx0XHRcdHNvcnQ6IHRydWUsXG5cdFx0XHRkaXNhYmxlZDogZmFsc2UsXG5cdFx0XHRzdG9yZTogbnVsbCxcblx0XHRcdGhhbmRsZTogbnVsbCxcblx0XHRcdHNjcm9sbDogdHJ1ZSxcblx0XHRcdHNjcm9sbFNlbnNpdGl2aXR5OiAzMCxcblx0XHRcdHNjcm9sbFNwZWVkOiAxMCxcblx0XHRcdGRyYWdnYWJsZTogL1t1b11sL2kudGVzdChlbC5ub2RlTmFtZSkgPyAnbGknIDogJz4qJyxcblx0XHRcdGdob3N0Q2xhc3M6ICdzb3J0YWJsZS1naG9zdCcsXG5cdFx0XHRjaG9zZW5DbGFzczogJ3NvcnRhYmxlLWNob3NlbicsXG5cdFx0XHRpZ25vcmU6ICdhLCBpbWcnLFxuXHRcdFx0ZmlsdGVyOiBudWxsLFxuXHRcdFx0YW5pbWF0aW9uOiAwLFxuXHRcdFx0c2V0RGF0YTogZnVuY3Rpb24gKGRhdGFUcmFuc2ZlciwgZHJhZ0VsKSB7XG5cdFx0XHRcdGRhdGFUcmFuc2Zlci5zZXREYXRhKCdUZXh0JywgZHJhZ0VsLnRleHRDb250ZW50KTtcblx0XHRcdH0sXG5cdFx0XHRkcm9wQnViYmxlOiBmYWxzZSxcblx0XHRcdGRyYWdvdmVyQnViYmxlOiBmYWxzZSxcblx0XHRcdGRhdGFJZEF0dHI6ICdkYXRhLWlkJyxcblx0XHRcdGRlbGF5OiAwLFxuXHRcdFx0Zm9yY2VGYWxsYmFjazogZmFsc2UsXG5cdFx0XHRmYWxsYmFja0NsYXNzOiAnc29ydGFibGUtZmFsbGJhY2snLFxuXHRcdFx0ZmFsbGJhY2tPbkJvZHk6IGZhbHNlXG5cdFx0fTtcblxuXG5cdFx0Ly8gU2V0IGRlZmF1bHQgb3B0aW9uc1xuXHRcdGZvciAodmFyIG5hbWUgaW4gZGVmYXVsdHMpIHtcblx0XHRcdCEobmFtZSBpbiBvcHRpb25zKSAmJiAob3B0aW9uc1tuYW1lXSA9IGRlZmF1bHRzW25hbWVdKTtcblx0XHR9XG5cblx0XHRfcHJlcGFyZUdyb3VwKG9wdGlvbnMpO1xuXG5cdFx0Ly8gQmluZCBhbGwgcHJpdmF0ZSBtZXRob2RzXG5cdFx0Zm9yICh2YXIgZm4gaW4gdGhpcykge1xuXHRcdFx0aWYgKGZuLmNoYXJBdCgwKSA9PT0gJ18nKSB7XG5cdFx0XHRcdHRoaXNbZm5dID0gdGhpc1tmbl0uYmluZCh0aGlzKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBTZXR1cCBkcmFnIG1vZGVcblx0XHR0aGlzLm5hdGl2ZURyYWdnYWJsZSA9IG9wdGlvbnMuZm9yY2VGYWxsYmFjayA/IGZhbHNlIDogc3VwcG9ydERyYWdnYWJsZTtcblxuXHRcdC8vIEJpbmQgZXZlbnRzXG5cdFx0X29uKGVsLCAnbW91c2Vkb3duJywgdGhpcy5fb25UYXBTdGFydCk7XG5cdFx0X29uKGVsLCAndG91Y2hzdGFydCcsIHRoaXMuX29uVGFwU3RhcnQpO1xuXG5cdFx0aWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG5cdFx0XHRfb24oZWwsICdkcmFnb3ZlcicsIHRoaXMpO1xuXHRcdFx0X29uKGVsLCAnZHJhZ2VudGVyJywgdGhpcyk7XG5cdFx0fVxuXG5cdFx0dG91Y2hEcmFnT3Zlckxpc3RlbmVycy5wdXNoKHRoaXMuX29uRHJhZ092ZXIpO1xuXG5cdFx0Ly8gUmVzdG9yZSBzb3J0aW5nXG5cdFx0b3B0aW9ucy5zdG9yZSAmJiB0aGlzLnNvcnQob3B0aW9ucy5zdG9yZS5nZXQodGhpcykpO1xuXHR9XG5cblxuXHRTb3J0YWJsZS5wcm90b3R5cGUgPSAvKiogQGxlbmRzIFNvcnRhYmxlLnByb3RvdHlwZSAqLyB7XG5cdFx0Y29uc3RydWN0b3I6IFNvcnRhYmxlLFxuXG5cdFx0X29uVGFwU3RhcnQ6IGZ1bmN0aW9uICgvKiogRXZlbnR8VG91Y2hFdmVudCAqL2V2dCkge1xuXHRcdFx0dmFyIF90aGlzID0gdGhpcyxcblx0XHRcdFx0ZWwgPSB0aGlzLmVsLFxuXHRcdFx0XHRvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuXHRcdFx0XHR0eXBlID0gZXZ0LnR5cGUsXG5cdFx0XHRcdHRvdWNoID0gZXZ0LnRvdWNoZXMgJiYgZXZ0LnRvdWNoZXNbMF0sXG5cdFx0XHRcdHRhcmdldCA9ICh0b3VjaCB8fCBldnQpLnRhcmdldCxcblx0XHRcdFx0b3JpZ2luYWxUYXJnZXQgPSB0YXJnZXQsXG5cdFx0XHRcdGZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuXG5cblx0XHRcdGlmICh0eXBlID09PSAnbW91c2Vkb3duJyAmJiBldnQuYnV0dG9uICE9PSAwIHx8IG9wdGlvbnMuZGlzYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuOyAvLyBvbmx5IGxlZnQgYnV0dG9uIG9yIGVuYWJsZWRcblx0XHRcdH1cblxuXHRcdFx0dGFyZ2V0ID0gX2Nsb3Nlc3QodGFyZ2V0LCBvcHRpb25zLmRyYWdnYWJsZSwgZWwpO1xuXG5cdFx0XHRpZiAoIXRhcmdldCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIGdldCB0aGUgaW5kZXggb2YgdGhlIGRyYWdnZWQgZWxlbWVudCB3aXRoaW4gaXRzIHBhcmVudFxuXHRcdFx0b2xkSW5kZXggPSBfaW5kZXgodGFyZ2V0LCBvcHRpb25zLmRyYWdnYWJsZSk7XG5cblx0XHRcdC8vIENoZWNrIGZpbHRlclxuXHRcdFx0aWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0aWYgKGZpbHRlci5jYWxsKHRoaXMsIGV2dCwgdGFyZ2V0LCB0aGlzKSkge1xuXHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KF90aGlzLCBvcmlnaW5hbFRhcmdldCwgJ2ZpbHRlcicsIHRhcmdldCwgZWwsIG9sZEluZGV4KTtcblx0XHRcdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRyZXR1cm47IC8vIGNhbmNlbCBkbmRcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoZmlsdGVyKSB7XG5cdFx0XHRcdGZpbHRlciA9IGZpbHRlci5zcGxpdCgnLCcpLnNvbWUoZnVuY3Rpb24gKGNyaXRlcmlhKSB7XG5cdFx0XHRcdFx0Y3JpdGVyaWEgPSBfY2xvc2VzdChvcmlnaW5hbFRhcmdldCwgY3JpdGVyaWEudHJpbSgpLCBlbCk7XG5cblx0XHRcdFx0XHRpZiAoY3JpdGVyaWEpIHtcblx0XHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KF90aGlzLCBjcml0ZXJpYSwgJ2ZpbHRlcicsIHRhcmdldCwgZWwsIG9sZEluZGV4KTtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aWYgKGZpbHRlcikge1xuXHRcdFx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHJldHVybjsgLy8gY2FuY2VsIGRuZFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblxuXHRcdFx0aWYgKG9wdGlvbnMuaGFuZGxlICYmICFfY2xvc2VzdChvcmlnaW5hbFRhcmdldCwgb3B0aW9ucy5oYW5kbGUsIGVsKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblxuXHRcdFx0Ly8gUHJlcGFyZSBgZHJhZ3N0YXJ0YFxuXHRcdFx0dGhpcy5fcHJlcGFyZURyYWdTdGFydChldnQsIHRvdWNoLCB0YXJnZXQpO1xuXHRcdH0sXG5cblx0XHRfcHJlcGFyZURyYWdTdGFydDogZnVuY3Rpb24gKC8qKiBFdmVudCAqL2V2dCwgLyoqIFRvdWNoICovdG91Y2gsIC8qKiBIVE1MRWxlbWVudCAqL3RhcmdldCkge1xuXHRcdFx0dmFyIF90aGlzID0gdGhpcyxcblx0XHRcdFx0ZWwgPSBfdGhpcy5lbCxcblx0XHRcdFx0b3B0aW9ucyA9IF90aGlzLm9wdGlvbnMsXG5cdFx0XHRcdG93bmVyRG9jdW1lbnQgPSBlbC5vd25lckRvY3VtZW50LFxuXHRcdFx0XHRkcmFnU3RhcnRGbjtcblxuXHRcdFx0aWYgKHRhcmdldCAmJiAhZHJhZ0VsICYmICh0YXJnZXQucGFyZW50Tm9kZSA9PT0gZWwpKSB7XG5cdFx0XHRcdHRhcEV2dCA9IGV2dDtcblxuXHRcdFx0XHRyb290RWwgPSBlbDtcblx0XHRcdFx0ZHJhZ0VsID0gdGFyZ2V0O1xuXHRcdFx0XHRwYXJlbnRFbCA9IGRyYWdFbC5wYXJlbnROb2RlO1xuXHRcdFx0XHRuZXh0RWwgPSBkcmFnRWwubmV4dFNpYmxpbmc7XG5cdFx0XHRcdGFjdGl2ZUdyb3VwID0gb3B0aW9ucy5ncm91cDtcblxuXHRcdFx0XHRkcmFnU3RhcnRGbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQvLyBEZWxheWVkIGRyYWcgaGFzIGJlZW4gdHJpZ2dlcmVkXG5cdFx0XHRcdFx0Ly8gd2UgY2FuIHJlLWVuYWJsZSB0aGUgZXZlbnRzOiB0b3VjaG1vdmUvbW91c2Vtb3ZlXG5cdFx0XHRcdFx0X3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZygpO1xuXG5cdFx0XHRcdFx0Ly8gTWFrZSB0aGUgZWxlbWVudCBkcmFnZ2FibGVcblx0XHRcdFx0XHRkcmFnRWwuZHJhZ2dhYmxlID0gdHJ1ZTtcblxuXHRcdFx0XHRcdC8vIENob3NlbiBpdGVtXG5cdFx0XHRcdFx0X3RvZ2dsZUNsYXNzKGRyYWdFbCwgX3RoaXMub3B0aW9ucy5jaG9zZW5DbGFzcywgdHJ1ZSk7XG5cblx0XHRcdFx0XHQvLyBCaW5kIHRoZSBldmVudHM6IGRyYWdzdGFydC9kcmFnZW5kXG5cdFx0XHRcdFx0X3RoaXMuX3RyaWdnZXJEcmFnU3RhcnQodG91Y2gpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIERpc2FibGUgXCJkcmFnZ2FibGVcIlxuXHRcdFx0XHRvcHRpb25zLmlnbm9yZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24gKGNyaXRlcmlhKSB7XG5cdFx0XHRcdFx0X2ZpbmQoZHJhZ0VsLCBjcml0ZXJpYS50cmltKCksIF9kaXNhYmxlRHJhZ2dhYmxlKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X29uKG93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgX3RoaXMuX29uRHJvcCk7XG5cdFx0XHRcdF9vbihvd25lckRvY3VtZW50LCAndG91Y2hlbmQnLCBfdGhpcy5fb25Ecm9wKTtcblx0XHRcdFx0X29uKG93bmVyRG9jdW1lbnQsICd0b3VjaGNhbmNlbCcsIF90aGlzLl9vbkRyb3ApO1xuXG5cdFx0XHRcdGlmIChvcHRpb25zLmRlbGF5KSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIHVzZXIgbW92ZXMgdGhlIHBvaW50ZXIgb3IgbGV0IGdvIHRoZSBjbGljayBvciB0b3VjaFxuXHRcdFx0XHRcdC8vIGJlZm9yZSB0aGUgZGVsYXkgaGFzIGJlZW4gcmVhY2hlZDpcblx0XHRcdFx0XHQvLyBkaXNhYmxlIHRoZSBkZWxheWVkIGRyYWdcblx0XHRcdFx0XHRfb24ob3duZXJEb2N1bWVudCwgJ21vdXNldXAnLCBfdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblx0XHRcdFx0XHRfb24ob3duZXJEb2N1bWVudCwgJ3RvdWNoZW5kJywgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG5cdFx0XHRcdFx0X29uKG93bmVyRG9jdW1lbnQsICd0b3VjaGNhbmNlbCcsIF90aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuXHRcdFx0XHRcdF9vbihvd25lckRvY3VtZW50LCAnbW91c2Vtb3ZlJywgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG5cdFx0XHRcdFx0X29uKG93bmVyRG9jdW1lbnQsICd0b3VjaG1vdmUnLCBfdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblxuXHRcdFx0XHRcdF90aGlzLl9kcmFnU3RhcnRUaW1lciA9IHNldFRpbWVvdXQoZHJhZ1N0YXJ0Rm4sIG9wdGlvbnMuZGVsYXkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRyYWdTdGFydEZuKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0X2Rpc2FibGVEZWxheWVkRHJhZzogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG93bmVyRG9jdW1lbnQgPSB0aGlzLmVsLm93bmVyRG9jdW1lbnQ7XG5cblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLl9kcmFnU3RhcnRUaW1lcik7XG5cdFx0XHRfb2ZmKG93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoZW5kJywgdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG5cdFx0XHRfb2ZmKG93bmVyRG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuXHRcdH0sXG5cblx0XHRfdHJpZ2dlckRyYWdTdGFydDogZnVuY3Rpb24gKC8qKiBUb3VjaCAqL3RvdWNoKSB7XG5cdFx0XHRpZiAodG91Y2gpIHtcblx0XHRcdFx0Ly8gVG91Y2ggZGV2aWNlIHN1cHBvcnRcblx0XHRcdFx0dGFwRXZ0ID0ge1xuXHRcdFx0XHRcdHRhcmdldDogZHJhZ0VsLFxuXHRcdFx0XHRcdGNsaWVudFg6IHRvdWNoLmNsaWVudFgsXG5cdFx0XHRcdFx0Y2xpZW50WTogdG91Y2guY2xpZW50WVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHRoaXMuX29uRHJhZ1N0YXJ0KHRhcEV2dCwgJ3RvdWNoJyk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICghdGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcblx0XHRcdFx0dGhpcy5fb25EcmFnU3RhcnQodGFwRXZ0LCB0cnVlKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRfb24oZHJhZ0VsLCAnZHJhZ2VuZCcsIHRoaXMpO1xuXHRcdFx0XHRfb24ocm9vdEVsLCAnZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnU3RhcnQpO1xuXHRcdFx0fVxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZiAoZG9jdW1lbnQuc2VsZWN0aW9uKSB7XG5cdFx0XHRcdFx0ZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0d2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0X2RyYWdTdGFydGVkOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAocm9vdEVsICYmIGRyYWdFbCkge1xuXHRcdFx0XHQvLyBBcHBseSBlZmZlY3Rcblx0XHRcdFx0X3RvZ2dsZUNsYXNzKGRyYWdFbCwgdGhpcy5vcHRpb25zLmdob3N0Q2xhc3MsIHRydWUpO1xuXG5cdFx0XHRcdFNvcnRhYmxlLmFjdGl2ZSA9IHRoaXM7XG5cblx0XHRcdFx0Ly8gRHJhZyBzdGFydCBldmVudFxuXHRcdFx0XHRfZGlzcGF0Y2hFdmVudCh0aGlzLCByb290RWwsICdzdGFydCcsIGRyYWdFbCwgcm9vdEVsLCBvbGRJbmRleCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdF9lbXVsYXRlRHJhZ092ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICh0b3VjaEV2dCkge1xuXHRcdFx0XHRpZiAodGhpcy5fbGFzdFggPT09IHRvdWNoRXZ0LmNsaWVudFggJiYgdGhpcy5fbGFzdFkgPT09IHRvdWNoRXZ0LmNsaWVudFkpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLl9sYXN0WCA9IHRvdWNoRXZ0LmNsaWVudFg7XG5cdFx0XHRcdHRoaXMuX2xhc3RZID0gdG91Y2hFdnQuY2xpZW50WTtcblxuXHRcdFx0XHRpZiAoIXN1cHBvcnRDc3NQb2ludGVyRXZlbnRzKSB7XG5cdFx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnZGlzcGxheScsICdub25lJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaEV2dC5jbGllbnRYLCB0b3VjaEV2dC5jbGllbnRZKSxcblx0XHRcdFx0XHRwYXJlbnQgPSB0YXJnZXQsXG5cdFx0XHRcdFx0Z3JvdXBOYW1lID0gJyAnICsgdGhpcy5vcHRpb25zLmdyb3VwLm5hbWUgKyAnJyxcblx0XHRcdFx0XHRpID0gdG91Y2hEcmFnT3Zlckxpc3RlbmVycy5sZW5ndGg7XG5cblx0XHRcdFx0aWYgKHBhcmVudCkge1xuXHRcdFx0XHRcdGRvIHtcblx0XHRcdFx0XHRcdGlmIChwYXJlbnRbZXhwYW5kb10gJiYgcGFyZW50W2V4cGFuZG9dLm9wdGlvbnMuZ3JvdXBzLmluZGV4T2YoZ3JvdXBOYW1lKSA+IC0xKSB7XG5cdFx0XHRcdFx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0XHRcdFx0XHR0b3VjaERyYWdPdmVyTGlzdGVuZXJzW2ldKHtcblx0XHRcdFx0XHRcdFx0XHRcdGNsaWVudFg6IHRvdWNoRXZ0LmNsaWVudFgsXG5cdFx0XHRcdFx0XHRcdFx0XHRjbGllbnRZOiB0b3VjaEV2dC5jbGllbnRZLFxuXHRcdFx0XHRcdFx0XHRcdFx0dGFyZ2V0OiB0YXJnZXQsXG5cdFx0XHRcdFx0XHRcdFx0XHRyb290RWw6IHBhcmVudFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRhcmdldCA9IHBhcmVudDsgLy8gc3RvcmUgbGFzdCBlbGVtZW50XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8qIGpzaGludCBib3NzOnRydWUgKi9cblx0XHRcdFx0XHR3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCFzdXBwb3J0Q3NzUG9pbnRlckV2ZW50cykge1xuXHRcdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ2Rpc3BsYXknLCAnJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cblx0XHRfb25Ub3VjaE1vdmU6IGZ1bmN0aW9uICgvKipUb3VjaEV2ZW50Ki9ldnQpIHtcblx0XHRcdGlmICh0YXBFdnQpIHtcblx0XHRcdFx0Ly8gb25seSBzZXQgdGhlIHN0YXR1cyB0byBkcmFnZ2luZywgd2hlbiB3ZSBhcmUgYWN0dWFsbHkgZHJhZ2dpbmdcblx0XHRcdFx0aWYgKCFTb3J0YWJsZS5hY3RpdmUpIHtcblx0XHRcdFx0XHR0aGlzLl9kcmFnU3RhcnRlZCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gYXMgd2VsbCBhcyBjcmVhdGluZyB0aGUgZ2hvc3QgZWxlbWVudCBvbiB0aGUgZG9jdW1lbnQgYm9keVxuXHRcdFx0XHR0aGlzLl9hcHBlbmRHaG9zdCgpO1xuXG5cdFx0XHRcdHZhciB0b3VjaCA9IGV2dC50b3VjaGVzID8gZXZ0LnRvdWNoZXNbMF0gOiBldnQsXG5cdFx0XHRcdFx0ZHggPSB0b3VjaC5jbGllbnRYIC0gdGFwRXZ0LmNsaWVudFgsXG5cdFx0XHRcdFx0ZHkgPSB0b3VjaC5jbGllbnRZIC0gdGFwRXZ0LmNsaWVudFksXG5cdFx0XHRcdFx0dHJhbnNsYXRlM2QgPSBldnQudG91Y2hlcyA/ICd0cmFuc2xhdGUzZCgnICsgZHggKyAncHgsJyArIGR5ICsgJ3B4LDApJyA6ICd0cmFuc2xhdGUoJyArIGR4ICsgJ3B4LCcgKyBkeSArICdweCknO1xuXG5cdFx0XHRcdG1vdmVkID0gdHJ1ZTtcblx0XHRcdFx0dG91Y2hFdnQgPSB0b3VjaDtcblxuXHRcdFx0XHRfY3NzKGdob3N0RWwsICd3ZWJraXRUcmFuc2Zvcm0nLCB0cmFuc2xhdGUzZCk7XG5cdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ21velRyYW5zZm9ybScsIHRyYW5zbGF0ZTNkKTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnbXNUcmFuc2Zvcm0nLCB0cmFuc2xhdGUzZCk7XG5cdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ3RyYW5zZm9ybScsIHRyYW5zbGF0ZTNkKTtcblxuXHRcdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0X2FwcGVuZEdob3N0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoIWdob3N0RWwpIHtcblx0XHRcdFx0dmFyIHJlY3QgPSBkcmFnRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG5cdFx0XHRcdFx0Y3NzID0gX2NzcyhkcmFnRWwpLFxuXHRcdFx0XHRcdG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG5cdFx0XHRcdFx0Z2hvc3RSZWN0O1xuXG5cdFx0XHRcdGdob3N0RWwgPSBkcmFnRWwuY2xvbmVOb2RlKHRydWUpO1xuXG5cdFx0XHRcdF90b2dnbGVDbGFzcyhnaG9zdEVsLCBvcHRpb25zLmdob3N0Q2xhc3MsIGZhbHNlKTtcblx0XHRcdFx0X3RvZ2dsZUNsYXNzKGdob3N0RWwsIG9wdGlvbnMuZmFsbGJhY2tDbGFzcywgdHJ1ZSk7XG5cblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAndG9wJywgcmVjdC50b3AgLSBwYXJzZUludChjc3MubWFyZ2luVG9wLCAxMCkpO1xuXHRcdFx0XHRfY3NzKGdob3N0RWwsICdsZWZ0JywgcmVjdC5sZWZ0IC0gcGFyc2VJbnQoY3NzLm1hcmdpbkxlZnQsIDEwKSk7XG5cdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ3dpZHRoJywgcmVjdC53aWR0aCk7XG5cdFx0XHRcdF9jc3MoZ2hvc3RFbCwgJ2hlaWdodCcsIHJlY3QuaGVpZ2h0KTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnb3BhY2l0eScsICcwLjgnKTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAncG9zaXRpb24nLCAnZml4ZWQnKTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnekluZGV4JywgJzEwMDAwMCcpO1xuXHRcdFx0XHRfY3NzKGdob3N0RWwsICdwb2ludGVyRXZlbnRzJywgJ25vbmUnKTtcblxuXHRcdFx0XHRvcHRpb25zLmZhbGxiYWNrT25Cb2R5ICYmIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZ2hvc3RFbCkgfHwgcm9vdEVsLmFwcGVuZENoaWxkKGdob3N0RWwpO1xuXG5cdFx0XHRcdC8vIEZpeGluZyBkaW1lbnNpb25zLlxuXHRcdFx0XHRnaG9zdFJlY3QgPSBnaG9zdEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0XHRfY3NzKGdob3N0RWwsICd3aWR0aCcsIHJlY3Qud2lkdGggKiAyIC0gZ2hvc3RSZWN0LndpZHRoKTtcblx0XHRcdFx0X2NzcyhnaG9zdEVsLCAnaGVpZ2h0JywgcmVjdC5oZWlnaHQgKiAyIC0gZ2hvc3RSZWN0LmhlaWdodCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdF9vbkRyYWdTdGFydDogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQsIC8qKmJvb2xlYW4qL3VzZUZhbGxiYWNrKSB7XG5cdFx0XHR2YXIgZGF0YVRyYW5zZmVyID0gZXZ0LmRhdGFUcmFuc2Zlcixcblx0XHRcdFx0b3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdFx0dGhpcy5fb2ZmVXBFdmVudHMoKTtcblxuXHRcdFx0aWYgKGFjdGl2ZUdyb3VwLnB1bGwgPT0gJ2Nsb25lJykge1xuXHRcdFx0XHRjbG9uZUVsID0gZHJhZ0VsLmNsb25lTm9kZSh0cnVlKTtcblx0XHRcdFx0X2NzcyhjbG9uZUVsLCAnZGlzcGxheScsICdub25lJyk7XG5cdFx0XHRcdHJvb3RFbC5pbnNlcnRCZWZvcmUoY2xvbmVFbCwgZHJhZ0VsKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHVzZUZhbGxiYWNrKSB7XG5cblx0XHRcdFx0aWYgKHVzZUZhbGxiYWNrID09PSAndG91Y2gnKSB7XG5cdFx0XHRcdFx0Ly8gQmluZCB0b3VjaCBldmVudHNcblx0XHRcdFx0XHRfb24oZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9vblRvdWNoTW92ZSk7XG5cdFx0XHRcdFx0X29uKGRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLl9vbkRyb3ApO1xuXHRcdFx0XHRcdF9vbihkb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25Ecm9wKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBPbGQgYnJ3b3NlclxuXHRcdFx0XHRcdF9vbihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcblx0XHRcdFx0XHRfb24oZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fb25Ecm9wKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuX2xvb3BJZCA9IHNldEludGVydmFsKHRoaXMuX2VtdWxhdGVEcmFnT3ZlciwgNTApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGlmIChkYXRhVHJhbnNmZXIpIHtcblx0XHRcdFx0XHRkYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9ICdtb3ZlJztcblx0XHRcdFx0XHRvcHRpb25zLnNldERhdGEgJiYgb3B0aW9ucy5zZXREYXRhLmNhbGwodGhpcywgZGF0YVRyYW5zZmVyLCBkcmFnRWwpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0X29uKGRvY3VtZW50LCAnZHJvcCcsIHRoaXMpO1xuXHRcdFx0XHRzZXRUaW1lb3V0KHRoaXMuX2RyYWdTdGFydGVkLCAwKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0X29uRHJhZ092ZXI6IGZ1bmN0aW9uICgvKipFdmVudCovZXZ0KSB7XG5cdFx0XHR2YXIgZWwgPSB0aGlzLmVsLFxuXHRcdFx0XHR0YXJnZXQsXG5cdFx0XHRcdGRyYWdSZWN0LFxuXHRcdFx0XHRyZXZlcnQsXG5cdFx0XHRcdG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG5cdFx0XHRcdGdyb3VwID0gb3B0aW9ucy5ncm91cCxcblx0XHRcdFx0Z3JvdXBQdXQgPSBncm91cC5wdXQsXG5cdFx0XHRcdGlzT3duZXIgPSAoYWN0aXZlR3JvdXAgPT09IGdyb3VwKSxcblx0XHRcdFx0Y2FuU29ydCA9IG9wdGlvbnMuc29ydDtcblxuXHRcdFx0aWYgKGV2dC5wcmV2ZW50RGVmYXVsdCAhPT0gdm9pZCAwKSB7XG5cdFx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHQhb3B0aW9ucy5kcmFnb3ZlckJ1YmJsZSAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9XG5cblx0XHRcdG1vdmVkID0gdHJ1ZTtcblxuXHRcdFx0aWYgKGFjdGl2ZUdyb3VwICYmICFvcHRpb25zLmRpc2FibGVkICYmXG5cdFx0XHRcdChpc093bmVyXG5cdFx0XHRcdFx0PyBjYW5Tb3J0IHx8IChyZXZlcnQgPSAhcm9vdEVsLmNvbnRhaW5zKGRyYWdFbCkpIC8vIFJldmVydGluZyBpdGVtIGludG8gdGhlIG9yaWdpbmFsIGxpc3Rcblx0XHRcdFx0XHQ6IGFjdGl2ZUdyb3VwLnB1bGwgJiYgZ3JvdXBQdXQgJiYgKFxuXHRcdFx0XHRcdFx0KGFjdGl2ZUdyb3VwLm5hbWUgPT09IGdyb3VwLm5hbWUpIHx8IC8vIGJ5IE5hbWVcblx0XHRcdFx0XHRcdChncm91cFB1dC5pbmRleE9mICYmIH5ncm91cFB1dC5pbmRleE9mKGFjdGl2ZUdyb3VwLm5hbWUpKSAvLyBieSBBcnJheVxuXHRcdFx0XHRcdClcblx0XHRcdFx0KSAmJlxuXHRcdFx0XHQoZXZ0LnJvb3RFbCA9PT0gdm9pZCAwIHx8IGV2dC5yb290RWwgPT09IHRoaXMuZWwpIC8vIHRvdWNoIGZhbGxiYWNrXG5cdFx0XHQpIHtcblx0XHRcdFx0Ly8gU21hcnQgYXV0by1zY3JvbGxpbmdcblx0XHRcdFx0X2F1dG9TY3JvbGwoZXZ0LCBvcHRpb25zLCB0aGlzLmVsKTtcblxuXHRcdFx0XHRpZiAoX3NpbGVudCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRhcmdldCA9IF9jbG9zZXN0KGV2dC50YXJnZXQsIG9wdGlvbnMuZHJhZ2dhYmxlLCBlbCk7XG5cdFx0XHRcdGRyYWdSZWN0ID0gZHJhZ0VsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG5cdFx0XHRcdGlmIChyZXZlcnQpIHtcblx0XHRcdFx0XHRfY2xvbmVIaWRlKHRydWUpO1xuXG5cdFx0XHRcdFx0aWYgKGNsb25lRWwgfHwgbmV4dEVsKSB7XG5cdFx0XHRcdFx0XHRyb290RWwuaW5zZXJ0QmVmb3JlKGRyYWdFbCwgY2xvbmVFbCB8fCBuZXh0RWwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICghY2FuU29ydCkge1xuXHRcdFx0XHRcdFx0cm9vdEVsLmFwcGVuZENoaWxkKGRyYWdFbCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblxuXHRcdFx0XHRpZiAoKGVsLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkgfHwgKGVsLmNoaWxkcmVuWzBdID09PSBnaG9zdEVsKSB8fFxuXHRcdFx0XHRcdChlbCA9PT0gZXZ0LnRhcmdldCkgJiYgKHRhcmdldCA9IF9naG9zdElzTGFzdChlbCwgZXZ0KSlcblx0XHRcdFx0KSB7XG5cblx0XHRcdFx0XHRpZiAodGFyZ2V0KSB7XG5cdFx0XHRcdFx0XHRpZiAodGFyZ2V0LmFuaW1hdGVkKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dGFyZ2V0UmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRfY2xvbmVIaWRlKGlzT3duZXIpO1xuXG5cdFx0XHRcdFx0aWYgKF9vbk1vdmUocm9vdEVsLCBlbCwgZHJhZ0VsLCBkcmFnUmVjdCwgdGFyZ2V0LCB0YXJnZXRSZWN0KSAhPT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdGlmICghZHJhZ0VsLmNvbnRhaW5zKGVsKSkge1xuXHRcdFx0XHRcdFx0XHRlbC5hcHBlbmRDaGlsZChkcmFnRWwpO1xuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbCA9IGVsOyAvLyBhY3R1YWxpemF0aW9uXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRoaXMuX2FuaW1hdGUoZHJhZ1JlY3QsIGRyYWdFbCk7XG5cdFx0XHRcdFx0XHR0YXJnZXQgJiYgdGhpcy5fYW5pbWF0ZSh0YXJnZXRSZWN0LCB0YXJnZXQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICh0YXJnZXQgJiYgIXRhcmdldC5hbmltYXRlZCAmJiB0YXJnZXQgIT09IGRyYWdFbCAmJiAodGFyZ2V0LnBhcmVudE5vZGVbZXhwYW5kb10gIT09IHZvaWQgMCkpIHtcblx0XHRcdFx0XHRpZiAobGFzdEVsICE9PSB0YXJnZXQpIHtcblx0XHRcdFx0XHRcdGxhc3RFbCA9IHRhcmdldDtcblx0XHRcdFx0XHRcdGxhc3RDU1MgPSBfY3NzKHRhcmdldCk7XG5cdFx0XHRcdFx0XHRsYXN0UGFyZW50Q1NTID0gX2Nzcyh0YXJnZXQucGFyZW50Tm9kZSk7XG5cdFx0XHRcdFx0fVxuXG5cblx0XHRcdFx0XHR2YXIgdGFyZ2V0UmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcblx0XHRcdFx0XHRcdHdpZHRoID0gdGFyZ2V0UmVjdC5yaWdodCAtIHRhcmdldFJlY3QubGVmdCxcblx0XHRcdFx0XHRcdGhlaWdodCA9IHRhcmdldFJlY3QuYm90dG9tIC0gdGFyZ2V0UmVjdC50b3AsXG5cdFx0XHRcdFx0XHRmbG9hdGluZyA9IC9sZWZ0fHJpZ2h0fGlubGluZS8udGVzdChsYXN0Q1NTLmNzc0Zsb2F0ICsgbGFzdENTUy5kaXNwbGF5KVxuXHRcdFx0XHRcdFx0XHR8fCAobGFzdFBhcmVudENTUy5kaXNwbGF5ID09ICdmbGV4JyAmJiBsYXN0UGFyZW50Q1NTWydmbGV4LWRpcmVjdGlvbiddLmluZGV4T2YoJ3JvdycpID09PSAwKSxcblx0XHRcdFx0XHRcdGlzV2lkZSA9ICh0YXJnZXQub2Zmc2V0V2lkdGggPiBkcmFnRWwub2Zmc2V0V2lkdGgpLFxuXHRcdFx0XHRcdFx0aXNMb25nID0gKHRhcmdldC5vZmZzZXRIZWlnaHQgPiBkcmFnRWwub2Zmc2V0SGVpZ2h0KSxcblx0XHRcdFx0XHRcdGhhbGZ3YXkgPSAoZmxvYXRpbmcgPyAoZXZ0LmNsaWVudFggLSB0YXJnZXRSZWN0LmxlZnQpIC8gd2lkdGggOiAoZXZ0LmNsaWVudFkgLSB0YXJnZXRSZWN0LnRvcCkgLyBoZWlnaHQpID4gMC41LFxuXHRcdFx0XHRcdFx0bmV4dFNpYmxpbmcgPSB0YXJnZXQubmV4dEVsZW1lbnRTaWJsaW5nLFxuXHRcdFx0XHRcdFx0bW92ZVZlY3RvciA9IF9vbk1vdmUocm9vdEVsLCBlbCwgZHJhZ0VsLCBkcmFnUmVjdCwgdGFyZ2V0LCB0YXJnZXRSZWN0KSxcblx0XHRcdFx0XHRcdGFmdGVyXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0aWYgKG1vdmVWZWN0b3IgIT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0XHRfc2lsZW50ID0gdHJ1ZTtcblx0XHRcdFx0XHRcdHNldFRpbWVvdXQoX3Vuc2lsZW50LCAzMCk7XG5cblx0XHRcdFx0XHRcdF9jbG9uZUhpZGUoaXNPd25lcik7XG5cblx0XHRcdFx0XHRcdGlmIChtb3ZlVmVjdG9yID09PSAxIHx8IG1vdmVWZWN0b3IgPT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdGFmdGVyID0gKG1vdmVWZWN0b3IgPT09IDEpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAoZmxvYXRpbmcpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGVsVG9wID0gZHJhZ0VsLm9mZnNldFRvcCxcblx0XHRcdFx0XHRcdFx0XHR0Z1RvcCA9IHRhcmdldC5vZmZzZXRUb3A7XG5cblx0XHRcdFx0XHRcdFx0aWYgKGVsVG9wID09PSB0Z1RvcCkge1xuXHRcdFx0XHRcdFx0XHRcdGFmdGVyID0gKHRhcmdldC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nID09PSBkcmFnRWwpICYmICFpc1dpZGUgfHwgaGFsZndheSAmJiBpc1dpZGU7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0YWZ0ZXIgPSB0Z1RvcCA+IGVsVG9wO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRhZnRlciA9IChuZXh0U2libGluZyAhPT0gZHJhZ0VsKSAmJiAhaXNMb25nIHx8IGhhbGZ3YXkgJiYgaXNMb25nO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoIWRyYWdFbC5jb250YWlucyhlbCkpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGFmdGVyICYmICFuZXh0U2libGluZykge1xuXHRcdFx0XHRcdFx0XHRcdGVsLmFwcGVuZENoaWxkKGRyYWdFbCk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0dGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRyYWdFbCwgYWZ0ZXIgPyBuZXh0U2libGluZyA6IHRhcmdldCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cGFyZW50RWwgPSBkcmFnRWwucGFyZW50Tm9kZTsgLy8gYWN0dWFsaXphdGlvblxuXG5cdFx0XHRcdFx0XHR0aGlzLl9hbmltYXRlKGRyYWdSZWN0LCBkcmFnRWwpO1xuXHRcdFx0XHRcdFx0dGhpcy5fYW5pbWF0ZSh0YXJnZXRSZWN0LCB0YXJnZXQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRfYW5pbWF0ZTogZnVuY3Rpb24gKHByZXZSZWN0LCB0YXJnZXQpIHtcblx0XHRcdHZhciBtcyA9IHRoaXMub3B0aW9ucy5hbmltYXRpb247XG5cblx0XHRcdGlmIChtcykge1xuXHRcdFx0XHR2YXIgY3VycmVudFJlY3QgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHRcdFx0X2Nzcyh0YXJnZXQsICd0cmFuc2l0aW9uJywgJ25vbmUnKTtcblx0XHRcdFx0X2Nzcyh0YXJnZXQsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlM2QoJ1xuXHRcdFx0XHRcdCsgKHByZXZSZWN0LmxlZnQgLSBjdXJyZW50UmVjdC5sZWZ0KSArICdweCwnXG5cdFx0XHRcdFx0KyAocHJldlJlY3QudG9wIC0gY3VycmVudFJlY3QudG9wKSArICdweCwwKSdcblx0XHRcdFx0KTtcblxuXHRcdFx0XHR0YXJnZXQub2Zmc2V0V2lkdGg7IC8vIHJlcGFpbnRcblxuXHRcdFx0XHRfY3NzKHRhcmdldCwgJ3RyYW5zaXRpb24nLCAnYWxsICcgKyBtcyArICdtcycpO1xuXHRcdFx0XHRfY3NzKHRhcmdldCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUzZCgwLDAsMCknKTtcblxuXHRcdFx0XHRjbGVhclRpbWVvdXQodGFyZ2V0LmFuaW1hdGVkKTtcblx0XHRcdFx0dGFyZ2V0LmFuaW1hdGVkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0X2Nzcyh0YXJnZXQsICd0cmFuc2l0aW9uJywgJycpO1xuXHRcdFx0XHRcdF9jc3ModGFyZ2V0LCAndHJhbnNmb3JtJywgJycpO1xuXHRcdFx0XHRcdHRhcmdldC5hbmltYXRlZCA9IGZhbHNlO1xuXHRcdFx0XHR9LCBtcyk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdF9vZmZVcEV2ZW50czogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG93bmVyRG9jdW1lbnQgPSB0aGlzLmVsLm93bmVyRG9jdW1lbnQ7XG5cblx0XHRcdF9vZmYoZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9vblRvdWNoTW92ZSk7XG5cdFx0XHRfb2ZmKG93bmVyRG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fb25Ecm9wKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoZW5kJywgdGhpcy5fb25Ecm9wKTtcblx0XHRcdF9vZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25Ecm9wKTtcblx0XHR9LFxuXG5cdFx0X29uRHJvcDogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcblx0XHRcdHZhciBlbCA9IHRoaXMuZWwsXG5cdFx0XHRcdG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cblx0XHRcdGNsZWFySW50ZXJ2YWwodGhpcy5fbG9vcElkKTtcblx0XHRcdGNsZWFySW50ZXJ2YWwoYXV0b1Njcm9sbC5waWQpO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuX2RyYWdTdGFydFRpbWVyKTtcblxuXHRcdFx0Ly8gVW5iaW5kIGV2ZW50c1xuXHRcdFx0X29mZihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcblxuXHRcdFx0aWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG5cdFx0XHRcdF9vZmYoZG9jdW1lbnQsICdkcm9wJywgdGhpcyk7XG5cdFx0XHRcdF9vZmYoZWwsICdkcmFnc3RhcnQnLCB0aGlzLl9vbkRyYWdTdGFydCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX29mZlVwRXZlbnRzKCk7XG5cblx0XHRcdGlmIChldnQpIHtcblx0XHRcdFx0aWYgKG1vdmVkKSB7XG5cdFx0XHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0IW9wdGlvbnMuZHJvcEJ1YmJsZSAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRnaG9zdEVsICYmIGdob3N0RWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChnaG9zdEVsKTtcblxuXHRcdFx0XHRpZiAoZHJhZ0VsKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG5cdFx0XHRcdFx0XHRfb2ZmKGRyYWdFbCwgJ2RyYWdlbmQnLCB0aGlzKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRfZGlzYWJsZURyYWdnYWJsZShkcmFnRWwpO1xuXG5cdFx0XHRcdFx0Ly8gUmVtb3ZlIGNsYXNzJ3Ncblx0XHRcdFx0XHRfdG9nZ2xlQ2xhc3MoZHJhZ0VsLCB0aGlzLm9wdGlvbnMuZ2hvc3RDbGFzcywgZmFsc2UpO1xuXHRcdFx0XHRcdF90b2dnbGVDbGFzcyhkcmFnRWwsIHRoaXMub3B0aW9ucy5jaG9zZW5DbGFzcywgZmFsc2UpO1xuXG5cdFx0XHRcdFx0aWYgKHJvb3RFbCAhPT0gcGFyZW50RWwpIHtcblx0XHRcdFx0XHRcdG5ld0luZGV4ID0gX2luZGV4KGRyYWdFbCwgb3B0aW9ucy5kcmFnZ2FibGUpO1xuXG5cdFx0XHRcdFx0XHRpZiAobmV3SW5kZXggPj0gMCkge1xuXHRcdFx0XHRcdFx0XHQvLyBkcmFnIGZyb20gb25lIGxpc3QgYW5kIGRyb3AgaW50byBhbm90aGVyXG5cdFx0XHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KG51bGwsIHBhcmVudEVsLCAnc29ydCcsIGRyYWdFbCwgcm9vdEVsLCBvbGRJbmRleCwgbmV3SW5kZXgpO1xuXHRcdFx0XHRcdFx0XHRfZGlzcGF0Y2hFdmVudCh0aGlzLCByb290RWwsICdzb3J0JywgZHJhZ0VsLCByb290RWwsIG9sZEluZGV4LCBuZXdJbmRleCk7XG5cblx0XHRcdFx0XHRcdFx0Ly8gQWRkIGV2ZW50XG5cdFx0XHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KG51bGwsIHBhcmVudEVsLCAnYWRkJywgZHJhZ0VsLCByb290RWwsIG9sZEluZGV4LCBuZXdJbmRleCk7XG5cblx0XHRcdFx0XHRcdFx0Ly8gUmVtb3ZlIGV2ZW50XG5cdFx0XHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KHRoaXMsIHJvb3RFbCwgJ3JlbW92ZScsIGRyYWdFbCwgcm9vdEVsLCBvbGRJbmRleCwgbmV3SW5kZXgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdC8vIFJlbW92ZSBjbG9uZVxuXHRcdFx0XHRcdFx0Y2xvbmVFbCAmJiBjbG9uZUVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2xvbmVFbCk7XG5cblx0XHRcdFx0XHRcdGlmIChkcmFnRWwubmV4dFNpYmxpbmcgIT09IG5leHRFbCkge1xuXHRcdFx0XHRcdFx0XHQvLyBHZXQgdGhlIGluZGV4IG9mIHRoZSBkcmFnZ2VkIGVsZW1lbnQgd2l0aGluIGl0cyBwYXJlbnRcblx0XHRcdFx0XHRcdFx0bmV3SW5kZXggPSBfaW5kZXgoZHJhZ0VsLCBvcHRpb25zLmRyYWdnYWJsZSk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKG5ld0luZGV4ID49IDApIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBkcmFnICYgZHJvcCB3aXRoaW4gdGhlIHNhbWUgbGlzdFxuXHRcdFx0XHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KHRoaXMsIHJvb3RFbCwgJ3VwZGF0ZScsIGRyYWdFbCwgcm9vdEVsLCBvbGRJbmRleCwgbmV3SW5kZXgpO1xuXHRcdFx0XHRcdFx0XHRcdF9kaXNwYXRjaEV2ZW50KHRoaXMsIHJvb3RFbCwgJ3NvcnQnLCBkcmFnRWwsIHJvb3RFbCwgb2xkSW5kZXgsIG5ld0luZGV4KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChTb3J0YWJsZS5hY3RpdmUpIHtcblx0XHRcdFx0XHRcdGlmIChuZXdJbmRleCA9PT0gbnVsbCB8fCBuZXdJbmRleCA9PT0gLTEpIHtcblx0XHRcdFx0XHRcdFx0bmV3SW5kZXggPSBvbGRJbmRleDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0X2Rpc3BhdGNoRXZlbnQodGhpcywgcm9vdEVsLCAnZW5kJywgZHJhZ0VsLCByb290RWwsIG9sZEluZGV4LCBuZXdJbmRleCk7XG5cblx0XHRcdFx0XHRcdC8vIFNhdmUgc29ydGluZ1xuXHRcdFx0XHRcdFx0dGhpcy5zYXZlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdH1cblx0XHRcdHRoaXMuX251bGxpbmcoKTtcblx0XHR9LFxuXG5cdFx0X251bGxpbmc6IGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gTnVsbGluZ1xuXHRcdFx0cm9vdEVsID1cblx0XHRcdGRyYWdFbCA9XG5cdFx0XHRwYXJlbnRFbCA9XG5cdFx0XHRnaG9zdEVsID1cblx0XHRcdG5leHRFbCA9XG5cdFx0XHRjbG9uZUVsID1cblxuXHRcdFx0c2Nyb2xsRWwgPVxuXHRcdFx0c2Nyb2xsUGFyZW50RWwgPVxuXG5cdFx0XHR0YXBFdnQgPVxuXHRcdFx0dG91Y2hFdnQgPVxuXG5cdFx0XHRtb3ZlZCA9XG5cdFx0XHRuZXdJbmRleCA9XG5cblx0XHRcdGxhc3RFbCA9XG5cdFx0XHRsYXN0Q1NTID1cblxuXHRcdFx0YWN0aXZlR3JvdXAgPVxuXHRcdFx0U29ydGFibGUuYWN0aXZlID0gbnVsbDtcblx0XHR9LFxuXG5cdFx0aGFuZGxlRXZlbnQ6IGZ1bmN0aW9uICgvKipFdmVudCovZXZ0KSB7XG5cdFx0XHR2YXIgdHlwZSA9IGV2dC50eXBlO1xuXG5cdFx0XHRpZiAodHlwZSA9PT0gJ2RyYWdvdmVyJyB8fCB0eXBlID09PSAnZHJhZ2VudGVyJykge1xuXHRcdFx0XHRpZiAoZHJhZ0VsKSB7XG5cdFx0XHRcdFx0dGhpcy5fb25EcmFnT3ZlcihldnQpO1xuXHRcdFx0XHRcdF9nbG9iYWxEcmFnT3ZlcihldnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICh0eXBlID09PSAnZHJvcCcgfHwgdHlwZSA9PT0gJ2RyYWdlbmQnKSB7XG5cdFx0XHRcdHRoaXMuX29uRHJvcChldnQpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblxuXHRcdC8qKlxuXHRcdCAqIFNlcmlhbGl6ZXMgdGhlIGl0ZW0gaW50byBhbiBhcnJheSBvZiBzdHJpbmcuXG5cdFx0ICogQHJldHVybnMge1N0cmluZ1tdfVxuXHRcdCAqL1xuXHRcdHRvQXJyYXk6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBvcmRlciA9IFtdLFxuXHRcdFx0XHRlbCxcblx0XHRcdFx0Y2hpbGRyZW4gPSB0aGlzLmVsLmNoaWxkcmVuLFxuXHRcdFx0XHRpID0gMCxcblx0XHRcdFx0biA9IGNoaWxkcmVuLmxlbmd0aCxcblx0XHRcdFx0b3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdFx0Zm9yICg7IGkgPCBuOyBpKyspIHtcblx0XHRcdFx0ZWwgPSBjaGlsZHJlbltpXTtcblx0XHRcdFx0aWYgKF9jbG9zZXN0KGVsLCBvcHRpb25zLmRyYWdnYWJsZSwgdGhpcy5lbCkpIHtcblx0XHRcdFx0XHRvcmRlci5wdXNoKGVsLmdldEF0dHJpYnV0ZShvcHRpb25zLmRhdGFJZEF0dHIpIHx8IF9nZW5lcmF0ZUlkKGVsKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG9yZGVyO1xuXHRcdH0sXG5cblxuXHRcdC8qKlxuXHRcdCAqIFNvcnRzIHRoZSBlbGVtZW50cyBhY2NvcmRpbmcgdG8gdGhlIGFycmF5LlxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ1tdfSAgb3JkZXIgIG9yZGVyIG9mIHRoZSBpdGVtc1xuXHRcdCAqL1xuXHRcdHNvcnQ6IGZ1bmN0aW9uIChvcmRlcikge1xuXHRcdFx0dmFyIGl0ZW1zID0ge30sIHJvb3RFbCA9IHRoaXMuZWw7XG5cblx0XHRcdHRoaXMudG9BcnJheSgpLmZvckVhY2goZnVuY3Rpb24gKGlkLCBpKSB7XG5cdFx0XHRcdHZhciBlbCA9IHJvb3RFbC5jaGlsZHJlbltpXTtcblxuXHRcdFx0XHRpZiAoX2Nsb3Nlc3QoZWwsIHRoaXMub3B0aW9ucy5kcmFnZ2FibGUsIHJvb3RFbCkpIHtcblx0XHRcdFx0XHRpdGVtc1tpZF0gPSBlbDtcblx0XHRcdFx0fVxuXHRcdFx0fSwgdGhpcyk7XG5cblx0XHRcdG9yZGVyLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRcdGlmIChpdGVtc1tpZF0pIHtcblx0XHRcdFx0XHRyb290RWwucmVtb3ZlQ2hpbGQoaXRlbXNbaWRdKTtcblx0XHRcdFx0XHRyb290RWwuYXBwZW5kQ2hpbGQoaXRlbXNbaWRdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXG5cdFx0LyoqXG5cdFx0ICogU2F2ZSB0aGUgY3VycmVudCBzb3J0aW5nXG5cdFx0ICovXG5cdFx0c2F2ZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHN0b3JlID0gdGhpcy5vcHRpb25zLnN0b3JlO1xuXHRcdFx0c3RvcmUgJiYgc3RvcmUuc2V0KHRoaXMpO1xuXHRcdH0sXG5cblxuXHRcdC8qKlxuXHRcdCAqIEZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIHNldCwgZ2V0IHRoZSBmaXJzdCBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IgYnkgdGVzdGluZyB0aGUgZWxlbWVudCBpdHNlbGYgYW5kIHRyYXZlcnNpbmcgdXAgdGhyb3VnaCBpdHMgYW5jZXN0b3JzIGluIHRoZSBET00gdHJlZS5cblx0XHQgKiBAcGFyYW0gICB7SFRNTEVsZW1lbnR9ICBlbFxuXHRcdCAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgICAgIFtzZWxlY3Rvcl0gIGRlZmF1bHQ6IGBvcHRpb25zLmRyYWdnYWJsZWBcblx0XHQgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR8bnVsbH1cblx0XHQgKi9cblx0XHRjbG9zZXN0OiBmdW5jdGlvbiAoZWwsIHNlbGVjdG9yKSB7XG5cdFx0XHRyZXR1cm4gX2Nsb3Nlc3QoZWwsIHNlbGVjdG9yIHx8IHRoaXMub3B0aW9ucy5kcmFnZ2FibGUsIHRoaXMuZWwpO1xuXHRcdH0sXG5cblxuXHRcdC8qKlxuXHRcdCAqIFNldC9nZXQgb3B0aW9uXG5cdFx0ICogQHBhcmFtICAge3N0cmluZ30gbmFtZVxuXHRcdCAqIEBwYXJhbSAgIHsqfSAgICAgIFt2YWx1ZV1cblx0XHQgKiBAcmV0dXJucyB7Kn1cblx0XHQgKi9cblx0XHRvcHRpb246IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuXHRcdFx0dmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cblx0XHRcdGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7XG5cdFx0XHRcdHJldHVybiBvcHRpb25zW25hbWVdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0b3B0aW9uc1tuYW1lXSA9IHZhbHVlO1xuXG5cdFx0XHRcdGlmIChuYW1lID09PSAnZ3JvdXAnKSB7XG5cdFx0XHRcdFx0X3ByZXBhcmVHcm91cChvcHRpb25zKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cblxuXHRcdC8qKlxuXHRcdCAqIERlc3Ryb3lcblx0XHQgKi9cblx0XHRkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgZWwgPSB0aGlzLmVsO1xuXG5cdFx0XHRlbFtleHBhbmRvXSA9IG51bGw7XG5cblx0XHRcdF9vZmYoZWwsICdtb3VzZWRvd24nLCB0aGlzLl9vblRhcFN0YXJ0KTtcblx0XHRcdF9vZmYoZWwsICd0b3VjaHN0YXJ0JywgdGhpcy5fb25UYXBTdGFydCk7XG5cblx0XHRcdGlmICh0aGlzLm5hdGl2ZURyYWdnYWJsZSkge1xuXHRcdFx0XHRfb2ZmKGVsLCAnZHJhZ292ZXInLCB0aGlzKTtcblx0XHRcdFx0X29mZihlbCwgJ2RyYWdlbnRlcicsIHRoaXMpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBSZW1vdmUgZHJhZ2dhYmxlIGF0dHJpYnV0ZXNcblx0XHRcdEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWwucXVlcnlTZWxlY3RvckFsbCgnW2RyYWdnYWJsZV0nKSwgZnVuY3Rpb24gKGVsKSB7XG5cdFx0XHRcdGVsLnJlbW92ZUF0dHJpYnV0ZSgnZHJhZ2dhYmxlJyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dG91Y2hEcmFnT3Zlckxpc3RlbmVycy5zcGxpY2UodG91Y2hEcmFnT3Zlckxpc3RlbmVycy5pbmRleE9mKHRoaXMuX29uRHJhZ092ZXIpLCAxKTtcblxuXHRcdFx0dGhpcy5fb25Ecm9wKCk7XG5cblx0XHRcdHRoaXMuZWwgPSBlbCA9IG51bGw7XG5cdFx0fVxuXHR9O1xuXG5cblx0ZnVuY3Rpb24gX2Nsb25lSGlkZShzdGF0ZSkge1xuXHRcdGlmIChjbG9uZUVsICYmIChjbG9uZUVsLnN0YXRlICE9PSBzdGF0ZSkpIHtcblx0XHRcdF9jc3MoY2xvbmVFbCwgJ2Rpc3BsYXknLCBzdGF0ZSA/ICdub25lJyA6ICcnKTtcblx0XHRcdCFzdGF0ZSAmJiBjbG9uZUVsLnN0YXRlICYmIHJvb3RFbC5pbnNlcnRCZWZvcmUoY2xvbmVFbCwgZHJhZ0VsKTtcblx0XHRcdGNsb25lRWwuc3RhdGUgPSBzdGF0ZTtcblx0XHR9XG5cdH1cblxuXG5cdGZ1bmN0aW9uIF9jbG9zZXN0KC8qKkhUTUxFbGVtZW50Ki9lbCwgLyoqU3RyaW5nKi9zZWxlY3RvciwgLyoqSFRNTEVsZW1lbnQqL2N0eCkge1xuXHRcdGlmIChlbCkge1xuXHRcdFx0Y3R4ID0gY3R4IHx8IGRvY3VtZW50O1xuXG5cdFx0XHRkbyB7XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHQoc2VsZWN0b3IgPT09ICc+KicgJiYgZWwucGFyZW50Tm9kZSA9PT0gY3R4KVxuXHRcdFx0XHRcdHx8IF9tYXRjaGVzKGVsLCBzZWxlY3Rvcilcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0cmV0dXJuIGVsO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR3aGlsZSAoZWwgIT09IGN0eCAmJiAoZWwgPSBlbC5wYXJlbnROb2RlKSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXG5cdGZ1bmN0aW9uIF9nbG9iYWxEcmFnT3ZlcigvKipFdmVudCovZXZ0KSB7XG5cdFx0aWYgKGV2dC5kYXRhVHJhbnNmZXIpIHtcblx0XHRcdGV2dC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9ICdtb3ZlJztcblx0XHR9XG5cdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cdH1cblxuXG5cdGZ1bmN0aW9uIF9vbihlbCwgZXZlbnQsIGZuKSB7XG5cdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZm4sIGZhbHNlKTtcblx0fVxuXG5cblx0ZnVuY3Rpb24gX29mZihlbCwgZXZlbnQsIGZuKSB7XG5cdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZm4sIGZhbHNlKTtcblx0fVxuXG5cblx0ZnVuY3Rpb24gX3RvZ2dsZUNsYXNzKGVsLCBuYW1lLCBzdGF0ZSkge1xuXHRcdGlmIChlbCkge1xuXHRcdFx0aWYgKGVsLmNsYXNzTGlzdCkge1xuXHRcdFx0XHRlbC5jbGFzc0xpc3Rbc3RhdGUgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR2YXIgY2xhc3NOYW1lID0gKCcgJyArIGVsLmNsYXNzTmFtZSArICcgJykucmVwbGFjZShSU1BBQ0UsICcgJykucmVwbGFjZSgnICcgKyBuYW1lICsgJyAnLCAnICcpO1xuXHRcdFx0XHRlbC5jbGFzc05hbWUgPSAoY2xhc3NOYW1lICsgKHN0YXRlID8gJyAnICsgbmFtZSA6ICcnKSkucmVwbGFjZShSU1BBQ0UsICcgJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblxuXHRmdW5jdGlvbiBfY3NzKGVsLCBwcm9wLCB2YWwpIHtcblx0XHR2YXIgc3R5bGUgPSBlbCAmJiBlbC5zdHlsZTtcblxuXHRcdGlmIChzdHlsZSkge1xuXHRcdFx0aWYgKHZhbCA9PT0gdm9pZCAwKSB7XG5cdFx0XHRcdGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSB7XG5cdFx0XHRcdFx0dmFsID0gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgJycpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGVsLmN1cnJlbnRTdHlsZSkge1xuXHRcdFx0XHRcdHZhbCA9IGVsLmN1cnJlbnRTdHlsZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBwcm9wID09PSB2b2lkIDAgPyB2YWwgOiB2YWxbcHJvcF07XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0aWYgKCEocHJvcCBpbiBzdHlsZSkpIHtcblx0XHRcdFx0XHRwcm9wID0gJy13ZWJraXQtJyArIHByb3A7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzdHlsZVtwcm9wXSA9IHZhbCArICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJyA/ICcnIDogJ3B4Jyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblxuXHRmdW5jdGlvbiBfZmluZChjdHgsIHRhZ05hbWUsIGl0ZXJhdG9yKSB7XG5cdFx0aWYgKGN0eCkge1xuXHRcdFx0dmFyIGxpc3QgPSBjdHguZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnTmFtZSksIGkgPSAwLCBuID0gbGlzdC5sZW5ndGg7XG5cblx0XHRcdGlmIChpdGVyYXRvcikge1xuXHRcdFx0XHRmb3IgKDsgaSA8IG47IGkrKykge1xuXHRcdFx0XHRcdGl0ZXJhdG9yKGxpc3RbaV0sIGkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBsaXN0O1xuXHRcdH1cblxuXHRcdHJldHVybiBbXTtcblx0fVxuXG5cblxuXHRmdW5jdGlvbiBfZGlzcGF0Y2hFdmVudChzb3J0YWJsZSwgcm9vdEVsLCBuYW1lLCB0YXJnZXRFbCwgZnJvbUVsLCBzdGFydEluZGV4LCBuZXdJbmRleCkge1xuXHRcdHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKSxcblx0XHRcdG9wdGlvbnMgPSAoc29ydGFibGUgfHwgcm9vdEVsW2V4cGFuZG9dKS5vcHRpb25zLFxuXHRcdFx0b25OYW1lID0gJ29uJyArIG5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnN1YnN0cigxKTtcblxuXHRcdGV2dC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG5cblx0XHRldnQudG8gPSByb290RWw7XG5cdFx0ZXZ0LmZyb20gPSBmcm9tRWwgfHwgcm9vdEVsO1xuXHRcdGV2dC5pdGVtID0gdGFyZ2V0RWwgfHwgcm9vdEVsO1xuXHRcdGV2dC5jbG9uZSA9IGNsb25lRWw7XG5cblx0XHRldnQub2xkSW5kZXggPSBzdGFydEluZGV4O1xuXHRcdGV2dC5uZXdJbmRleCA9IG5ld0luZGV4O1xuXG5cdFx0cm9vdEVsLmRpc3BhdGNoRXZlbnQoZXZ0KTtcblxuXHRcdGlmIChvcHRpb25zW29uTmFtZV0pIHtcblx0XHRcdG9wdGlvbnNbb25OYW1lXS5jYWxsKHNvcnRhYmxlLCBldnQpO1xuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gX29uTW92ZShmcm9tRWwsIHRvRWwsIGRyYWdFbCwgZHJhZ1JlY3QsIHRhcmdldEVsLCB0YXJnZXRSZWN0KSB7XG5cdFx0dmFyIGV2dCxcblx0XHRcdHNvcnRhYmxlID0gZnJvbUVsW2V4cGFuZG9dLFxuXHRcdFx0b25Nb3ZlRm4gPSBzb3J0YWJsZS5vcHRpb25zLm9uTW92ZSxcblx0XHRcdHJldFZhbDtcblxuXHRcdGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuXHRcdGV2dC5pbml0RXZlbnQoJ21vdmUnLCB0cnVlLCB0cnVlKTtcblxuXHRcdGV2dC50byA9IHRvRWw7XG5cdFx0ZXZ0LmZyb20gPSBmcm9tRWw7XG5cdFx0ZXZ0LmRyYWdnZWQgPSBkcmFnRWw7XG5cdFx0ZXZ0LmRyYWdnZWRSZWN0ID0gZHJhZ1JlY3Q7XG5cdFx0ZXZ0LnJlbGF0ZWQgPSB0YXJnZXRFbCB8fCB0b0VsO1xuXHRcdGV2dC5yZWxhdGVkUmVjdCA9IHRhcmdldFJlY3QgfHwgdG9FbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHRcdGZyb21FbC5kaXNwYXRjaEV2ZW50KGV2dCk7XG5cblx0XHRpZiAob25Nb3ZlRm4pIHtcblx0XHRcdHJldFZhbCA9IG9uTW92ZUZuLmNhbGwoc29ydGFibGUsIGV2dCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJldFZhbDtcblx0fVxuXG5cblx0ZnVuY3Rpb24gX2Rpc2FibGVEcmFnZ2FibGUoZWwpIHtcblx0XHRlbC5kcmFnZ2FibGUgPSBmYWxzZTtcblx0fVxuXG5cblx0ZnVuY3Rpb24gX3Vuc2lsZW50KCkge1xuXHRcdF9zaWxlbnQgPSBmYWxzZTtcblx0fVxuXG5cblx0LyoqIEByZXR1cm5zIHtIVE1MRWxlbWVudHxmYWxzZX0gKi9cblx0ZnVuY3Rpb24gX2dob3N0SXNMYXN0KGVsLCBldnQpIHtcblx0XHR2YXIgbGFzdEVsID0gZWwubGFzdEVsZW1lbnRDaGlsZCxcblx0XHRcdFx0cmVjdCA9IGxhc3RFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHRcdHJldHVybiAoKGV2dC5jbGllbnRZIC0gKHJlY3QudG9wICsgcmVjdC5oZWlnaHQpID4gNSkgfHwgKGV2dC5jbGllbnRYIC0gKHJlY3QucmlnaHQgKyByZWN0LndpZHRoKSA+IDUpKSAmJiBsYXN0RWw7IC8vIG1pbiBkZWx0YVxuXHR9XG5cblxuXHQvKipcblx0ICogR2VuZXJhdGUgaWRcblx0ICogQHBhcmFtICAge0hUTUxFbGVtZW50fSBlbFxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gX2dlbmVyYXRlSWQoZWwpIHtcblx0XHR2YXIgc3RyID0gZWwudGFnTmFtZSArIGVsLmNsYXNzTmFtZSArIGVsLnNyYyArIGVsLmhyZWYgKyBlbC50ZXh0Q29udGVudCxcblx0XHRcdGkgPSBzdHIubGVuZ3RoLFxuXHRcdFx0c3VtID0gMDtcblxuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdHN1bSArPSBzdHIuY2hhckNvZGVBdChpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gc3VtLnRvU3RyaW5nKDM2KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBpbmRleCBvZiBhbiBlbGVtZW50IHdpdGhpbiBpdHMgcGFyZW50IGZvciBhIHNlbGVjdGVkIHNldCBvZlxuXHQgKiBlbGVtZW50c1xuXHQgKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxcblx0ICogQHBhcmFtICB7c2VsZWN0b3J9IHNlbGVjdG9yXG5cdCAqIEByZXR1cm4ge251bWJlcn1cblx0ICovXG5cdGZ1bmN0aW9uIF9pbmRleChlbCwgc2VsZWN0b3IpIHtcblx0XHR2YXIgaW5kZXggPSAwO1xuXG5cdFx0aWYgKCFlbCB8fCAhZWwucGFyZW50Tm9kZSkge1xuXHRcdFx0cmV0dXJuIC0xO1xuXHRcdH1cblxuXHRcdHdoaWxlIChlbCAmJiAoZWwgPSBlbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nKSkge1xuXHRcdFx0aWYgKGVsLm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgIT09ICdURU1QTEFURSdcblx0XHRcdFx0XHQmJiBfbWF0Y2hlcyhlbCwgc2VsZWN0b3IpKSB7XG5cdFx0XHRcdGluZGV4Kys7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGluZGV4O1xuXHR9XG5cblx0ZnVuY3Rpb24gX21hdGNoZXMoLyoqSFRNTEVsZW1lbnQqL2VsLCAvKipTdHJpbmcqL3NlbGVjdG9yKSB7XG5cdFx0aWYgKGVsKSB7XG5cdFx0XHRzZWxlY3RvciA9IHNlbGVjdG9yLnNwbGl0KCcuJyk7XG5cblx0XHRcdHZhciB0YWcgPSBzZWxlY3Rvci5zaGlmdCgpLnRvVXBwZXJDYXNlKCksXG5cdFx0XHRcdHJlID0gbmV3IFJlZ0V4cCgnXFxcXHMoJyArIHNlbGVjdG9yLmpvaW4oJ3wnKSArICcpKD89XFxcXHMpJywgJ2cnKTtcblxuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0KHRhZyA9PT0gJycgfHwgZWwubm9kZU5hbWUudG9VcHBlckNhc2UoKSA9PSB0YWcpICYmXG5cdFx0XHRcdCghc2VsZWN0b3IubGVuZ3RoIHx8ICgoJyAnICsgZWwuY2xhc3NOYW1lICsgJyAnKS5tYXRjaChyZSkgfHwgW10pLmxlbmd0aCA9PSBzZWxlY3Rvci5sZW5ndGgpXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIF90aHJvdHRsZShjYWxsYmFjaywgbXMpIHtcblx0XHR2YXIgYXJncywgX3RoaXM7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKGFyZ3MgPT09IHZvaWQgMCkge1xuXHRcdFx0XHRhcmdzID0gYXJndW1lbnRzO1xuXHRcdFx0XHRfdGhpcyA9IHRoaXM7XG5cblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0aWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdFx0XHRjYWxsYmFjay5jYWxsKF90aGlzLCBhcmdzWzBdKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y2FsbGJhY2suYXBwbHkoX3RoaXMsIGFyZ3MpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGFyZ3MgPSB2b2lkIDA7XG5cdFx0XHRcdH0sIG1zKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gX2V4dGVuZChkc3QsIHNyYykge1xuXHRcdGlmIChkc3QgJiYgc3JjKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG5cdFx0XHRcdGlmIChzcmMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRcdGRzdFtrZXldID0gc3JjW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZHN0O1xuXHR9XG5cblxuXHQvLyBFeHBvcnQgdXRpbHNcblx0U29ydGFibGUudXRpbHMgPSB7XG5cdFx0b246IF9vbixcblx0XHRvZmY6IF9vZmYsXG5cdFx0Y3NzOiBfY3NzLFxuXHRcdGZpbmQ6IF9maW5kLFxuXHRcdGlzOiBmdW5jdGlvbiAoZWwsIHNlbGVjdG9yKSB7XG5cdFx0XHRyZXR1cm4gISFfY2xvc2VzdChlbCwgc2VsZWN0b3IsIGVsKTtcblx0XHR9LFxuXHRcdGV4dGVuZDogX2V4dGVuZCxcblx0XHR0aHJvdHRsZTogX3Rocm90dGxlLFxuXHRcdGNsb3Nlc3Q6IF9jbG9zZXN0LFxuXHRcdHRvZ2dsZUNsYXNzOiBfdG9nZ2xlQ2xhc3MsXG5cdFx0aW5kZXg6IF9pbmRleFxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIENyZWF0ZSBzb3J0YWJsZSBpbnN0YW5jZVxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSAgZWxcblx0ICogQHBhcmFtIHtPYmplY3R9ICAgICAgW29wdGlvbnNdXG5cdCAqL1xuXHRTb3J0YWJsZS5jcmVhdGUgPSBmdW5jdGlvbiAoZWwsIG9wdGlvbnMpIHtcblx0XHRyZXR1cm4gbmV3IFNvcnRhYmxlKGVsLCBvcHRpb25zKTtcblx0fTtcblxuXG5cdC8vIEV4cG9ydFxuXHRTb3J0YWJsZS52ZXJzaW9uID0gJzEuNC4yJztcblx0cmV0dXJuIFNvcnRhYmxlO1xufSk7XG4iXX0=
