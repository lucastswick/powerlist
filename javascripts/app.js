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

(function (global, factory) {
    if (typeof define === "function" && define.amd) define(factory);
    else if (typeof module === "object") module.exports = factory();
    else global.augment = factory();
}(this, function () {
    "use strict";

    var Factory = function () {};
    var slice = Array.prototype.slice;

    var augment = function (base, body) {
        var uber = Factory.prototype = typeof base === "function" ? base.prototype : base;
        var prototype = new Factory, properties = body.apply(prototype, slice.call(arguments, 2).concat(uber));
        if (typeof properties === "object") for (var key in properties) prototype[key] = properties[key];
        if (!prototype.hasOwnProperty("constructor")) return prototype;
        var constructor = prototype.constructor;
        constructor.prototype = prototype;
        return constructor;
    };

    augment.defclass = function (prototype) {
        var constructor = prototype.constructor;
        constructor.prototype = prototype;
        return constructor;
    };

    augment.extend = function (base, body) {
        return augment(base, function (uber) {
            this.uber = uber;
            return body;
        });
    };

    return augment;
}));

var defclass = augment.defclass;

var EventStream = defclass({
    constructor: function () {
        this.argc = arguments.length;
        this.argv = arguments;
        this.listeners = [];
    },
    emit: function (event) {
        var listeners = this.listeners, length = listeners.length, index = 0;
        while (index < length) listeners[index++](event);
        this.argc = 0;
    },
    addListener: function (f) {
        var argc = this.argc, argv = this.argv, index = 0;
        while (index < argc) f(argv[index++]);
        this.listeners.push(f);
    },
    map: function (f) {
        var events = new Events;

        this.addListener(function (x) {
            events.emit(f(x));
        });

        return events;
    },
    filter: function (f) {
        var events = new Events;

        this.addListener(function (x) {
            if (f(x)) events.emit(x);
        });

        return events;
    },
    scan: function (a, f) {
        var events = new Events(a);

        this.addListener(function (x) {
            events.emit(a = f(a, x));
        });

        return events;
    },
    merge: function (that) {
        var events = new Events;

        this.addListener(function (x) {
            events.emit({ left: x });
        });

        that.addListener(function (y) {
            events.emit({ right: y });
        });

        return events;
    }
});
var PARLIAMENT = PARLIAMENT || {};

PARLIAMENT.createNS = function (namespace) {
    var nsparts = namespace.split(".");
    var parent = PARLIAMENT;
 
    // we want to be able to include or exclude the root namespace so we strip
    // it if it's in the namespace
    if (nsparts[0] === "PARLIAMENT") {
        nsparts = nsparts.slice(1);
    }
 
    // loop through the parts and create a nested namespace if necessary
    for (var i = 0; i < nsparts.length; i++) {
        var partname = nsparts[i];
        // check if the current parent already has the namespace declared
        // if it isn't, then create it
        if (typeof parent[partname] === "undefined") {
            parent[partname] = {};
        }
        // get a reference to the deepest element in the hierarchy so far
        parent = parent[partname];
    }
    // the parent is now constructed with empty namespaces and can be used.
    // we return the outermost namespace
    return parent;
};

PARLIAMENT.createNS("PARLIAMENT.POWERLIST");
var Classist = PARLIAMENT.Classist = function() {
}

PARLIAMENT.Classist.addClass = function(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ' ' + className;
  }
}

PARLIAMENT.Classist.removeClass = function(el, className) {

	if (el.classList) {
	  el.classList.remove(className);
	} else {
	  el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
	}
}

PARLIAMENT.Classist.hasClass = function(el, className) {

	if (el.classList) {
  	return el.classList.contains(className);
	} else {
  	return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
  }
}

PARLIAMENT.Classist.toggleClass = function(el, className) {

	if (Classist.hasClass(el, className)) {
  	
  	Classist.removeClass(el, className);
  	return false;
	
	} else {
  
  	Classist.addClass(el, className);
  	return true;
  
  }
}
// https://github.com/javascript/augment/wiki/Classical-Inheritance
// Uses FLIP animation principles from http://aerotwist.com/blog/flip-your-animations/

var defclass = augment.defclass;

