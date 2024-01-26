# tg-bote User guild

tg-bote is a plugin based telegram bot framework. By using tg-bote, you can easily create telegram bots.

This tutorial will guide you through the basic usage of tg-bote. 
I will assume that you know the basics of Linux.

## Pre-requirements

You need to have the latest LTS version of `nodejs` and the latest version of `MongoDB` installed on your server (PC).

## Installation

First, prepare a working environment by creating an empty folder and then use the following command:

```
npm init
```

Then, you can install tg-bote by using the following command.

```
npm install tg-bote
```

## Setting up your bot

To use this project, you'll need a configuration. The template can provide a quick start.

Create a file named 'bote.config.ts' in your root directory of the working environment.
Put the following content in it.

```typescript
import { defineConfig } from "tg-bote"

export default defineConfig({
    credentials: {
        mongodbConnectionURL: '<MongoDB>',
        telegramBoteToken: '<TelegramBotToken>'
    },
    storage: {
        plugins: "plugins"
    },
    devMode: true 
})
```

You must replace `<MongoDB>` and `<TelegramBotToken>` with your actual credentials.

If you didn't provide a valid Mongodb connection URL and you leave devMode on, permission manager will be replaced with 'VoidPermissionManager', which will allow every action. It's dangerous! Please do not use it in a production environment!

To obtain a Telegram bot account, you need to directly message @botfather. Follow the instructions he provided, and you can easily create a bot account. Then, he will give you the bot token.

Now, you can get some plugins you like. You can put all of your plugins in `./plugins` folder.

## Starting bot

Start your telegram bot is simple. Please use the following command in your root directory of the working environment.

```
npm tg-bote run
```

If you want to quit, please press Ctrl + C.