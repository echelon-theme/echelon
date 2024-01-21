// ==UserScript==
// @name			Echelon :: Search Engine icon
// @description 	Adds back Search Engine icon and Placeholder name.
// @author			Travis
// @include			main
// ==/UserScript==

const mainWindow = document.documentElement;
const isEchelonStyle3 = mainWindow.getAttribute("echelon-style-3");
const isEchelonStyle5 = mainWindow.getAttribute("echelon-style-5");

try {

	if (!isEchelonStyle5) {

		function setEngineProperties() {
			if (!isEchelonStyle5) {
				
				// Remove Search Engine name from URL Bar placeholder
				let urlBarInputPlaceholder = "Search or enter address";
				
				let urlBarInput = document.getElementById("urlbar-input");
				let searchBar = document.getElementById("searchbar");
				let searchBarIcon = document.querySelector(".searchbar-search-icon");
				let getEngineIcon = searchbar.currentEngine.iconURI.spec;
				let getEngineName = searchBar.currentEngine.name;
				let searchBarPlaceholder = document.querySelector(".searchbar-textbox");
				
				
				// Custom Search Engine icons
				if (!isEchelonStyle3) {
					if (getEngineName === "Google") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/google.png";
					} else if (getEngineName === "Bing") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/bing.png";
					} else if (getEngineName === "eBay") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/ebay.png";
					}
				} else {
					if (getEngineName === "Google") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/google_new.ico";
					} else if (getEngineName === "Bing") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/bing_new.ico";
					} else if (getEngineName === "eBay") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/ebay_new.ico";
					}
				}
				
				searchBarIcon.setAttribute("src", getEngineIcon);
				searchBarPlaceholder.setAttribute("placeholder", getEngineName);
				urlBarInput.setAttribute("placeholder", urlBarInputPlaceholder);
				
			}
		};
		
		
		// Execute function after search service finishes loading
		Services.search.init().then(a => {
			
			// Update Search Bar Icon & Placeholder
			let searchBar = document.getElementById("searchbar");

			let oldUpdateDisplay = searchBar.updateDisplay;
			
			searchBar.updateDisplay = function() {
				oldUpdateDisplay.call(this);
				setEngineProperties();
			};
			
			setEngineProperties();
			
		});
	}
	
}
catch (e) {
	Components.utils.reportError(e);
}