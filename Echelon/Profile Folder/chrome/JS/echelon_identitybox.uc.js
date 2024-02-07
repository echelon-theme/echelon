// ==UserScript==
// @name			Echelon :: Identity Box
// @description 	Changes identity box text to match appropriate brand name.
// @author			aubymori
// @include			main
// ==/UserScript==

{
    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    function identityLabelMutation(list)
    {
        let brand = BrandUtils.getShortProductName();
        for (const mut of list)
        {
            if (mut.target.value != brand)
            {
                mut.target.value = brand;
            }
        }
    }

    waitForElement("#identity-icon-label").then(identity => {
        let observer = new MutationObserver(identityLabelMutation);
        observer.observe(
            identity,
            {
                attributes: true,
                attributeFilter: ["value"]
            }
        );
    })
}