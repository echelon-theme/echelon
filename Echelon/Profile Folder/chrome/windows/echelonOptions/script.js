/* Fill current values */
for (const option of document.querySelectorAll(".option"))
{   
    switch (option.dataset.type)
    {
        case "bool":
        {
            let value = false;
            try
            {
                value = Services.prefs.getBoolPref(option.dataset.option);
            } catch (e) {}
            option.checked = value;
            break;
        }
        case "enum":
        {
            let value = 0;
            try
            {
                value = Services.prefs.getIntPref(option.dataset.option);
            } catch (e) {}
            option.value = value;
            break;
        }
        case "string":
        {
            let value = "";
            try
            {
                value = Services.prefs.getStringPref(option.dataset.option);
            } catch (e) {}
            option.value = value;
            break;
        }
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
            {
                try
                {
                    Services.prefs.setBoolPref(option.dataset.option, option.checked);
                } catch (e) {}
                break;
            }
            case "enum":
            {
                try
                {
                    Services.prefs.setIntPref(option.dataset.option, Number(option.value));
                } catch (e) {}
                break;
            }
            case "string":
            {
                try
                {
                    Services.prefs.setStringPref(option.dataset.option, option.value);
                } catch (e) {}
                break;
            }
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
}

for (const tab of document.querySelectorAll(".tab"))
{
    tab.addEventListener("click", switchTab);
}

document.getElementById("custom-name").placeholder = Services.appinfo.name;