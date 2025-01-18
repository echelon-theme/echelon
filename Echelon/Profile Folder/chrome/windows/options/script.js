const { EchelonThemeManager } = ChromeUtils.importESModule("chrome://modules/content/EchelonThemeManager.sys.mjs");

let g_themeManager = new EchelonThemeManager;
g_themeManager.init(
    document.documentElement,
    {
        style: true,
        bools: ["Echelon.Appearance.Blue"]
    }
);

function switchCategory(event)
{
    let section = document.getElementById(this.value);
    if (section)
    {
        let selected = document.querySelector(`.section[selected="true"]`);
        selected && selected.removeAttribute("selected");
        section.setAttribute("selected", "true");
    }
}
document.getElementById("categories").addEventListener("select", switchCategory);

const gPrefHandler = {
    updatePref: function PrefHandler_updatePref(element)
    {
        switch (element.localName)
        {
            case "checkbox":
                element.checked = Services.prefs.getBoolPref(
                    element.getAttribute("preference"),
                    false
                );
                break;
            case "radiogroup":
                element.value = Services.prefs.getIntPref(
                    element.getAttribute("preference"),
                    0
                );
                break;
            case "menulist":

				if (element.getAttribute("type") == "string") {
					element.value = Services.prefs.getStringPref(
						element.getAttribute("preference")
					);
				} 
				else {
					element.value = Services.prefs.getIntPref(
						element.getAttribute("preference"),
						0
					);
				}
                break;
            case "input":
                switch (element.type)
                {
                    case "number":
                        element.value = Services.prefs.getIntPref(
                            element.getAttribute("preference"),
                            0
                        );
                        break;
                }
                break;
        }
    },

    handleEvent: function PrefHandler_handleEvent(event)
    {
        switch (event.type)
        {
            case "CheckboxStateChange":
                Services.prefs.setBoolPref(
                    event.target.getAttribute("preference"),
                    event.target.checked
                );
                break;
            case "input":
            {
                let pref = event.target;
                switch (pref.type)
                {
                    case "number":
                        if (pref.value && Number.isInteger(Number(pref.value)))
                        {
                            pref.removeAttribute("invalid");
                            Services.prefs.setIntPref(
                                pref.getAttribute("preference"),
                                Number(pref.value)
                            );
                        }
                        else
                        {
                            pref.setAttribute("invalid", "");
                        }
                        break;
                }
            }
            case "command":
				if (event.target.parentElement.parentElement.getAttribute("type") == "string") {
					Services.prefs.setStringPref(
						event.target.parentElement.parentElement.getAttribute("preference"),
						event.target.parentElement.parentElement.value
					)
				} else {
					Services.prefs.setIntPref(
						event.target.parentElement.parentElement.getAttribute("preference"),
						Number(event.target.parentElement.parentElement.value)
					);
				};
                break;
        }
    },

    observe: function PrefHandler_observe(subject, topic, data)
    {
        if (topic == "nsPref:changed")
        {
            let pref = document.querySelector(`[preference="${data}"]`);
            pref && this.updatePref(pref);
        }
    },

    init: function PrefHandler_init()
    {
        for (const pref of document.querySelectorAll("[preference]"))
        {
            this.updatePref(pref);
        }
        Services.prefs.addObserver(null, this);
        document.addEventListener("CheckboxStateChange", this);
        document.addEventListener("input", this);
        document.addEventListener("command", this);
        document.addEventListener("updateRadioGroup", this)
    }
};

gPrefHandler.init();

// stolen from echelon_themes until i add import support on that script
class ThemeUtils
{
    static stylePreset = {
		0: { // Firefox 4
			"version": "4",
            "name": "Firefox 4",
            "year": "2011",
		},
		1: { // Firefox 5
			"version": "5",
            "name": "Firefox 5",
            "year": "2011",
		},
		2: { // Firefox 6
			"version": "6",
            "name": "Firefox 6",
            "year": "2011",
		},
		3: { // Firefox 8
			"version": "8",
            "name": "Firefox 8",
            "year": "2011",
		},
		4: { // Firefox 10
			"version": "10",
            "name": "Firefox 10",
            "year": "2012",
		},
        5: { // Firefox 14
			"version": "14",
            "name": "Firefox 14",
            "year": "2012",
		},
        6: { // Firefox 28
			"version": "28",
            "name": "Firefox 28",
            "year": "2014",
		},
        7: { // Firefox 29
			"version": "29",
            "name": "Firefox 29",
            "year": "2014",
		},
        8: { // Firefox 56
			"version": "56",
            "name": "Firefox 56 (WIP)",
            "year": "2017",
		}
	};

    static styleHomepage = {
		0: { // Firefox 4-7
            "version": "4",
            "name": "Firefox 4",
            "year": "2011",
		},
        1: { // Firefox 10-12
            "version": "8",
            "name": "Firefox 8",
            "year": "2011",
		},
        2: { // Firefox 13-22
            "version": "14",
            "name": "Firefox 14",
            "year": "2012",
		},
        3: { // Firefox 23-30
            "version": "28",
            "name": "Firefox 28",
            "year": "2014",
		},
        4: { // Firefox 23-30
            "version": "56",
            "name": "Firefox 56",
            "year": "2017",
		},
	};
}

let presetContainer = document.getElementById("preset-container");
let presetCard = null;

for (const i of Object.keys(ThemeUtils.stylePreset)) {
    presetCard = `
        <vbox class="card">
            <radio value="${i}" class="card-wrapper">
                <div class="checked" />
                <div class="year">${ThemeUtils.stylePreset[i].year}</div>
                <image style="background-image: url('chrome://userchrome/content/windows/options/images/presets/firefox-${ThemeUtils.stylePreset[i].version}.png');" flex="1" />
                <div class="content">
                    <label value="${ThemeUtils.stylePreset[i].name}" flex="1" />
                </div>
            </radio>
        </vbox> 
    `

    presetContainer.appendChild(MozXULElement.parseXULToFragment(presetCard));
}

let homepageContainer = document.getElementById("homepage-container");

for (const i of Object.keys(ThemeUtils.styleHomepage)) {
    presetCard = `
        <vbox class="card" style="background-image: url('chrome://userchrome/content/windows/options/images/homepage/firefox-${ThemeUtils.styleHomepage[i].version}.png');">
            <radio value="${i}" class="card-wrapper">
                <div class="checked" />
                <div class="year">${ThemeUtils.styleHomepage[i].year}</div>
                <div class="content">
                    <label value="${ThemeUtils.styleHomepage[i].name}" flex="1" />
                </div>
            </radio>
        </vbox> 
    `

    homepageContainer.appendChild(MozXULElement.parseXULToFragment(presetCard));
}