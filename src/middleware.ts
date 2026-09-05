import type { CommandHandler, UserCommandHandler } from "./commands.js";
import { getUser } from "./lib/db/queries/users.js";
import { readConfig } from "./config.js";


export const middlewareLoggedIn = (handler: UserCommandHandler): CommandHandler => {
    const lookupUser = async (cmdName: string, ...args: string[]): Promise<void> => {
        const read = readConfig();
        const userFound = await getUser(read.currentUserName);
        if (userFound !== undefined){
            await handler(cmdName, userFound, ...args);
        } else {
            throw new Error("User not found");
        }
    }
    return lookupUser;
}
