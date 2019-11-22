const { RichEmbed } = require("discord.js");
exports.run = async (client, message) => {
	client
		.generateInvite([
			"SEND_MESSAGES",
			"MENTION_EVERYONE",
			"ADD_REACTIONS",
			"EMBED_LINKS",
			"READ_MESSAGES",
			"SPEAK",
			"CONNECT"
		])
		.then(link => {
			client.log("Info", "", "Generated bot invite link");
			const e = new RichEmbed()
				.setColor(client.config.colors.blurple)
				.setDescription(
					`**Invite Cadence:** [click here](${link})\nOr visit the homepage and dashboard first: https://musicbot.ga/`
				)
				.setThumbnail(client.user.avatarURL);
			message.channel.send(e);
		})
		.catch(console.error);
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};
