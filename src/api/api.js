/**
 * @description Rest api
 * @author Johann Laur
 * @version 1.0
 * @extends dashboard.js
 * @param {Discord.Client} client discord client passed by dashboard.js
 * @param {express.app} app express app
 * @param moment moment package
 */

const { getBasicInfo } = require("ytdl-core"),
	packageFile = require("../../package.json");

module.exports = (client, app, moment) => {
	client.log("Info", "Boot", "API online");

	// api start page with some general data
	app.get("/api", (req, res) => {
		const data = {
			connections: client.voiceConnections.map(c => c.channel.id),
			// get memory usage in Megabytes
			processMemoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
			nodeV: process.version,
			// number of guilds the bot is on
			guildsCount: client.guilds.size,
			// uptime as number in milliseconds
			uptime_raw: client.uptime,
			// uptime as formatted string
			uptime: moment.duration(client.uptime).format(" D [days], H [hrs], m [mins], s [secs]"),
			version: packageFile.version
		};
		res.json(data);
	});

	app.get("/api/:id", (req, res) => {
		const guildID = req.params.id,
			guild = client.guilds.get(guildID);
		// return with not found if the guild does not exist
		if (!guild) return res.sendStatus(404).json({ err: "Guild not found" });
		// check for voiceconnection on guild
		const existingConnection = guild.voiceConnection ? true : false,
			// the connection
			connection = guild.voiceConnection,
			// check if dispatcher exists if connection exists ;)
			existingDispatcher = existingConnection ? (connection.dispatcher ? true : false) : false,
			// whether the dispatcher (if existing) is paused or not
			paused = existingDispatcher ? (connection.dispatcher.paused ? true : false) : null,
			// name of the channel where the bot is in (else null)
			channel = existingConnection ? connection.channel.name : null,
			queue = client.queue[guildID] ? client.getClearQueue(client.queue[guildID]) : [],
			// timer of the dispatcher
			stream_time = existingDispatcher ? connection.dispatcher.time : null,
			volume = existingDispatcher ? connection.dispatcher.volume : null;

		if (queue[0]) {
			getBasicInfo(queue[0].link, (err, info) => {
				if (err) throw err;
				const length = Number(info.length_seconds);
				res.json({
					id: guildID,
					existingConnection,
					existingDispatcher,
					volume,
					paused,
					channel,
					queue,
					stream_time,
					length
				});
			});
		} else {
			res.json({
				id: guildID,
				existingConnection,
				existingDispatcher,
				channel,
				queue
			});
		}
	});
};
