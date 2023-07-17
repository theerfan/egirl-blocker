// background.js
let blockedUsers = [];

// Function to fetch user bio and check for OnlyFans link
async function checkBio(username) {
  const response = await fetch(`https://api.twitter.com/2/users/by?usernames=${username}`); // This requires bearer token
  const userData = await response.json();

  if (userData.data[0].description.includes('onlyfans.com')) {
    blockedUsers.push(username);
  }
}

// Function to modify the content of Twitter pages
function modifyTwitter() {
  // Get all tweet elements
  // This one is wrong, should be replaced with "article" selectors
  const tweets = document.querySelectorAll('.tweet');

  // Loop over each tweet
  tweets.forEach(tweet => {
    // Get the username for this tweet
    const username = tweet.getAttribute('data-screen-name');

    // If this user is in our blocked list, hide the tweet
    if (blockedUsers.includes(username)) {
      tweet.style.display = 'none';
    }
  });
}

// Listen for web requests
// browser.webRequest.onBeforeRequest.addListener(
//   details => {
//     const url = new URL(details.url);
//     const parts = url.pathname.split('/');

//     if (parts[1] === 'i' && parts[2] === 'web' && parts[3] === 'status') {
//       const username = parts[4];
//       checkBio(username);
//       modifyTwitter();
//     }
//   },
//   { urls: ['*://*.twitter.com/*'] },
//   ['blocking']
// );

// Listen for page refresh
browser.webNavigation.onHistoryStateUpdated.addListener(
  details => {
    modifyTwitter();
  },
  { url: [{ urlMatches: 'https://twitter.com/*' }] }
);

browser.webNavigation.onCompleted.addListener(
  details => {
    modifyTwitter();
  },
  { url: [{ urlMatches: 'https://twitter.com/*' }] }
);

function listener(details) {
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();

  if (details.url.includes("HomeTimeline")) {
    console.log("HomeTimeline");
  }
  else {
    return {};
  }

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
      let tweets = json["data"]["home"]["home_timeline_urt"]["instructions"][0]["entries"];
      for (let i = 0; i < tweets.length; i++) {
        if (tweets[i]["entryId"].includes("tweet")) {
          user = tweets[i]["content"]["itemContent"]["tweet_results"]["results"]["core"]["user_results"]["result"]["legacy"];
          user_urls = user["entities"]["url"]["urls"];
          // If user's url contains "onlyfans.com", or "fansly.com", then block the tweet
          for (let j = 0; j < user_urls.length; j++) {
            if (user_urls[j]["expanded_url"].includes("onlyfans.com") || user_urls[j]["expanded_url"].includes("fansly.com")) {
              tweets.splice(i, 1);
              i--;
              break;
            }
          }
        }
      }
      // Replace the original tweets with the filtered tweets

      json["data"]["user"]["result"]["timeline"]["timeline"]["instructions"][0]["entries"] = tweets;
      str = JSON.stringify(json);
      filter.write(encoder.encode(str));
      filter.close();
    }
    catch (err) {
      console.log(err);
      filter.close();
      // filter.disconnect();
    }
  };
}

browser.webRequest.onBeforeRequest.addListener(
  listener,
  { urls: ["https://twitter.com/i/api/graphql/*"], },
  // { urls: ["https://example.com/*"], types: ["main_frame"] },
  ["blocking"],
);