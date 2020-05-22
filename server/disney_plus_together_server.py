# Created by Adam Thompson-Sharpe on 20/04/2020.
# Licensed under MIT.
import asyncio
import secrets
import ssl
import websockets

PORT = 2626

# Used for SSL
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain("certificate.crt", "key.pem")
# ssl_context.load_cert_chain("certificate.crt")

# Bind websockets to display names
connections = {}

# Manage groups of websockets to send commands to (play, pause, etc.)
groups = {}

# Manage video state for groups as well as the group password (played/paused, position)
groups_info = {}

# Manage preferences set by the group creator
preferences = {}

# Main function
async def main(websocket, path):
    async for message in websocket:
        # # Client requesting session token
        # if message[:11] == "GET_SESSION":
        #     print(f"Session token request from {websocket.local_address}.")
        #     while True:
        #         # Generate a session token and see if it's not taken
        #         tk = secrets.token_hex(12)
        #         if tk not in sessions:
        #             sessions[tk] = websocket
        #             await websocket.send(f"STK:{tk}")
        #             print(f"Giving session token {tk} to {websocket.local_address}.")
        #             break

        # Client requesting initialization
        if message[:5] == "INIT\uffff":
            # Get parameters
            try:
                params = message.split("\uffff")
                params[1]
            except IndexError:
                # Client did not provide enough parameters
                print("INIT: Client did not provide enough parameters.")
                await websocket.send("FAIL\uffffIN_MISSING_PARAMETERS")
                return
            
            if websocket not in connections:
                connections[websocket] = params[1]
                print(f"INIT: Client successfully initialized with display name {params[1]}.")
                await websocket.send("INIT\uffffOK")
            else:
                print(f"INIT: Client already initialized (display name: {connections[websocket]})")
                await websocket.send("FAIL\uffffIN_ALREADY_DONE")
        
        # Client requesting group creation
        elif message[:13] == "CREATE_GROUP\uffff":
            print(f"Group creation request from {websocket.local_address}.")
            # Get parameters
            try:
                params = message.split("\uffff")
                params[4]
            except IndexError:
                # Client did not provide enough parameters to create group
                print(f"CREATE_GROUP: Client did not provide enough parameters.")
                await websocket.send("FAIL\uffffCG_MISSING_PARAMETERS")
                return
            
            # Check if the client has initialized
            if websocket in connections:
                # Check if client is already in a group
                in_group = False
                for group in groups:
                    if websocket in groups[group]:
                        in_group = True

                if not in_group:
                    # See if the creator provided a group name
                    if params[1] != "":
                        if params[1] not in groups:
                            tk = params[1]
                        else:
                            print(f"CREATE_GROUP: Client tried to use taken group name.")
                            await websocket.send(f"FAIL\uffffCG_NAME_TAKEN")
                            return
                    else:
                        # Generate a group token and see if it's not taken
                        while True:
                            tk = secrets.token_hex(12)
                            if tk not in groups:
                                break

                    # Add group token to groups list and set the creator's group
                    groups[tk] = [websocket]
                    # Set group preferences
                    preferences[tk] = {}
                    preferences[tk]["owner_controls"] = params[3]
                    # Set group video state, password & url
                    groups_info[tk] = {"playing": True, "position": "0", "password": params[2], "video": params[4]}
                    # Send token to user
                    await websocket.send(f"CGTK\uffff{tk}")
                    print(f"CREATE_GROUP: Giving group token {tk} to client with display name {connections[websocket]}.")
                else:
                    # Client is already in a group
                    print(f"CREATE_GROUP: Client with display name {connections[websocket]} is already in a group.")
                    await websocket.send("FAIL\uffffCG_IN_GROUP")
            else:
                # Invalid websocket
                print(f"CREATE_GROUP: Client not initialized.")
                await websocket.send("FAIL\uffffCG_NOT_INITIALIZED")
        
        # Client requesting to join group
        elif message[:11] == "JOIN_GROUP\uffff":
            # Get parameters
            try:
                params = message.split("\uffff")
                params[2]
            except IndexError:
                # Client did not provide enough parameters to join group
                print("JOIN_GROUP: Client did not provide enough parameters.")
                await websocket.send("FAIL\uffffJG_MISSING_PARAMETERS")
                return
            
            # Check if an initialized websocket is being used
            if websocket in connections:
                # Websocket initialized
                print(f"{websocket.local_address} verified.")

                # Check if client is already in a group
                in_group = False
                for group in groups:
                    if websocket in groups[group]:
                        in_group = True

                if not in_group:
                    # Check if the password matches
                    if params[2] != groups_info[params[1]]["password"]:
                        print("JOIN_GROUP: Client provided an invalid password.")
                        await websocket.send(f"FAIL\uffffJG_INVALID_PASSWORD")
                        return

                    # Try to add the client to the group
                    try:
                        # Send the client the group code along with the video info
                        groups[params[1]].append(websocket)
                        await websocket.send(f"JG\uffff{params[1]}\uffff{groups_info[params[1]]['playing']}\uffff{groups_info[params[1]]['position']}\uffff{groups_info[params[1]]['video']}")

                    except KeyError:
                        # Client provided invalid group
                        print("JOIN_GROUP: Client provided an invalid group.")
                        await websocket.send("FAIL\uffffJG_INVALID_GROUP")
                    except Exception:
                        # Other error
                        print("JOIN_GROUP: An unknown error occurred.")
                        await websocket.send("FAIL\uffffJG_UNKNOWN_ERROR")
                else:
                    # Client is already in a group
                    print(f"JOIN_GROUP: Client with display name {connections[websocket]} is already in a group.")
                    await websocket.send("FAIL\uffffJG_IN_GROUP")
            else:
                # Uninitialized websocket
                print("JOIN_GROUP: Uninitialized websocket.")
                await websocket.send("FAIL\uffffJG_NOT_INITIALIZED")
        
        # Client requesting to play/pause video
        elif message[:5] == "PLAY\uffff" or message[:6] == "PAUSE\uffff":
            # Get parameters
            try:
                params = message.split("\uffff")
                params[1]
            except IndexError:
                # Client did not provide enough parameters to join group
                print("PLAY/PAUSE: Client did not provide enough parameters.")
                await websocket.send("FAIL\uffffPV_MISSING_PARAMETERS")
                return

            # Check if client created the group (first member of the group) or the group allows anyone to control
            try:
                if groups[params[1]][0] == websocket or (preferences[params[1]]["owner_controls"] == "OFF" and websocket in groups[params[1]]):
                    if message[:4] == "PLAY":
                        print(f"PLAY/PAUSE: Client with display name {connections[websocket]} played video for group {params[1]}")
                        for ws in groups[params[1]]:
                            try:
                                # Send all group members the play instruction other than the person who played the video
                                if ws != websocket:
                                    await ws.send("PLAY")
                                await ws.send(f"NOTE\uffff{connections[websocket]} played the video")
                            except:
                                print(f"A client is no longer present.")
                                groups[params[1]].remove(ws)
                        # Update group video info
                        groups_info[params[1]]["playing"] = True
                    else:
                        print(f"PLAY/PAUSE: Client with display name {connections[websocket]} paused video for group {params[1]}")
                        for ws in groups[params[1]]:
                            try:
                                # Send all group members the pause instruction other than the person who played the video
                                if ws != websocket:
                                    await ws.send("PAUSE")
                                await ws.send(f"NOTE\uffff{connections[websocket]} paused the video")
                            except:
                                print(f"A client is no longer present.")
                                groups[params[1]].remove(ws)
                        # Update group video info
                        groups_info[params[1]]["playing"] = False
            except KeyError:
                print("PLAY/PAUSE: Client provided an invalid group.")
                await websocket.send("FAIL\uffffPV_INVALID_GROUP")
        
        # Client requesting to set video time
        elif message[:8] == "SET_POS\uffff":
            # Get parameters
            try:
                params = message.split("\uffff")
                params[2]
            except IndexError:
                # Client did not provide enough parameters to join group
                print("SET_POS: Client did not provide enough parameters.")
                await websocket.send("FAIL\uffffSP_MISSING_PARAMETERS")
                return
            
            # Check if client created the group (first member of the group) or the group allows anyone to control
            try:
                if groups[params[1]][0] == websocket or (preferences[params[1]]["owner_controls"] == "OFF" and websocket in groups[params[1]]):
                    print(f"SET_POS: Client with display name {connections[websocket]} set video time for group {params[1]}")
                    for ws in groups[params[1]]:
                        try:
                            # Send all group members the new video position other than the person who updated it
                            if ws != websocket:
                                await ws.send(f"POS\uffff{params[2]}")
                            await ws.send(f"NOTE\uffff{connections[websocket]} set the video time to {params[2]} seconds")
                        except:
                            print(f"SET_POS: A client is no longer present.")
                            groups[params[1]].remove(ws)
                    # Update group video info
                    groups_info[params[1]]["position"] = params[2]
                else:
                    print(f"SET_POS: Client with display name {connections[websocket]} is not the group creator.")
                    await websocket.send("FAIL\uffffSP_NOT_GROUP_CREATOR")
            except KeyError:
                print(f"SET_POS: Client with display name {connections[websocket]} provided an invalid group.")
                await websocket.send("FAIL\uffffSP_INVALID_GROUP")
        
        # Client sending message
        elif message[:5] == "CHAT\uffff":
            # Get parameters
            try:
                params = message.split("\uffff")
                params[2]
            except IndexError:
                # Client did not provide enough parameters to join group
                print("CHAT: Client did not provide enough parameters.")
                await websocket.send("FAIL\uffffCT_MISSING_PARAMETERS")
                return
            
            # Check if client is in the group
            try:
                if websocket in groups[params[1]]:
                    # Send all group members the message
                    for ws in groups[params[1]]:
                        try:
                            await ws.send(f"CHAT\uffff{connections[websocket]}\uffff{params[2]}")
                        except:
                            print(f"CHAT: A client is no longer present.")
                            groups[params[1]].remove(ws)
                else:
                    print(f"CHAT: Client with display name {connections[websocket]} is not in group {params[1]}.")
                    await websocket.send("FAIL\uffffCT_NOT_IN_GROUP")
            except KeyError:
                print(f"CHAT: Client with display name {connections[websocket]} provided an invalid group.")
                await websocket.send("FAIL\uffffCT_INVALID_GROUP")

# Run WebSocket
asyncio.get_event_loop().run_until_complete(
    # websockets.serve(main, "0.0.0.0", PORT))
    websockets.serve(main, "0.0.0.0", PORT, ssl=ssl_context))
asyncio.get_event_loop().run_forever()
