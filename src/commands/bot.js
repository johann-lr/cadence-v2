const packageJSON = require("../../package.json"),
	{ version } = require("discord.js");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const bot = new Embed()
		.setColor(guildTheme)
		.setAuthor(client.user.tag, client.user.avatarURL)
		.addField("Created By", `Johann L. <@!${client.config.owner}>`, true)
		.addField("Memory", `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
		.addField("Server", `${client.guilds.size.toLocaleString()}`, true)
		.addField("Version", packageJSON.version, true)
		.addField("Discord.js", `v${version}`, true)
		.addField("Node", `${process.version}`, true)
		.setThumbnail(client.user.avatarURL);
	message.channel.send(bot);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: false,
	enabled: true,
	alias: ["cadence"]
};
