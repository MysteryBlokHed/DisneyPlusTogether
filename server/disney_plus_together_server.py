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
        if message[:5] == "INIT:":
            # Get parameters
            try:
                params = message.split(":")
                params[1]
            except IndexError:
                # Client did not provide enough parameters
                await websocket.send("FAIL:IN_MISSING_PARAMETERS")
            
            print(f"Initialization from {websocket.local_address}.")
            if websocket not in connections:
                connections[websocket] = params[1]
                await websocket.send("INIT:OK")
            else:
                await websocket.send("FAIL:IN_ALREADY_DONE")
        
        # Client requesting group creation
        elif message[:13] == "CREATE_GROUP:":
            print(f"Group creation request from {websocket.local_address}.")
            # Get parameters
            try:
                params = message.split(":")
                params[2]
            except IndexError:
                # Client did not provide enough parameters to create group
                await websocket.send("FAIL:CG_MISSING_PARAMETERS")
            
            # Check if the client has initialized
            if websocket in connections:
                # Websocket initialized
                print(f"{websocket.local_address} verified.")

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
                            await websocket.send(f"FAIL:CG_NAME_TAKEN")
                    else:
                        # Generate a group token and see if it's not taken
                        while True:
                            tk = secrets.token_hex(12)
                            if tk not in groups:
                                break

                    # Add group token to groups list and set the creator's group
                    groups[tk] = [websocket]
                    await websocket.send(f"CGTK:{tk}")
                    print(f"Giving group token {tk} to {websocket.local_address}.")
                    # Set group preferences
                    preferences[tk] = {}
                    preferences[tk]["owner_controls"] = params[3]
                    # Set group video state & password
                    groups_info[tk] = {"playing": True, "position": "0", "password": params[2]}
                    break
                else:
                    # Client is already in a group
                    await websocket.send("FAIL:CG_IN_GROUP")
            else:
                # Invalid websocket
                print(f"Invalid token {message[13:]}.")
                await websocket.send("FAIL:CG_NOT_INITIALIZED")
        
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
                        await websocket.send(f"FAIL:JG_INVALID_PASSWORD")
                        return

                    # Try to add the client to the group
                    try:
                        # Send the client the group code along with the video info
                        groups[params[1]].append(websocket)
                        await websocket.send(f"JG:{params[1]}:{groups_info[params[1]]['playing']}:{groups_info[params[1]]['position']}")

                    except KeyError as e:
                        # Client provided invalid group
                        await websocket.send("FAIL:JG_INVALID_GROUP")
                        print(e)
                    except Exception as e:
                        # Other error
                        await websocket.send("FAIL:JG_UNKNOWN_ERROR")
                        print(e)
                else:
                    # Client is already in a group
                    await websocket.send("FAIL:JG_IN_GROUP")
            else:
                # Uninitialized websocket
                print(f"Uninitialized websocket.")
                await websocket.send("FAIL:JG_NOT_INITIALIZED")
        
        # Client requesting to play/pause video
        elif message[:5] == "PLAY:" or message[:6] == "PAUSE:":
            # Get parameters
            try:
                params = message.split(":")
                params[1]
            except IndexError:
                # Client did not provide enough parameters to join group
                await websocket.send("FAIL:PV_MISSING_PARAMETERS")

            # Check if client created the group (first member of the group) or the group allows anyone to control
            try:
                if groups[params[1]][0] == websocket or (preferences[params[1]]["owner_controls"] == "OFF" and websocket in groups[params[1]]):
                    if message[:4] == "PLAY":
                        for ws in groups[params[1]]:
                            try:
                                # Send all group members the play instruction other than the person who played the video
                                if ws != websocket:
                                    await ws.send("PLAY")
                                await ws.send(f"NOTE:{connections[websocket]} played the video")
                            except:
                                print(f"{ws.local_address} is no longer present.")
                                groups[params[1]].remove(ws)
                        # Update group video info
                        groups_info[params[1]]["playing"] = True
                    else:
                        for ws in groups[params[1]]:
                            try:
                                # Send all group members the pause instruction other than the person who played the video
                                if ws != websocket:
                                    await ws.send("PAUSE")
                                await ws.send(f"NOTE:{connections[websocket]} paused the video")
                            except:
                                print(f"{ws.local_address} is no longer present.")
                                groups[params[1]].remove(ws)
                        # Update group video info
                        groups_info[params[1]]["playing"] = False
            except KeyError:
                await websocket.send("FAIL:PV_INVALID_GROUP")
        
        # Client requesting to set video time
        elif message[:8] == "SET_POS:":
            # Get parameters
            try:
                params = message.split(":")
                params[2]
            except IndexError:
                # Client did not provide enough parameters to join group
                await websocket.send("FAIL:SP_MISSING_PARAMETERS")
            
            # Check if client created the group (first member of the group) or the group allows anyone to control
            try:
                if groups[params[1]][0] == websocket or (preferences[params[1]]["owner_controls"] == "OFF" and websocket in groups[params[1]]):
                    for ws in groups[params[1]]:
                        try:
                            # Send all group members the new video position other than the person who updated it
                            if ws != websocket:
                                await ws.send(f"POS:{params[2]}")
                            await ws.send(f"NOTE:{connections[websocket]} set the video time to {params[2]} seconds")
                        except:
                            print(f"{ws.local_address} is no longer present.")
                            groups[params[1]].remove(ws)
                    # Update group video info
                    groups_info[params[1]]["position"] = params[2]
                else:
                    await websocket.send("FAIL:SP_NOT_GROUP_CREATOR")
            except KeyError:
                await websocket.send("FAIL:SP_INVALID_GROUP")
        
        # Client sending message
        elif message[:5] == "CHAT:":
            # Get parameters
            try:
                params = message.split(":")
                params[2]
            except IndexError:
                # Client did not provide enough parameters to join group
                await websocket.send("FAIL:CT_MISSING_PARAMETERS")
            
            # Check if client is in the group
            try:
                if websocket in groups[params[1]]:
                    # Send all group members the message
                    for ws in groups[params[1]]:
                        try:
                            await ws.send(f"CHAT:{connections[websocket]}:{params[2]}")
                        except:
                            print(f"{ws.local_address} is no longer present.")
                            groups[params[1]].remove(ws)
                else:
                    await websocket.send("FAIL:CT_NOT_IN_GROUP")
            except KeyError:
                await websocket.send("FAIL:CT_INVALID_GROUP")

# Run WebSocket
asyncio.get_event_loop().run_until_complete(
    # websockets.serve(main, "0.0.0.0", PORT))
    websockets.serve(main, "0.0.0.0", PORT, ssl=ssl_context))
asyncio.get_event_loop().run_forever()
