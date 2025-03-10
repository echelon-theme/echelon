// ==UserScript==
// @name			Echelon :: Migrator
// @description 	Migrates old configs of Echelon 1 to 2
// @author			Travis
// @include			main
// ==/UserScript==

class EchelonThemeMigrator {
    static oldEchelonPrefs = [
        "Echelon.Option.ChannelSpoof",
        "Echelon.Option.BrowserSpoof",
        "Echelon.Option.BrandName",
        "Echelon.FirefoxButton.CustomBGColor",
        "Echelon.FirefoxButton.CustomName",
        "Echelon.FirefoxButton.CustomStyle",
        "Echelon.WindowTitle.ContentDefault",
        "Echelon.WindowTitle.ContentPrivate",
        "Echelon.WindowTitle.Default",
        "Echelon.WindowTitle.Private",
        "Echelon.Appearance.Australis.EnableFog",
        "Echelon.Appearance.Australis.Windows10",
        "Echelon.Appearance.Australis.Windows8",
        "Echelon.Appearance.DevTools",
        "Echelon.Appearance.XP"
    ]

    static get wasLegacyInstalled() {
        // Checks to see if Echelon 1 was really installed
        let lastLoadedVerPref = "Echelon.parameter.lastLoadedVersion";
        let lastEchelon1Build = 413;

        if (PrefUtils.tryGetIntPref(lastLoadedVerPref) <= lastEchelon1Build) {
            return true;
        } else {
            return false;
        }
    }

    static deleteOldPrefs() {
        for (let i in this.oldEchelonPrefs) {
            if (PrefUtils.tryGetPref(this.oldEchelonPrefs[i])) {
                PrefUtils.tryDeletePref(this.oldEchelonPrefs[i]);
            }
        }
    }

    static migrate() {
        let oldSystemStyles = {
            0: { // Windows 10
                "config": "Echelon.Appearance.Australis.Windows10",
                "type": "bool",
    
                "migrationName": "Echelon.Appearance.systemStyle",
                "migrationValue": "win10"
            },
            1: { // Windows 8
                "config": "Echelon.Appearance.Australis.Windows8",
                "type": "bool",
    
                "migrationName": "Echelon.Appearance.systemStyle",
                "migrationValue": "win8"
            },
            2: { // Windows XP
                "config": "Echelon.Appearance.XP",
                "type": "bool",
    
                "migrationName": "Echelon.Appearance.systemStyle",
                "migrationValue": "winxp"
            },
            3: { // Linux
                "config": "Echelon.Appearance.Linux",
                "type": "bool",
    
                "migrationName": "Echelon.Appearance.systemStyle",
                "migrationValue": "linux"
            }
        }

        for (const config of Object.keys(oldSystemStyles)) {
            if (oldSystemStyles[config].config) {
                if (oldSystemStyles[config].type == "bool") {
                    if (PrefUtils.tryGetBoolPref(oldSystemStyles[config].config) == true) {
                        PrefUtils.trySetStringPref(oldSystemStyles[config].migrationName, oldSystemStyles[config].migrationValue);
                    }
                }
            }
        }
        
        if (PrefUtils.tryGetStringPref(this.oldEchelonPrefs[0])) 
        {
            switch (PrefUtils.tryGetStringPref(this.oldEchelonPrefs[0]))
            {
                case "nightly":
                    PrefUtils.trySetStringPref("Echelon.Option.Branding", "nightly");
                    break;
                case "aurora":
                    PrefUtils.trySetStringPref("Echelon.Option.Branding", "aurora");
                    break;
                default:
                    PrefUtils.trySetStringPref("Echelon.Option.Branding", "firefox");
                    break;
            }
        }

        // Delete old leftovers
        this.deleteOldPrefs();

        PrefUtils.trySetBoolPref("Echelon.parameter.legacyPreviouslyInstalled", true);
    }
}