exports.run = (client, message, args, Embed, guildStrings, guildTheme) => {
	const msg = new Embed().setColor(guildTheme).setDescription(guildStrings.noQ),
		msgGuildID = message.guild.id;
	if (!client.queue[msgGuildID]) return message.channel.send(msg);
	let titles = [];
	const length = client.queue[msgGuildID].length > 11 ? 11 : client.queue[msgGuildID].length;
	for (let i = 0; i < length; i++) {
		if (i === 0) titles.push(`>> ${client.queue[msgGuildID][0].title}`);
		else titles.push(`${i}. ${client.queue[msgGuildID][i].title}`);
	}
	const dashboard =
			process.platform === "linux"
				? `https://musicbot.ga/music/${message.guild.id}`
				: `https://localhost/music/${message.guild.id}`,
		list = new Embed()
			.setDescription(
				`:notes: **[${guildStrings.queue} ${
					message.guild.name
				}](${dashboard})**\`\`\`md\n${titles.join("\n")}\`\`\``
			)
			.setColor(guildTheme)
			.setFooter(`${guildStrings.complQ} (${dashboard})`);
	message.channel.send(list);
};
exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: ["q", "queue", "songs"]
};
