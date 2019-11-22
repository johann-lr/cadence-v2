/**
 * @version 1.0
 * @description Refreshes memory and uptime stats on bot page every second
 * @author Johann Laur
 * @extends bot.ejs
 * @requires jquery
 */

$(document).ready(function() {
	setInterval(() => {
		// call api every second and edit hmtl
		$.getJSON("/api", function(data) {
			$("#memory").html(data.processMemoryMB + "MB");
			$("#uptime").html(data.uptime);
		});
	}, 1000);
});
