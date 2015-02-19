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

