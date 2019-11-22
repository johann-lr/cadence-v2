const defaultSettings = {
	lang: "en"
};

module.exports = (client, guild) => {
	const creator = client.users.get(client.config.owner),
		msg = `Ich bin **${guild}** beigetreten`;
	creator.send(msg);
	client.log("Info", "Guilds", `Joined ${guild}`);

	// store default guild language in config
	client.settings.set(guild.id, defaultSettings);
};
