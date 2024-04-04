# Echelon
Installing Echelon is not hard to do, as there are minimal steps for a proper installation. Follow the steps closely and properly and you should have no problem with installing the theme.

## Notes
While these are not requirements, it is very recommended to use the following:
- Microsoft Windows
- Mozilla Firefox 115 ESR
- You need to note that GitHub archives the repository inside a `Echelon-main` folder. You will need to extract the contents of the folder, not the folder itself.

## Patching Firefox (Recommended)

Before installing Echelon, it is recommended to install a patch for Mozilla Firefox to ensure a proper experience with the theme. This patch makes the theme look closer to the real deal, changing certain elements like the Scrollbar.

You can download the patch here, there are pre-compiled versions of `xul.dll` for Firefox ESR in the releases section on the right. [Firefox Native Patch](https://github.com/kawapure/firefox-native-controls/releases)

To install the patch, replace the `xul.dll` file in your Mozilla Firefox program directory with the downloaded `xul.dll` file.

`%ProgramFiles%\Mozilla Firefox`

`C:\Program Files\Mozilla Firefox`

Overwrite pre-existing files if prompted. After copying the files, restart Firefox.

## Prerequisite

Before installing the theme, you must install a patch to load userScripts that Echelon requires, this is required to have a proper experience with Echelon. 

To install the patch, copy all files inside the `Firefox Folder` directory to your Firefox program directory, it is usually located either in:

`%ProgramFiles%\Mozilla Firefox`

`C:\Program Files\Mozilla Firefox`

Overwrite pre-existing files if prompted. After copying the files, restart Firefox.

## Installing Echelon
To install Echelon, you will need to know where your Firefox profile is located.

### Finding your profile with `about:support`
To find your profile, open `about:support` on Firefox.

![about:support](https://github.com/windows-experience/eXPeriencefox/assets/94665268/19edc8f6-6f2c-4087-9302-6adfdb77d117)

Look for `Profile Folder` under Application Basics and press the "Open Folder" button.

## Extracting the theme

To extract the theme, open the ZIP file using a program of your choice. [7-Zip](http://7-zip.org/) will do the job and is the preferred choice. Extract the contents of the Profile Folder to the Root Directory of the profile folder

## After Installation
After extracting the files to Echelon, restart Firefox. Changes will be applied and you should see the First Run Experience after restarting.