import { program } from "commander";

program
    .name("Bote")
    .description("A Plugin based Telegram bot framework")
    .version("2.0.0")

program.command("run")
    .option("-c, --config []", "Config file")
    .action(async (options) => {
        const opts = options.config ?? "bote.config.js"
        const config = await import(opts)

        await I.launch(config.default)
    })