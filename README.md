# Disney Plus Together
<!-- Shields.io Badges -->
[![Release](https://img.shields.io/github/v/release/MysteryBlokHed/Disney-Plus-Together?style=flat-square)](https://github.com/MysteryBlokHed/Disney-Plus-Together/releases)
[![License](https://img.shields.io/github/license/MysteryBlokHed/Disney-Plus-Together?style=flat-square)](https://github.com/MysteryBlokHed/Disney-Plus-Together/blob/master/LICENSE)
[![Python](https://img.shields.io/badge/python-3.6%20%7C%203.7%20%7C%203.8-blue?style=flat-square)](https://www.python.org/downloads/)
<!-- End of Badges -->
A Chromium extension to allow people to sync movies and TV shows on Disney Plus.

## About
Disney Plus Together has a Chromium extension to be installed, and a server that needs to be run for it to work. There are currently no Disney Plus Together servers running, so you will have to download and run a server yourself. **If you would like to use this with friends on a different network, you will need to set up port forwarding to the machine running the server.**  
The extension is JavaScript and does not need anything else to be run. The server is a Python Flask server.

## Requirements (Server)
- Python 3.6 | 3.7 | 3.8
- `websockets>=8.1` - Get with `python` or `python3 -m pip install "websockets>=8.1"`

## Installing the client
The Chromium extension is inside the `/extensions` folder in the repository.

1. Go to the extensions page (`chrome://extensions` or `edge://extensions`)
2. Enable developer mode (top-right for Chrome, bottom-left for Edge)
3. Select "load unpacked" from the new menu at the top.
4. To be continued

## Running the server
The server code is inside the `/server` folder in the repository. Instructions will be written relative to there.

1. Install the requirements by running `python` or `python3 -m pip install -r requirements.txt`.
2. Run `disney_plus_together_server.py`.
