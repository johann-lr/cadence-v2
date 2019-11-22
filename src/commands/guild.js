exports.run = (client, message, args, Embed, guildStrings, guildTheme) => {
	const msgGuildID = message.guild.id,
		prefix = client.settings.has(msgGuildID, "prefix")
			? client.settings.get(msgGuildID, "prefix")
			: client.config.prefix,
		channel = client.settings.has(msgGuildID, "mc") ? client.settings.get(msgGuildID, "mc") : "-",
		color = client.settings.has(msgGuildID, "color")
			? client.settings.get(msgGuildID, "color")
			: "-",
		guild = new Embed()
			.setColor(guildTheme)
			.setTitle(`${message.guild.name}`)
			.setTimestamp()
			.setThumbnail(message.guild.iconURL)
			.setDescription(
				client.languageReplace(
					guildStrings.guild,
					prefix,
					message.guild.createdAt,
					message.guild.memberCount,
					`<#${channel}>`,
					color
				)
			);
	message.channel.send(guild);
};
exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};