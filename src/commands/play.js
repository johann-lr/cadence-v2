const emitter = require("../emitter"),
	{ isPlaying } = require("../functions/check_for_vc"),
	spotify = require("spotify-url-info"),
	search = require("youtube-search"),
	{ filterResults } = require("../functions/filter_results"),
	ytdl = require("ytdl-core"),
	ytpl = require("ytpl");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	// youtube-search options
	const opts = {
			maxResults: 5,
			key: client.config.yt.key
		},
		msgGuildID = message.guild.id;

	//if (!message.guild.me.hasPermission("READ_MESSAGE_HISTORY"))
	//return message.channel.send(messages.readHistory);
	if (!client.queue[msgGuildID]) client.queue[msgGuildID] = [];
	if (
		!args[0] &&
		message.guild.voiceConnection &&
		message.guild.voiceConnection.dispatcher &&
		message.guild.voiceConnection.dispatcher.paused
	)
		return message.guild.voiceConnection.dispatcher.resume();

	// useful "error" rich embeds
	const noVC = new Embed().setColor(guildTheme).setDescription(guildStrings.noVC),
		serr = new Embed().setColor(client.config.colors.red).setDescription(guildStrings.searchErr),
		noArgs = new Embed().setColor(client.config.colors.red).setDescription(guildStrings.noArgs);

	// return if sender is not in a voicechannel
	if (!message.member.voiceChannel) return message.channel.send(noVC);
	if (!args[0] && client.queue[msgGuildID][0] && !isPlaying(message)) {
		return emitter.emit("startPlaying", message, args, client.queue[msgGuildID][0].link);
	}
	if (!args[0]) return message.channel.send(noArgs);
	const joined = args.join(" ");
	// check for spotify links
	// TODO: do not check for boolean with ===
	if (args[0].includes("spotify") === true) {
		if (args[0].includes("playlist") === true || args[0].includes("album") === true) {
			spotify.getData(joined).then(data => {
				for (var i = 0; i < data.tracks.items.length; i++) {
					const link =
						args[0].includes("playlist") == true
							? data.tracks.items[i].track.external_urls.spotify
							: data.tracks.items[i].external_urls.spotify;
					spotify.getPreview(link).then(track => {
						search(`${track.title} ${track.artist}`, opts, async (err, results) => {
							const result = filterResults(results);
							if (!err && data.tracks.items.length < 4)
								await client.queue[msgGuildID].push({
									link: result.link,
									stream: ytdl(result.link, { filter: "audioonly", highWaterMark: 1 << 25 }),
									title: result.title.replace(/&#39;/g, "'"),
									req: message.author.id,
									reqTag: message.author.tag,
									spotify: data.image
								});
							else if (!err)
								await client.queue[msgGuildID].push({
									link: result.link,
									title: result.title.replace(/&#39;/g, "'"),
									req: message.author.id,
									reqTag: message.author.tag,
									spotify: data.image
								});
						});
					});
				}

				const ownerArtist =
						args[0].includes("playlist") == true ? data.owner.display_name : data.artists[0].name,
					date =
						args[0].includes("playlist") == true
							? Date(data["last-checked-timestamp"])
							: data.release_date,
					playlist = new Embed()
						.setColor(guildTheme)
						.setDescription(
							client.languageReplace(
								guildStrings.playlist,
								data.name,
								ownerArtist,
								data.tracks.total,
								date
							)
						)
						.setThumbnail(data.images[0].url)
						.setFooter(guildStrings.plWarn)
						.setTimestamp();
				message.channel.send(playlist);
			});
		} else {
			spotify.getPreview(joined).then(data => {
				search(`${data.title}  ${data.artist}`, opts, (err, results) => {
					if (err) {
						client.log("Error", "Youtube Search", err);
						return message.channel.send(serr);
					}
					const result = filterResults(results);
					client.queue[msgGuildID].push({
						link: result.link,
						stream: ytdl(result.link, { filter: "audioonly", highWaterMark: 1 << 25 }),
						title: result.title.replace(/&#39;/g, "'"),
						req: message.author.id,
						reqTag: message.author.tag,
						spotify: data.image
					});
					if (!isPlaying(message)) {
						emitter.emit("startPlaying", message, args, client.queue[msgGuildID][0].link);
					} else {
						const add = new Embed()
							.setColor(guildTheme)
							.setDescription(`:musical_note: **${result.title}** ${guildStrings.qAdd}`);
						message.channel.send(add);
					}
				});
			});
		}
	} else if (args[0].includes("playlist?")) {
		ytpl(args[0], (err, result) => {
			if (err) client.log("Error", "Youtube-Playlist", err);
			for (var i = 0; i < result.items.length; i++) {
				const link = result.items[i].url_simple,
					title = result.items[i].title;
				if (result.items.length < 4)
					client.queue[msgGuildID].push({
						link,
						stream: ytdl(link, { filter: "audioonly", highWaterMark: 1 << 25 }),
						title: title.replace(/&#39;/g, "'"),
						req: message.author.id,
						reqTag: message.author.tag
					});
				else
					client.queue[msgGuildID].push({
						link,
						title: title.replace(/&#39;/g, "'"),
						req: message.author.id,
						reqTag: message.author.tag
					});
				if (i === result.items.length - 1)
					//play(client.queue[msgGuildID][0].link, client.queue[msgGuildID][0].link);
					emitter.emit("startPlaying", message, args, client.queue[msgGuildID][0].link);
			}
			const pAdd = new Embed()
				.setColor(guildTheme)
				.setDescription(
					client.languageReplace(
						guildStrings.playlist,
						result.title,
						result.author.name,
						result.total_items,
						result.last_updated
					)
				)
				.setTimestamp()
				.setFooter(guildStrings.plWarn)
				.setThumbnail(result.items[0].thumbnail);
			message.channel.send(pAdd);
		});
	} else {
		search(joined, opts, async (err, results) => {
			if (err) {
				client.log("Error", "Youtube-Search", err);
				return message.channel.send(serr);
			}
			const result = await filterResults(results);
			client.queue[msgGuildID].push({
				title: result.title.replace(/&#39;/g, "'"),
				link: result.link,
				stream: ytdl(result.link, { filter: "audioonly", highWaterMark: 1 << 25 }),
				req: message.author.id,
				reqTag: message.author.tag
			});
			if (!isPlaying(message)) {
				emitter.emit("startPlaying", message, args, client.queue[msgGuildID][0].link);
			} else {
				const qAdd = new Embed()
					.setColor(guildTheme)
					.setDescription(`:musical_note: **${result.title}** ${guildStrings.qAdd}`);
				message.channel.send(qAdd);
			}
		});
	}
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};
