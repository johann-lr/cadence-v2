/**
 * @author Johann Laur
 * @description new main file
 * @version 1.0
 * @module main.js
 */

// packages
const Discord = require("discord.js"),
	fs = require("fs"),
	packageJSON = require("../package.json"),
	Enmap = require("enmap");

// god himself
const client = new Discord.Client();
// additional client functions
require("./functions/functions")(client);

// includes old play-method and event listener (./emitter)
// This module must be run permanently cause the dispatcher event listener
// would stop and fail if it's restartet by another (guild)message
require("./dispatcher_handler")(client);

client.log("Info", `Running version ${packageJSON.version}`, `on ${process.platform}`);
// safemode: run bootstrap.js to check f.ex. ffmpeg installation
if (process.argv.indexOf("-s") !== -1) {
	const boot = require("./bootstrap");
	boot.run();
}

// "global" variables for player
client.queue = {};
client.musicConfig = {
	loop: {},
	loopAll: {},
	autoVolume: {},
	loopIndex: {},
	autop: {}
};

// Get config depending on platform of process
client.config =
	process.platform === "linux"
		? require("../config/config.json")
		: require("../config/dev_conf.json");

// basic event handler (inspired by anidiots.guide)
fs.readdir("./src/events/", (err, files) => {
	client.log("Info", "Boot", `Loaded ${files.length}`);
	if (err) return client.log("Error", "Load Events", err);
	files.forEach(file => {
		if (!file.endsWith(".js")) return;
		const event = require(`./events/${file}`),
			eventName = file.split(".")[0];
		client.on(eventName, event.bind(null, client));
		delete require.cache[require.resolve(`./events/${file}`)];
	});
});

// enmap to store commands for faster responding commands
// and improved alias commands
client.commands = new Enmap();
client.aliases = new Enmap();

// load commands
fs.readdir("./src/commands/", (err, files) => {
	if (err) throw err;
	client.log("Info", "Boot", `Loading ${files.length} commands`);
	files.forEach(async file => {
		if (!file.endsWith(".js")) return;
		const cmdFile = await require(`./commands/${file}`),
			cmdName = file.split(".")[0];
		cmdFile.config.alias.forEach(alias => client.aliases.set(alias, cmdName));
		if (cmdFile.config.enabled) client.commands.set(cmdName, cmdFile);
	});
});

client.statistics = new Enmap({ name: "stats", autoFetch: true, fetchAll: false });

// guild settings
client.settings = new Enmap({
	name: "settings",
	fetchAll: false,
	autoFetch: true,
	cloneLevel: "deep"
});

// login to dc
client.login(client.config.token);
