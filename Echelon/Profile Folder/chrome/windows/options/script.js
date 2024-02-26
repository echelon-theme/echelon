const { PrefUtils, BrandUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
const { EchelonThemeManager } = ChromeUtils.import("chrome://modules/content/EchelonThemeManager.js");
const { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");
const gOptionsBundle = document.getElementById("optionsBundle");

let g_themeManager = new EchelonThemeManager;
g_themeManager.init(
    document.documentElement,
    {
        bools: ["Echelon.Appearance.XP"]
    }
);

function getWinVer()
{
    if (Services.appinfo.OS != "WINNT")
    {
        return "Not applicable";
    }

    let kernel32 = ctypes.open("kernel32.dll");

    let OSVERSIONINFOW = new ctypes.StructType("OSVERSIONINFOW", [
        {"dwOSVersionInfoSize": ctypes.uint32_t},
        {"dwMajorVersion": ctypes.uint32_t},
        {"dwMinorVersion": ctypes.uint32_t},
        {"dwBuildNumber": ctypes.uint32_t},
        {"dwPlatformId": ctypes.uint32_t},
        {"szCDSVersion": new ctypes.ArrayType(ctypes.char16_t, 128)}
    ]);

    let GetVersionExW = kernel32.declare(
        "GetVersionExW",
        ctypes.winapi_abi,
        ctypes.int32_t,
        OSVERSIONINFOW.ptr
    );

    let osv = new OSVERSIONINFOW();
    osv.dwOSVersionInfoSize = OSVERSIONINFOW.size;
    if (GetVersionExW(osv.address()))
    {
        return `${osv.dwMajorVersion}.${osv.dwMinorVersion}.${osv.dwBuildNumber}`;
    }
    return "Failed";
}

function getTrueWinVer()
{
    if (Services.appinfo.OS != "WINNT")
    {
        return "Not applicable";
    }

    let ntdll = ctypes.open("ntdll.dll");

    let RTL_OSVERSIONINFOW = new ctypes.StructType("RTL_OSVERSIONINFOW", [
        {"dwOSVersionInfoSize": ctypes.uint32_t},
        {"dwMajorVersion": ctypes.uint32_t},
        {"dwMinorVersion": ctypes.uint32_t},
        {"dwBuildNumber": ctypes.uint32_t},
        {"dwPlatformId": ctypes.uint32_t},
        {"szCDSVersion": new ctypes.ArrayType(ctypes.char16_t, 128)}
    ]);

    let RtlGetVersion = ntdll.declare(
        "RtlGetVersion",
        ctypes.winapi_abi,
        ctypes.int32_t,
        RTL_OSVERSIONINFOW.ptr
    );

    let osv = new RTL_OSVERSIONINFOW();
    osv.dwOSVersionInfoSize = RTL_OSVERSIONINFOW.size;
    if (RtlGetVersion(osv.address()) == 0)
    {
        return `${osv.dwMajorVersion}.${osv.dwMinorVersion}.${osv.dwBuildNumber}`;
    }
    return "Failed";
}

const OS_STYLE_MAP = {
    "winxp": {
        "Echelon.Appearance.XP": true,
        "Echelon.Appearance.Australis.Windows8": false,
        "Echelon.Appearance.Australis.Windows10": false,
        "Echelon.Appearance.Blue": false
    },
    "win7": {
        "Echelon.Appearance.XP": false,
        "Echelon.Appearance.Australis.Windows8": false,
        "Echelon.Appearance.Australis.Windows10": false
        // blue can be variable
    },
    "win8": {
        "Echelon.Appearance.XP": false,
        "Echelon.Appearance.Australis.Windows8": true,
        "Echelon.Appearance.Australis.Windows10": false,
        "Echelon.Appearance.Blue": false
    },
    "win10": {
        "Echelon.Appearance.XP": false,
        "Echelon.Appearance.Australis.Windows8": false,
        "Echelon.Appearance.Australis.Windows10": true,
        "Echelon.Appearance.Blue": false
    }
};

function osStyleGet()
{
    let style = null;
    for (const osName in OS_STYLE_MAP)
    {
        const defs = OS_STYLE_MAP[osName];
        for (const prop in defs)
        {
            if (PrefUtils.tryGetBoolPref(prop) == defs[prop])
            {
                style = osName;
            }
            else
            {
                style = null;
            }
        }

        if (style != null)
            break;
    }

    return style ?? "win7"; // default
}

function osStyleSet(osName)
{
    for (const prop in OS_STYLE_MAP[osName])
    {
        PrefUtils.trySetBoolPref(prop, OS_STYLE_MAP[osName][prop]);
    }
}

// Initialise display of native controls patch:
let ncpQueryResult = window.matchMedia("(-moz-ev-native-controls-patch)");
if (!ncpQueryResult.matches)
{
    document.querySelector("#section-native-controls").style.display = "none";
}

function refreshViewProperties()
{
    // Handle local display changes when the user changes configuration.
    let restartRequired = isRestartRequired();

    document.querySelector(".restart-required-label").style.display = restartRequired ? "inline" : "none";

    for (const elm of document.querySelectorAll(".option[australis-only]"))
    {
        let localStyle = document.querySelector(".option[data-option='Echelon.Appearance.Style']").value;
        elm.disabled = localStyle < 4;
    }

    for (const elm of document.querySelectorAll(".option[win7-only]"))
    {
        let localOS = document.querySelector(".option.os-control-list").value;
        elm.disabled = localOS != "win7";
    }
}

document.querySelector(".option.os-control-list").value = osStyleGet();

/* Fill current values */
for (const option of document.querySelectorAll(".option"))
{
    switch (option.dataset.type)
    {
        case "bool":
            option.checked = PrefUtils.tryGetBoolPref(option.dataset.option);
            break;
        case "int":
        case "enum":
            option.value = PrefUtils.tryGetIntPref(option.dataset.option);
            break;
        case "string":
            option.value = PrefUtils.tryGetStringPref(option.dataset.option);
            break;
    }
    option.originalValue = getOptionValue(option);

    if (option.localName == "menulist")
        option.addEventListener("command", refreshViewProperties);
    else if (option.localName == "checkbox")
        option.addEventListener("CheckboxStateChange", refreshViewProperties);
    else if (option.localName == "input")
        option.addEventListener("input", refreshViewProperties);
}

refreshViewProperties();

function getOptionValue(optElm)
{
    switch (optElm.dataset.type)
    {
        case "bool":
            return optElm.checked;
        case "int":
        case "enum":
            return optElm.value;
        case "string":
            return optElm.value;
    }

    return null;
}

function isRestartRequired()
{
    for (const option of document.querySelectorAll(".option"))
    {
        if (option.closest("[section-change-requires-restart]") || option.getAttribute("change-requires-restart"))
        {
            if (option.originalValue != getOptionValue(option))
            {
                return true;
            }
        }
    }
    return false;
}

function okApplyHandler(e, closeWindow = false)
{
    let restartRequired = isRestartRequired();

    let restartStruct = {
        accepted: false,
        icon: "warning",
        title: gOptionsBundle.getString("restart_prompt_title"),
        message: gOptionsBundle.getString("restart_prompt_message"),
        acceptButtonText: gOptionsBundle.getString("restart_prompt_restart")
    };

    if (restartRequired)
    {
        window.openDialog(
            "chrome://userchrome/content/windows/common/dialog.xhtml",
            gOptionsBundle.getString("restart_prompt_title"),
            "chrome,centerscreen,resizeable=no,dependent,modal",
            restartStruct
        );
    }

    if (!restartRequired || restartStruct.accepted)
    {
        for (const option of document.querySelectorAll(".option"))
        {
            switch (option.dataset.type)
            {
                case "bool":
                    PrefUtils.trySetBoolPref(option.dataset.option, option.checked);
                    break;
                case "enum":
                    PrefUtils.trySetIntPref(option.dataset.option, Number(option.value));
                    break;
                case "int":
                    PrefUtils.trySetIntPref(option.dataset.option, Math.floor(Number(option.value)));
                    break;
                case "string":
                    PrefUtils.trySetStringPref(option.dataset.option, option.value);
                    break;
            }
        }

        // OS style needs to be applied separately
        osStyleSet(document.querySelector(".option.os-control-list").value);

        if (restartRequired)
            _ucUtils.restart(true);

        if (closeWindow)
            window.close();
    }
}

/* Events */
document.getElementById("ok-button").addEventListener("click", e => okApplyHandler(e, true));
document.getElementById("apply-button").addEventListener("click", e => okApplyHandler(e, false));

document.getElementById("cancel-button").addEventListener("click", function()
{
    window.close();
});

function switchTab(e)
{
    let id = this.id.replace("tab-", "");

    /* Update tabs */
    document.querySelector(".tab-selected").classList.remove("tab-selected");
    this.classList.add("tab-selected");

    /* Update sections */
    document.querySelector(".section-selected").classList.remove("section-selected");
    document.getElementById(`section-${id}`).classList.add("section-selected");

    /* Update content element */
    document.getElementById("content").dataset.tab = id;
}

for (const tab of document.querySelectorAll(".tab"))
{
    tab.addEventListener("click", switchTab);
}

document.documentElement.addEventListener('keypress', function(e) {
	if (e.key == "Escape") {
		window.close();
	}
});

document.getElementById("custom-name").placeholder = BrandUtils.getShortProductName();
document.getElementById("brand-name").placeholder = BrandUtils.getDefaultProductName();

document.getElementById("browser-spoof").placeholder = Services.appinfo.name;
document.getElementById("channel-spoof").placeholder = Services.appinfo.defaultUpdateChannel;

let titles = BrandUtils.getDefaultTitles();
document.getElementById("default-title").placeholder = titles.default;
document.getElementById("private-title").placeholder = titles.private;
document.getElementById("default-content-title").placeholder = titles.contentDefault;
document.getElementById("private-content-title").placeholder = titles.contentPrivate;

for (const td of document.querySelectorAll("#debug-table td"))
{
    td.innerText = eval(td.dataset.content);
}

fetch("chrome://userchrome/content/version.txt").then(async r => {
    document.getElementById("echelon-ver-text").innerHTML = gOptionsBundle.getFormattedString(
        "version_format",
        [`<html:b>${await r.text()}</html:b>`]
    );
});

fetch("chrome://userchrome/content/build.txt").then(async r => {
    document.getElementById("echelon-build-text").innerHTML = gOptionsBundle.getFormattedString(
        "build_format",
        [`<html:b>${await r.text()}</html:b>`]
    );
});