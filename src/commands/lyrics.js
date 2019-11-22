const { isPlaying } = require("../functions/check_for_vc"),
	request = require("request");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const msgGuildID = message.guild.id;
	if (!isPlaying(message) && !args[0])
		return message.channel.send(
			new Embed().setColor(guildTheme).setDescription(guildStrings.noPlaying)
		);
	const searchTitle = isPlaying(message) ? client.queue[msgGuildID][0].title : args.join(" ");
	await message.channel.startTyping();
	// define embed for lyrics
	const lyricsMsg = new Embed().setColor(guildTheme),
		// lyrics api request options
		options = {
			url: `https://api.ksoft.si/lyrics/search?q=${searchTitle.replace(
				/&[^\s]+/g,
				""
			)}&text-only=true&limit=1`,
			headers: {
				Authorization: `Bearer ${client.config.ksoft}`
			}
		};

	async function callback(error, response, body) {
		lyricsMsg.setDescription(guildStrings.lyricsErr);
		if (error || !response.statusCode === 200 || body.startsWith("<!DOCTYPE html>")) {
			client.log("Error", "Lyrics API", error);
			message.channel.stopTyping();
			message.channel.send(lyricsMsg);
		} else {
			const resp = JSON.parse(body);
			if (!resp.data[0].lyrics) {
				message.channel.stopTyping();
				message.channel.send(lyricsMsg);
			}
			let content = resp.data[0].lyrics;
			// weird text cutting to get everything into one embed message
			await lyricsMsg
				.setTitle(`${resp.data[0].name} - ${resp.data[0].artist}`)
				.setFooter(`See lyrics on dashboard: musicbot.ga/${msgGuildID}/lyrics`)
				.setDescription(`${content.slice(0, 800 + content.slice(799).indexOf("\n"))}`);
			content = content.slice(800 + content.slice(799).indexOf("\n"));
			while (content.length > 1024) {
				const chars = content.slice(0, 800 + content.slice(799).indexOf("\n"));
				lyricsMsg.addField("\u200b", `${chars}`);
				content = content.slice(800 + content.slice(799).indexOf("\n"));
			}
			if ((content.length != 0 && content.length < 1024) || content.length == 1024) {
				lyricsMsg.addField("\u200b", `${content}`);
			}
			// create reaction collector to make deleting of message possible
			const filter = (reaction, user) =>
				reaction.emoji.name === "❌" && user.id === message.author.id;
			message.channel.send(lyricsMsg).then(m => {
				message.channel.stopTyping();
				m.react("❌");
				const c = m.createReactionCollector(filter, { time: 300000 });
				c.on("collect", () => {
					m.delete();
					message.delete();
					c.stop();
				});
			});
		}
	}

	request(options, callback);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: false,
	enabled: true,
	alias: ["lyr", "songtext"]
};
