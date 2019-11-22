module.exports = async client => {
	const clientEmbeds = require("../client_embeds"),
		package = require("../../package.json"),
		Enmap = require("enmap"),
		statistics = new Enmap({ name: "stats", autoFetch: true, fetchAll: false });

	function ensureSettings(guilds) {
		const guildsArr = guilds.map(g => {
			return g.id;
		});
		guildsArr.forEach(gID => {
			if (!client.settings.has(gID)) {
				client.settings.set(gID, { lang: "en" });
				client.log("Info", "Boot", `Set language to EN in start script (guild ${gID})`);
			}
		});
	}

	client.log("Info", "Boot", `Loaded and cached ${client.commands.array().length} commands`);
	client.appInfo = await client.fetchApplication();
	// fetch application every minute
	setInterval(() => {
		client.appInfo = client.fetchApplication();
	}, 60000);
	// load dashboard module and pass client
	require("../dashboard")(client);
	client.log("Info", "Boot", `Logged in as ${client.user.tag}`);
	if (process.platform === "linux") {
		clientEmbeds.readyEmbed.setTimestamp();
		client.channels.get(client.config.log).send(clientEmbeds.readyEmbed);
	}
	client.user.setActivity(`${client.config.prefix}${client.config.standardGame}`, {
		type: "LISTENING"
	});
	// in order to make sure that there's no guild without basic settings
	ensureSettings(client.guilds);
	// change bot status (in discord) every few minutes
	setInterval(() => {
		const rdm = Math.floor(Math.random() * 10);
		if (rdm === 5) client.user.setActivity(`v${package.version}!`);
		if (rdm > 5) client.user.setActivity("https://musicbot.ga");
		else
			client.user.setActivity(`${client.config.prefix}${client.config.standardGame}`, {
				type: "LISTENING"
			});
	}, 300000);
	// reset stats every 24h
	setInterval(() => {
		statistics.deleteAll();
	}, 86400000);
};
