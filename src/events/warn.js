const Discord = require("discord.js");

module.exports = (client, info) => {
	const embed = new Discord.RichEmbed()
		.setColor(client.config.colors.lello)
		.setTitle("Client Warning")
		.setDescription(info)
		.setTimestamp();

	client.channels.get(client.config.log).send(embed);
	client.log("Info", "Received client warning", info);
};
