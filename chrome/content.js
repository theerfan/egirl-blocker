// content.js
function hideBlockedTweets() {
    chrome.storage.local.get(['blockedUsers'], function (result) {
        let blockedUsers = result.blockedUsers || [];

        let tweets = document.querySelectorAll('.tweet');
        for (let tweet of tweets) {
            let username = tweet.getAttribute('data-screen-name');
            if (blockedUsers.includes(username)) {
                tweet.style.display = 'none';
            }
        }
    });
}

// Run the function whenever the page updates
new MutationObserver(hideBlockedTweets).observe(document, { childList: true, subtree: true });
