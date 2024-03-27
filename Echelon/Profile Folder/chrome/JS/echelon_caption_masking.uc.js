// ==UserScript==
// @name			Echelon :: Caption Button Masking
// @description 	Manages the masking of DWM caption buttons in Echelon.
// @author			ephemeralViolette
// @include			main
// ==/UserScript==

let g_echelonCaptionButtonMaskingManager;
	
{
	var { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");

	class CaptionButtonMaskingManager
	{
		containerEl = null;
		captionButtonsEl = null;

		init()
		{
			this.createMaskElement();
			this.updateCaptionButtonSizing();
			this.applyMask();
		}

		/**
		 * Updates the caption button sizing.
		 */
		updateCaptionButtonSizing()
		{
			this.tryApplySizing(this.calculateSizeForWin7());
		}

		tryApplySizing(sizeInfo)
		{
			if (sizeInfo.code !== 0)
				return

			this.captionButtonsEl.style.width = sizeInfo.width + "px";
			this.captionButtonsEl.style.height = sizeInfo.height + "px";
		}

		createMaskElement()
		{
			let maskContainer = document.createElement("div");
			maskContainer.id = "echelon-titlebar-mask";

			let maskCaptionButtons = document.createElement("div");
			maskCaptionButtons.className = "echelon-titlebar-mask-caption-buttons";

			maskContainer.appendChild(maskCaptionButtons);

			this.containerEl = maskContainer;
			this.captionButtonsEl = maskCaptionButtons;

			document.documentElement.appendChild(maskContainer);
		}

		applyMask()
		{
			document.body.classList.add("echelon-masked-titlebar");
			document.documentElement.classList.add("echelon-has-masked-titlebar-window");
		}

		/**
		 * Calculates the caption button size for Vista and 7 themes.
		 * 
		 * Vista and 7 actually share the same sizing algorithms, but they have
		 * different default SM_CYCAPTION sizes.
		 *
		 * The default size for Windows 7 is 105x21. The height of the caption buttons
		 * is roughly equivalent to SM_CYSIZE, but for our purposes, we want to subtract
		 * 1 from that since 1 pixel is drawn into the window border (beyond our access).
		 */
		calculateSizeForWin7()
		{
			// Width to height ratio of the default dimensions.
			const widthToHeightRatio = 5;

			const user32 = ctypes.open("user32.dll");
			try
			{
				let GetSystemMetrics = user32.declare(
					"GetSystemMetrics",
					ctypes.winapi_abi,
					ctypes.int32_t,
					ctypes.int32_t
				);

				// SM_CYSIZE
				let captionButtonHeight = GetSystemMetrics(31);

				return {
					code: 0,
					width: captionButtonHeight * widthToHeightRatio - 3, // 3 pixels are offscreen
					height: captionButtonHeight - 1 // 1 pixel is offscreen
				};
			}
			catch (e)
			{
				return {
					code: -1,
					width: 0,
					height: 0
				};
			}
			finally
			{
				user32.close();
			}
		}

		/**
		 * Gets the caption button size from DWM API.
		 */
		getSizeFromDwmApi()
		{
			const dwmapi = ctypes.open("dwmapi.dll");
			try
			{
				// Get our own window handle for later:
				let hwndSelf = window.docShell.treeOwner.nsIBaseWindow.nativeHandle;

				// HRESULT DwmGetWindowAttribute(HWND hWnd, DWORD dwAttribute, PVOID pvAttribute, DWORD cbAttribute)
				const DwmGetWindowAttribute = dwmapi.declare(
					"DwmGetWindowAttribute",
					ctypes.winapi_abi,
					ctypes.uint32_t, // return HRESULT
					ctypes.uint32_t, // DWORD dwAttribute
					ctypes.voidptr_t, // PVOID pvAttribute
					ctypes.uint32_t // DWORD cbAttribute
				);

				const RECT = new ctypes.StructType(
					"RECT", [
						[ ctypes.int32_t, "left" ],
						[ ctypes.int32_t, "top" ],
						[ ctypes.int32_t, "right" ],
						[ ctypes.int32_t, "bottom" ]
					]
				);

				// Index of this in the API enum:
				// https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute
				const DWMWA_CAPTION_BUTTON_BOUNDS = 5;

				// Query DWM API for the caption button bounds:
				let captionButtonsRect = new RECT();

				if (0 != DwmGetWindowAttribute(
					ctypes.voidptr_t(ctypes.UInt64(hwndSelf)),
					DWMWA_CAPTION_BUTTON_BOUNDS,
					captionButtonsRect.ptr(),
					RECT.size()
				))
				{
					throw "Failed to get window attribute";
				}

				let width = captionButtonsRect.right - captionButtonsRect.left;
				let height = captionButtonsRect.bottom - captionButtonsRect.top;

				return {
					code: 0,
					width: width,
					height: height
				};
			}
			catch (e)
			{
				return {
					code: -1,
					width: 0,
					height: 0
				};
			}
			finally
			{
				dwmapi.close();
			}
		}
	}
	
	g_echelonCaptionButtonMaskingManager = new CaptionButtonMaskingManager;
	g_echelonCaptionButtonMaskingManager.init();
}
