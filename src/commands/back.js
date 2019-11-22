const { isPlaying } = require("../functions/check_for_vc");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const backErr = new Embed()
			.setColor(client.config.colors.red)
			.setDescription(guildStrings.noPlayed),
		noPlaying = new Embed().setColor(guildTheme).setDescription(guildStrings.noPlaying),
		msgGuildID = message.guild.id;
	if (!client.played[msgGuildID][0]) return message.channel.send(backErr);
	if (!isPlaying(message)) return message.channel.send(noPlaying);
	await client.queue[msgGuildID].splice(1, 0, client.played[msgGuildID][0]);
	message.guild.voiceConnection.dispatcher.end();
	const back = new Embed().setColor(guildTheme).setDescription(guildStrings.back);
	message.channel.send(back);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: true,
	enabled: true,
	alias: ["previous"]
};