PARLIAMENT.POWERLIST.PowerList = defclass({

  constructor: function (target) {
    this.target = target;
    this.initVars();
    this.initEvents();
  },


  initVars: function () {
    // turn nodelist into array
    this.items = Array.prototype.slice.call(this.target.querySelectorAll("li"));
    this.itemCount = this.items.length;
    this.canDragElements = false;
  },

  initEvents: function() {

    var _this = this;

    this._onTouchStart = function(ev) {

      ev.preventDefault();

      var el = ev.touches[0].target;
      var rect = el.getBoundingClientRect();
      
      _this.dragging = el;
      el.dataset.startX = ~~rect.left;
      el.dataset.startY = ~~rect.top;
      el.style.opacity = .5;
      
    }

    this._onTouchMove = function(ev) {

      var el, touch, style, diffX, diffY, halfWidth, halfHeight, ex, ey;

      // Only deal with one finger    
      if(ev.touches.length == 1) { 

        // Get the information for finger #1
        touch = ev.touches[0];
        el = _this.dragging;

        // Find the style object for the node the drag started from
        style = touch.target.style; 
        diffX = ~~(touch.pageX - el.dataset.startX);
        diffY = ~~(touch.pageY - el.dataset.startY);
        halfWidth = el.offsetWidth >> 1;
        halfHeight = el.offsetHeight >> 1;
        ex = diffX - halfWidth;
        ey = diffY - halfHeight;

        // Position the element under the touch point
        style.transform = "translateX(" + ex + "px) translateY(" + ey + "px)";
        style.webkitTransform = "translateX(" + ex + "px) translateY(" + ey + "px)";

      }
    }

    this._onTouchEnd = function(ev) {

      var el = _this.dragging;

      // first
      var startPositions = _this._getStartPositions();

      el.style.transform = "";
      el.style.webkitTransform = "";

      el.removeAttribute("data-start-x");
      el.removeAttribute("data-start-y");

      _this._animate(startPositions);

    }

    this._onDragStart = function(ev) {
      _this.dragging = ev.target;
      Classist.addClass(_this.dragging, "dragging");
    }

    this._onDragEnd = function(ev) {
      _this.dragging = undefined;
    }

    this._onDragOver = function(ev) {
      ev.preventDefault();

      var dropTarget = ev.toElement;
      var type = "swap";

      if (dropTarget !== _this.dragging) {

        var startPositions = _this._getStartPositions();
        
        dropParent = dropTarget.parentNode;

        dropTargetPos = _this.items.indexOf(dropTarget);
        
        if (dropTargetPos === 0 && !dropParent.children[0]) {
          dropParent.appendChild(_this.dragging);
        } else {
          dropParent.insertBefore(_this.dragging, dropTarget);
          // dropParent.insertBefore(this, dropParent.children[dropTargetPos]);
        }

        _this._animate(startPositions);

      }

    }

    this._onDragLeave = function(ev) {
    }

    this._onDrop = function(ev) {

      Classist.removeClass(_this.dragging, "dragging");
    }

    this._onAnimateComplete = function() {

      var el;

      for (var i = 0; i < _this.itemCount; i++) {
        el = _this.items[i];
        Classist.removeClass(el, "animate-on-transforms");

        el.removeEventListener('transitionend', _this._onAnimateComplete);
        el.removeEventListener('webkitTransitionEnd', _this._onAnimateComplete);
      }

      if (_this.requestID) {
        window.cancelAnimationFrame(_this.requestID);
        _this.requestID = undefined;
      }
    }

  },


  prepend: function(el) {
    this.items.unshift(el);
    this.itemCount = this.items.length;

    var startPositions = this._getStartPositions();
    
    this.target.insertBefore(el, this.target.firstChild);

    // get first item's coordinates
    var referencePosition = startPositions[1];
    startPositions[0].left = referencePosition.left - 10;
    startPositions[0].top = referencePosition.top;
    
    el.style.opacity = 0;

    this._animate(startPositions);

    if (this.canDragElements) {
      el.addEventListener("touchstart", this._onTouchStart);
      el.addEventListener("touchmove", this._onTouchMove);
      el.addEventListener("touchend", this._onTouchEnd);

      el.setAttribute("draggable", true);
      el.addEventListener("dragstart", this._onDragStart);
      el.addEventListener("dragend", this._onDragEnd);
      el.addEventListener("dragover", this._onDragOver);
      el.addEventListener("dragleave", this._onDragLeave);
      el.addEventListener("drop", this._onDrop);
    }

  },

  add: function(el) {
    this.items.push(el);
    this.itemCount = this.items.length;

    var startPositions = this._getStartPositions();

    this.target.appendChild(el);

    // get second-last item's coordinates, 
    // which is the item prior to the one we just added
    var referencePosition = startPositions[this.itemCount - 2];
    startPositions[this.itemCount - 1].left = referencePosition.left - 10;
    startPositions[this.itemCount - 1].top = referencePosition.top;
    
    el.style.opacity = 0;

    this._animate(startPositions);

    if (this.canDragElements) {
      el.addEventListener("touchstart", this._onTouchStart);
      el.addEventListener("touchmove", this._onTouchMove);
      el.addEventListener("touchend", this._onTouchEnd);

      el.setAttribute("draggable", true);
      el.addEventListener("dragstart", this._onDragStart);
      el.addEventListener("dragend", this._onDragEnd);
      el.addEventListener("dragover", this._onDragOver);
      el.addEventListener("dragleave", this._onDragLeave);
      el.addEventListener("drop", this._onDrop);
    }
  },

  _getStartPositions: function() {
    var startPositions = [];

    for (var i = 0; i < this.itemCount; i++) {
      var el = this.items[i];
      var rect = el.getBoundingClientRect();
      startPositions.push({"left": ~~rect.left, "top": ~~rect.top});
    }

    return startPositions;
  },

  _animate: function(startPositions) {

    var _this = this;
    var el;
    var animatedElements = [];

    for (var i = 0; i < this.itemCount; i++) {

      el = this.items[i];

      // Get the first position.
      var startPosition = startPositions[i];

      // Read again. This forces a sync layout, so be careful.
      var endPosition = el.getBoundingClientRect();

      // You can do this for other computed styles as well, if needed.
      // Just be sure to stick to compositor-only props like transform
      // and opacity where possible.
      var invertX = ~~(startPosition.left - endPosition.left);
      var invertY = ~~(startPosition.top - endPosition.top);

      // Invert.
      // el.style.transform = 'translateX(' + invertX + "px, " + invertY + "px);"
      if (invertX || invertY) {
        el.style.transform = "translateX(" + invertX + "px) translateY(" + invertY + "px)";
        el.style.webkitTransform = "translateX(" + invertX + "px) translateY(" + invertY + "px)";

        animatedElements.push(el);
      }
      
    }

    // Capture the animation end with transitionend
    if (animatedElements.length) {
      var lastAnimatedElement = animatedElements[animatedElements.length-1];
      lastAnimatedElement.addEventListener('transitionend', _this._onAnimateComplete);
      lastAnimatedElement.addEventListener('webkitTransitionEnd', _this._onAnimateComplete);
    }

    // unclear why this is required to ensure last element in list animates
    // appears as though console.log syncs layout, but that ... can't be right.
    console.log(el);

    if (this.requestID) {
      window.cancelAnimationFrame(this.requestID);
      this.requestID = undefined;
    }
    
    // Wait for the next frame so we know all the style changes have taken hold.
    this.requestID = window.requestAnimationFrame(function() {

      var len = animatedElements.length;
      for (var j = 0; j < len; j++) {
        el = animatedElements[j];

        // Switch on animations.
        Classist.addClass(el, 'animate-on-transforms');

        // GO GO GOOOOOO!
        el.style.transform = '';
        el.style.webkitTransform = '';
        el.style.opacity = '';
        
      }

    });

  },

  enableDrag: function() {

    var _this = this;

    this.canDragElements = true;

    for (var i = 0; i < this.itemCount; i++) {
      el = this.items[i];
      el.addEventListener("touchstart", _this._onTouchStart);
      el.addEventListener("touchmove", this._onTouchMove);
      el.addEventListener("touchend", _this._onTouchEnd);

      el.setAttribute("draggable", true);
      el.addEventListener("dragstart", _this._onDragStart);
      el.addEventListener("dragend", _this._onDragEnd);
      el.addEventListener("dragover", _this._onDragOver);
      el.addEventListener("dragleave", _this._onDragLeave);
      el.addEventListener("drop", _this._onDrop);
    }
  },


});
////////////////////////////////////////////////////////////////////////////////// 
// 
// App
// 
//////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////////// 
// 
// Instantiate
// 
//////////////////////////////////////////////////////////////////////////////////

var powerlist;
var count = 3;

document.addEventListener("DOMContentLoaded", function() {

  if (document.readyState != 'loading'){
    var t = document.querySelector(".powerlist")
		powerlist = new PARLIAMENT.POWERLIST.PowerList(t);
		powerlist.enableDrag();

		var prependButton = document.querySelector("[data-action=prepend-item]");
		prependButton.addEventListener("click", function(ev) {
			ev.preventDefault();
			var item = getNextItem();
			powerlist.prepend(item);
		});

		var addButton = document.querySelector("[data-action=add-item]");
		addButton.addEventListener("click", function(ev) {
			ev.preventDefault();
			var item = getNextItem();
			powerlist.add(item);
		});
  } 


  getNextItem = function() {
  	item = document.createElement('li');
  	item.className = "item";
  	item.innerHTML = "Item " + ++count;

  	return item;
  }
});

