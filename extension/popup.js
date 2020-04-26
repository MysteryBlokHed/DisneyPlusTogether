// Created by Adam Thompson-Sharpe on 19/04/2020.
// Licensed under MIT.
class DisneyPlusTogether {
    constructor(server="localhost", port=2626) {
        // Initialize WebSocket over TLS (Must be TLS-signed or it can't be connected to by an HTTPS site)
        this._ws = new WebSocket(`wss://${server}:${port}`);

        // When WebSocket opens
        this._ws.addEventListener("open", (event) => {
            // Request a session
            this._ws.send("GET_SESSION");
        });

        // Handle received messages
        this._ws.addEventListener("message", (event) => {
            // Message was a session token
            if(event.data.substring(0, 4) == "STK:") {
                this._stk = event.data.substring(4);
                console.log("Received token: " + this._stk);

            // Message was a group token for a created group
            } else if(event.data.substring(0, 5) == "CGTK:") {
                this._gtk = event.data.substring(5);
                console.log("Created group: " + this._gtk);
                // Create chat window
                this._createWindow();
            
            // Message was a group join confirmation
            } else if(event.data.substring(0, 3) == "JG:") {
                this._gtk = event.data.substring(3);
                console.log("Joined group: " + this._gtk);
                // Create chat window
                this._createWindow();

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
        let dpTogetherWindow = document.createElement("div");
        // Set main window style
        dpTogetherWindow.style.width = "20%";
        dpTogetherWindow.style.height = "100%";
        dpTogetherWindow.style.float = "right";
        dpTogetherWindow.style.position = "relative";
        dpTogetherWindow.style.padding = "5px";
        dpTogetherWindow.style.backgroundColor = "#334";

        // Create textarea for messages
        let messageBox = document.createElement("textarea");
        messageBox.rows = 4;
        // Set message box style
        messageBox.style.bottom = "5px";
        messageBox.style.position = "absolute";
        messageBox.style.width = "97%";
        messageBox.autocapitalize = "off";
        messageBox.autocomplete = "off";

        // Add message box to window
        dpTogetherWindow.appendChild(messageBox);

        // Create button to send message
        let sendButton = document.createElement("button");
        // Set button style
        sendButton.style.bottom = "5px";
        sendButton.style.position = "absolute";
        sendButton.style.width = "97%";
        // Set button text
        sendButton.innerText = "Send";

        // Add button to window
        dpTogetherWindow.appendChild(sendButton);
        
        // Add window to right of player
        document.getElementById("hudson-wrapper").appendChild(dpTogetherWindow);
    }

    createGroup() {
        // Request to create a group
        this._ws.send("CREATE_GROUP:" + this._stk);
    }

    joinGroup(gtk) {
        // Request to join group
        this._ws.send(`JOIN_GROUP:${this._stk}:${gtk}`);
    }

    playVideo() {
        // Play the video
        this._ws.send(`PLAY:${this._stk}:${this._gtk}`);
    }

    pauseVideo() {
        // Pause the video
        this._ws.send(`PAUSE:${this._stk}:${this._gtk}`);
    }

    setOptions(creatorControlOnly="OFF") {
        // Change a created group's settings
        // creatorControlOnly - Whether or not the group creator is the only one allowed to play/pause/move through video
        this._ws.send(`SET:${creatorControlOnly}`);
    }

    setVideoPosition(position) {
        // Set the current position in the video
        this._ws.send(`SET_POS:${this._stk}:${this._gtk}:${position}`);
    }
};

var dpt;

function setServer(serverElement) {
    dpt = new DisneyPlusTogether(serverElement.value);
}

function create() {
    dpt.createGroup();
}

function join(gtkElement) {
    dpt.joinGroup(gtk.value);
}
