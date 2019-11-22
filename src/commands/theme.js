exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const msgGuildID = message.guild.id,
		themeEm = new Embed()
			.setColor(guildTheme)
			.setDescription(client.languageReplace(guildStrings.color, message.guild.name));
	if (!message.member.hasPermission("MANAGE_GUILD")) {
		themeEm.setColor(client.config.colors.red).setDescription(guildStrings.missingPerm);
		return message.channel.send(themeEm);
	}
	if (isNaN(args[0])) {
		if (args[0].length != 7 || !args[0].startsWith("#")) {
			themeEm.setDescription(guildStrings.colorErr);
			return message.channel.send(themeEm);
		}
		const newColor = args[0];
		client.settings.set(msgGuildID, newColor, "color");
		themeEm.setColor(newColor);
		message.channel.send(themeEm);
	} else message.channel.send(themeEm.setDescription(guildStrings.colorErr));
};

exports.config = {
	requiresAdmin: false,
	requiresArg: true,
	enabled: true,
	alias: ["color"]
};
