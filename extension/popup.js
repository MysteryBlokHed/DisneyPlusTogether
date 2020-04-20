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
            } else if(event.data.substring(0, 5) == "FAIL:") {
                console.error(event.data.substring(5));
            }
        });
    }

    createGroup() {
        // Request to create a group
        this._ws.send("CREATE_GROUP:" + this._stk);
    }
};

let dpt = new DisneyPlusTogether();
