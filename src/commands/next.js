const search = require("youtube-search"),
	ytdl = require("ytdl-core"),
	{ filterResults } = require("../functions/filter_results"),
	{ isPlaying } = require("../functions/check_for_vc");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const joinedArgs = args.join(" ");
	if (args[0]) {
		search(joinedArgs, { maxResults: 5, key: client.config.yt.key }, async (err, results) => {
			if (err) {
				const errem = new Embed()
					.setColor(client.config.colors.red)
					.setDescription(guildStrings.searchErr);
				client.log("Error", "youtube-search", err);
				return message.channel.send(errem);
			}
			const result = await filterResults(results);
			await client.queue[message.guild.id].splice(1, 0, {
				title: result.title.replace(/&#39;/g, "'"),
				link: result.link,
				stream: ytdl(result.link, { filter: "audioonly", highWaterMark: 1 << 25 }),
				req: message.author.id,
				reqTag: message.author.tag
			});
			const added = new Embed()
				.setColor(guildTheme)
				.setDescription(`${result.title.replace(/&#39;/g, "'")}`)
				.setTitle(guildStrings.addedNext);
			message.channel.send(added);
		});
	} else {
		const noPlaying = new Embed().setColor(guildTheme).setDescription(guildStrings.noPlaying);
		if (!isPlaying(message)) return message.channel.send(noPlaying);
		const skipped = new Embed().setColor(guildTheme).setDescription(guildStrings.skipped);
		await message.channel.send(skipped);
		message.guild.voiceConnection.dispatcher.end();
	}
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: ["skip"]
};
