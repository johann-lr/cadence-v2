const { isPlaying } = require("../functions/check_for_vc");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const noPlaying = new Embed().setColor(guildTheme).setDescription(guildStrings.noPlaying);
	if (!isPlaying(message)) return message.channel.send(noPlaying);
	if (args[0] > 96) {
		const err = new Embed()
			.setColor(client.config.colors.red)
			.setDescription(guildStrings.bitsHigh);
		return message.channel.send(err);
	}
	message.guild.voiceConnection.dispatcher.setBitrate(args[0]);
	const bitr = new Embed()
		.setColor(guildTheme)
		.setDescription(client.languageReplace(guildStrings.bitrate, args[0]));
	message.channel.send(bitr);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: true,
	enabled: true,
	alias: []
};
