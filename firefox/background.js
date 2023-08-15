let filterPhrases = ["onlyfans.com", "fansly.com"];

// Load saved custom filter phrases from storage
browser.storage.local.get("egirlblocker-filterPhrases", function (data) {
    if (data.filterPhrases && data.filterPhrases.length) {
        filterPhrases = filterPhrases.concat(data.filterPhrases);
    }
});

function listener(details) {
    const filter = browser.webRequest.filterResponseData(details.requestId);
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();

    const data = [];
    filter.ondata = (event) => {
        data.push(event.data);
    };

    filter.onstop = (event) => {
        let str = "";
        if (data.length === 1) {
            str = decoder.decode(data[0]);
        } else {
            for (let i = 0; i < data.length; i++) {
                let stream = i !== data.length - 1;
                str += decoder.decode(data[i], { stream });
            }
        }
        const json = JSON.parse(str);
        try {
            let tweets = [];
            if (details.url.includes("HomeTimeline")) {
                tweets = json["data"]["home"]["home_timeline_urt"]["instructions"][0]["entries"];
            }
            else if (details.url.includes("UserTweets")) {
                tweets = json["data"]["user"]["result"]["timeline_v2"]["timeline"]["instructions"][0]["entries"];
            }
            else if (details.url.includes("TweetDetail")) {
                tweets = json["data"]["threaded_conversation_with_injections"]["instructions"][0]["entries"];
            }
            else {
                filter.write(encoder.encode(str));
                filter.close();
                return {};
            }
            for (let i = 0; i < tweets.length; i++) {
                entry_id = tweets[i]["entryId"];
                if (entry_id.includes("tweet") || entry_id.includes("conversationthread")) {
                    user = tweets[i]["content"]["itemContent"]["tweet_results"]["results"]["core"]["user_results"]["result"]["legacy"];
                    user_bio = user["description"];
                    // If user's bio contains the filter phrases, then block the tweet
                    if (filterPhrases.some(phrase => user_bio.includes(phrase))) {
                        tweets.splice(i, 1);
                        i--;
                        continue;
                    }
                    user_urls = user["entities"]["url"]["urls"];
                    // If user's urls contains the filter phrases, then block the tweet
                    for (let j = 0; j < user_urls.length; j++) {
                        const exp_url = user_urls[j]["expanded_url"];
                        if (filterPhrases.some(phrase => exp_url.includes(phrase))) {
                            tweets.splice(i, 1);
                            i--;
                            break;
                        }
                    }
                }
            }
            // Replace the original tweets with the filtered tweets
            if (details.url.includes("HomeTimeline")) {
                json["data"]["home"]["home_timeline_urt"]["instructions"][0]["entries"] = tweets;
            }
            else if (details.url.includes("UserTweets")) {
                json["data"]["user"]["result"]["timeline_v2"]["timeline"]["instructions"][0]["entries"] = tweets;
            }
            else if (details.url.includes("TweetDetail")) {
                json["data"]["threaded_conversation_with_injections"]["instructions"][0]["entries"] = tweets;
            }

            str = JSON.stringify(json);
            filter.write(encoder.encode(str));
            filter.close();
        }
        catch (err) {
            console.log(err);
            filter.write(encoder.encode(str));
            filter.close();
        }
    };
}

browser.webRequest.onBeforeRequest.addListener(
    listener,
    { urls: ["https://twitter.com/i/api/graphql/*"], },
    ["blocking"],
);
