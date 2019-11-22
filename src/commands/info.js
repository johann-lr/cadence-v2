exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const msgGuildID = message.guild.id,
		pref = client.settings.has(msgGuildID, "prefix")
			? client.settings.get(msgGuildID, "prefix")
			: client.config.prefix,
		info = new Embed()
			.setColor(guildTheme)
			.setTitle(guildStrings.infoHead)
			.setDescription(
				`Basics: ${pref}play, ${pref}next, ${pref}volume\n[Bot Homepage](https://musicbot.ga/commands)`
			)
			.setAuthor(client.user.username, client.user.avatarURL)
			.setFooter(`${guildStrings.infoFooter} https://musicbot.ga/bot`);
	message.channel.send(info);
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};
