const { prefixes } = require("../client_embeds");

exports.run = (client, message, args, Embed, guildStrings, guildTheme) => {
	if (!message.member.hasPermission("MANAGE_GUILD")) {
		const err = new Embed()
			.setColor(client.config.colors.red)
			.setDescription(guildStrings.missingPerm);
		return message.channel.send(err);
	}
	if (!args[0]) return message.channel.send(prefixes);
	if (client.config.prefixes.indexOf(args[0]) !== -1) {
		client.settings.set(message.guild.id, args[0], "prefix");
		const prefixSet = new Embed()
			.setColor(guildTheme)
			.setDescription(
				client.languageReplace(guildStrings.sPrefix, args[0], `<@!${message.author.id}>`)
			);
		message.channel.send(prefixSet);
	} else {
		const prefixErr = new Embed()
			.setDescription(guildStrings.prefErr)
			.setColor(client.config.colors.red);
		message.channel.send(prefixErr);
	}
};
exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};
