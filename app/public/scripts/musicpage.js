/**
 * @author Johann Laur
 * @extends music.ejs
 */

function postURL(url) {
	$.post(url);
}

function tableCreator(queue) {
	let tableArr = [];
	// pushes html code that defines a new table row into tableArr for each table row
	for (let i = 1; i < queue.length; i++) {
		tableArr.push(
			`<tr><td><a class="linki" href="${queue[i].link}">${queue[i].title}</a></td><td>${
				queue[i].reqTag
			}</td><td><form class="removeFromQ" id="removeFromQ" method="POST" action="/music/${guild}/remove"><button class="controlButton" type="submit" value="${i}" name="position"><i style="color:#df2626;" class="far fa-trash-alt"></i></button></form></td></tr>`
		);
	}
	return tableArr.join("");
}

/**
 * @description Set default values to some elements
 */
function setDefault() {
	$("#pause").css({ display: "none" });
	$("#volume-slider").attr("value", 100);
	$("#volume-label").html("Volume (--)");
	$("#song-link")
		.html("No playback")
		.attr("href", "");
	$("#time-label").css({ display: "none" });
	$("#lyrics-button").css({ display: "none" });
	$("#progr").css({ display: "none" });
}

/**
 * @description set display style of buttons: "", "none"
 * @param {String} resumePlayDisplay
 * @param {String} pause
 */
function setResumePP(resumePlayDisplay, pause) {
	$("#resumePlay").css({ display: resumePlayDisplay });
	$("#pause").css({ display: pause });
}

/**
 * @description Update page elements with data from api
 * @param {Object} apiData /api/<guild_id>
 */
function updateContent(apiData) {
	if (!apiData.existingConnection) {
		$("#connected-channel").html("No connections");
		setDefault();
	} else {
		if (apiData.existingDispatcher) {
			if (apiData.paused) setResumePP("", "none");
			else setResumePP("none", "");
			$("#song-link")
				.html(apiData.queue[0].title)
				.attr("href", apiData.queue[0].link);
			$("#progr").css({ display: "" });
			$("#progr").attr("max", `${apiData.length}`);
			$("#progr").attr("value", `${Math.floor(apiData.stream_time / 1000)}`);
			let secsTime = (apiData.stream_time / 1000) % 60;
			const minsT = (apiData.stream_time / 1000 - secsTime) / 60;
			const secsLength = apiData.length % 60;
			const minsL = (apiData.length - secsLength) / 60;
			if (secsTime < 10) secsTime = `0${secsTime}`;
			$("#time-label").html(`${minsT}:${Math.floor(secsTime)} / ${minsL}:${secsLength}`);
			$("#time-label").css({ display: "" });
			$("#volume-label").html(`Lautstärke (${apiData.volume * 100}%)`);
			$("#volume-slider").attr("value", apiData.volume * 100);
			// add table updates
			$("#queue-body").html(tableCreator(apiData.queue));
		} else {
			$("#connected-channel").html(`Connected to #${apiData.channel}`);
			$("#volume-slider").attr("value", 100);
			$("#progr").css({ display: "none" });
			$("#time-label").css({ display: "none" });
			$("#volume-label").html("Volume (--)");
			$("#song-link")
				.html("No playback")
				.attr("href", "");
		}
	}
}

$(document).ready(function() {
	// update content after page did load (eg ready)
	$.getJSON(`/api/${guild}`, function(data) {
		updateContent(data);
	});

	// refresh content every second with the api data
	setInterval(() => {
		$.getJSON(`/api/${guild}`, function(data) {
			updateContent(data);
		});
	}, 1000);

	$("#pause").submit(function(event) {
		event.preventDefault();
		postURL(`/music/${guild}/pause`);
	});

	$("#skip").submit(function(event) {
		event.preventDefault();
		postURL(`/music/${guild}/skip`);
	});

	$("#stop").submit(function(event) {
		event.preventDefault();
		postURL(`/music/${guild}/stop`);
	});

	$("#shuffle").submit(function(event) {
		event.preventDefault();
		postURL(`/music/${guild}/shuffle`);
	});

	$("#resumePlay").submit(function(event) {
		event.preventDefault();
		postURL(`/music/${guild}/resumePlay`);
	});

	// triggered if slider updates
	$("#volume-slider").change(function() {
		var value = $(this).val();
		$.ajax({
			url: `/music/${guild}/vl`,
			type: "post",
			data: { vl: value }
		});
	});

	$("#add-form").submit(function(event) {
		event.preventDefault();
		var data = $(this).serialize();
		$.ajax({
			url: `/music/${guild}/add`,
			type: "post",
			data
		});
		$(this)
			.find("input")
			.val("");
	});
});
