function getAndSetTitleBarHeight() {
    if (Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS == "WINNT") {
        // Load User32.dll library
        const user32 = ctypes.open("user32.dll");

        // Define the GetSystemMetrics function signature
        const GetSystemMetrics = user32.declare("GetSystemMetrics", ctypes.winapi_abi,
            ctypes.int32_t,
            ctypes.int32_t
        );

        // Get the height of the system title bar (SM_CYCAPTION)
        var titleBarHeight = GetSystemMetrics(4) - 1;

        // Close the User32.dll library
        user32.close();
    } else {
        var titleBarHeight = 16;
    }

    var titlebarHeightStyle = document.createElement('style');
    document.head.appendChild(titlebarHeightStyle);

    titlebarHeightStyle.innerHTML = `
        :root {
            --titlebar-height:`+ titleBarHeight + `px;
        }
    `
}