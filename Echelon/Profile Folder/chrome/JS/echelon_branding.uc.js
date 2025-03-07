// ==UserScript==
// @name			Echelon :: Branding
// @description 	Register brand FTLs.
// @author			aubymori
// @include			main
// @onlyonce
// ==/UserScript===

{
    function fsPathToFileUri(path, isDir = false)
    {
        let out = "file://";
        if (Services.appinfo.OS == "WINNT")
        {
            // file:// URIs have a leading slash that Windows file path doesn't
            // have normally
            out += "/";
        }
        // Add and de-Windowsify the path
        out += path.replaceAll("\\", "/");
        // Add leading slash if it isn't there
        if (isDir && out.slice(-1) != "/")
            out += "/";
        return out;
    }

    let brand = Services.prefs.getStringPref("Echelon.Option.Branding", "");
    if (brand != "")
    {
        let brandFtl = Services.dirsvc.get("UChrm", Ci.nsIFile);
        brandFtl.append("branding");
        brandFtl.append(brand);
        brandFtl.append("ftls");
        let root = fsPathToFileUri(brandFtl.path, true);
        brandFtl.append("branding");
        brandFtl.append("brand.ftl");
        if (brandFtl.exists())
        {
            let path = fsPathToFileUri(brandFtl.path);
            let locale = Services.locale.appLocalesAsBCP47;
            let source = new L10nFileSource(
                "echelon",
                "app",
                locale,
                root,
                {
                    addResourceOptions: {
                        allowOverrides: true
                    }
                },
                [path]
            );
            L10nRegistry.getInstance().registerSources([source]);
        }
    }

    if (brand != "")
    {
        let dialogFtl = Services.dirsvc.get("UChrm", Ci.nsIFile);
        dialogFtl.append("branding");
        dialogFtl.append(brand);
        dialogFtl.append("ftls");
        let root = fsPathToFileUri(dialogFtl.path, true);
        dialogFtl.append("browser");
        dialogFtl.append("aboutDialog.ftl");
        if (dialogFtl.exists())
        {
            let path = fsPathToFileUri(dialogFtl.path);
            let locale = Services.locale.appLocalesAsBCP47;
            let source = new L10nFileSource(
                "echelon",
                "app",
                locale,
                root,
                {
                    addResourceOptions: {
                        allowOverrides: true
                    }
                },
                [path]
            );
            L10nRegistry.getInstance().registerSources([source]);
        }
    }
}