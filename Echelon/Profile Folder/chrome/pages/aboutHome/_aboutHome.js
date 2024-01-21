function percentChance(chance)
{
    return (Math.random() * 100) <= chance;
}

function snippetRandomizer() 
{
	let selector = ".snippet1";
	if (percentChance(75))
	{
		selector = ".snippet2";
	}

	document.querySelector(selector).hidden = true;
}

snippetRandomizer();