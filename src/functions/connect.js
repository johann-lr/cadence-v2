const Discord = require("discord.js"),
	{ isPlaying } = require("../functions/check_for_vc");

/**
 * @description Connects the bot client to voicechannel
 * @returns Message to dc text channel
 */
exports.connectVC = (client, message, guildStrings, guildTheme) => {
	const errMsg = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.noVC);
	if (!message.member.voiceChannel) return message.channel.send(errMsg);
	const channel = message.member.voiceChannel;
	if (!channel.permissionsFor(client.user).has("CONNECT")) {
		errMsg.setDescription(guildStrings.connectErr);
		return message.channel.send(errMsg);
	}
	if (!channel.permissionsFor(client.user).has("VIEW_CHANNEL")) {
		errMsg.setDescription(guildStrings.missingPerm);
		return message.channel.send(errMsg);
	}
	if (!channel.permissionsFor(client.user).has("SPEAK")) {
		errMsg.setDescription(guildStrings.speakErr);
		return message.channel.send(errMsg);
	}
	message.member.voiceChannel.join();
	errMsg.setDescription(guildStrings.joined);
	message.channel.send(errMsg);
};

exports.leave = (client, message, guildStrings, guildTheme) => {
	const msg = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.noVC);
	if (!message.guild.voiceConnection || !message.member.voiceChannel)
		return message.channel.send(msg);
	if (isPlaying(message)) {
		delete client.musicConfig.loopAll[message.guild.id];
		message.guild.volume = 1;
	}
	client.queue[message.guild.id] = [];
	if (message.guild.voiceConnection.dispatcher) message.guild.voiceConnection.dispatcher.end();
	message.guild.voiceConnection.disconnect();
	msg.setDescription(guildStrings.disconnectVC);
	message.channel.send(msg);
};

/**
 * @description Leave a voicechannel if it is empty
 */
exports.leaveEmptyChannel = (client, message, guildStrings, guildTheme) => {
	const msgGuildID = message.guild.id;
	delete client.musicConfig.loopAll[msgGuildID];
	delete client.musicConfig.volume[msgGuildID];
	client.queue[msgGuildID] = [];
	message.guild.voiceConnection.disconnect();
	const disc = new Discord.RichEmbed()
		.setColor(guildTheme)
		.setDescription(guildStrings.disconnectVC);
	message.channel.send(disc);
};
