// Created by Adam Thompson-Sharpe on 19/04/2020.
// Licensed under MIT.
class DisneyPlusTogether {
    constructor(server="localhost", port=2626) {
        // Initialize WebSocket
        this._ws = new WebSocket(`ws://${server}:${port}`);

        // Request session token
        this._ws.addEventListener("open", (event) => {
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
            
            // Message was a group join confirmation
            } else if(event.data.substring(0, 3) == "JG:") {
                this._gtk = event.data.substring(3);
                console.log("Joined group: " + this._gtk);

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

    setVideoPosition(position) {
        // Set the current position in the video
        this._ws.send(`SET_POS:${this._stk}:${this._gtk}:${position}`);
    }
};

let dpt = new DisneyPlusTogether();
