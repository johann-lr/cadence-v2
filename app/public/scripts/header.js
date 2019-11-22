/**
 * Saves some data in the browsers localstorage
 * to update the pill next to changelog link
 */

$(document).ready(function() {
	$.getJSON("/api", function(data) {
		const version = data.version;
		if (!localStorage.getItem("lastV")) localStorage.setItem("lastV", version);
		else localStorage.setItem("cl", false);
	});
	$("#changelog").click(function() {
		localStorage.setItem("cl", true);
		console.log(localStorage);
	});
	if (localStorage.getItem("cl")) $("#pill").css({ display: "none" });
});
