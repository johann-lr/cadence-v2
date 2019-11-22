const search = require("youtube-search"),
	{ isPlaying } = require("../functions/check_for_vc"),
	emitter = require("../emitter");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const searchQ = args.join(" "),
		msgGuildID = message.guild.id;
	if (!client.queue[msgGuildID]) client.queue[msgGuildID] = [];
	search(searchQ, { maxResults: 6, key: client.config.yt.key }, async (err, results) => {
		if (err) client.log("Error", "youtube-search", err);
		let titles = [];
		for (let i = 0; i < 5; i++) titles.push(`${i + 1}. ${results[i].title.replace(/&#39;/g, "'")}`);
		const search = new Embed()
			.setColor(guildTheme)
			.setTitle(guildStrings.general.results)
			.setDescription(`\`\`\`md\n${titles.join("\n")}\`\`\``);
		await message.channel.send(search);
		const filter = m => m.author.id == message.author.id,
			c = message.channel.createMessageCollector(filter, { time: 20000 });
		c.on("collect", async e => {
			if (isNaN(e.content)) return c.stop();
			await client.queue[msgGuildID].push({
				title: results[Number(e.content) - 1].title.replace(/&#39;/g, "'"),
				link: results[Number(e.content) - 1].link,
				req: message.author.id,
				reqTag: message.author.tag
			});
			c.stop();
			if (!isPlaying(message)) {
				if (client.queue[msgGuildID][0].stream)
					emitter.emit("startPlaying", message, args, client.queue[msgGuildID][0].stream);
				else emitter.emit("startPlaying", message, args, client.queue[msgGuildID][0].link);
			} else e.react("✅");
		});
	});
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: true,
	alias: ["s"]
};
