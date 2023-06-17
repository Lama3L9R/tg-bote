import { ConsoleLoggerIO, FileLoggerIO, IOMux, Logger, MasterLoggerIO } from "./logger"
import fs from 'fs'
import { PluginDescription } from '../plugin'

export default class Logging {
    private static defaultInstance?: Logger

    static init(logs: fs.PathLike = "./logs", levels?: string[]) {
        Logging.defaultInstance = new Logger(new IOMux(new FileLoggerIO(logs), new ConsoleLoggerIO()), levels ?? [], "Bote")
    }

    static event(event: string, msg: any, trigger: any) {
        Logging.defaultInstance?.event(event, msg, trigger)
    }

    static info(msg: any) {
        Logging.defaultInstance?.info(msg)
    }

    static log(level: any, msg: any) {
        Logging.defaultInstance?.log(level, msg)
    }

    static error <T extends Error> (err: T, msg?: any) {
        Logging.defaultInstance?.error(err, msg)
    }

    static getLogger(moduleName: string | PluginDescription) {
        if (!Logging.defaultInstance) {
            throw new Error("Not init yet!")
        }

        if (typeof moduleName === "string") {
            return new Logger(new MasterLoggerIO(Logging.defaultInstance), [], moduleName)
        } else {
            return new Logger(new MasterLoggerIO(Logging.defaultInstance), [], moduleName.name)
        }
    }
}