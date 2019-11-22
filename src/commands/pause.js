const { isPlaying } = require("../functions/check_for_vc");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const noPlaying = new Embed().setColor(guildTheme).setDescription(guildStrings.noPlaying);
	if (!isPlaying(message)) return message.channel.send(noPlaying);
	message.react("⏸");
	message.guild.voiceConnection.dispatcher.pause();
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: ["p"]
};
