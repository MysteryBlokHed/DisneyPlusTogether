# Disney Plus Together
<!-- Shields.io Badges -->
[![Release](https://img.shields.io/github/v/release/MysteryBlokHed/DisneyPlusTogether?style=flat-square)](https://github.com/MysteryBlokHed/DisneyPlusTogether/releases)
[![License](https://img.shields.io/github/license/MysteryBlokHed/DisneyPlusTogether?style=flat-square)](https://github.com/MysteryBlokHed/DisneyPlusTogether/blob/master/LICENSE)
[![Python](https://img.shields.io/badge/python-3.6%20%7C%203.7%20%7C%203.8-blue?style=flat-square)](https://www.python.org/downloads/)
<!-- End of Badges -->
A Chrome extension to allow people to sync movies and TV shows on Disney Plus.

## About
Disney Plus Together has a Chrome extension to be installed, and a server that needs to be run for it to work. There are currently no Disney Plus Together servers running, so you will have to download and run a server yourself. **If you would like to use this with friends on a different network, you will need to set up port forwarding to the machine running the server.**  
The extension is JavaScript and does not need anything else to be run. The server is a Python WebSocket server.

## Requirements (Server)
- Python 3.6 | 3.7 | 3.8
- `websockets>=8.1` - Get with `python` or `python3 -m pip install "websockets>=8.1"`

## Features
Disney Plus Together has the following features:

- A chat to the right of the video player

- Fully synced video (play/pause state and video position)

- Custom group names and passwords

- Notifications in chat when the video is played/paused or moved to a different position

## Installing the client
The Chrome extension source code is inside the `/extension` folder in the repository. You can get the latest release either by cloning the `master` branch, or by downloading the latest source code from the [releases page](https://github.com/MysteryBlokHed/DisneyPlusTogether/releases). Note that you **cannot install `.crx` files from untrusted sources**.

1. Go to the extensions page (`chrome://extensions`)
2. Enable developer mode (top-right for Chrome, bottom-left for Edge)
3. Select "Load unpacked" from the new menu at the top
4. Select the `extension` folder of the repository

Now you should see the extension in the area to the right of your URL bar. Left-click it when on any Disney Plus video to open it.

## Using the client
### Creating groups
Groups are just groups of users to sync the videos of.

1. Go to any video on Disney Plus (video must be fully loaded, URL should start with `https://www.disneyplus.com/video/`)
2. Open the extension popup by clicking the icon in the extensions bar
3. Enter a display name and a server
4. Set settings at the bottom
5. Pick a group name & password
6. Click "Create a Group"

A group code will then appear in the extension popup, as well as a new chat window. If there is no chat window after clicking "Create Group," try refreshing the page.

### Joining groups
1. Go to any video (URL should start with `https://www.disneyplus.com/video/`)
2. Open the extension popup by clicking the icon in the extensions bar
3. Enter a display name, server, the group name, and the password given to you by the group owner or another group member
4. Click "Join Group"

If you are not on the same video as the creator, you will be redirected.

A group code will then appear in the extension popup, as well as a new chat window. If there is no chat window after clicking "Join Group," try refreshing the page.

## Running the server
The server code is inside the `/server` folder in the repository. Instructions will be written relative to there.

**IMPORTANT: If you want to use this with others (which is likely), you will need a server on a different network as well as a TLS certificate.** I recommend [ZeroSSL](http://zerossl.com/) to create the certificate, since it's free, uses [Let's Encrypt](https://letsencrypt.org/), is cross-platform (only important for certificate creation), and is trusted by most browsers I've seen. Using a self-signed certificate is not trusted by any browser unless you manually add it.

1. Install the requirements by running `python` or `python3 -m pip install -r requirements.txt`.
2. Name your TLS certificate `certificate.crt` and your private key `key.pem`, and place them in the same directory as the server. These files are already in the `.gitignore`.
3. Run the server using `python` or `python3 disney_plus_together_server.py`.

## License
Disney Plus Together is licensed under the MIT License. For more information, check [its page on choosealicense](https://choosealicense.com/licenses/mit/).
