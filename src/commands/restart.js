const { disconnect } = require("../client_embeds");

exports.run = async client => {
	client.log("Info", "", "Restarting application");
	disconnect.setTimestamp();
	client.channels
		.get(client.config.log)
		.send(disconnect)
		.then(client.destroy());
};

exports.config = {
	requiresAdmin: true,
	enabled: true,
	requiresArg: false,
	alias: ["logout"]
};
