/**
 * @author Johann Laur
 * @module client_embeds.js
 * @description Some basic rich embeds f.ex. ready
 * @exports Object including embeds
 */

const config = require("../config/config.json"),
	{ RichEmbed } = require("discord.js"),
	disconnect = new RichEmbed().setColor(config.colors.red).setTitle("Disconnected"),
	reconnect = new RichEmbed().setColor(config.colors.lello).setTitle("Reconnecting"),
	readyEmbed = new RichEmbed().setDescription("**Ready**").setColor(config.colors.green),
	errorEmbed = new RichEmbed().setTitle("Client Error").setColor(config.colors.red),
	resu = new RichEmbed().setColor(config.colors.lello).setTitle("Resume"),
	test = new RichEmbed().setColor(config.colors.lello).setTitle("Test Message"),
	debug = new RichEmbed().setColor(config.colors.blue).setTitle("Debugging Information"),
	prefixes = new RichEmbed()
		.setColor(config.colors.blue)
		.setTitle("Prefixes")
		.setDescription(`\`\`\`\n${config.prefixes.join(", ")}\`\`\``);

//export rich embeds
module.exports = {
	test,
	prefixes,
	disconnect,
	debug,
	resu,
	errorEmbed,
	readyEmbed,
	reconnect
};
