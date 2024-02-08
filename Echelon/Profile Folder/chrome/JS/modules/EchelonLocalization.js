/**
 * Provides an interface for the JSON localization files used by Echelon userscripts.
 */
class EchelonLocalization
{
    static #store = {};

    static async #fillStringsById(id)
    {
        let lang = Services.locale.requestedLocale;
        let response = await fetch(`chrome://echelon/locale/json/${id}.json`);
        if (response.status != 200)
        {
            throw new Error(`Failed to get JSON locale file with ID ${id} and locale ${lang}`);
        }

        let obj = null;
        try
        {
            obj = await response.json();
        }
        catch (e)
        {
            Components.utils.reportError(e);
            throw new Error(`Got JSON locale file with ID ${id} and locale ${lang} but failed to parse it as JSON`);
        }

        if (!(lang in this.#store))
        {
            this.#store[lang] = {};
        }

        this.#store[lang][id] = obj;
        return this.#store[lang][id];
    }

    static async getStringsById(id)
    {
        let lang = Services.locale.requestedLocale;
        if (lang in this.#store && id in this.#store[lang])
        {
            return this.#store[lang][id];
        }
        else
        {
            let obj = null;
            try
            {
                obj = await this.#fillStringsById(id);
            }
            catch(e)
            {
                Components.utils.reportError(e);
            }
            return obj;
        }
    }
}

let EXPORTED_SYMBOLS = ["EchelonLocalization"];