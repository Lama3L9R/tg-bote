const { program } = require("commander")
const { I } = require(".")
const { register } = require("ts-node")
const path = require("path")

register({
    esm: false,
    compilerOptions: {
        esModuleInterop: true,
        module: "CommonJS",
        moduleResolution: "node"        
    }
})

program
    .name("Bote")
    .description("A Plugin based Telegram bot framework (nta backend)")
    .version("2.1.0")

program.command("run")
    .option("-c, --config []", "Config file")
    .action(async (options) => {

        let opts = path.relative(__dirname, path.join(process.cwd(), options.config ?? "bote.config.ts"))

        if (!opts.startsWith("./")) {
            opts = "./" + opts
        }

        const config = require(opts, "\\", "/")

        await I.launch(config.default)
    })

program.parse(process.argv)