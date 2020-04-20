# Created by Adam Thompson-Sharpe on 20/04/2020.
# Licensed under MIT.
import asyncio
import base64
import os
import websockets

PORT = 2626

# Manage sessions/groups
sessions = {}
groups = []

# Main function
async def main(websocket, path):
    async for message in websocket:
        # Client requesting session token
        if message[:11] == "GET_SESSION":
            print(f"Session token request from {websocket.local_address}.")
            while True:
                # Generate a session token and see if it's not taken
                tk = base64.b64encode(os.urandom(16)).decode("utf-8")
                if tk not in sessions:
                    sessions[tk] = None
                    await websocket.send(f"STK:{tk}")
                    print(f"Giving session token {tk} to {websocket.local_address}.")
                    break
        
        # Client requesting group creation
        elif message[:13] == "CREATE_GROUP:":
            print(f"Group creation request from {websocket.local_address} with session token {message[13:]}.")
            # Check if a valid session token was provided
            if message[13:] in sessions:
                # Valid session
                print(f"Token {message[13:]} verified.")

                # Generate a group token and see if it's not taken
                while True:
                    tk = base64.b64encode(os.urandom(16)).decode("utf-8")
                    if tk not in groups:
                        # Add group token to groups list and set the creator's group
                        groups.append(tk)
                        sessions[message[13:]] = tk
                        await websocket.send(f"CGTK:{tk}")
                        print(f"Giving group token {tk} to {websocket.local_address} with session token {message[13:]}.")
                        break
            else:
                # Invalid session
                print(f"Invalid token {message[13:]}.")
                await websocket.send("FAIL:CG_FAIL_BAD_SESSION")
        
        # Client requesting to join group
        elif message[:12] == "JOIN_GROUP:":
            # Check if a valid session token was provided
            pass

# Run WebSocket
asyncio.get_event_loop().run_until_complete(
    websockets.serve(main, "0.0.0.0", PORT))
asyncio.get_event_loop().run_forever()
