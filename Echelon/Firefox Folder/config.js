// skip 1st line
try {
  
  let {
  classes: Cc,
  interfaces: Ci,
  manager: Cm,
  utils: Cu
  } = Components;
  
  let cmanifest = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('UChrm', Ci.nsIFile);
  cmanifest.append('utils');
  cmanifest.append('chrome.manifest');
  
  if(cmanifest.exists()){
    Cm.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(cmanifest);
    Cu.import('chrome://userchromejs/content/boot.jsm');
  }

} catch(ex) {};

// FUCK DARK MODE
defaultPref("ui.systemUsesDarkMode", 0);
defaultPref("browser.theme.dark-private-windows", false);

// Enable CSS
defaultPref("toolkit.legacyUserProfileCustomizations.stylesheets", true);

// Enable :has()
defaultPref("layout.css.has-selector.enabled", true);

// Make private windows good again
defaultPref("browser.theme.dark-private-windows", false);
defaultPref("browser.privateWindowSeparation.enabled", false);

// Enable native theming
defaultPref("browser.display.windows.non_native_menus", 0);
defaultPref("widget.non-native-theme.enabled", false);

// Angle graphics engine + caption button mask is notoriously buggy
// This makes Firefox use the DirectX backend instead:
defaultPref("gfx.webrender.software", true);

// Maul Waterfox devs
defaultPref("browser.theme.enableWaterfoxCustomizations", 2);

// Old smooth scroll
defaultPref("general.smoothScroll.currentVelocityWeighting", ".25");
defaultPref("general.smoothScroll.mouseWheel.durationMaxMS", 400);
defaultPref("general.smoothScroll.mouseWheel.durationMinMS", 200);
defaultPref("general.smoothScroll.stopDecelerationWeighting", ".4");

// Restore "View Image Info" menuitem
defaultPref("browser.menu.showViewImageInfo", true);

// Echelon defaults
defaultPref("Echelon.Appearance.Blue", false);
defaultPref("Echelon.Appearance.Style", 0);
defaultPref("Echelon.Appearance.NewLogo", false);
defaultPref("Echelon.Appearance.Australis.EnableFog", true);
defaultPref("Echelon.Appearance.Australis.Windows10", false);
defaultPref("Echelon.Appearance.DevTools", true);

defaultPref("Echelon.Option.HideUnifiedExtensions", false);

defaultPref("Echelon.Behavior.ViewImage", true);

defaultPref("Echelon.FirefoxButton.CustomStyle", false);
defaultPref("Echelon.FirefoxButton.CustomName", "");
defaultPref("Echelon.FirefoxButton.CustomBGColor", "#000000");

defaultPref("Echelon.parameter.isFirstRunFinished", false);