// Heavily referenced/stolen from this script:
// https://github.com/aminomancer/uc.css.js/blob/3ecff5b064712b2517b0af0d6a41cead3b7fe89f/JS/aboutCfg.uc.js

class OverrideObject
{
    _uri = null;
    QueryInterface = null;

    constructor(uri)
    {
        this._uri = uri;
        this.QueryInterface = ChromeUtils.generateQI(["nsIAboutModule"]);
    }

    get uri()
    {
        return Services.io.newURI(this._uri);
    }

    newChannel(uri, loadInfo)
    {
        const ch = Services.io.newChannelFromURIWithLoadInfo(this.uri, loadInfo);
        ch.owner = Services.scriptSecurityManager.getSystemPrincipal();
        return ch;
    }

    getURIFlags(uri)
    {
        return Ci.nsIAboutModule.ALLOW_SCRIPT | Ci.nsIAboutModule.IS_SECURE_CHROME_UI;
    }

    getChromeURI(_uri)
    {
        return this.uri;
    }
}

class OverrideFactory
{
    QueryInterface = null;
    uri = null;

    constructor(uri)
    {
        this.uri = uri;
        this.QueryInterface = ChromeUtils.generateQI(["nsIFactory"]);
    }

    createInstance(aIID)
    {
        return (new OverrideObject(this.uri)).QueryInterface(aIID);
    }
}

export class AboutPageManager
{
    static registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    static registeredPages = {};

    /* Generate unique ID every launch */
    static generateFreeCID()
    {
        let uuid;
        do
        {
            uuid = Components.ID(Services.uuid.generateUUID().toString());
        }
        while (this.registrar.isCIDRegistered(uuid));

        return uuid;
    }

    static registerPage(name, uri)
    {
        /* Unregister the page if it has already been registered. */
        this.unregisterPage(name);

        let factory = new OverrideFactory(uri);
        let cid = this.generateFreeCID();

        this.registeredPages[name] = {
            cid: cid,
            factory: factory
        };

        this.registrar.registerFactory(
            cid,
            `about:${name}`,
            `@mozilla.org/network/protocol/about;1?what=${name}`,
            factory
        );
    }

    static unregisterPage(name)
    {
        if (this.registeredPages[name])
        {
            this.registrar.unregisterFactory(
                this.registeredPages[name].cid,
                this.registeredPages[name].factory
            );
            delete this.registeredPages[name];
        }
    }
}