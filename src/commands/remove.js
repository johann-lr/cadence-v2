exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const noArgs = new Embed().setColor(guildTheme).setDescription(guildStrings.noArgs),
		msgGuildID = message.guild.id;

	if (!args[0]) return message.channel.send(noArgs);
	if (!isNaN(args[0])) {
		const msg = new Embed().setColor(guildTheme).setDescription(guildStrings.noQ);
		if (args[0] == 0 || args[0] > client.queue[msgGuildID].length) return message.channel.send(msg);
		else {
			const removed = await new Embed()
				.setDescription(
					`:x: **${client.queue[msgGuildID][Number(args[0])].title}**\n${message.member}`
				)
				.setColor(guildTheme);
			client.queue[msgGuildID].splice(Number(args[0]), Number(args[0]));
			message.channel.send(removed);
		}
	} else {
		const search = args.join(" ").toLowerCase(),
			titles = client.queue[msgGuildID].map(t => t.title.toLowerCase()),
			includes = title => {
				return title.includes(search);
			},
			index = titles.findIndex(includes),
			removed = await new Embed()
				.setColor(guildTheme)
				.setDescription(`:x: **${client.queue[msgGuildID][index].title}**\n${message.member}`);
		client.queue[msgGuildID].splice(index, index);
		message.channel.send(removed);
	}
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: ["rm"]
};
