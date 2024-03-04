export const LocaleUtils = {
    createStringBundle(id)
    {
        let bundle = null;
        try
        {
            bundle = Services.strings.createBundle(`chrome://echelon/locale/properties/${id}.properties`);
            bundle.GetStringFromName("dummy");
        }
        catch (e)
        {
            if (e.result == Components.results.NS_ERROR_FILE_NOT_FOUND
            || e.result == Components.results.NS_ERROR_UNEXPECTED)
            {
                bundle = Services.strings.createBundle(`chrome://userchrome/content/locale/en-US/properties/${id}.properties`);
            }
        }
        return bundle;
    }
};