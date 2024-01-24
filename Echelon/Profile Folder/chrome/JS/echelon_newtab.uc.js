// ==UserScript==
// @name			Echelon :: New Tab
// @description 	Manages the custom New Tab page system of Echelon.
// @author			ephemeralViolette
// @include			main
// @backgroundmodule
// ==/UserScript==

// Heavily referenced/stolen from this script:
// https://github.com/aminomancer/uc.css.js/blob/3ecff5b064712b2517b0af0d6a41cead3b7fe89f/JS/aboutCfg.uc.js

(function() {
	
//let Services = ChromeUtils.import("resource://gre/modules/Services.jsm");
let registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);

// generate a unique ID on every app launch. protection against the very
// unlikely possibility that a future update adds a component with the same
// class ID, which would break the script.
function generateFreeCID() {
  let uuid = Components.ID(Services.uuid.generateUUID().toString());
  // I can't tell whether generateUUID is guaranteed to produce a unique ID, or
  // just a random ID. so I add this loop to regenerate it in the extremely
  // unlikely (or potentially impossible) event that the UUID is already
  // registered as a CID.
  while (registrar.isCIDRegistered(uuid)) {
    uuid = Components.ID(Services.uuid.generateUUID().toString());
  }
  return uuid;
}

let aboutHomeUri = "chrome://userchrome/content/pages/aboutHome/_aboutHome.html";

function generateOverrideClassAndFactory(aUri)
{
	function OverrideObject() {}
	OverrideObject.prototype = {
		get uri()
		{
			return Services.io.newURI(aUri);
		},
		
		newChannel(_uri, loadInfo)
		{
			const ch = Services.io.newChannelFromURIWithLoadInfo(this.uri, loadInfo);
			ch.owner = Services.scriptSecurityManager.getSystemPrincipal();
			return ch;
		},
		
		getURIFlags(_uri)
		{
			return Ci.nsIAboutModule.ALLOW_SCRIPT | Ci.nsIAboutModule.IS_SECURE_CHROME_UI;
		},
		
		getChromeURI(_uri)
		{
			return this.uri;
		},
		
		QueryInterface: ChromeUtils.generateQI(["nsIAboutModule"])
	};
	
	return {
		override: OverrideObject,
		factory: {
			createInstance(aIID)
			{
				return new OverrideObject().QueryInterface(aIID);
			},
			
			QueryInterface: ChromeUtils.generateQI(["nsIFactory"])
		}
	};
}

function echelonInitNewTabManager() {
	let overrideDefs = generateOverrideClassAndFactory(aboutHomeUri);
	registrar.registerFactory(
		generateFreeCID(),
		`about:newtab`,
		`@mozilla.org/network/protocol/about;1?what=newtab`,
		overrideDefs.factory
	);
};
echelonInitNewTabManager();
	
})();

let EXPORTED_SYMBOLS = [];