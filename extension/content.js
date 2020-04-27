// Created by Adam Thompson-Sharpe on 19/04/2020.
// Licensed under MIT.
class DisneyPlusTogether {
    constructor(displayName, server="localhost", port=2626) {
        // Initialize WebSocket over TLS (Must be TLS-signed or it can't be connected to by an HTTPS site)
        this._ws = new WebSocket(`ws://${server}:${port}`);

        // Functions to run on certain events
        this.onconnect = function() {}
        this.ongroupcreate = function() {}
        this.ongroupjoin = function() {}

        // When WebSocket opens
        this._ws.addEventListener("open", (event) => {
            // Request initialization with display name
            this._ws.send(`INIT:${displayName}`);
        });

        // Handle received messages
        this._ws.addEventListener("message", (event) => {
            // // Message was a session token
            // if(event.data.substring(0, 4) == "STK:") {
            //     this._stk = event.data.substring(4);
            //     console.log("Received token: " + this._stk);

            // Message was an initialization confirmation
            if(event.data.substring(0, 7) == "INIT:OK") {
                console.log("Initialized.");
                // Run the onconnect function
                this.onconnect();

            // Message was a group token for a created group
            } else if(event.data.substring(0, 5) == "CGTK:") {
                this._gtk = event.data.substring(5);
                console.log("Created group: " + this._gtk);
                // Create chat window
                this._createWindow();
                // Run the ongroupcreate function
                this.ongroupcreate();
            
            // Message was a chat message
            } else if(event.data.substring(0, 5) == "CHAT:") {
                console.log("Received chat message.");
                let params = event.data.split(":");
                // Add message to chat window
                this._addMessage(params[1], params[2]);
            
            // Message was a group join confirmation
            } else if(event.data.substring(0, 3) == "JG:") {
                this._gtk = event.data.substring(3);
                console.log("Joined group: " + this._gtk);
                // Create chat window
                this._createWindow();
                // Run the ongroupjoin function
                this.ongroupjoin();

            // Message was an error of some kind
            } else if(event.data.substring(0, 5) == "FAIL:") {
                console.error(event.data.substring(5));
            
            // Message was to play the video
            } else if(event.data.substring(0, 4) == "PLAY") {
                console.log("Playing video...");
                document.getElementsByTagName("video")[0].play();
            
            // Message was to pause the video
            } else if(event.data.substring(0, 5) == "PAUSE") {
                console.log("Pausing video...");
                document.getElementsByTagName("video")[0].pause();
            
            // Message was a new video position
            } else if(event.data.substring(0, 4) == "POS:") {
                console.log("Setting video time to " + event.data.substring(4));
                document.getElementsByTagName("video")[0].currentTime = parseFloat(event.data.substring(4));
            
            // Unknown message
            } else {
                console.log("Unknown message: " + event.data);
            }
        });
    }

    _createWindow() {
        // Create main window
        this._dpTogetherWindow = document.createElement("div");
        // Set main window style
        this._dpTogetherWindow.style.width = "20%";
        this._dpTogetherWindow.style.height = "100%";
        this._dpTogetherWindow.style.float = "right";
        this._dpTogetherWindow.style.position = "relative";
        this._dpTogetherWindow.style.padding = "5px";
        this._dpTogetherWindow.style.backgroundColor = "#334";

        // Put group token at top
        let gtk = document.createElement("h3");
        gtk.innerHTML = "Code:<br>" + this._gtk;
        gtk.style.textAlign = "center";
        gtk.style.color = "white";

        // Add token to window
        this._dpTogetherWindow.appendChild(gtk);

        // Create div to hold messages
        let messageArea = document.createElement("div");
        // Set message area style
        messageArea.style.margin = "4px";
        messageArea.style.overflowX = "hidden";
        messageArea.style.overflowY = "auto";
        messageArea.style.height = "82%";
        messageArea.style.color = "white";
        messageArea.style.display = "flex";
        messageArea.style.flexDirection = "column-reverse";

        // Add message area to window
        this._dpTogetherWindow.appendChild(messageArea);

        // Create textarea for messages
        let messageBox = document.createElement("textarea");
        messageBox.rows = 4;
        // Set message box style
        messageBox.style.bottom = "5px";
        messageBox.style.position = "absolute";
        messageBox.style.width = "97%";
        messageBox.autocapitalize = "off";
        messageBox.autocomplete = "off";
        // Add eventlistener to send message
        messageBox.onkeyup = (event) => {
            if(event.key === "Enter") {
                this.sendMessage(messageBox.value);
                messageBox.value = "";
            }
        };

        // Add message box to window
        this._dpTogetherWindow.appendChild(messageBox);

        // Create button to send message
        let sendButton = document.createElement("button");
        // Set button style
        sendButton.style.bottom = "5px";
        sendButton.style.position = "absolute";
        sendButton.style.width = "97%";
        // Set button text
        sendButton.innerText = "Send";
        // Add eventlistener to send message
        sendButton.onclick = (event) => {
            this.sendMessage(messageBox.value);
            messageBox.value = "";
        }

        // Add button to window
        this._dpTogetherWindow.appendChild(sendButton);
        
        // Add window to right of player
        document.getElementById("hudson-wrapper").appendChild(this._dpTogetherWindow);
    }

