import { setUser } from "./config.js";

export type CommandHandler = (cmd: string, ...args: string[]) => void;

export type CommandsRegistry = Record<string, CommandHandler>;

export function handlerLogin(cmdName: string, ...args: string[]) {
    if (args.length === 0) {
        throw new Error("You must provide an arg");
    }
    setUser(args[0]);
    console.log("User has been set");

}

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler;
}

export function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    const run = registry[cmdName];
    if (run === undefined){
        throw new Error("Command not found");
    }
    run(cmdName, ...args);
}
