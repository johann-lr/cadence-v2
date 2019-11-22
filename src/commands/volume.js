const { isPlaying } = require("../functions/check_for_vc");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	if (!isPlaying(message))
		return message.channel.send(
			new Embed().setColor(guildTheme).setDescription(guildStrings.noPlaying)
		);
	if (!args[0]) {
		const currentVolume = new Embed()
			.setColor(guildTheme)
			.setDescription(
				`${guildStrings.volume} ${message.guild.voiceConnection.dispatcher.volume * 100}%`
			);
		message.channel.send(currentVolume);
		return;
	}
	const volumeErr = new Embed().setDescription(guildStrings.volumeExe).setColor(guildTheme);
	if (args[0] < 0) return message.channel.send(volumeErr);
	const msg = new Embed().setColor(guildTheme);
	if (args[0] === "reset" || args[0] === "r") {
		message.guild.voiceConnection.dispatcher.setVolume(1);
		msg.setColor(guildTheme).setDescription(guildStrings.volumeReset);
		message.channel.send(msg);
		return;
	}
	if (isNaN(args[0])) {
		msg.setDescription(guildStrings.isNAN);
		return message.channel.send(msg);
	}
	if (args[0] > 200) message.channel.send(volumeErr);
	msg.setDescription(client.languageReplace(guildStrings.volumeChange, `${args[0]}%`));
	message.guild.voiceConnection.dispatcher.setVolume(args[0] / 100);
	message.channel.send(msg);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: false,
	enabled: true,
	alias: ["v"]
};
