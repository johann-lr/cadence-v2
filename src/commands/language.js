const languages = {
	de: require("../../config/languages/de.json"),
	en: require("../../config/languages/en.json"),
	es: require("../../config/languages/es.json")
};

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	if (!message.member.hasPermission("MANAGE_GUILD") || args[0].length !== 2)
		return message.react("❌");
	const newLanguage = args[0].toLowerCase(),
		// to get proper flag emoji
		flagString = newLanguage === "en" ? "gb" : newLanguage;
	await client.settings.set(message.guild.id, newLanguage, "lang");
	const lang = new Embed()
		.setColor(guildTheme)
		.setDescription(`:flag_${flagString}: ${languages[newLanguage].langSet}`);
	message.channel.send(lang);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: true,
	enabled: true,
	alias: ["lang"]
};
