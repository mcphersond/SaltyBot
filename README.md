# SaltyBot

Gambling bot

## First Time Setup on a local machine or server
1. Clone this repository
    `git clone https://github.com/mcphersond/SaltyBot.git`
1. Use node v16.13.2+ (`nvm install v16.13.2 && nvm use v16.13.2`)
1. Create a file named `config.json` in the root of this project and fill in the following values:
    ```
    {
        "token": "A Discord Authentication Token",
        "perms": "",
        "ownerId": "",
        "guildId": "",
        "cliendId" : "",
        "applicationId" : "",
        "dbUser" : "",
        "dbPass" : "",
        "icon" : "https://i.pinimg.com/564x/50/32/23/5032232e13aca7bad5f03535b606366c.jpg",
        "footer" : "SaltyBot v1.0"
      }
    ```

1. Run the following commands for setup:
    ``` npm install ``` To retrieve packages
    ``` node command_deploy.js [-s] [-p] [-g] ``` To register slash commands with Discord. 
    -s    deploys to the staging guild set in your config.json 
    -p    deploys to the production guild set in your config.json
    -g    deploys globally.
    ``` node db_deploy.js ``` To set up a local SQLite DB for tracking bets.

    - To Reset your betting database:
      ``` node db_deploy.js -f```

1. Run the server with `node SaltyBot.js`