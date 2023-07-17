// background.js
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        let url = new URL(details.url);
        if (url.pathname.startsWith('/i/api/graphql') && url.searchParams.get('variables').includes('UserByScreenName')) {
            fetch(details.url)
                .then(response => response.json())
                .then(data => {
                    let bio = data.data.user.legacy.description;
                    let username = data.data.user.legacy.screen_name;
                    if (bio.includes('onlyfans.com')) {
                        chrome.storage.local.get(['blockedUsers'], function (result) {
                            let blockedUsers = result.blockedUsers || [];
                            if (!blockedUsers.includes(username)) {
                                blockedUsers.push(username);
                                chrome.storage.local.set({ blockedUsers: blockedUsers });
                            }
                        });
                    }
                })
                .catch(console.error);
        }
    },
    { urls: ['<all_urls>'] }
);
