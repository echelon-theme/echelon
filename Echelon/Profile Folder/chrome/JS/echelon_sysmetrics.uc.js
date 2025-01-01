// ==UserScript==
// @name			Echelon :: System Metrics
// @description 	Gets system metrics and assigns them to CSS variables.
// @author			Travis
// @include			main
// ==/UserScript==

{
    waitForElement(".titlebar-buttonbox").then((e) => {
        let style = document.createElement("style");
        style.innerHTML = `
            :root {
                --buttonbox-width: ${e.clientWidth}px;
                --buttonbox-height: ${e.clientHeight}px;
            }
        `;
        document.head.appendChild(style);
    });
}