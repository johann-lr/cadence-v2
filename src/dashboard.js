/**
 * @author Johann Laur, anidiots
 * @version 1.2
 * @description Dashboard module, run next to index, includes express app
 * @module dashboard.js
 */

// Packages
require("moment-duration-format");
const url = require("url"),
	fs = require("fs"),
	path = require("path"),
	Discord = require("discord.js"),
	moment = require("moment"),
	helmet = require("helmet"), //security (?)
	request = require("request"),
	{ filterResults } = require("./functions/filter_results"),
	clientEmbeds = require("./client_embeds"),
	https = require("https"),
	/* prettier-ignore */
	httpsOpts =
		process.platform === "linux"
			? {
				key: fs.readFileSync("keys/privkey.pem"),
				cert: fs.readFileSync("keys/fullchain.pem")
			}
			: {
				key: fs.readFileSync("keys/key.pem"),
				cert: fs.readFileSync("keys/cert.pem")
			};

// Express Session
const express = require("express"),
	app = express();

const search = require("youtube-search"),
	{ getInfo } = require("ytdl-core");

// Express Plugins (passport for oauth)
const passport = require("passport"),
	session = require("express-session"),
	LevelStore = require("level-session-store")(session),
	Strategy = require("passport-discord").Strategy,
	strings = {
		de: require("../config/languages/de.json"),
		en: require("../config/languages/en.json"),
		es: require("../config/languages/es.json")
	};

/**
 * @param {Discord.Client} client discord client passed by index
 */
