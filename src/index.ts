import { registerCommand, handlerLogin, runCommand } from "./commands.js";
import type { CommandsRegistry } from "./commands.js";

function main() { 
    const registry: CommandsRegistry = {}
    registerCommand(registry, "login", handlerLogin);
    
    const input = process.argv.slice(2);
    if (input.length < 1){
        console.error("Please provide an argument");
        process.exit(1);
    }
    const commandName = input[0];
    const argArray: string[] = input.slice(1);
    try{
        runCommand(registry, commandName, ...argArray);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            process.exit(1);
        }
    }
}

main();
