/**
 * @module dm.js
 * @author Johann Laur
 * @description Function that is run if the bot gets a dm (direct message)
 * @exports dmHandler - function
 * @param {Client} client discord client
 * @param {Message} message message from message event
 */
exports.dmHandler = (client, message) => {
	const filter = (reaction, user) => reaction.emoji.name === "🇬🇧" && user.id === message.author.id;
	function messageReactionHandler(message, reply) {
		message.react("🇬🇧");
		const c = message.createReactionCollector(filter, { time: 10000 });
		c.on("collect", () => {
			message.edit(reply);
		});
	}
	if (message.attachments.map(a => a.id).length !== 0)
		return message
			.reply("Dateianhänge werden nicht untersützt")
			.then(m => messageReactionHandler(m, "File attachments are not supported yet"));
	client.users.get(client.config.owner).send(`[${message.author.tag}]: ${message.content}`);
	message
		.reply("Nachricht übermittelt...")
		.then(m => messageReactionHandler(m, "Transmitted message..."));
};
