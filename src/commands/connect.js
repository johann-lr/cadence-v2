const { connectVC } = require("../functions/connect");

exports.run = async (client, message, args, Discord, guildStrings, guildTheme) => {
	connectVC(client, message, guildStrings, guildTheme);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: false,
	enabled: true,
	alias: ["join"]
};
