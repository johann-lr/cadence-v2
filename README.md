# Cadence [![Build Status](https://travis-ci.com/johann-lr/Cadence.svg?token=bNJrJyNp7mTCf8zvF5QZ&branch=dev)](https://travis-ci.com/johann-lr/Cadence)

![Codacy](https://img.shields.io/codacy/grade/dfe5a6883b0343b4835dabcf8911a8f2/dev.svg?logo=codacy&style=for-the-badge)
![Version](https://img.shields.io/badge/version-v2.0.0-blue.svg?style=for-the-badge)
![Dashboard Version](https://img.shields.io/badge/dashboard_version-v1.2-blue.svg?style=for-the-badge)
![Discord](https://img.shields.io/discord/509751546729463819.svg?logo=discord&style=for-the-badge)

---

## Notice!

This repository contains the old version (v2). The client has been rewritten with the latest libraries and coding standards (v3) using Typescript. This rewrite can be tested on every discord server: <https://discordapp.com/api/oauth2/authorize?client_id=698914997400502272&permissions=36792384&scope=bot>
The source code will be released later after final client release.

**Cadence Music Bot for discord** <br>
Language support for german, english and spanish (french coming soon)

Homepage & Dashboard: <https://musicbot.ga/> <br>
Join the bot's server: <https://discord.gg/tgmJRc7>

## Usage

-   Node version 10.15.3 or 11 (12 might not work correctly)
-   ffmpeg installation for audio
-   Start options:
    -   `-w` write mode - logging outputs are going to be written in .log files
    -   `-s` safe mode - additional script that checks installations is run first

### FFmpeg

On Linux systems: ffmpeg can be installed via apt or apt-get <br>
On darwin: third party package managers (like homebrew and macports) could have some missing dependencies that'll cause an error
=> Clone FFmpeg github repo and follow instructions from Install.md

<a href="./documentation/docker.md">More information regarding cadence with docker (compose)</a>

### Files

-   Install modules: `npm install --save` / `npm ci` (with package-lock file) <br> **Node needs to build some packages that have c/cpp headers, so at least 500MB of free RAM are required** <br>
-   For ssl-certificates: `mkdir keys` <br>
-   create self-signed certs with openssl: `openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out cert.pem` <br>
    (or use authorized software like certbot/letsencrypt)
-   For log files: `mkdir logs` -> To activate logfile writing run the bot with `-w`, for safe mode use `-s` (runs bootstrap.js first)

### API Credentials

-   Youtube (Search) Google API Key (<https://console.developers.google.com/apis/dashboard>)
-   Token, client id, oauth secret token from discord application page (<https://discordapp.com/developers>)

### Information

Created by Johann Laur
Support via discord (see above) or email associated with github account (<jl.01@icloud.com>) - Do not hesitate asking any further questions
