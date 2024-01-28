Services.scriptloader.loadSubScript("chrome://userchrome/content/JS/echelon_utils.uc.js");
const { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");

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

/* Fill current values */
for (const option of document.querySelectorAll(".option"))
{   
    switch (option.dataset.type)
    {
        case "bool":
            option.checked = tryGetBoolPref(option.dataset.option);
            break;
        case "int":
        case "enum":
            option.value = tryGetIntPref(option.dataset.option);
            break;
        case "string":
            option.value = tryGetStringPref(option.dataset.option);
            break;
    }
}

/* Events */
document.getElementById("ok-button").addEventListener("click", function()
{
    for (const option of document.querySelectorAll(".option"))
    {   
        switch (option.dataset.type)
        {
            case "bool":
                trySetBoolPref(option.dataset.option, option.checked);
                break;
            case "enum":
                trySetIntPref(option.dataset.option, Number(option.value));
                break;
            case "int":
                trySetIntPref(option.dataset.option, Math.floor(Number(option.value)));
                break;
            case "string":
                trySetStringPref(option.dataset.option, option.value);
                break;
        }
    }

    _ucUtils.restart(true);
    window.close();
});

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

document.getElementById("custom-name").placeholder = getShortProductName();
document.getElementById("brand-name").placeholder = getDefaultProductName();

document.getElementById("browser-spoof").placeholder = Services.appinfo.name;
document.getElementById("channel-spoof").placeholder = Services.appinfo.defaultUpdateChannel;

let titles = getDefaultTitles();
document.getElementById("default-title").placeholder = titles.default;
document.getElementById("private-title").placeholder = titles.private;
document.getElementById("default-content-title").placeholder = titles.contentDefault;
document.getElementById("private-content-title").placeholder = titles.contentPrivate;

for (const td of document.querySelectorAll("#debug-table td"))
{
    td.innerText = eval(td.dataset.content);
}

fetch("chrome://userchrome/content/version.txt").then(r => {
    r.text().then(t => {
        document.querySelector("#echelon-ver-text b").innerText = t;
    });
});