module.exports = client => {
	client.log("Info", "Boot", `Dashboard available on ${client.config.dashboard.domain}`);

	// opts for youtube-search
	const opts = {
			maxResults: 5,
			key: client.config.yt.key2
		},
		// This resolves to: botDirectory/dashboard/
		dataDir = path.resolve(`${process.cwd()}${path.sep}app`),
		templateDir = path.resolve(`${dataDir}${path.sep}templates`);

	// The public data directory, which is accessible from the *browser*.
	// It contains all css, client javascript, and images needed for the site.
	app.use("/public", express.static(path.resolve(`${dataDir}${path.sep}public`)));

	// No Idea how that auth shit works too, just copied code which works :D
	passport.serializeUser((user, done) => {
		done(null, user);
	});
	passport.deserializeUser((obj, done) => {
		done(null, obj);
	});

	//uses data (like clientSecret) for oauth (discord)
	passport.use(
		new Strategy(
			{
				clientID: client.appInfo.id,
				clientSecret: client.config.dashboard.oauthSecret,
				callbackURL: client.config.dashboard.callbackURL,
				scope: ["identify", "guilds"]
			},
			(accessToken, refreshToken, profile, done) => {
				process.nextTick(() => done(null, profile));
			}
		)
	);

	// More copied code that stores dashboard-session data in a lvl thing :P
	app.use(
		session({
			store: new LevelStore("./data/dashboard-session/"),
			secret: client.config.dashboard.sessionSecret,
			resave: false,
			saveUninitialized: false
		})
	);

	// Initializes passport and session...
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(helmet());

	//Link domain name
	app.locals.domain = client.config.dashboard.domain;

	// Use ejs as html view engine for the interface
	app.engine("html", require("ejs").renderFile);
	app.set("view engine", "html");

	// to parse incoming bodys (json or url encoded)
	var bodyParser = require("body-parser");
	app.use(bodyParser.json());
	app.use(
		bodyParser.urlencoded({
			extended: true
		})
	);

	// RestAPI for the bot
	require("./api/api")(client, app, moment);

	/**
    @description checks whether the request's user is authenticated
  */
	function checkAuth(req, res, next) {
		if (req.isAuthenticated()) return next();
		req.session.backURL = req.url;
		// basically isn't working anymore cause /login is now a post method (should be fixed)
		res.redirect(307, "/login");
	}

	/**
	 * This function simplifies the rendering of the page, since every page must be rendered
	 * @author anidiots
	 * @param res response by express post/get
	 * @param req request ''
	 * @param template the ejs template that should be rendered
	 * @param data optional object of data that should be passed to page
	 */
	const renderTemplate = (res, req, template, data = {}) => {
		const baseData = {
			bot: client,
			path: req.path,
			user: req.isAuthenticated() ? req.user : null
		};
		res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
	};

	// DASHBOARD ROUTES

	// redirects to login using passport discord oauth
	app.post(
		"/login",
		(req, res, next) => {
			if (req.session.backURL) {
				req.session.backURL = req.session.backURL;
			} else if (req.headers.referer) {
				const parsed = url.parse(req.headers.referer);
				if (parsed.hostname === app.locals.domain) {
					req.session.backURL = parsed.path;
				}
			} else {
				req.session.backURL = "/";
			}
			next();
		},
		passport.authenticate("discord")
	);

	app.get("/login", (req, res) => {
		if (req.isAuthenticated()) return res.redirect("/");
		renderTemplate(res, req, "auth.ejs");
	});

	// oauth endpoint
	app.get(
		"/callback",
		passport.authenticate("discord", { failureRedirect: "/autherror" }),
		(req, res) => {
			if (client.config.admins.indexOf(req.user.id) != -1) req.session.isAdmin = true;
			else req.session.isAdmin = false;
			if (req.session.backURL) {
				const url = req.session.backURL;
				req.session.backURL = null;
				res.redirect(url);
			} else {
				res.redirect("/");
			}
		}
	);

	// will be displayed if any error happens
	app.get("/autherror", (req, res) => renderTemplate(res, req, "autherror.ejs"));

	// Destroys the session to log out the user
	app.post("/logout", (req, res) => {
		req.session.destroy(() => {
			req.logout();
			res.redirect("/");
		});
	});

	// Index page
	app.get("/", (req, res) => {
		renderTemplate(res, req, "index.ejs");
	});

	// The Command list (~blocks) is created with all infos in commandlist.json
	app.get("/commands", (req, res) => {
		const list = require("../config/cmds.json");
		renderTemplate(res, req, "commands.ejs", { list });
	});

	// Bot stats
	app.get("/bot", (req, res) => {
		const duration = moment
				.duration(client.uptime)
				.format(" D [days], H [hrs], m [mins], s [secs]"),
			members = client.guilds.reduce((p, c) => p + c.memberCount, 0),
			textChannels = client.channels.filter(c => c.type === "text").size,
			voiceChannels = client.channels.filter(c => c.type === "voice").size,
			guilds = client.guilds.size,
			commandsToday = client.statistics.get("commandsToday");
		renderTemplate(res, req, "bot.ejs", {
			stats: {
				servers: guilds,
				members,
				text: textChannels,
				voice: voiceChannels,
				uptime: duration,
				memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
				dVersion: Discord.version,
				nVersion: process.version,
				commandsToday
			}
		});
	});

	// music control page for a guild
	app.get("/music/:id", checkAuth, async (req, res) => {
		const guild = req.params.id,
			guildC = client.guilds.get(guild);
		// return with not found if a wrong id param was passed
		if (!guildC) return res.sendStatus(404);
		let length, time, img;
		if (guildC.voiceConnection)
			if (guildC.voiceConnection.dispatcher) {
				getInfo(client.queue[guild][0].link, (err, info) => {
					if (err) throw err;
					length = info.length_seconds * 1000;
					time = guildC.voiceConnection.dispatcher.time;
					img = client.queue[guild][0].spotify
						? client.queue[guild][0].spotify
						: info.player_response.videoDetails.thumbnail.thumbnails[0].url;
					renderTemplate(res, req, "music.ejs", { length, time, img, guild });
				});
			} else renderTemplate(res, req, "music.ejs", { length, time, img, guild });
		else renderTemplate(res, req, "music.ejs", { length, time, img, guild });
	});

	// guild main page with stats etc
	app.get("/guilds/:id", checkAuth, async (req, res) => {
		const guildID = req.params.id,
			guild = client.guilds.get(guildID);
		if (!guild) return res.sendStatus(404);
		renderTemplate(res, req, "server.ejs", {
			guild,
			guildID
		});
	});

	// guild selection page
	app.get("/guilds", checkAuth, async (req, res) => {
		renderTemplate(res, req, "guild_selection.ejs", { music: false });
	});

	// just a list of all guilds the bot is on with a non-working remove button
	app.get("/admin", checkAuth, (req, res) => {
		if (!req.session.isAdmin) return res.redirect("/");
		renderTemplate(res, req, "admin.ejs");
	});
	app.post("/admin/:guildID/leave", checkAuth, async (req, res) => {
		if (!req.session.isAdmin) return res.redirect("/");
		// structure missing to remove bot after modal
	});

	// admin page that allows admin users to view log
	app.get("/admin/logs", checkAuth, async (req, res) => {
		// return if user is not admin
		if (!req.session.isAdmin) return res.redirect("/");
		// read log files as string
		const logFiles = {
			info: await fs.readFileSync("logs/info.log", { encoding: "utf8" }),
			pDebug: await fs.readFileSync("logs/player_debug.log", { encoding: "utf8" }),
			player: await fs.readFileSync("logs/player.log", { encoding: "utf8" }),
			errors: await fs.readFileSync("logs/errors.log", { encoding: "utf8" }),
			db: await fs.readFileSync("logs/dashboard.log", { encoding: "utf8" })
		};
		renderTemplate(res, req, "/admin/log.ejs", { logFiles });
	});

	app.get("/admin/guilds", checkAuth, (req, res) => {
		if (!req.session.isAdmin) return res.redirect("/");
		renderTemplate(res, req, "/admin/guilds.ejs", {});
	});

	app.post("/admin/reboot", checkAuth, req => {
		if (!req.session.isAdmin) return;
		client.log(
			"Info",
			"Shutdown",
			`Shutdown and reboot executed by ${req.user.username}#${req.user.discriminator} via dashboard/admin`
		);
		client.channels
			.get(client.config.log)
			.send(clientEmbeds.disconnect)
			.then(() => client.destroy());
	});

	// same as guild selection above
	app.get("/music", checkAuth, async (req, res) => {
		renderTemplate(res, req, "guild_selection.ejs", { music: true });
	});

	app.post("/music/:id/pause", checkAuth, async (req, res) => {
		const guildID = req.params.id,
			guild = client.guilds.get(guildID);
		if (!guild) return res.sendStatus(404);
		if (!guild.voiceConnection) return;
		if (!guild.voiceConnection.dispatcher) return;
		await guild.voiceConnection.dispatcher.pause();
		client.log("Player", "", `Paused with dashboard ${guildID}`);
		// send info message to guild if a mainchannel is defined
		if (client.settings.has(guildID, "mc")) {
			const color = client.settings.has(guildID, "color")
					? client.settings.get(guildID, "color")
					: client.config.colors.blue,
				lang = client.settings.has(guildID) ? client.settings.get(guildID, "lang") : "en",
				msg = new Discord.RichEmbed()
					.setColor(color)
					.setDescription(client.languageReplace(strings[lang].pause, req.user.id)),
				channel = client.settings.get(guildID, "mc");
			client.channels.get(channel).send(msg);
		}
	});

	app.post("/music/:id/resumePlay", checkAuth, async (req, res) => {
		const guildID = req.params.id,
			guild = client.guilds.get(guildID),
			user = await client.users.get(req.user.id),
			member = await guild.member(user);
		if (!guild) return;
		if (!guild.voiceConnection) {
			if (!member.voiceChannelID) {
				member.send("You're not in a voice channel!");
				res.redirect(`/music/${guild}`);
			} else {
				const c = await client.channels.get(member.voiceChannelID);
				c.join();
				return;
			}
		}
		if (!guild.voiceConnection.dispatcher) return;
		if (guild.voiceConnection.dispatcher.paused) guild.voiceConnection.dispatcher.resume();
		else return;
		client.log("Player", "", `Resumed with dashboard ${guildID}`);
		if (client.settings.has(guildID, "mc")) {
			const color = client.settings.has(guildID, "color")
					? client.settings.get(guildID, "color")
					: client.config.colors.blue,
				lang = client.settings.has(guildID) ? client.settings.get(guildID, "lang") : "en",
				msg = new Discord.RichEmbed()
					.setColor(color)
					.setDescription(client.languageReplace(strings[lang].resume, req.user.id)),
				channel = client.settings.get(guildID, "mc");
			client.channels.get(channel).send(msg);
		}
	});

	app.post("/music/:id/skip", checkAuth, async req => {
		const guildID = req.params.id,
			guild = client.guilds.get(guildID);
		if (!guild) return;
		if (!guild.voiceConnection) return;
		if (!guild.voiceConnection.dispatcher) return;
		await guild.voiceConnection.dispatcher.end();
		if (client.settings.has(guildID, "mc")) {
			const color = client.settings.has(guildID, "color")
					? client.settings.get(guildID, "color")
					: client.config.colors.blue,
				lang = client.settings.has(guildID) ? client.settings.get(guildID, "lang") : "en",
				msg = new Discord.RichEmbed()
					.setColor(color)
					.setDescription(client.languageReplace(strings[lang].skip, req.user.id)),
				channel = client.settings.get(guildID, "mc");
			client.channels.get(channel).send(msg);
		}
	});

	app.post("/music/:id/stop", checkAuth, async req => {
		const guildID = req.params.id,
			guild = client.guilds.get(guildID);
		if (!guild) return;
		if (!guild.voiceConnection) return;
		if (guild.voiceConnection.dispatcher)
			if (client.settings.has(guildID, "mc")) {
				const color = client.settings.has(guildID, "color")
						? client.settings.get(guildID, "color")
						: client.config.colors.blue,
					lang = client.settings.has(guildID) ? client.settings.get(guildID, "lang") : "en",
					msg = new Discord.RichEmbed()
						.setColor(color)
						.setDescription(client.languageReplace(strings[lang].stop, req.user.id)),
					channel = client.channels.get(guildID, "mc");
				client.channels.get(channel).send(msg);
			}
		guild.voiceConnection.disconnect();
	});

	app.post("/music/:id/add", checkAuth, async req => {
		const guild = req.params.id;
		if (req.body.title === "") {
			client.users.get(req.user.id).send("Please enter a title before submitting...");
			client.log(
				"Dashboard",
				"",
				`${req.user.username}#${req.user.discriminator} submitted empty form in add-form`
			);
			return;
		}
		client.log("Dashboard", "", `${req.body.title} submitted by ${req.user.username}`);
		search(req.body.title, opts, async (err, results) => {
			if (err) {
				client.users
					.get(req.user.id)
					.send("Your Search Query (Dashboard) didn't return any results");
				client.log("Error", "DB Search", err);
				return;
			}
			if (!client.queue[guild]) client.queue[guild] = [];
			const result = filterResults(results);
			client.queue[guild].push({
				title: result.title,
				link: result.link,
				req: req.user.id,
				reqTag: `${req.user.username}#${req.user.discriminator}`
			});
			if (client.settings.has(guild, "mc")) {
				const color = client.settings.has(guild, "color")
						? client.settings.get(guild, "color")
						: client.config.colors.blue,
					lang = client.settings.has(guild) ? client.settings.get(guild, "lang") : "en",
					msg = new Discord.RichEmbed()
						.setColor(color)
						.setDescription(client.languageReplace(strings[lang].addWS, result.title, req.user.id)),
					channel = client.settings.get(guild, "mc");
				client.channels.get(channel).send(msg);
			}
		});
	});

	app.post("/music/:id/remove", checkAuth, async (req, res) => {
		const guild = req.params.id;
		if (req.body.position == 0 && client.queue[guild].length === 1) client.queue[guild] = [];
		else client.queue[guild].splice(req.body.position, req.body.position);
		res.redirect(`/music/${guild}`);
		if (client.settings.has(guild, "mc")) {
			const color = client.settings.has(guild, "color")
					? client.settings.get(guild, "color")
					: client.config.colors.blue,
				lang = client.settings.has(guild) ? client.settings.get(guild, "lang") : "en",
				msg = new Discord.RichEmbed()
					.setColor(color)
					.setDescription(client.languageReplace(strings[lang].removed, req.user.id)),
				channel = client.settings.get(guild, "mc");
			client.channels.get(channel).send(msg);
		}
	});

	app.get("/music/:id/clear", checkAuth, async (req, res) => {
		const guild = req.params.id;
		if (!client.queue[guild]) return;
		const nowp = client.queue[guild][0];
		client.queue[guild] = [];
		client.queue[guild].push(nowp);
		if (client.settings.has(guild, "mc")) {
			const color = client.settings.has(guild, "color")
					? client.settings.get(guild, "color")
					: client.config.colors.blue,
				lang = client.settings.has(guild) ? client.settings.get(guild, "lang") : "en",
				msg = new Discord.RichEmbed()
					.setColor(color)
					.setDescription(client.languageReplace(strings[lang].cleared, req.user.id)),
				channel = client.settings.get(guild, "mc");
			client.channels.get(channel).send(msg);
		}
		res.redirect(`/music/${guild}`);
	});

	app.post("/music/:id/vl", checkAuth, async req => {
		const guildID = req.params.id,
			guild = client.guilds.get(guildID);
		// listed return if-statements cause the next one would throw err if one is false
		if (!guild) return;
		if (!guild.voiceConnection) return;
		if (!guild.voiceConnection.dispatcher) return;
		const dp = guild.voiceConnection.dispatcher;
		if (req.body.vl > 200) return client.users.get(req.user.id).send("Let my ears life bro :(");
		client.log("Player", "", `Volume changed on dashboard (${guildID})`);
		dp.setVolume(req.body.vl / 100);
	});

	app.post("/music/:id/shuffle", checkAuth, req => {
		const guild = req.params.id;
		if (!client.queue[guild] || !client.guilds.get(guild)) return;
		if (!client.queue[guild][1]) return;
		var i = client.queue[guild].length;
		if (i < 2) return;
		do {
			var zi = Math.floor(Math.random() * i),
				t = client.queue[guild][zi];
			client.queue[guild][zi] = client.queue[guild][--i];
			client.queue[guild][i] = t;
		} while (i);
		if (client.settings.has(guild, "mc")) {
			const color = client.settings.has(guild, "color")
					? client.settings.get(guild, "color")
					: client.config.colors.blue,
				lang = client.settings.has(guild) ? client.settings.get(guild, "lang") : "en",
				msg = new Discord.RichEmbed()
					.setColor(color)
					.setDescription(client.languageReplace(strings[lang].shuffled, req.user.id)),
				channel = client.settings.get(guild, "mc");
			client.channels.get(channel).send(msg);
		}
	});

	app.get("/music/:id/lyrics", (req, res) => {
		const guildID = req.params.id;
		let content = "No Queue on this guild....";
		if (!client.queue[guildID] || !client.queue[guildID][0])
			return renderTemplate(res, req, "lyrics.ejs", { content });
		const title = client.queue[guildID][0].title;
		request(`https://some-random-api.ml/lyrics?title=${title}`, (err, response, body) => {
			//if (err != null) console.log(err);
			content = JSON.parse(body);
			renderTemplate(res, req, "lyrics.ejs", { content });
		});
	});

	// demo page, linked in index
	// music.ejs demo without any actions
	app.get("/demo", async (req, res) => {
		renderTemplate(res, req, "demo.ejs", {});
	});

	app.get("/changes", async (req, res) => {
		const content = await fs.readFileSync("documentation/CHANGELOG.md", { encoding: "utf8" });
		renderTemplate(res, req, "changes.ejs", { content });
	});

	app.get("/guilds/:id/settings", checkAuth, async (req, res) => {
		const guild = req.params.id,
			lang = client.settings.get(guild, "lang"),
			prefix = client.settings.has(guild, "prefix")
				? client.settings.get(guild, "prefix")
				: client.config.prefix;
		renderTemplate(res, req, "settings.ejs", { guild, lang, prefix });
	});

	// language switch button on settings page
	app.post("/guilds/:id/settings/lang/", checkAuth, async req => {
		const guild = req.params.id,
			guildLanguage = req.body.lang;
		if (guildLanguage === "en") {
			client.settings.set(guild, "de", "lang");
		} else {
			client.settings.set(guild, "en", "lang");
		}
	});

	// prefix setting on settings page
	app.post("/guilds/:id/settings/prefix", checkAuth, async req => {
		const guild = req.params.id,
			newPrefix = req.body.newPrefix;
		if (newPrefix.length === 0) return;
		client.settings.set(guild, newPrefix, "prefix");
	});

	// color picker on settings page
	app.post("/guilds/:id/settings/theme", checkAuth, async req => {
		const guild = req.params.id,
			newColor = req.body.color;
		client.log("Info", "", `New Color Theme ${newColor} on ${guild}`);
		client.settings.set(guild, newColor, "color");
	});

	// selector for npmsg config
	app.post("/guilds/:id/settings/npmsg", checkAuth, async req => {
		const guild = req.params.id,
			setting = req.body.value;
		client.log("Info", "", `Np-message config changed to ${setting} on ${guild}`);
		client.settings.set(guild, setting, "npmsg");
	});

	// selector for empty voicechannel configuration
	app.post("/guilds/:id/settings/emptyc", checkAuth, async req => {
		const guild = req.params.id,
			setting = req.body.value;
		client.log("Info", "", `Empty-channel config changed to ${setting} on ${guild}`);
		client.settings.set(guild, setting, "emptyc");
	});

	// feedback formular on index page
	app.post("/feedback", async req => {
		const name = req.body.name,
			email = req.body.email,
			message = req.body.message;

		client.users.get(client.config.owner).send(`[${name}] - [${email}]: ${message}`);
	});

	app.get("/impressum", (req, res) => {
		renderTemplate(res, req, "impressum.ejs", {});
	});

	app.get("/sitemap", (req, res) => {
		renderTemplate(res, req, "sitemap.ejs", {});
	});

	app.get("*", (req, res) => {
		res.status(404);
		if (req.accepts("html")) return renderTemplate(res, req, "404.ejs");
		if (req.accepts("json")) return res.send({ error: "Page not found" });
		res.type("txt").send("Page not found");
	});

	// create https and http server
	https.createServer(httpsOpts, app).listen(client.config.dashboard.https);
	app.listen(client.config.dashboard.http);
};
