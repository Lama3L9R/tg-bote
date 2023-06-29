import fs from 'fs'
import path from 'path'

export class Logger {
    private registeredLevels: string[] = ["Event", "Info", "Error"] 
    private maxPadding = 8
    private moduleName: string
    private io: LoggerIO

    constructor(io: LoggerIO, levels: string[], moduleName: string) {
        this.io = io
        this.moduleName = moduleName
        
        levels.forEach(lvl => {
            if (this.registeredLevels.indexOf(lvl) !== -1) {
                return
            }
    
            this.maxPadding = lvl.length
            for (let i of this.registeredLevels) {
                this.maxPadding = Math.max(this.maxPadding, i.length)
            }
    
            this.registeredLevels.push(lvl)
        })
    }

    event(event: string, msg: any, trigger: any) {
        this.write(`${this.makePrefix("Event")} : <${event}> from ${(trigger + "").padEnd(25, " ")} -> ${msg}`)
    }

    info(msg: any) {
        this.write(`${this.makePrefix("Info")} : ${msg}`)
    }

    log(level: any, msg: any) {
        if ((level !== undefined || level !== null) && msg === undefined) {
            this.info(level)
        } else {
            this.write(`${this.makePrefix(level)} : ${msg}`)
        }
    }

    error <T extends Error> (err: T, msg?: any) {
        const writeErr = (t: any) => {
            this.write(`${this.makePrefix("Error")} : ${t}`)
        }
        
        writeErr(`${err.name} thrown: ${err.message}`)
        if (err.stack) {
            writeErr(`${err.stack}`)
        }

        writeErr(msg)
    }

    getIO() {
        return this.io
    }

    private makePrefix(level: string) {
        if (this.registeredLevels.indexOf(level) === -1) {
            throw new Error("No such level!")
        }

        return `${this.getTime()} [${this.moduleName}] ${level.padEnd(this.maxPadding)}`

    }

    private write(text: any) {
        this.io.writeLine(text)
    }

    private getTime() {
        const d = new Date()
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`
    }

}

export interface LoggerIO {
    writeLine(data: any): void;
}

export class MasterLoggerIO implements LoggerIO {
    private master: Logger

    constructor(master: Logger) {
        this.master = master
    }

    writeLine(data: any): void {
        this.master.getIO().writeLine(data)
    }
}

export class ConsoleLoggerIO implements LoggerIO {
    writeLine(data: any): void {
        if (data instanceof Error) {
            console.error(data)
        } else {
            console.log(data)
        }
    }
}

export class FileLoggerIO implements LoggerIO {
    private dest: number

    constructor(folder: fs.PathLike) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder)
        }

        const logHistories = fs.readdirSync(folder)
        if (logHistories.indexOf("latest.log") !== -1) {
            if (logHistories.indexOf("latest.log.bak") !== -1) {
                fs.rmSync(path.join(folder.toString(), "latest.log.bak"))
            }

            fs.renameSync(path.join(folder.toString(), "latest.log"), path.join(folder.toString(), "latest.log.bak"))
        }

        this.dest = fs.openSync(path.join(folder.toString(), "latest.log"), "w+")
    }

    writeLine(data: any): void {
        fs.writeFileSync(this.dest, data + "\n")
    }
}

export class IOMux implements LoggerIO {
    
    private ios: LoggerIO[]

    constructor(...ios: LoggerIO[]) {
        this.ios = ios
    }
    
    writeLine(data: any): void {
        this.ios.forEach(it => it.writeLine(data))
    }
}
