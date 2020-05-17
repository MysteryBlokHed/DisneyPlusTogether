// Created by Adam Thompson-Sharpe on 19/04/2020.
// Licensed under MIT.
class DisneyPlusTogether {
    constructor(displayName, server="localhost", port=2626) {
        // Initialize WebSocket over TLS (Must be TLS-signed or it can't be connected to by an HTTPS site)
        this._ws = new WebSocket(`wss://${server}:${port}`);

        // Functions to run on certain events
        this.onconnect = function() {};
        this.ongroupcreate = function() {};
        this.ongroupjoin = function() {};

        // Avoid essentially DOSing the server with play/pauses by tracking if updates were done by user or in the backend
        this.justPlayed = false;
        this.justPaused = false;
        this.justSet = false;

        // When WebSocket opens
        this._ws.addEventListener("open", () => {
            // Request initialization with display name
            let urlEnd = window.location.pathname.split("/")[2];
            this._ws.send(`INIT\uffff${displayName}\uffff${urlEnd}`);
        });

        // Handle received messages
        this._ws.addEventListener("message", () => {
            // // Message was a session token
            // if(event.data.substring(0, 4) == "STK:") {
            //     this._stk = event.data.substring(4);
            //     console.log("Received token: " + this._stk);

            // Message was an initialization confirmation
            if(event.data.substring(0, 7) == "INIT\uffffOK") {
                console.log("Initialized.");
                // Run the onconnect function
                this.onconnect();

            // Message was a group token for a created group
            } else if(event.data.substring(0, 5) == "CGTK\uffff") {
                this._gtk = event.data.substring(5);
                console.log("Created group: " + this._gtk);
                // Create chat window
                this._createWindow();
                // Run the ongroupcreate function
                this.ongroupcreate();
            
            // Message was a chat message
            } else if(event.data.substring(0, 5) == "CHAT\uffff") {
                console.log("Received chat message.");
                let params = event.data.split("\uffff");
                // Add message to chat window
                this._addMessage(params[1], params[2]);

            // Message was an update (eg. play/pause)
            } else if(event.data.substring(0, 5) == "NOTE\uffff") {
                console.log("Received status update.");
                let params = event.data.split("\uffff");
                // Add to window
                this._addMessage(params[1], "", "gray");
            
            // Message was a group join confirmation
            } else if(event.data.substring(0, 3) == "JG\uffff") {
                let params = event.data.split("\uffff");
                this._gtk = params[1];

                // Check if the URL is correct and change it if not
                if(params[4] != window.location.pathname.split("/")[2])
                    window.location.pathname = "/video/" + params[4];
                
                // Update video to proper location and play/pause state
                if(params[2] == "True")
                    document.getElementsByTagName("video")[0].play();
                else
                    document.getElementsByTagName("video")[0].pause();
                document.getElementsByTagName("video")[0].currentTime = parseFloat(params[3]);

                console.log("Joined group: " + this._gtk);
                // Create chat window
                this._createWindow();
                // Run the ongroupjoin function
                this.ongroupjoin();

            // Message was an error of some kind
            } else if(event.data.substring(0, 5) == "FAIL\uffff") {
                console.error(event.data.substring(5));
            
            // Message was to play the video
            } else if(event.data.substring(0, 4) == "PLAY") {
                this.justPlayed = true;
                console.log("Playing video...");
                document.getElementsByTagName("video")[0].play();
            
            // Message was to pause the video
            } else if(event.data.substring(0, 5) == "PAUSE") {
                this.justPaused = true;
                console.log("Pausing video...");
                document.getElementsByTagName("video")[0].pause();
            
            // Message was a new video position
            } else if(event.data.substring(0, 4) == "POS\uffff") {
                this.justSet = true;
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
        gtk.innerText = "Group Name: " + this._gtk;
        gtk.style.textAlign = "center";
        gtk.style.color = "white";

        // Add token to window
        this._dpTogetherWindow.appendChild(gtk);

        // Add password under group token
        let passText = document.createElement("span");
        passText.style.color = "white";
        passText.style.fontWeight = "bold";
        passText.style.fontSize = "1.2em";
        passText.innerText = "Password: ";

        let pass = document.createElement("span");
        pass.style.color = "white";
        pass.style.backgroundColor = "white";
        pass.innerText = this._password;
        
        // Mouse enter/leave events to hide password
        pass.onmouseenter = () => pass.style.backgroundColor = "";
        pass.onmouseleave = () => pass.style.backgroundColor = "white";

        passText.appendChild(pass);

        // Add password to window
        this._dpTogetherWindow.appendChild(passText);

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

    _addMessage(senderName, message, color=undefined) {
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

            // Set color if specified
            if(color !== undefined)
                msg.style.color = color;

            // Add name & content to message
            msg.appendChild(name);
            msg.appendChild(document.createElement("br"));
            msg.appendChild(content);

            try {
                // Add message to window
                this._dpTogetherWindow.children[2].insertBefore(msg, this._dpTogetherWindow.children[2].firstChild);
                // Add line break for next message
                this._dpTogetherWindow.children[2].insertBefore(document.createElement("br"), this._dpTogetherWindow.children[2].firstChild);
            } catch {
                // Add message to window
                this._dpTogetherWindow.children[2].appendChild(msg);
                // Add line break for next message
                this._dpTogetherWindow.children[2].insertBefore(document.createElement("br"), this._dpTogetherWindow.children[2].firstChild);
            }
        }
    }

    createGroup(ownerControls, groupName, password) {
        // Get current video
        let urlEnd = window.location.pathname.split("/")[2];
        // Request to create a group
        console.log(`CREATE_GROUP\uffff${groupName}\uffff${password}\uffff${ownerControls}\uffff${urlEnd}`);
        this._ws.send(`CREATE_GROUP\uffff${groupName}\uffff${password}\uffff${ownerControls}\uffff${urlEnd}`);
        // Store password so it can be added to the window
        this._password = password;
    }

    joinGroup(gtk, password) {
        // Request to join group
        this._ws.send(`JOIN_GROUP\uffff${gtk}\uffff${password}`);
        // Store password so it can be added to the window
        this._password = password;
    }

    playVideo() {
        this._ws.send(`PLAY\uffff${this._gtk}`);
    }

    pauseVideo() {
        this._ws.send(`PAUSE\uffff${this._gtk}`);
    }

    setVideoPosition(position) {
        this._ws.send(`SET_POS\uffff${this._gtk}\uffff${position}`);
    }

    sendMessage(message) {
        // Send a message to the group members
        this._ws.send(`CHAT\uffff${this._gtk}\uffff${message}`);
    }
};

console.log(_ws);

var dpt;
var lastTime = 0;

function initializeVidListeners() {
    // Set up video event listeners (play, pause, time)
    document.getElementsByTagName("video")[0].onplay = () => {
        if(!dpt.justPlayed)
            dpt.playVideo();
        dpt.justPlayed = false;
    }
    document.getElementsByTagName("video")[0].onpause = () => {
        if(!dpt.justPaused) {
            dpt.pauseVideo();
            dpt.setVideoPosition(document.getElementsByTagName("video")[0].currentTime);
        }
        dpt.justPaused = false;
    }
    document.getElementsByTagName("video")[0].ontimeupdate = () => {
        // Check if video time has changed significantly
        if(document.getElementsByTagName("video")[0].currentTime - lastTime >= -1 && document.getElementsByTagName("video")[0].currentTime - lastTime <= 1) {
            lastTime = document.getElementsByTagName("video")[0].currentTime;
        } else {
            if(!dpt.justSet)
                dpt.setVideoPosition(document.getElementsByTagName("video")[0].currentTime);
            lastTime = document.getElementsByTagName("video")[0].currentTime;
            dpt.justSet = false;
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
            dpt.onconnect = () => dpt.createGroup(request.ownerControls, request.group, request.password);
            dpt.ongroupcreate = () => {
                chrome.runtime.sendMessage({result: "CODE", code: dpt._gtk}, function(response) {});
                initializeVidListeners();
            };
            sendResponse({result: "PROCESSING"});
        
        // Message was to join a group
        } else if(request.command == "JOIN") {
            dpt = new DisneyPlusTogether(request.name, request.server);
            // On DPT group join tell the extension group is ready
            dpt.onconnect = () => dpt.joinGroup(request.group, request.password);
            dpt.ongroupjoin = () => {
                chrome.runtime.sendMessage({result: "CODE", code: dpt._gtk}, function(response) {});
                initializeVidListeners();
            };
            sendResponse({result: "PROCESSING"});
        } else {
            sendResponse({result: "UNKNOWN"});
        }
    });
