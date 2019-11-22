exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const msgGuildID = message.guild.id,
		msg = new Embed().setColor(guildTheme).setDescription(guildStrings.noQ);
	if (!client.queue[msgGuildID] || !client.queue[msgGuildID][0]) return message.channel.send(msg);
	const nowp = client.queue[msgGuildID][0];
	client.queue[msgGuildID] = [];
	client.queue[msgGuildID].push(nowp);
	msg.setDescription(guildStrings.clearedQueue);
	message.channel.send(msg);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: false,
	enabled: true,
	alias: []
};
