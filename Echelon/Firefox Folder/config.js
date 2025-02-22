// skip 1st line
try
{  
    let {
        classes: Cc,
        interfaces: Ci,
        manager: Cm,
        utils: Cu
    } = Components;
    
    let cmanifest = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("UChrm", Ci.nsIFile);
    cmanifest.append("utils");
    cmanifest.append("chrome.manifest");
    
    if (cmanifest.exists())
    {
        Cm.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);
        Cu.import("chrome://userchromejs/content/boot.jsm");
    }

    // Branding part 1: Registration of content
    let prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
    let branding = prefs.getStringPref("Echelon.Option.Branding", "");
    if (branding != "")
    {
        let brandingManifest = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("UChrm", Ci.nsIFile);
		let newBranding = prefs.getBoolPref("Echelon.Appearance.NewLogo");
        brandingManifest.append("branding");
        brandingManifest.append(branding);
		if (newBranding)
		{
			brandingManifest.append("new");
		}
        brandingManifest.append("chrome.manifest");
        if (brandingManifest.exists())
        {
            Cm.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(brandingManifest);
        }
    }
} catch(ex) {};

// Old smooth scroll
defaultPref("general.smoothScroll.currentVelocityWeighting", ".25");
defaultPref("general.smoothScroll.mouseWheel.durationMaxMS", 400);
defaultPref("general.smoothScroll.mouseWheel.durationMinMS", 200);
defaultPref("general.smoothScroll.stopDecelerationWeighting", ".4");

// Enable CSS
defaultPref("toolkit.legacyUserProfileCustomizations.stylesheets", true);