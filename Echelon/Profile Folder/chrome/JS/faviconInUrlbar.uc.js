// ==UserScript==
// @name			Favicon In UrlBar
// @description 	Adds Favicon of the current website to the UrlBar
// @author			Travis
// @include			main
// ==/UserScript==

var default_favicon = 'chrome://userchrome/content/images/icon16.png';

var FaviconInUrlbar = {
 init: function() {
   try {

	document.addEventListener("TabAttrModified", updateIcon, false);
	document.addEventListener('TabSelect', updateIcon, false);
	document.addEventListener('TabOpen', updateIcon, false);
	document.addEventListener('TabClose', updateIcon, false);
	document.addEventListener('load', updateIcon, false);
	updateIcon();

	function updateIcon() {
		
	 setTimeout(function(){
	  
	  var favicon_in_urlbar = gBrowser.selectedTab.image;
	  
	  if(!gBrowser.selectedTab.image || gBrowser.selectedTab.image == null)
		if(!default_favicon) favicon_in_urlbar = default_favicon;
		  else favicon_in_urlbar = default_favicon;
		  
	  document.querySelector('#identity-icon').setAttribute("style", "list-style-image: url('"+favicon_in_urlbar+"');");
	  
	 },1);

	}

  } catch(e) {}
 }
};

// initiate script after DOM/browser content is loaded
document.addEventListener("DOMContentLoaded", FaviconInUrlbar.init(), false);
