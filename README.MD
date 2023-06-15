# tg-bote
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

一个 `DP7` 群机器人使用的框架
---

## 部署指南

你需要创建一个 `Node` 项目并将 `tg-bote`、`typescript` 和 `ts-node` 安装到你的项目

```
$ yarn add tg-bote typescript ts-node
```

然后创建一个 `bootstrap.ts` 文件作为你的程序入口点，并填写 `launch` 函数的参数
```typescript
import I from 'tg-bote'

I.launch("<MongoDB Connection String>", "<TG Bot Token>")

export { }
```

然后使用 `ts-node` 启动 `bootstrap.ts` 即可

## 插件开发指南

对着下面这个模板干就完了

```typescript
import I from 'tg-bote'
import { PluginDescription } from 'tg-bote/plugin'
import { Command } from 'tg-bote/plugin/command/command'

export const plugin: PluginDescription = {
    author: "lama",
    name: "example",
    version: "1.0",
    license: "Anti-996"
}

const Logging = I.getLogger(plugin)

I.getMasterDispatcher().register(new Command("example", (ctx, args) => {
    if (I.getPermissionManager().check(`${ctx.chat.id}:${ctx.from.id}`, "example.deny")) {
        return await ctx.reply("Permission denied")
    }
    Logging.info("log to console")
    return await ctx.reply("hello world")
}))
```

顺带一提 `Command` 可以注册子指令，即使用 `Command#command`，然后可以注册子指令的子指令
