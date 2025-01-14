// ==UserScript==
// @name			Echelon :: System Metrics
// @description 	Gets system metrics and assigns them to CSS variables.
// @author			Travis
// @include			main
// ==/UserScript==

{
    waitForElement(".titlebar-buttonbox").then((e) => {
        function setButtonBoxMetrics() {

            document.documentElement.style.removeProperty(`--buttonbox-width`);
            document.documentElement.style.removeProperty(`--buttonbox-height`);

            document.documentElement.style.setProperty(
                `--buttonbox-width`,
                `${e.clientWidth}px`
            );
            document.documentElement.style.setProperty(
                `--buttonbox-height`,
                `${e.clientHeight}px`
            );
        }
        
        setButtonBoxMetrics();
        let observer = new MutationObserver(setButtonBoxMetrics);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["sizemode"] });
    });
}