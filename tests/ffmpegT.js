/**
 * @author Johann Laur
 * @description Seperate module that creates its own disord client
 * Test ffmpeg argument manipulation using prism
 */

const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const prism = require("prism-media");

const config = require("../config/dev_conf.json");

const client = new Discord.Client();

/* prettier-ignore */
let transcoder = new prism.FFmpeg({
    args: [
        "-analyzeduration", "0",
        "-loglevel", "0",
        "-f", "s16le",
        "-ar", "48000",
        "-ac", "2",
        "-af", "bass=g=15, vibrato=f=6.5, aecho=in_gain=0.6",
    ]
});

client.on("ready", () => console.log("FFMPEG Client Ready"));

client.on("message", message => {
  if (!message.content.startsWith(config.prefix)) return;
  if (message.author.bot) return;
  const arguments = message.content
    .slice(config.prefix.length)
    .trim()
    .split(/ +/g);
  const command = arguments.shift().toLowerCase();

  if (command === "start") {
    if (!message.member.voice.channel) return;
    message.member.voice.channel.join().then(async connection => {
      let inputStream = await ytdl("https://www.youtube.com/watch?v=PpzWRxCMGOs", {
        filter: "audioonly"
      });
      console.log("downloaded");
      let output = inputStream.pipe(transcoder);
      connection.play(output, { type: "converted" });
      connection.on("error", err => console.log(err));
      connection.dispatcher.on("start", () => console.log("start stream playing"));
      connection.dispatcher.on("debug", d => console.log(d));
      connection.dispatcher.on("end", () => connection.channel.leave());
      connection.dispatcher.on("error", err => console.log(err));
    });
  }
});

client.login(config.token);
