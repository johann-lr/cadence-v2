const moment = require("moment");
require("moment-duration-format");

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const pinging = await message.channel.send("Pinging..."),
		duration = moment.duration(client.uptime).format(" D [days], H [h], m [mins], s [secs]"),
		clientPing = client.ping.toFixed(1),
		pingMsg = new Embed()
			.setColor(guildTheme)
			.setTitle(":ping_pong: Pong!")
			.setTimestamp();
	pingMsg.setDescription(
		`Ping: **${pinging.createdTimestamp -
			message.createdTimestamp}**ms\nAPI: **${clientPing}**ms \nUptime: **${duration}**`
	);
	pinging.edit(pingMsg);
	client.log("Info", "", `${clientPing}ms ping (Uptime: ${duration})`);
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: ["pong"]
};
