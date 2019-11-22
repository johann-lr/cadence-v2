const clientEmbeds = require("../client_embeds");

module.exports = (client, event) => {
	clientEmbeds.disconnect.setDescription(event);
	client.channels.get(client.config.log).send(clientEmbeds.disconnect);
};
