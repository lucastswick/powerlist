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

    this._makeDraggable = function(el) {
      el.addEventListener("touchstart", this._onTouchStart);
      el.addEventListener("touchmove", this._onTouchMove);
      el.addEventListener("touchend", this._onTouchEnd);

      // el.setAttribute("draggable", true);
      el.addEventListener("mousedown", this._onDragStart);
      // el.addEventListener("dragend", this._onDragEnd);
      // el.addEventListener("dragover", this._onDragOver);
      // el.addEventListener("dragleave", this._onDragLeave);
      // el.addEventListener("drop", this._onDrop);
    }

    this._onDragStart = function(ev) {

      _this.dragging = ev.target;

      _this.placeholder = _this.dragging.cloneNode(true);
      Classist.addClass(_this.placeholder, "placeholder");
      _this.dragging.parentNode.insertBefore(_this.placeholder, _this.dragging);

      var placeholderBounds = _this.placeholder.getBoundingClientRect();
      var draggingBounds = _this.dragging.getBoundingClientRect();
      var parentBounds = _this.target.getBoundingClientRect();

      _this.placeholderStartX = draggingBounds.left;
      _this.placeholderStartY = draggingBounds.top;
      // _this.offsetX = ev.pageX - _this.placeholderStartX;
      // _this.offsetY = ev.pageY - _this.placeholderStartY;
      _this.offsetX = placeholderBounds.width >> 1;
      _this.offsetY = placeholderBounds.height >> 1;

      var x = ~~(ev.pageX - parentBounds.left - _this.offsetX);
      var y = ~~(ev.pageY - parentBounds.top - _this.offsetY);

      var style = _this.placeholder.style;
      style.transform = "translateX(" + x + "px) translateY(" + y + "px)";
      style.webkitTransform = "translateX(" + x + "px) translateY(" + y + "px)";

      Classist.addClass(_this.dragging, "dragging");

      document.removeEventListener("mousemove", _this._onDrag);
      document.addEventListener("mousemove", _this._onDrag);

      document.removeEventListener("mouseup", _this._onDragEnd);
      document.addEventListener("mouseup", _this._onDragEnd);
      
    }

    this._onDrag = function(ev) {

      var placeholderBounds = _this.placeholder.getBoundingClientRect();
      var draggingBounds = _this.dragging.getBoundingClientRect();
      var parentBounds = _this.target.getBoundingClientRect();

      var x = ~~(ev.pageX - parentBounds.left - _this.offsetX);
      var y = ~~(ev.pageY - parentBounds.top - _this.offsetY);
      
      // var startPositions = _this._getStartPositions();

      var style = _this.placeholder.style;
      style.transform = "translateX(" + x + "px) translateY(" + y + "px)";
      style.webkitTransform = "translateX(" + x + "px) translateY(" + y + "px)";

      // hide placeholder so we can retrieve item under cursor
      _this.placeholder.style.display = "none";

      var over = document.elementFromPoint(ev.pageX, ev.pageY);

      if (over != _this.overElement && _this.overElement) {
        _this.overElement.style.opacity = 1;
      }
              
      if (_this.target.contains(over)) {
        
        if (over != _this.target) {

          if (over != _this.dragging) {
          
            // style the element we are over
            over.style.opacity = .5;

            var itemIndex = _this.items.indexOf(_this.dragging);
            var overIndex = _this.items.indexOf(over);
            var overBounds = over.getBoundingClientRect();
            var dir = (ev.pageX < _this.lastPageX) ? "left" : "right";


            // if we're more than halfway past the x-axis of the item we're over, we insert after
            /*
            if (ev.pageX < overBounds.left + overBounds.width / 2 ) {
              // console.log('left side');
              _this.dragging.parentNode.insertBefore(_this.dragging, over);
            } else {
              // console.log('right side');
              if (overIndex == _this.itemCount - 1) {
                _this.dragging.parentNode.appendChild(_this.dragging);
              } else {
                _this.dragging.parentNode.insertBefore(_this.dragging, _this.items[overIndex + 1]);
              }
            }
            */

            if (dir === "left") {
              if (overIndex === _this.itemCount - 1) {
                _this.dragging.parentNode.insertBefore(_this.dragging, _this.items[overIndex]);
              } else {
                _this.dragging.parentNode.insertBefore(_this.dragging, _this.items[overIndex]);
              }
            } else if (dir === "right") {
              if (overIndex === _this.itemCount - 1) {
                _this.dragging.parentNode.appendChild(_this.dragging);
              } else {
                _this.dragging.parentNode.insertBefore(_this.dragging, _this.items[overIndex + 1]);
              }
            }

            var startPositions = _this._getStartPositions();

            _this.items = Array.prototype.slice.call(_this.target.querySelectorAll("li:not(.placeholder)"));

            _this._animate(startPositions);

          }

          _this.overElement = over;
        }
          
      }

      // turn placeholder back on
      _this.placeholder.style.display = "inline";
      _this.lastPageX = ev.pageX;

    }

    this._onDragEnd = function(ev) {

      Classist.removeClass(_this.dragging, "dragging");

      _this.dragging = undefined;

      if (_this.placeholder) {
        _this.placeholder.parentNode.removeChild(_this.placeholder);
        _this.placeholder = undefined;
      }

      if (_this.overElement) {
        _this.overElement.style.opacity = 1;
        _this.overElement = undefined;
      }

      _this.items = Array.prototype.slice.call(_this.target.querySelectorAll("li"));

      document.removeEventListener("mousemove", _this._onDrag);
      document.removeEventListener("mouseup", _this._onDragEnd);

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
      this._makeDraggable(el);
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
      this._makeDraggable(el);
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
      this._makeDraggable(el);
    }
  },


});