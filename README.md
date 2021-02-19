# DiscordOmegle
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/51ffd6a17f084b0fa4c6736c6f5b4333)](https://app.codacy.com/gh/DamsDev1/DiscordOmegle?utm_source=github.com&utm_medium=referral&utm_content=DamsDev1/DiscordOmegle&utm_campaign=Badge_Grade_Settings)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/e256c90d4f0e48efa4d7395288c256a9)](#)
[![Size](https://img.shields.io/github/repo-size/DamsDev1/DiscordOmegle)](#) [![Licence](https://img.shields.io/github/license/DamsDev1/DiscordOmegle)](#)

## Project
This project aims to provide Discord bot works like https://omegle.com. Omegle is a free online chat and support webcams. However, when using webcams, our IP address is visible to the other person, as opposed to Discord.

## Getting started
#### Configure `config.json`
```json
{
    "token": "",
    "waitChannelID": "",
    "categoryID": "",
    "secondsMatchTimeout": "120"
}
```
##### `token`: Token of your bot in [Discord Developer Portal](https://discord.com/developers/applications)
##### `waitChannelID`: Discord ID of voice waiting channel
##### `categoryID`: Discord ID of category in which channels will be created
##### `secondsMatchTimeout`: Number of seconds for a meeting cooldown to expire


### How to get Discord ID
![Discord Settings Enable Dev](https://github.com/DamsDev1/DiscordOmegle/blob/images/enable-dev.jpeg?raw=true)
![Copy ID of Channel](https://github.com/DamsDev1/DiscordOmegle/blob/images/copy_id.png?raw=true)
