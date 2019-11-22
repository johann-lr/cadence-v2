const { isPlaying } = require("../functions/check_for_vc");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const noPlaying = new Embed().setColor(guildTheme).setDescription(guildStrings.noPlaying);
	if (!isPlaying(message)) return message.channel.send(noPlaying);
	if (!message.guild.voiceConnection.dispatcher.paused) {
		const notPaused = new Embed()
			.setColor(client.config.colors.red)
			.setDescription(guildStrings.notPaused);
		return message.channel.send(notPaused);
	}
	message.guild.voiceConnection.dispatcher.resume();
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};
