const playEmitter = require("./emitter"),
	ytdl = require("ytdl-core"),
	dlCore = require("ytdl-core-discord"),
	Discord = require("discord.js"),
	{ connectVC } = require("./functions/connect"),
	{ leaveEmptyChannel } = require("./functions/connect"),
	messageStrings = {
		de: require("../config/languages/de.json"),
		en: require("../config/languages/en.json"),
		es: require("../config/languages/es.json")
	},
	{ filterResults } = require("./functions/filter_results"),
	search = require("youtube-search");

module.exports = client => {
	/**
	 * @description Play function that gets the stream and plays it into a voicechannel
	 * @param {ReadableStream, String} song stream from queue (instead of stream link)
	 * @param {string} link yt stream link (used to get additional infos)
	 * @param {Discord.Message} message by event emitter, message that fired event
	 */
	async function play(song, link, message) {
		// define general guild specific constants
		const msgGuildID = message.guild.id,
			lang = client.settings.get(msgGuildID, "lang"),
			guildStrings = messageStrings[lang],
			guildTheme = client.settings.has(msgGuildID, "color")
				? client.settings.get(msgGuildID, "color")
				: client.config.colors.blue,
			opts = {
				maxResults: 5,
				key: client.config.yt.key
			};

		let playing; // store id of download-message, for rich embed (np message)
		message.guild.lastToReplace = undefined;
		if (!message.guild.voiceConnection) connectVC(client, message, guildStrings, guildTheme);
		const vc = message.guild.voiceConnection;
		client.log("Player", "", `Connected to #${vc.channel.name} (${vc.channel.id})`);
		if (!client.queue[msgGuildID]) client.queue[msgGuildID] = [];
		// only done if loop is not activated to prevent spamming
		if (typeof song == "string") {
			const download = new Discord.RichEmbed()
				.setColor(guildTheme)
				.setDescription(guildStrings.download);
			await message.channel.send(download).then(m => (message.guild.lastToReplace = m.id));
		}

		const dispatcher =
			typeof song != "string" ? vc.playStream(song) : vc.playOpusStream(await dlCore(song));

		dispatcher.on("start", () => {
			client.log(
				"Player",
				"",
				`Started Playing ${client.queue[msgGuildID][0].title} (${msgGuildID})`
			);
			// set dispatcher volume to saved value if it exists
			if (message.guild.volume) dispatcher.setVolume(message.guild.volume);
			// set stream bitrate depending on channel bitrate
			dispatcher.setBitrate("auto");

			if (!client.queue[msgGuildID][0].stream)
				client.queue[msgGuildID][0].stream = ytdl(client.queue[msgGuildID][0].link, {
					filter: "audioonly",
					highWaterMark: 1 << 25
				});

			// set topic of music channel to current song
			// (if that channel is defined & neccescary permissions are granted)
			if (client.settings.has(msgGuildID, "mc")) {
				if (
					message.guild.me.hasPermission("MANAGE_CHANNELS") ||
					message.channel.memberPermissions(message.guild.me).has("MANAGE_CHANNELS")
				) {
					const channel = client.channels.get(client.settings.get(msgGuildID, "mc"));
					channel.setTopic(
						`:arrow_forward: **${guildStrings.np}**: ${client.queue[msgGuildID][0].title}`
					);
				}
			}
			ytdl.getInfo(link, (err, info) => {
				if (err) throw err;
				// only without looping enabled
				//if (!client.musicConfig.loop[msgGuildID]) {
				var secsRest = info.length_seconds % 60,
					minutes = (info.length_seconds - secsRest) / 60;
				if (secsRest < 10) secsRest = `0${secsRest}`;
				playing = new Discord.RichEmbed().setTitle(`**${guildStrings.np}**`).setColor(guildTheme);
				if (client.queue[msgGuildID][0].spotify)
					playing.setThumbnail(client.queue[msgGuildID][0].spotify);
				else playing.setThumbnail(info.player_response.videoDetails.thumbnail.thumbnails[0].url);
				if (info.media.song && info.media.artist) {
					playing.addField(guildStrings.songtitle, `[${info.media.song}](${info.video_url})`);
					playing.addField(guildStrings.artist, info.media.artist);
				} else {
					playing.addField(guildStrings.songtitle, `[${info.title}](${info.video_url})`);
					playing.addField("Video Uploader", info.author.name);
				}
				playing.addField(guildStrings.length, `\`${minutes}:${secsRest}min\``, true);
				playing.addField(guildStrings.req, `<@!${client.queue[msgGuildID][0].req}>`, true);
				if (message.guild.lastToReplace !== undefined) {
					message.channel.messages
						.get(message.guild.lastToReplace)
						.edit(playing)
						.then(m => {
							message.guild.lastToReplace = m.id;
						});
					// lastToReplace = undefined
				} else message.channel.send(playing).then(m => (message.guild.lastToReplace = m.id));
				//}
			});
		});
		dispatcher.on("error", err => client.log("Player", "Dispatcher Error", err));

		//event volumeChange to save changed volume in playFile (so next tracks will keep that volume)
		dispatcher.on("volumeChange", (old, newVolume) => {
			message.guild.volume = newVolume;
			client.log("Player", "", `${msgGuildID}: Saved updated volume (${newVolume})`);
		});
		dispatcher.on("debug", info => {
			client.log("Player", "Dispatcher Debug", info);
		});
		dispatcher.on("end", async reason => {
			// first check if played-array exists in object
			if (!message.guild.played) message.guild.played = [];
			// leave voicechannel and stop if the channel is empty except from bot
			if (message.guild.voiceConnection.channel.members.map(m => m.id).length < 2)
				return leaveEmptyChannel();

			// continue looping through queue if loop all is activated
			if (client.musicConfig.loopAll[msgGuildID]) {
				const nLink = client.queue[msgGuildID][client.musicConfig.loopIndex[msgGuildID]].link;

				if (client.musicConfig.loopIndex[msgGuildID] + 1 == client.queue[msgGuildID].length)
					client.musicConfig.loopIndex[msgGuildID] = 0; // set loopIndex back to 0 if the complete queue was played to start again
				if (client.queue[msgGuildID][client.musicConfig.loopIndex[msgGuildID]].stream)
					play(
						client.queue[msgGuildID][client.musicConfig.loopIndex[msgGuildID]].stream,
						nLink,
						message
					);
				else play(nLink, nLink, message);
				message.guild.played.unshift(
					client.queue[msgGuildID][client.musicConfig.loopIndex[msgGuildID]]
				);
				client.musicConfig.loopIndex[msgGuildID]++;
				return;
			}
			if (client.musicConfig.loop[msgGuildID]) {
				const nowAndNext = client.queue[msgGuildID][0];
				if (nowAndNext.stream) play(nowAndNext.stream, nowAndNext.link, message);
				else play(nowAndNext.link, nowAndNext.link, message);
				if (message.guild.played[0] != nowAndNext) message.guild.played.unshift(nowAndNext);
				return;
			}

			await message.guild.played.unshift(client.queue[msgGuildID].shift());
			// create last played message if lastNPMessage and last played song exists
			if (message.guild.lastToReplace !== undefined && message.guild.played[0]) {
				message.channel.fetchMessage(message.guild.lastToReplace).then(async msg => {
					const npConf = client.settings.has(msgGuildID, "npmsg")
						? client.settings.get(msgGuildID, "npmsg")
						: "default";
					if (npConf == "stay") return;
					if (npConf == "dl") return msg.delete();
					const playedSong = new Discord.RichEmbed()
						.setColor(guildTheme)
						.setTitle(guildStrings.played)
						.setDescription(`${message.guild.played[0].title}`)
						.setTimestamp();
					msg.edit(playedSong);
				});
			}
			client.log("Player", "", `Song ended on ${message.guild.name} | Reason: ${reason}`);
			if (client.settings.has(msgGuildID, "mc")) {
				const mc = client.settings.get(msgGuildID, "mc"),
					channel = client.channels.get(mc);
				channel.setTopic("");
			}
			// continue if the queue is not empty
			if (client.queue[msgGuildID].length !== 0) {
				const nLink = client.queue[msgGuildID][0].link;
				if (client.queue[msgGuildID][0].stream)
					play(client.queue[msgGuildID][0].stream, nLink, message);
				else play(nLink, nLink, message);
			} else vc.disconnect();

			/*
			// download songs if there is no stream
			if (client.queue[msgGuildID][2])
				if (!client.queue[msgGuildID][2].stream) {
					client.log("Player", "", "Downloading stream for queue[2] on " + message.guild.name);
					const link = client.queue[msgGuildID][2].link;
					client.queue[msgGuildID][2]["stream"] = ytdl(link, {
						filter: "audioonly",
						highWaterMark: 1 << 25
					});
				}
				*/

			// autoplay
			if (client.musicConfig.autop[msgGuildID] && client.queue[msgGuildID].length < 3) {
				// get related videos from last song in queue
				ytdl.getInfo(
					client.queue[msgGuildID][client.queue[msgGuildID].length - 1].link,
					(err, info) => {
						if (err) client.log("Error", "ytdl", err);
						const rVid = info.related_videos[1];
						search(rVid, opts, (err, results) => {
							if (err) client.log("Error", "Youtube search", err);
							const result = filterResults(results);
							client.queue[msgGuildID].push({
								link: result.link,
								title: result.title,
								req: client.user.id,
								reqTag: message.author.tag,
								stream: ytdl(result.link, { filter: "audioonly", highWaterMark: 1 << 25 })
							});
						});
					}
				);
			}
		});
		vc.on("debug", info => client.log("Player", "Debug", `${msgGuildID}: ${info}`));
		vc.on("reconnecting", () =>
			client.log("Player", "Debug", `${msgGuildID} Reconnecting (${vc.channel.name})`)
		);
		vc.on("warn", warning => client.log("Player", "Debug", `${msgGuildID}: ${warning}`));
	}

	playEmitter.on("startPlaying", (message, args, song) => play(song, song, message));
};
