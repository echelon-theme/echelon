Services.scriptloader.loadSubScript("chrome://userchrome/content/JS/echelon_utils.uc.js");

/* Fill current values */
for (const option of document.querySelectorAll(".option"))
{   
    switch (option.dataset.type)
    {
        case "bool":
            option.checked = tryGetBoolPref(option.dataset.option);
            break;
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
document.getElementById("custom-name").placeholder = getDefaultFirefoxButtonText();

document.documentElement.addEventListener('keypress', function(e) {
	if (e.key == "Escape") {
		window.close();
	}
});