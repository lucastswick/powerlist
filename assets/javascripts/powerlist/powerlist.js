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