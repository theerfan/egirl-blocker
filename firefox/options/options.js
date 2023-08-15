
document.addEventListener("DOMContentLoaded", function() {
    // Load saved phrases when the options page is opened
    browser.storage.local.get("egirlblocker-filterPhrases", function(data) {
        if (data.filterPhrases) {
            document.getElementById("phraseList").value = data.filterPhrases.join("\n");
        }
    });

    // Save custom phrases when the "Save" button is clicked
    document.getElementById("saveButton").addEventListener("click", function() {
        const phrases = document.getElementById("phraseList").value.split("\n").filter(Boolean);
        browser.storage.local.set({filterPhrases: phrases}, function() {
            alert("Filter phrases saved!");
        });
    });
});
