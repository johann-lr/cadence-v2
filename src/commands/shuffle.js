const { isPlaying } = require("../functions/check_for_vc");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const msgGuildID = message.guild.id;
	if (!isPlaying(message))
		return message.channel.send(
			new Embed().setColor(guildTheme).setDescription(guildStrings.noPlaying)
		);
	let now = client.queue[msgGuildID].shift(),
		i = client.queue[msgGuildID].length;
	do {
		var zi = Math.floor(Math.random() * i);
		var t = client.queue[msgGuildID][zi];
		client.queue[msgGuildID][zi] = client.queue[msgGuildID][--i];
		client.queue[msgGuildID][i] = t;
	} while (i);
	if (client.queue[msgGuildID][0] != now) {
		client.queue[msgGuildID].push(client.queue[msgGuildID][0]);
		client.queue[msgGuildID][0] = now;
	}
	const shuffle = new Embed().setColor(guildTheme).setDescription(guildStrings.shuffle);
	message.channel.send(shuffle);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: false,
	enabled: true,
	alias: []
};
