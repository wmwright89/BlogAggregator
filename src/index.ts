import { registerCommand, 
        handlerLogin, 
        runCommand, 
        handlerRegister, 
        handlerReset, 
        handlerGetUsers, 
        handlerAgg, 
        handlerAddFeed, 
        handlerFeeds,
        handlerFollow,
        handlerFollowing,
        handlerDeleteFollow,
        handlerBrowse } from "./commands.js";
import type { CommandsRegistry } from "./commands.js";
import { middlewareLoggedIn } from "./middleware.js";

async function main() { 
    const registry: CommandsRegistry = {}
    registerCommand(registry, "login", handlerLogin);
    registerCommand(registry, "register", handlerRegister);
    registerCommand(registry, "reset", handlerReset);
    registerCommand(registry, "users", handlerGetUsers);
    registerCommand(registry, "agg", handlerAgg);
    registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
    registerCommand(registry, "feeds", handlerFeeds);
    registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
    registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
    registerCommand(registry, "unfollow", middlewareLoggedIn(handlerDeleteFollow));
    registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));
    
    const input = process.argv.slice(2);
    if (input.length < 1){
        console.error("Please provide an argument");
        process.exit(1);
    }
    const commandName = input[0];
    const argArray: string[] = input.slice(1);
    try{
        await runCommand(registry, commandName, ...argArray);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err);
            process.exit(1);
        }
    }
    process.exit(0);
}

main();
