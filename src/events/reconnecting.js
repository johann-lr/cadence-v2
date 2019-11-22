const clientEmbeds = require("../client_embeds");

module.exports = client => {
	client.log("Connection", "", "reconnecting to websocket");
	client.channels.get(client.config.log).send(clientEmbeds.reconnect);
};
