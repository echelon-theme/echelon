// ==UserScript==
// @name			Echelon :: Title Text
// @description 	Changes the window title formats.
// @author			aubymori
// @include			main
// ==/UserScript===

{
    function setTitleText() {
        let root = document.documentElement;
        let titles = BrandUtils.getDefaultTitles();
        let browserName = BrandUtils.getBrandingKey("productName");
    
        root.dataset.titleDefault = titles.default;
        root.dataset.titlePrivate = titles.private;
        root.dataset.contentTitleDefault = titles.contentDefault;
        root.dataset.contentTitlePrivate = titles.contentPrivate;
        root.setAttribute("titleShortName", titles.appmenuName);

        waitForElement("#appmenu-button").then(e => {
            e.setAttribute("label", browserName);
        });
    }

    const echelonBranding = {
        observe: function (subject, topic, data) {
            if (topic == "nsPref:changed")
                setTitleText();
        },
    };

    Services.prefs.addObserver("Echelon.Option.BrowserSpoof", echelonBranding, false);
    setTitleText();
}