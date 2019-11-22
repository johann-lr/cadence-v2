const Enmap = require("enmap"),
	queueStorage = new Enmap({ name: "queue" });

exports.run = async (client, message, args, Embed, guildStrings, guildTheme) => {
	const err = new Embed().setColor(guildTheme).setDescription(guildStrings.notSavedYet),
		success = new Embed().setColor(guildTheme).setDescription(guildStrings.loadedQ);
	// wait for ready-state of db
	await queueStorage.defer;
	// return if no queue was saved
	if (!queueStorage.has(message.guild.id)) return message.channel.send(err);
	// ask whether the current queue should be overwritten with the saved one
	const resp = await client.awaitReply(message, guildStrings.overwriteQ),
		savedQueue = queueStorage.get(message.guild.id);
	if (resp === "y") client.queue[message.guild.id] = savedQueue;
	else client.queue[message.guild.id].push(savedQueue);
	queueStorage.delete(message.guild.id);
	message.channel.send(success);
};

exports.config = {
	requiresAdmin: false,
	enabled: true,
	requiresArg: false,
	alias: []
};
