app.get("/mystats", checkAuth, async (req, res) => {
	//insert right path to db
	const enm =
			process.platform === "darwin"
				? new Database("/Users/johannlaur/Documents/Coding/GitHub_private/Hbb/data/enmap.sqlite")
				: new Database("../HBB/data/enmap.sqlite"),
		//just get all rows from that table
		sql = enm.prepare("SELECT * FROM stats WHERE substr(key, 1, 18) = ?"),
		rows = sql.all(`${req.user.id}`),
		// filter temporary rows out
		filteredGames = rows.filter(
			rows =>
				rows.key.includes("-times") === false &&
				rows.key.includes("went") === false &&
				rows.key.includes("started") === false &&
				rows.key.includes("Time") === false
		);

	if (
		rows.find(e => {
			return e.key.startsWith(`${req.user.id}-onlineTime`);
		}) === undefined
	);
	const userData =
		rows.find(e => {
			return e.key.startsWith(`${req.user.id}-onlineTime`);
		}) !== undefined
			? {
					onlineTime: rows.find(e => {
						return e.key.startsWith(`${req.user.id}-onlineTime`);
					}).value,
					idleTime: rows.find(e => {
						return e.key.startsWith(`${req.user.id}-idleTime`);
					}).value,
					games: filteredGames
			  }
			: null;
	renderTemplate(res, req, "mystats.ejs", { userData });
});
app.get("/guilds/:id", checkAuth, async (req, res) => {
	const guildID = req.params.id,
		guild = client.guilds.get(guildID);
	if (!guild) return res.sendStatus(404);
	// load db depending on platform
	const enm =
			process.platform === "darwin"
				? new Database("/Users/johannlaur/Downloads/FileZilla Downloads/data/enmap.sqlite")
				: new Database("./myDB"),
		// prepare sqlite statements on database (enm)
		// "?" is a placeholder for the guildID
		statSql = enm.prepare("SELECT * FROM messages WHERE substr(key, 1, 18) = ?"),
		pointSql = enm.prepare("SELECT * FROM points WHERE substr(key, 1, 18) = ?"),
		// get all rows and insert guildID for ?-placeholder
		rows = statSql.all(`${guildID}`),
		p = pointSql.all(`${guildID}`),
		// filter out timeout value-rows, they only exist temporary and contain null values
		filtered = p.filter(p => p.key.includes("-timeout") === false);
	/* eslint-disable prefer-const */
	let points = [],
		channelNames = [],
		channelValues = [];
	await filtered.forEach(e =>
		points.push({ key: e.key.slice(19, 38), value: JSON.parse(e.value).points })
	);
	await rows.forEach(e => {
		const name = client.channels.get(e.key.slice(19)).name;
		channelNames.push(name);
		channelValues.push(e.value);
	});
	points.sort((a, b) => b.value - a.value);
	renderTemplate(res, req, "server.ejs", {
		guild,
		guildID,
		points,
		channels: JSON.stringify(channelNames),
		values: JSON.stringify(channelValues)
	});
});
