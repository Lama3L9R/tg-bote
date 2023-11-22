import { I } from "."

(async () => {
    const config = require("./bote.config.ts")
    await I.launch(config.default)  
})()