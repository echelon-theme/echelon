const { NewTabUtils } = ChromeUtils.importESModule("resource://gre/modules/NewTabUtils.sys.mjs");
const { XPCOMUtils } = ChromeUtils.importESModule("resource://gre/modules/XPCOMUtils.sys.mjs");

const PREF_NEWTAB_ENABLED = "browser.newtabpage.enabled";

XPCOMUtils.defineLazyGetter(this, "gStringBundle", function() {
  return Services.strings.
    createBundle("chrome://browser/locale/newTab.properties");
});

function newTabString(name) {
  return gStringBundle.GetStringFromName("newtab." + name);
}

const gPage = {
  get enabled() {
    return Services.prefs.getBoolPref(PREF_NEWTAB_ENABLED, true);
  },

  set enabled(aValue) {
    Services.prefs.setBoolPref(PREF_NEWTAB_ENABLED, !!aValue);
  },
  
  init: function Page_init() {

  }
};

gPage.init();