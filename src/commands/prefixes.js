const embeds = require("../client_embeds");

exports.run = (client, message) => {
	message.channel.send(embeds.prefixes);
};
exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};
