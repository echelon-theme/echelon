(function(){
try
{
    Components.utils.import("resource://gre/modules/addons/XPIProvider.jsm", {}).eval("SIGNED_TYPES.clear()");
} catch(e) {}

try
{
    Components.utils.import("resource://gre/modules/addons/XPIInstall.jsm", {}).eval("SIGNED_TYPES.clear()");
} catch(e) {}

try
{
    Components.utils.import("resource://gre/modules/addons/XPIDatabase.jsm", {}).eval("SIGNED_TYPES.clear()");
} catch(e) {}

const {XPCOMUtils} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetters(this, {
    XPIDatabase: "resource://gre/modules/addons/XPIDatabase.jsm",
});

XPIDatabase.SIGNED_TYPES.clear();

console.log('Add-on signing disabled.');
})();