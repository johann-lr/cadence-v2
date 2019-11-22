exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const msgGuildID = message.guild.id,
		msg = new Embed().setColor(guildTheme).setDescription(guildStrings.autoplay);
	if (!client.musicConfig.autop[msgGuildID]) {
		client.musicConfig.autop[msgGuildID] = true;
		message.channel.send(msg);
		client.log("Player", "", `${msgGuildID}: Autoplay activated`);
	} else {
		delete client.musicConfig.autop[msgGuildID];
		msg.setDescription(guildStrings.autoplayOff);
		message.channel.send(msg);
		client.log("Player", "", `${msgGuildID}: Autoplay deactivated`);
	}
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: ["ap", "auto"]
};
