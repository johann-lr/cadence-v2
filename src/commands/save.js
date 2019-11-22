const Enmap = require("enmap"),
	queueStorage = new Enmap({ name: "queue" });

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const err = new Embed().setColor(guildTheme).setDescription(guildStrings.noQ),
		success = new Embed().setColor(guildTheme).setDescription(guildStrings.savedQueue);
	// return if the guild does not have a queue to save
	if (!client.queue[message.guild.id]) return message.channel.send(err);
	const queue2Save = client.queue[message.guild.id],
		// use method from module functions.js which removes streams from the objects
		// else we'd have stringified node streams in the db
		clearedQ = client.getClearQueue(queue2Save);
	// save to enmap.sqlite after the db is ready
	queueStorage.defer.then(() => queueStorage.set(message.guild.id, clearedQ));
	client.log("Player", "", `Saved queue for guild ${message.guild.id}`);
	message.channel.send(success);
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};
