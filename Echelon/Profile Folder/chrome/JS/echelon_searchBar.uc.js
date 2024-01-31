// ==UserScript==
// @name			Echelon :: Restore Old Search Engine
// @description 	Adds back Search Engine icon and Placeholder name.
// @author			Travis
// @include			main
// ==/UserScript==

// christ just rewrite this whole thing

try {

	const mainWindow = document.documentElement;
	const isEchelonStyle4 = mainWindow.getAttribute("echelon-style-4");
	const isEchelonStyle5 = mainWindow.getAttribute("echelon-style-5");

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
				if (isEchelonStyle4) {
					if (getEngineName === "Google") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/google_new.ico";
					} else if (getEngineName === "Bing") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/bing_new.ico";
					} else if (getEngineName === "eBay") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/ebay_new.ico";
					}
				} else {
					if (getEngineName === "Google") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/google.png";
					} else if (getEngineName === "Bing") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/bing.png";
					} else if (getEngineName === "eBay") {
						getEngineIcon = "chrome://userchrome/content/images/icons/engines/ebay.png";
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