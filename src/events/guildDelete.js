module.exports = (client, guild) => {
	const creator = client.users.get(client.config.owner),
		msg = `Ich habe **${guild}** verlassen`;
	creator.send(msg);
	client.settings.delete(guild.id);
};
