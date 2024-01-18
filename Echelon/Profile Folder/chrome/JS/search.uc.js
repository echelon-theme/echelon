// ==UserScript==
// @name			Old Search Bar
// @description 	Adds back Search Engine icon and Placeholder name.
// @author			Travis
// @include			main
// ==/UserScript==

const mainWindow = document.documentElement;
const isEchelonStyle5 = mainWindow.getAttribute("echelon-style-5");

try {

	if (!isEchelonStyle5) {
		function setEngineProperties() {
			let searchBar = document.getElementById("searchbar");
			let searchBarIcon = document.querySelector(".searchbar-search-icon");
			let getEngineIcon = searchbar.currentEngine.iconURI.spec;
			let getEngineName = searchBar.currentEngine.name;
			let searchBarPlaceholder = document.querySelector(".searchbar-textbox");
			
			if (getEngineName = "Google") {
				getEngineIcon = "chrome://userchrome/content/images/icons/engines/google.png";
			}
			
			searchBarIcon.setAttribute("src", getEngineIcon);
			searchBarPlaceholder.setAttribute("placeholder", getEngineName);
		}
		
		Services.search.init().then(a => {
			setEngineProperties();
		});
	}
	
}
catch (e) {
	Components.utils.reportError(e);
}