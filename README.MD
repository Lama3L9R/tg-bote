# tg-bote v2
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

bote，一个 DP7 群专属的、辣妈开发的踢寄波特框架，插件基于的。

**Bote V2 还在测试中，请勿用于生产环境**

---
## 关于 V2 的主要变动

- 插件结构重做，让插件编写更加顺畅
    - 比如支持了文件夹格式的插件
    - 又比如支持了我也不知道怎么描述反正就是很好用的功能
- 增强的事件系统
- 增强的配置文件
- 增强的 Logging
- 完善文档
- 不再需要 bootstrap.ts，当然你也可以有

### 关于 V3 的更新计划

- [ ] 不再使用 `telegraf` 作为踢寄波特API的后端。
    - 由于其类型系统过于复杂和并未对二次框架开发做兼容（很多功能较为long3yu2），因此决定未来迁移，核心 API 变动应该会较小
- [ ] 支持 Channel，完全统一化 API
    - 开发过踢寄波特的应该都知道，Channel 和 Group 是两个消息事件，但是没有任何道理非得搞成两个
    - 因此将在 V3 完全支持 Channel 和 Group，不对其进行过于严格的区分
- [ ] 可能会支持一下动态加载 npm 包，但这真的很难做
- [ ] 进一步完善文档

## 部署指南

V2 的更新带来了一个 CLI 工具，这样您就不再需要编写一个 bootstrap.ts 了，一行指令，直接启动

```
$ yarn tg-bote run
```

哦，当然，你需要编写一个 bote.config.ts ()

```typescript
// bote.config.ts

import { defineConfig } from "tg-bote";

export default defineConfig({
    credentials: {
        mongodbConnectionURL: "",
        telegramBoteToken: ""
    },
    telegram: { },
    devMode: true
})

```

**值得注意的是，在新版本中强制要求了生产环境使用 Webhook 模式。**

## 插件开发指南

下面是一个示范插件

```typescript
// example plugin

import { BotePluginModule, definePlugin, Logging, Events, Command, I } from "tg-bote";

export default definePlugin({
//  vvvv 命名规范详见文档
    name: "icu.lama.example.ExamplePlugin",
    displayName: "ExamplePlugin",
    author: 'lamadaemon',
    version: "1.0@stable"
//         出于安全因素考量，插件之间不得直接通过 import 或者 require 获取其 module，应通过 requirePlugin
// vvvvvv  由于不使用 ESM 的 export，因此需要手动调用框架提供的 export 函数 来为其他插件提供 API
}).export(myAPI).onUnload(() => {
    // shutdown logic
}).begin(main)

function myAPI(name: string) {
    Logging.getLogger("ExamplePlugin").info(`hello ${name}`)
}

//                  vvvvvvvvvvvvvvvvvvvvvv 并非必须，因为此函数在调用前一定会进行 this 绑定，这里只是为了让 tsc 闭嘴。
async function main(this: BotePluginModule) {
//  vvvvvvvvvvvvvvvvvvvvv 您不应该使用 console.log，请使用 bote 提供的 Logging 系统，也最好不要用全局 Logger
    this.getLogger().info(`Hello world`)

    Events.onFinalization.subscribe(this, () => {
        this.getLogger().info("Finalization event triggered")
    })

//  vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv 指令系统无变化
    I.getMasterDispatcher().register(this, new Command("echo", async (ctx, args) => {
        return await ctx.reply(args.join())
    }))
}
```
