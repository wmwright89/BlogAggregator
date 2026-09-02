import { setUser, readConfig } from "./config.js";
import { createUser, getUser, resetUsers, getUsers } from "./lib/db/queries/users.js";

export type CommandHandler = (cmd: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export async function handlerLogin(cmdName: string, ...args: string[]) {
    if (args.length === 0) {
        throw new Error("You must provide an arg");
    }
    const findUser = await getUser(args[0]);
    if (findUser == undefined){
        throw new Error("User not found");
    }
    setUser(args[0]);
    console.log("User has been set");

}

export async function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    const run = registry[cmdName];
    if (run === undefined){
        throw new Error("Command not found");
    }
    await run(cmdName, ...args);
}

export async function handlerRegister(cmdName: string, ...args: string[]){
    if (args.length === 0) {
        throw new Error("You must provide an arg");
    }
    const findUser = await getUser(args[0]);
    if (findUser != undefined) {
        throw new Error("User already exists");
    }
    else {
        const returnValue = await createUser(args[0]);
        setUser(returnValue.name);
        console.log(`User: ${args[0]} created.\nUser Data: ${await getUser(args[0])}`);
    }    
}

export async function handlerReset(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    try{
        if (args.length === 0) {
        await resetUsers();
        console.log("Users table truncated");
        process.exit(0);
        }
        await resetUsers(args[0]);
        console.log(`${args[0]} user deleted`);
        process.exit(0);
    } catch (err) {
        console.error(err.message);
    }

}

export async function handlerGetUsers(cmdName: string, ...args: string[]) {
    try {
        const allUsers = await getUsers();
        if (allUsers.length !== 0) {
            const read = readConfig();
            for (let user of allUsers) {
                if (user.name === read.currentUserName) {
                    console.log(`* ${user.name} (current)`);
                } else{
                    console.log(`* ${user.name}`);
                }
            }
        } else {
            console.log("No users found");
        }
    } catch (err) {
        console.error(err.message);
    }
}
