function changeSearchBarPlaceholder() {
	var enginename = document.getElementById("searchbar").currentEngine.name;
	const searchBarPlaceHolder = document.querySelector(".searchbar-textbox");
	
	searchBarPlaceHolder.setAttribute("placeholder", ""+enginename+"");
};