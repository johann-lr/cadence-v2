const Discord = require("discord.js"),
	messageStrings = {
		de: require("../../config/languages/de.json"),
		en: require("../../config/languages/en.json"),
		es: require("../../config/languages/es.json")
	},
	{ dmHandler } = require("../functions/dm");

module.exports = (client, message) => {
	// ignore bot messages
	if (message.author.bot) return;
	// Send a dm directly to JHN#9045
	if (message.channel.type === "dm") return dmHandler(client, message);
	const msgGuildID = message.guild.id,
		guildLanguage = client.settings.has(msgGuildID)
			? client.settings.get(msgGuildID, "lang")
			: "en",
		guildStrings = messageStrings[guildLanguage],
		prefix = client.settings.has(msgGuildID, "prefix")
			? client.settings.get(msgGuildID, "prefix")
			: client.config.prefix,
		guildTheme = client.settings.has(msgGuildID, "color")
			? client.settings.get(msgGuildID, "color")
			: client.config.colors.blue;

	// ignore messages without prefix at index 0
	if (message.content.indexOf(prefix) !== 0) return;

	// increment commandsToday or set its value to 1 if it doesn't exist yet
	if (!client.statistics.has("commandsToday")) client.statistics.set("commandsToday", 1);
	else client.statistics.inc("commandsToday");

	const noArgsEmbed = new Discord.RichEmbed()
		.setColor(guildTheme)
		.setDescription(guildStrings.noArgs);

	const args = message.content
		.slice(prefix.length)
		.trim()
		.split(/ +/g);
	const command = args.shift().toLowerCase();
	let loadedCommand;
	if (client.commands.has(command)) loadedCommand = client.commands.get(command);
	else if (client.aliases.has(command))
		loadedCommand = client.commands.get(client.aliases.get(command));

	// return if command or alias could not be loaded/does not exist
	if (!loadedCommand) return;

	if (client.config.admins.indexOf(message.author.id) === -1 && loadedCommand.config.requiresAdmin)
		return message.react("❌");
	if (client.config.requiresArg && !args[0]) return message.channel.send(noArgsEmbed);
	loadedCommand.run(client, message, args, Discord.RichEmbed, guildStrings, guildTheme);
};
