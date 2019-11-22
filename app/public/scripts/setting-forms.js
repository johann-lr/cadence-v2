/**
 * @description Handler of submitted forms using jquery
 * @extends settings.ejs
 */

/**
 * @description make banner visible and hide it again after 5secs
 */
function showSuccBanner() {
	$("div#banner").css({
		visibility: "visible"
	});
	setTimeout(() => {
		$("div#banner").css({ visibility: "hidden" });
	}, 5000);
}

$(document).ready(function() {
	$("#prefix-form").submit(function(event) {
		event.preventDefault();

		var form = $(this);
		var data = form.serialize();
		var url = `/guilds/${guildID}/settings/prefix`;

		$.ajax({
			url: url,
			type: "post",
			data: data
		});
		showSuccBanner();
	});

	$(document).on("click", "#lang-button", function(event) {
		event.preventDefault();

		var url = `/guilds/${guildID}/settings/lang`;

		$.ajax({
			url: url,
			type: "post",
			data: { lang: $(this).val() }
		});

		let charsl = $(this).val() === "de" ? "en" : "de";
		$("#lang-button").html(charsl);

		showSuccBanner();
	});

	$("#color-form").submit(function(event) {
		event.preventDefault();

		var url = `/guilds/${guildID}/settings/theme`;
		var data = $(this).serialize();

		$.ajax({
			url: url,
			type: "post",
			data: data
		});

		showSuccBanner();
	});

	$("#np").change(function(e) {
		e.preventDefault();
		var data = {
			value: $(this)
				.children("option:selected")
				.val()
		};
		console.log(data);
		$.ajax({
			url: `/guilds/${guildID}/settings/npmsg`,
			type: "post",
			data
		});
		showSuccBanner();
	});

	$("#empty").change(function(e) {
		e.preventDefault();
		var data = {
			value: $(this)
				.children("option:selected")
				.val()
		};
		showSuccBanner();
		$.ajax({
			url: `/guilds/${guildID}/settings/emptyc`,
			type: "post",
			data
		});
	});
});
