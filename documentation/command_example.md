# Command files

Sample for command files in src/commands
Require modules outside of exports-blocks at the beginning

```js
// command code
exports.run = async (client, message, args, Discord, guildStrings, guildTheme) => {};

exports.config = {
	requiresAdmin: Boolean,
	requiresArg: Boolean,
	enabled: Boolean,
	alias: ["Strings with alias commands"]
};
```
