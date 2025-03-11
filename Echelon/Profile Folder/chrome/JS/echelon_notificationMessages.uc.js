// ==UserScript==
// @name            Echelon :: Notification Messages
// @description     Adds attributional values on Notification Messages for styling purposes
// @author		    Travis
// @include			main
// ==/UserScript==

function onMutation(list)
{
    for (const mut of list)
    {
        if (mut.target.matches("notification-message")) {
            var stylesheet = `
                <html:link rel="stylesheet" href="chrome://userchrome/content/echelon.uc.css" />
            `
            var stylesheetElem = mut.target.shadowRoot.querySelector("link[href='chrome://userchrome/content/echelon.uc.css']");

            if (!stylesheetElem) {
                mut.target.shadowRoot.appendChild(MozXULElement.parseXULToFragment(stylesheet));

                var container = mut.target.shadowRoot.querySelector("div");
                container.setAttribute("echelon-modified", "true");
                container.setAttribute("type", mut.target.getAttribute("type"))

                var style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");

                if (style >= 6)
                {
                    container.setAttribute("echelon-modified-australis", "true");
                }

                var childElements = container.childNodes;
                for (let i = 0; i < childElements.length; i++) {
                    const child = childElements[i];
                    child.setAttribute("echelon-modified", "true");
                }
            }
        }
    }
}

let messageBoxObserver = new MutationObserver(onMutation);
messageBoxObserver.observe(
    document.documentElement,
    {
        attributes: true,
        childList: true,
        subtree: true
    }
);