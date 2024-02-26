// ==UserScript==
// @name            Echelon :: Bookmark Dialog
// @description     Makes "Add Bookmark", etc. dialogs into separate windows again
// @author          aubymori
// @include         main
// ==/UserScript==

{
    let showBookmarkDialog_orig = PlacesUIUtils.showBookmarkDialog;
    async function showBookmarkDialog_hook(aInfo, aParentWindow = null)
    {
        let dialogBox = null;
        if (aParentWindow.gDialogBox)
        {
            dialogBox = aParentWindow.gDialogBox;
            aParentWindow.gDialogBox = null;
        }
        let result = (showBookmarkDialog_orig.bind(this))(aInfo, aParentWindow);
        if (dialogBox)
        {
            aParentWindow.gDialogBox = dialogBox;
        }
        return result;
    }
    PlacesUIUtils.showBookmarkDialog = showBookmarkDialog_hook.bind(PlacesUIUtils);
}