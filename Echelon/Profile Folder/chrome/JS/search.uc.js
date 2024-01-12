// 'Search engine icon in search bar' script for Firefox 60+ by Aris
//
// Feature: search button shows current search engines icon (like with old search)
// based on 'alternative_searchbar.uc.js'
// Fx 77+ fix provided by anomiex

var tries = 30;
var init = function() {
  // Sometimes search interface is not being created in time. Retry (up to 30 times) until it does.
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

	// Override updateDisplay() from browsers internal 'searchbar.js' file to also update the icon
	var oldUpdateDisplay = searchbar.updateDisplay;
	searchbar.updateDisplay = function() {
	  oldUpdateDisplay.call(this);
	  updateStyleSheet();
	};

	// main style sheet
	function updateStyleSheet() {
		
		var enginename = document.getElementById("searchbar").currentEngine.name;
		
		if (enginename == "Google") {
			engineicon = "chrome://userchrome/content/images/google.png";
		}

		document.querySelector(".searchbar-search-icon").setAttribute("src", engineicon);

	};
	
	function changeSearchBarPlaceholder() {
		var enginename = document.getElementById("searchbar").currentEngine.name;
		const searchBarPlaceHolder = document.querySelector(".searchbar-textbox");
		
		searchBarPlaceHolder.setAttribute("placeholder", ""+enginename+"");
	};

  } catch(e) {}
}
setTimeout(init, 1000);
