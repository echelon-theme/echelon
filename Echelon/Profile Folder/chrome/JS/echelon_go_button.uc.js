// ==UserScript==
// @name			Echelon :: Go Button
// @description 	Adds a Go button to the stop-reload item.
// @author			aubymori
// @include			main
// ==/UserScript==

// {
//     var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
//     waitForElement = waitForElement.bind(window);

//     waitForElement("#stop-reload-button").then((e) => {
//         let goButton = window.MozXULElement.parseXULToFragment(`
//             <toolbarbutton id="go-button" class="toolbarbutton-1" onclick="gURLBar.handleCommand(event);" tooltiptext="Go to the address in the Location Bar" label="Go">
//                 <image class="toolbarbutton-icon" label="Go"/>
//             </toolbarbutton>
//         `);
//         e.insertBefore(goButton, e.querySelector("#stop-button"));
//     });
// }