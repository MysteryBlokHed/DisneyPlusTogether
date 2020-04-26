# Created by Adam Thompson-Sharpe on 20/04/2020.
# Licensed under MIT.
import asyncio
import secrets
import ssl
import websockets

PORT = 2626

# Used for SSL
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain("certificate.crt", "key.key")
# ssl_context.load_cert_chain("certificate.crt")

# Bind sessions to websockets (token: websockets.WebSocketClientProtocol)
sessions = {}

# Manage groups of websockets to send commands to (play, pause, etc.)
groups = {}

# Manage preferences set by the group creator
preferences = {}

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
            # Get parameters
            try:
                params = message.split(":")
                params[2]
            except IndexError:
                # Client did not provide enough parameters to join group
                await websocket.send("FAIL:JG_MISSING_PARAMETERS")
            
            print(f"Group join request from {websocket.local_address} with session token {params[1]}.")
            # Check if a valid session token was provided
            if params[1] in sessions:
                # Valid session
                print(f"Token {params[1]} verified.")

                # Check if client is already in a group
                in_group = False
                for group in groups:
                    if sessions[params[1]] in groups[group]:
                        in_group = True

                if not in_group:
                    # Try to add the client to the group
                    try:
                        groups[params[2]].append(sessions[params[1]])
                        await websocket.send("JG:" + params[2])
                    except KeyError:
                        # Client provided invalid group
                        await websocket.send("FAIL:JG_INVALID_GROUP")
                    except:
                        # Other error
                        await websocket.send("FAIL:JG_UNKNOWN_ERROR")
                else:
                    # Client is already in a group
                    await websocket.send("FAIL:JG_IN_GROUP")
            else:
                # Invalid session
                print(f"Invalid token {message[13:43]}.")
                await websocket.send("FAIL:JG_BAD_SESSION")
        
        # Client requesting to play/pause video
        elif message[:5] == "PLAY:" or message[:6] == "PAUSE:":
            # Get parameters
            try:
                params = message.split(":")
                params[2]
            except IndexError:
                # Client did not provide enough parameters to join group
                await websocket.send("FAIL:PV_MISSING_PARAMETERS")
            
            # Check if client created the group (first member of the group)
            try:
                if groups[params[2]][0] == websocket:
                    # Send all group members the play instruction
                    if message[:4] == "PLAY":
                        for ws in groups[params[2]]:
                            await ws.send("PLAY")
                    else:
                        for ws in groups[params[2]]:
                            await ws.send("PAUSE")
            except KeyError:
                await websocket.send("FAIL:PV_INVALID_GROUP")
        
        # Client requesting to set video time
        elif message[:8] == "SET_POS:":
            # Get parameters
            try:
                params = message.split(":")
                params[3]
            except IndexError:
                # Client did not provide enough parameters to join group
                await websocket.send("FAIL:SP_MISSING_PARAMETERS")
            
            # Check if client created the group (first member of the group)
            try:
                if groups[params[2]][0] == websocket:
                    # Send all group members the set instruction
                    for ws in groups[params[2]]:
                        await ws.send(f"POS:{params[3]}")
            except KeyError:
                await websocket.send("FAIL:SP_INVALID_GROUP")

# Run WebSocket
asyncio.get_event_loop().run_until_complete(
    # websockets.serve(main, "0.0.0.0", PORT))
    websockets.serve(main, "0.0.0.0", PORT, ssl=ssl_context))
asyncio.get_event_loop().run_forever()
