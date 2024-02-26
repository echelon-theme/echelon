// ==UserScript==
// @name			Echelon :: System Metrics
// @description 	Gets system metrics and assigns them to CSS variables.
// @author			AngelBruni, Travis
// @include			main
// ==/UserScript==

{
    var { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");

    window.addEventListener("load", function() {
        if (Services.appinfo.OS == "WINNT")
        {
            let user32 = ctypes.open("user32.dll");
            let GetSystemMetrics = user32.declare(
                "GetSystemMetrics",
                ctypes.winapi_abi,
                ctypes.int32_t,
                ctypes.int32_t
            );

            // SM_CYPCAPTION
            let titlebarHeight = GetSystemMetrics(4) - 1;

            // SM_CXPADDEDBORDER
            let paddedBorder = GetSystemMetrics(92);
            if (paddedBorder > 0)
            {
                paddedBorder--;
            }

            // CAPTION BUTTON MASK SIZE
            let captionMaskSize = document.querySelector(".titlebar-buttonbox-container").clientWidth;

            let style = document.createElement("style");
            style.innerHTML = `
                :root {
                    --titlebar-height: ${titlebarHeight}px;
                    --padded-border: ${paddedBorder}px;
                    --caption-mask-width: ${captionMaskSize}px;
                }
            `;
            document.head.appendChild(style);
        }
    });
}