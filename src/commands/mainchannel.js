exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	if (!message.member.hasPermission("MANAGE_GUILD"))
		return message.channel.send(
			new Embed().setColor(guildTheme).setDescription(guildStrings.missingPerm)
		);
	const msgChannel = message.channel.id;
	client.settings.set(message.guild.id, msgChannel, "mc");
	const success = new Embed()
		.setColor(guildTheme)
		.setDescription(client.languageReplace(guildStrings.mainc, message.channel.name));
	message.channel.send(success);
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};
