module.exports = (client, rateLimitInfo) => {
	client.log(
		"Error",
		"Rate Limited",
		`Limit: ${rateLimitInfo.requestLimit}, Time Difference: ${
			rateLimitInfo.timeDifference
		}, Method: ${rateLimitInfo.method}, Path: ${rateLimitInfo.path}`
	);
};
