// ==UserScript==
// @name			Echelon :: System Metrics
// @description 	Gets system metrics and assigns them to CSS variables.
// @author			Travis
// @include			main
// ==/UserScript==

{
    window.addEventListener("load", function() {
           // CAPTION BUTTON MASK SIZE
           let captionMask = document.querySelector(".titlebar-buttonbox");

           let style = document.createElement("style");
           style.innerHTML = `
               :root {
                   --buttonbox-width: ${captionMask.clientWidth}px;
                   --buttonbox-height: ${captionMask.clientHeight}px;
               }
           `;
           document.head.appendChild(style);
    });
}