/**
 * @author Johann Laur
 * @description Runs through yt-search results to filter channels that can not be played ;)
 * @version 1.0
 * @returns {string} stream link to yt for ytdl
 * @exports filterResults function
 * @module filter_results.js imported by index, run in search/play function
 */

exports.filterResults = results => {
	let result;
	// prevent channels etc. that will lead to a crash
	if (results[0].kind !== "youtube#video") {
		for (var i = 0; i < results.length; i++) {
			if (results[i].kind === "youtube#video") {
				result = results[i];
				return result;
			}
		}
	} else return results[0];
};
