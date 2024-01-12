# RinFox
Rinfox is a Mozilla Firefox theme that mimicks the look and feel of Internet Explorer 7 and 8.

# Notes
* Tested on Windows Vista w/ Extended Kernel, Windows 7, and Windows 10
* It doesn't work properly with WindowBlinds
* Make sure that your profile hasn't been modified by other themes, if so, delete the modified files _or_ create a new profile

# Instructions

1. Copying files

1.1.	Copy the contents of the Firefox Folder to where the firefox.exe is located;

1.2.	Copy the contents of the Profile Folder to the Root Directory of the profile folder (if you don't know, open firefox and type `about:profiles` in the address bar).

2.	Download and install [Resource Hacker](https://angusj.com/resourcehacker/) (if your OS is NOT Windows Vista/7) - this is to enable glass in navigation pane

2.1.	Run as administrator

2.2.	File > Open > find `firefox.exe` > Manifest > delete/comment these lines:
```xml
<supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/>
<supportedOS Id="{1f676c76-80e1-4239-95bb-83d0f6d0da78}"/>
<supportedOS Id="{4a2f28e3-53b9-4441-ba9c-d69d4a4a6e38}"/>
```
2.3.	Restart your computer.

3. Open Firefox and follow the instructions of the wizard that appears on-screen.

4.	Extensions

4.1	**(Optional)** Drag and drop `suggestedSites.xpi` in the Extensions folder to Firefox

4.3	**(Optional)** Install [FeedBro](https://addons.mozilla.org/en-US/firefox/addon/feedbroreader/) for RSS feeds

5. Go to `about:support` and click on "Clear startup cache"

Enjoy!

# Credits 
* [BruniBanana](https://github.com/angelbruni) - Developer
* All Closed Beta testers