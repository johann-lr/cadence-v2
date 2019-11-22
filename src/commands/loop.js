exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const loopMsg = new Embed().setColor(guildTheme).setDescription(guildStrings.loop),
		msgGuildID = message.guild.id,
		config = client.musicConfig;
	if (args[0] === "all") {
		if (!config.loopAll[msgGuildID]) {
			config.loopAll[msgGuildID] = true;
			config.loopIndex[msgGuildID] = 0;
			if (config.loop[msgGuildID]) delete config.loop[msgGuildID];
			loopMsg.setDescription(guildStrings.loopAll);
			message.channel.send(loopMsg);
		} else {
			delete config.loopAll[msgGuildID];
			loopMsg.setDescription(guildStrings.loopOff);
			message.channel.send(loopMsg);
		}
	} else {
		if (!config.loop[msgGuildID]) {
			config.loop[msgGuildID] = true;
			if (config.loopAll[msgGuildID]) delete config.loopAll[msgGuildID];
			message.channel.send(loopMsg);
		} else {
			delete config.loop[msgGuildID];
			loopMsg.setDescription(guildStrings.loopOff);
			message.channel.send(loopMsg);
		}
	}
};

exports.config = {
	requiresAdmin: false,
	requiresArg: false,
	enabled: true,
	alias: []
};
