const { leave } = require("../functions/connect");

exports.run = async (client, message, args, Discord, guildStrings, guildTheme) => {
	leave(client, message, guildStrings, guildTheme);
};

exports.config = {
	requiresAdmin: false,
	requiresArg: false,
	enabled: true,
	alias: ["leave", "stop"]
};
