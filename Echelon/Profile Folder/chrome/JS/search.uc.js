var tries = 30;
var init = function() {
  try {
	document.getElementById("searchbar").currentEngine;
  } catch(e) {
	if (--tries > 0) {
	  setTimeout(init, 1000);
	}
  }

  try {
	var searchbar = document.getElementById("searchbar");

	updateStyleSheet();

	var oldUpdateDisplay = searchbar.updateDisplay;
	searchbar.updateDisplay = function() {
	  oldUpdateDisplay.call(this);
	  updateStyleSheet();
	};

	function updateStyleSheet() {
		
		var enginename = document.getElementById("searchbar").currentEngine.name;
		
		if (enginename == "Google") {
			engineicon = "chrome://userchrome/content/images/google.png";
		}

		document.querySelector(".searchbar-search-icon").setAttribute("src", engineicon);

	};

  } catch(e) {}
}
setTimeout(init, 1000);