const g_namespaceEnabledMap = {
    "AustralisPanel.CustomizeMode": false
};

class DebugController
{
    namespace = null;

    constructor(namespace)
    {
        this.namespace = namespace;
    }

    get isDebug()
    {
        return g_namespaceEnabledMap[this.namespace] ?? false;
    }

    log(...args)
    {
        if (this.isDebug)
        {
            console.log(`%c[${this.namespace}]`, "background-color: #000; color: #fff;", ...args);
        }
    }
}

export class EchelonDebugTools
{
    static getDebugController(namespace)
    {
        return new DebugController(namespace);
    }

    static setDebugMode(namespace, value)
    {
        g_namespaceEnabledMap[namespace] = value;
    }
}