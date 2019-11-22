/**
 * @author Johann Laur
 * @description js for feedback formular on homepage
 * @version 1.0
 * @extends index.ejs
 * @requires jquery
 */

$(document).ready(function() {
	$("#feedback-form").submit(function(event) {
		event.preventDefault();
		var data = $(this).serialize();

		// post serialized form data to backend
		$.ajax({
			url: "/feedback",
			type: "post",
			data: data
		});

		// show success-banner
		$("div#banner").css({
			visibility: "visible"
		});
		// remove it 5secs later
		setTimeout(() => {
			$("div#banner").css({ visibility: "hidden" });
		}, 5000);

		// clear value of input fields after posting data
		$("#feedback-form")
			.find("input[type=text], textarea, input[type=email]")
			.val("");
	});
});
