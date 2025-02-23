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

    function GetSystemColor(aValue) {
        if (Services.appinfo.OS == "WINNT")
        {
            var { ctypes } = ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs");

            let user32 = ctypes.open("user32.dll");
            let GetSysColor = user32.declare(
                "GetSysColor",
                ctypes.winapi_abi,
                ctypes.int32_t,
                ctypes.int32_t
            );

            let coloref = GetSysColor(aValue);

            let r = coloref & 0xFF;
            let g = (coloref >> 8) & 0xFF;
            let b = (coloref >> 16) & 0xFF;

            user32.close();

            return `rgb(${r}, ${g}, ${b})`;
        }
        else {
            return "rgb(0, 0, 0)"; // fallback
        }
    }

    window.addEventListener("load", function() {
        if (Services.appinfo.OS == "WINNT")
        {
            
            let style = document.createElement("style");
            style.innerHTML = `
                :root {
                    --captiontext: ${GetSystemColor(9)};
                    --inactivecaptiontext: ${GetSystemColor(19)};
                }
            `;
            document.head.appendChild(style);
        }
    });
}