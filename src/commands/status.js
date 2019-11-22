exports.run = async (client, message, args) => {
	if (!args[0]) return;
	if (client.config.presences.indexOf(status) == -1) return;
	client.user.setStatus(status);
	message.react("✅");
};

exports.config = {
	requiresAdmin: true,
	enabled: true,
	requiresArg: true,
	alias: ["presence"]
};
