const clientEmbeds = require("../client_embeds");

module.exports = (client, replayed) => {
	client.log("Connection", "", `Resume - Replayed ${replayed} events`);
	clientEmbeds.resu.setDescription(`Replayed ${replayed} events`);
	client.channels.get(client.config.log).send(clientEmbeds.resu);
};
