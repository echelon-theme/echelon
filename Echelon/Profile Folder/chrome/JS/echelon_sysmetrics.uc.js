// ==UserScript==
// @name			Echelon :: System Metrics
// @description 	Gets system metrics and assigns them to CSS variables.
// @author			Travis
// @include			main
// ==/UserScript==

{
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
            // fallbacks
            switch (aValue) {
                case "9":
                    return "CaptionText"
                case "19":
                    return "InactiveCaptionText"
                default:
                    return "rgb(0, 0, 0)"
            }
        }
    }

    function SetSystemColors() {
        if (Services.appinfo.OS == "WINNT")
        {
            document.documentElement.style.removeProperty(`--captiontext`);
            document.documentElement.style.removeProperty(`--inactivecaptiontext`);

            document.documentElement.style.setProperty(
                `--captiontext`,
                GetSystemColor(9)
            );
            document.documentElement.style.setProperty(
                `--inactivecaptiontext`,
                GetSystemColor(19)
            );
        }
    }

    window.addEventListener("load", SetSystemColors);

    let WM_THEMECHANGED = {
        observe(aSubject, aTopic, aData)
        {
            SetSystemColors();
        }
    };
    
    Services.obs.addObserver(WM_THEMECHANGED, "internal-look-and-feel-changed");
}