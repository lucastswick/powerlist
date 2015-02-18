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
  },


  initVars: function () {
    // turn nodelist into array
    this.items = Array.prototype.slice.call(this.target.querySelectorAll("li"));
  },


  prepend: function(el) {
    this.items.unshift(el);

    this._preAnimate();
    
    this.target.insertBefore(el, this.target.firstChild);

    // get first item's coordinates
    var item1Coord = this.items[1].dataset;
    el.dataset["left"] = item1Coord["left"] - 10;
    el.dataset["top"] = item1Coord["top"];
    el.style.opacity = 0;

    this._animate();

  },

  add: function(el) {
    this.items.push(el);

    this._preAnimate();

    this.target.appendChild(el);

    // get second-last item's coordinates, 
    // which is the item prior to the one we just added
    var itemLastCoord = this.items[this.items.length - 2].dataset;
    el.dataset["left"] = itemLastCoord["left"] - 10;
    el.dataset["top"] = itemLastCoord["top"];
    el.style.opacity = 0;

    this._animate();
  },

  _preAnimate: function() {
    for (var i = 0; i < this.items.length; i++) {
      var el = this.items[i];
      var rect = el.getBoundingClientRect();
      el.dataset["left"] = ~~rect.left;
      el.dataset["top"] = ~~rect.top;
    }
  },

  _animate: function() {

    var _this = this;
    var el;
    var len = this.items.length;

    for (var i = 0; i < len; i++) {

      el = this.items[i];

      // Get the first position.
      var first = {"left": el.dataset["left"], "top" : el.dataset["top"]}

      // Read again. This forces a sync layout, so be careful.
      var last = el.getBoundingClientRect();

      // You can do this for other computed styles as well, if needed.
      // Just be sure to stick to compositor-only props like transform
      // and opacity where possible.
      var invertX = ~~(first.left - last.left);
      var invertY = ~~(first.top - last.top);

      // Invert.
      // el.style.transform = 'translateX(' + invertX + "px, " + invertY + "px);"
      el.style.transform = "translateX(" + invertX + "px) ";
      el.style.transform += "translateY(" + invertY + "px) ";
      el.style.webkitTransform = "translateX(" + invertX + "px) ";
      el.style.webkitTransform += "translateY(" + invertY + "px) ";
      
    }

    // unclear why this is required to ensure last element in list animates
    // appears as though console.log syncs layout, but that ... can't be right.
    console.log(el);

    // Wait for the next frame so we know all the style changes have taken hold.
    this.requestId = window.requestAnimationFrame(function() {

      for (var i = 0; i < len; i++) {
        el = _this.items[i];

        // Switch on animations.
        Classist.addClass(el, 'animate-on-transforms');

        // GO GO GOOOOOO!
        el.style.transform = '';
        el.style.webkitTransform = '';
        el.style.opacity = '';

        // Capture the end with transitionend
        el.addEventListener('transitionend', onAnimateComplete);
        el.addEventListener('webkitTransitionEnd', onAnimateComplete);
      }
    });

    onAnimateComplete = function(ev) {
      Classist.removeClass(ev.target, "animate-on-transforms");
      if (_this.requestID) {
        window.cancelAnimationFrame(_this.requestID);
        _this.requestID = undefined;
      }
    }
    
  }

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
    document.removeEventListener('DOMContentLoaded');
    var t = document.querySelector(".powerlist")
		powerlist = new PARLIAMENT.POWERLIST.PowerList(t);

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

