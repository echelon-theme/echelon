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

  _updateAttributes: function Page_updateAttributes(aValue) {
    // Set the nodes' states.
    let nodeSelector = "#newtab-scrollbox, #newtab-toggle, #newtab-grid, #newtab-search-container";
    for (let node of document.querySelectorAll(nodeSelector)) {
      if (aValue)
        node.removeAttribute("page-disabled");
      else
        node.setAttribute("page-disabled", "true");
    }

    // Enables/disables the control and link elements.
    let inputSelector = ".newtab-control, .newtab-link";
    for (let input of document.querySelectorAll(inputSelector)) {
      if (aValue) 
        input.removeAttribute("tabindex");
      else
        input.setAttribute("tabindex", "-1");
    }

    // Update the toggle button's title.
    let toggle = document.getElementById("newtab-toggle");
    toggle.setAttribute("title", newTabString(aValue ? "hide" : "show"));
  },

  handleEvent: function Page_handleEvent(aEvent) {
    switch (aEvent.type){
      case "click":
        let {button, target} = aEvent;
        if (target.id == "newtab-toggle") {
          if (button == 0) {
            this.enabled = !this.enabled;
          }
          break;
        }
    }
  },
  
  init: function Page_init() {
    this._updateAttributes(this.enabled);
  }
};

gPage.init();