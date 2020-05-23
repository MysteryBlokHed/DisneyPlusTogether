// Created by Adam Thompson-Sharpe on 26/04/2020.
var nameElement = document.getElementById("name");
var server = document.getElementById("server");
var groupJoinId = document.getElementById("groupJoinId");
var groupPassword = document.getElementById("groupPassword");
var ownerControls = document.getElementById("ownerControls");

function getCheckStatus(checkboxElement) {
    if(checkboxElement.checked) return "ON";
    else return "OFF";
}

// Set button click actions
document.getElementById("createButton").onclick = () => {
    console.log(nameElement);
    // Initialize and create a group
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            command: "CREATE",
            name: nameElement.value,
            server: server.value,
            group: groupJoinId.value,
            password: groupPassword.value,
            ownerControls: getCheckStatus(ownerControls)
        }, function(response) {});
    });
};

document.getElementById("joinButton").onclick = () => {
    // Initialize and join a group
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            command: "JOIN",
            name: nameElement.value,
            server: server.value,
            group: groupJoinId.value,
            password: groupPassword.value,
        }, function(response) {});
    });
};

// Get responses from content script
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // Group code
        if(request.result == "CODE") {
            // Change popup dimensions
            document.body.parentElement.style.height = "200px";
            document.body.style.height = "200px";
            document.getElementById("content").innerHTML = `<h1>Group Code: ${request.code}</h1>`;
        }
        sendResponse({o: "k"});
    });
