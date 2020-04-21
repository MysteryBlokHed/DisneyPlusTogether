# Created by Adam Thompson-Sharpe on 20/04/2020.
# Licensed under MIT.
import asyncio
import secrets
import websockets

PORT = 2626

# Bind sessions to websockets (token: websockets.WebSocketClientProtocol)
sessions = {}

# Manage groups of websockets to send video commands
groups = {}

# Main function
async def main(websocket, path):
    async for message in websocket:
        # Client requesting session token
        if message[:11] == "GET_SESSION":
            print(f"Session token request from {websocket.local_address}.")
            while True:
                # Generate a session token and see if it's not taken
                tk = secrets.token_hex(12)
                if tk not in sessions:
                    sessions[tk] = websocket
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

                # Check if client is already in a group
                in_group = False
                for group in groups:
                    if sessions[message[13:]] in groups[group]:
                        in_group = True

                if not in_group:
                    # Generate a group token and see if it's not taken
                    while True:
                        tk = secrets.token_hex(12)
                        if tk not in groups:
                            # Add group token to groups list and set the creator's group
                            groups[tk] = [sessions[message[13:]]]
                            await websocket.send(f"CGTK:{tk}")
                            print(f"Giving group token {tk} to {websocket.local_address} with session token {message[13:]}.")
                            break
                else:
                    # Client is already in a group
                    await websocket.send("FAIL:CG_IN_GROUP")
            else:
                # Invalid session
                print(f"Invalid token {message[13:]}.")
                await websocket.send("FAIL:CG_BAD_SESSION")
        
        # Client requesting to join group
        elif message[:11] == "JOIN_GROUP:":
            print(f"Group join request from {websocket.local_address} with session token {message[11:35]}.")
            # Check if a valid session token was provided
            if message[11:35] in sessions:
                # Valid session
                print(f"Token {message[11:35]} verified.")

                # Check if client is already in a group
                in_group = False
                for group in groups:
                    if sessions[message[11:35]] in groups[group]:
                        in_group = True

                if not in_group:
                    # Try to the client to the group
                    try:
                        params = message.split(":")
                        groups[params[2]].append(params[1])
                        await websocket.send("JG:" + params[2])
                    except IndexError:
                        # Client did not provide enough parameters to join group
                        await websocket.send("FAIL:JG_MISSING_PARAMETERS")
                    except KeyError:
                        # Client provided invalid group
                        await websocket.send("FAIL:JG_INVALID_GROUP")
                else:
                    # Client is already in a group
                    await websocket.send("FAIL:JG_IN_GROUP")
            else:
                # Invalid session
                print(f"Invalid token {message[13:43]}.")
                await websocket.send("FAIL:JG_BAD_SESSION")

# Run WebSocket
asyncio.get_event_loop().run_until_complete(
    websockets.serve(main, "0.0.0.0", PORT))
asyncio.get_event_loop().run_forever()
