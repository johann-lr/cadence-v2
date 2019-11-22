const clientEmbeds = require("../client_embeds");

module.exports = (client, error) => {
	client.log(
		"Error",
		"Client Error",
		`Type: ${error.type}\nClose Code: ${error.target._closeCode}\nError Code: ${
			error.error.code
		} (syscall *${error.error.syscall}*)`
	);
	client.channels.get(client.config.log).send(clientEmbeds.errorEmbed);
};
