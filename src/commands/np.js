const { isPlaying } = require("../functions/check_for_vc"),
	{ getInfo } = require("ytdl-core");

/**
 * @param {Number} streamt
 * @returns {String} progress bar for embed
 */
function getProgressBar(streamt) {
	if (streamt < 10) return "🔵▬▬▬▬▬▬▬▬▬";
	if (streamt >= 10 && streamt < 20) return "▬🔵▬▬▬▬▬▬▬▬";
	if (streamt >= 20 && streamt < 30) return "▬▬🔵▬▬▬▬▬▬▬";
	if (streamt >= 30 && streamt < 40) return "▬▬▬🔵▬▬▬▬▬▬";
	if (streamt >= 40 && streamt < 50) return "▬▬▬▬🔵▬▬▬▬▬";
	if (streamt >= 50 && streamt < 60) return "▬▬▬▬▬🔵▬▬▬▬";
	if (streamt >= 60 && streamt < 70) return "▬▬▬▬▬▬🔵▬▬▬";
	if (streamt >= 70 && streamt < 80) return "▬▬▬▬▬▬▬🔵▬▬";
	if (streamt >= 80 && streamt < 90) return "▬▬▬▬▬▬▬▬🔵▬";
	if (streamt >= 90) return "▬▬▬▬▬▬▬▬▬🔵";
}

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	/**
	 * @description Edit guild configuration for last np message
	 * @param {String} guildID discord guild id
	 * @param {String} setting dl, stay, default
	 * @param {Discord.Message} message the sent message to react on
	 */
	function writeNPMSGConfig(guildID, setting, message) {
		client.settings.set(guildID, setting, "npmsg");
		message.react("✅");
	}

	const msgGuildID = message.guild.id;
	if (args[0]) {
		if (args[0] === "delete" || args[0] === "dl") {
			writeNPMSGConfig(msgGuildID, "dl", message);
		} else if (args[0] === "replace" || args[0] === "default") {
			writeNPMSGConfig(msgGuildID, "default", message);
		} else if (args[0] === "stay") {
			writeNPMSGConfig(msgGuildID, "stay", message);
		}
		return;
	}
	const noPlaying = new Embed().setColor(guildTheme).setDescription(guildStrings.noPlaying);
	if (!isPlaying(message)) return message.channel.send(noPlaying);
	message.channel.startTyping();
	let np;
	getInfo(client.queue[msgGuildID][0].link, async (err, info) => {
		if (err) client.log("Error", "ytdl#getInfo", err);
		const secsRest = info.length_seconds % 60,
			minutes = (info.length_seconds - secsRest) / 60,
			dispatcherTime = message.guild.voiceConnection.dispatcher.time / 1000,
			dispatcherSecsRest = dispatcherTime % 60,
			dispatcherMins = (dispatcherTime - dispatcherSecsRest) / 60;
		np = new Embed().setTitle(`**${guildStrings.np}**`).setColor(guildTheme);
		if (client.queue[msgGuildID][0].spotify) np.setThumbnail(client.queue[msgGuildID][0].spotify);
		else np.setThumbnail(info.player_response.videoDetails.thumbnail.thumbnails[0].url);

		if (info.media.song && info.media.artist) {
			np.addField(guildStrings.songtitle, `[${info.media.song}](${info.video_url})`, true);
			np.addField(guildStrings.artist, info.media.artist, true);
		} else {
			np.addField(guildStrings.songtitle, `[${info.title}](${info.video_url})`, true);
			np.addField("Video Uploader", info.author.name, true);
		}
		np.addField(
			guildStrings.general.volume,
			`${(message.guild.voiceConnection.dispatcher.volume * 100).toFixed(0)}%`,
			true
		);
		np.addField(guildStrings.req, `<@!${client.queue[msgGuildID][0].req}>`, true);

		// percent of song played
		const streamP = Math.round(
				(message.guild.voiceConnection.dispatcher.time / 1000 / info.length_seconds) * 100
			),
			progress = await getProgressBar(streamP),
			playedMins = `${dispatcherMins}:${Math.round(dispatcherSecsRest)} / ${minutes}:${secsRest}`;
		np.addField(guildStrings.length, `${progress} (${playedMins})`, true);
		message.channel.send(np).then(m => {
			message.channel.fetchMessage(message.guild.lastToReplace).then(m => m.delete());
			message.guild.lastToReplace = m.id;
		});
		message.channel.stopTyping();
	});
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: ["nowplaying", "playing", "song"]
};