    _addMessage(senderName, message) {
        // Adds a message to the main window
        if(this._dpTogetherWindow !== undefined) {
            // Create message div
            let msg = document.createElement("div");

            // Create name on message
            let name = document.createElement("b");
            name.innerText = senderName;

            // Add message content
            let content = document.createElement("span");
            content.innerText = message;

            // Add name & content to message
            msg.appendChild(name);
            msg.appendChild(document.createElement("br"));
            msg.appendChild(content);

            try {
                // Add message to window
                this._dpTogetherWindow.children[1].insertBefore(msg, this._dpTogetherWindow.children[1].firstChild);
                // Add line break for next message
                this._dpTogetherWindow.children[1].insertBefore(document.createElement("br"), this._dpTogetherWindow.children[1].firstChild);
            } catch {
                // Add message to window
                this._dpTogetherWindow.children[1].appendChild(msg);
                // Add line break for next message
                this._dpTogetherWindow.children[1].insertBefore(document.createElement("br"), this._dpTogetherWindow.children[1].firstChild);
            }
        }
    }

    createGroup() {
        // Request to create a group
        this._ws.send("CREATE_GROUP");
    }

    joinGroup(gtk) {
        // Request to join group
        this._ws.send(`JOIN_GROUP:${gtk}`);
    }

    playVideo() {
        // Play the video
        this._ws.send(`PLAY:${this._gtk}`);
    }

    pauseVideo() {
        // Pause the video
        this._ws.send(`PAUSE:${this._gtk}`);
    }

    setOptions(creatorControlOnly="OFF") {
        // Change a created group's settings
        // creatorControlOnly - Whether or not the group creator is the only one allowed to play/pause/move through video
        this._ws.send(`SET:${creatorControlOnly}`);
    }

    setVideoPosition(position) {
        // Set the current position in the video
        this._ws.send(`SET_POS:${this._gtk}:${position}`);
    }

    sendMessage(message) {
        // Send a message to the group members
        this._ws.send(`CHAT:${this._gtk}:${message}`);
    }
};

var dpt;
var lastTime = 0;

function initializeVidListeners() {
    // Set up video event listeners (play, pause, time)
    document.getElementsByTagName("video")[0].onplay = () => {
        dpt.playVideo();
    }
    document.getElementsByTagName("video")[0].onpause = () => {
        dpt.pauseVideo();
        dpt.setVideoPosition(document.getElementsByTagName("video")[0].currentTime);
    }
    document.getElementsByTagName("video")[0].ontimeupdate = () => {
        // Check if video time has changed significantly
        if(document.getElementsByTagName("video")[0].currentTime - lastTime >= -1 && document.getElementsByTagName("video")[0].currentTime - lastTime <= 1) {
            lastTime = document.getElementsByTagName("video")[0].currentTime;
        } else {
            dpt.setVideoPosition(document.getElementsByTagName("video")[0].currentTime);
            lastTime = document.getElementsByTagName("video")[0].currentTime;
        }
    }
}

// Handle requests from the extension
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // Message was to create a group
        if(request.command == "CREATE") {
            dpt = new DisneyPlusTogether(request.name, request.server);
            // On DPT group create tell the extension group is ready
            dpt.onconnect = () => {
                dpt.createGroup();
            }
            dpt.ongroupcreate = () => {
                chrome.runtime.sendMessage({result: "CODE", code: dpt._gtk}, function(response) {});
                initializeVidListeners();
            };
            sendResponse({result: "PROCESSING"});
        
        // Message was to join a group
        } else if(request.command == "JOIN") {
            dpt = new DisneyPlusTogether(request.name, request.server);
            // On DPT group join tell the extension group is ready
            dpt.onconnect = () => {
                dpt.joinGroup(request.group);
            };
            dpt.ongroupjoin = () => {
                chrome.runtime.sendMessage({result: "CODE", code: dpt._gtk}, function(response) {});
                initializeVidListeners();
            };
            sendResponse({result: "PROCESSING"});
        } else {
            sendResponse({result: "UNKNOWN"});
        }
    });
