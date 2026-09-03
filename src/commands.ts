import { setUser, readConfig } from "./config.js";
import { createUser, getUser, resetUsers, getUsers } from "./lib/db/queries/users.js";
import { fetchFeed } from "./lib/rss.js";
import { createFeed, queryFeeds } from "./lib/db/queries/feeds.js";
import type { Feed, User } from "./lib/db/schema.js";

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

export async function handlerAgg(cmdName: string, ...args: string[]){
    const feed = await fetchFeed("https://www.wagslane.dev/index.xml");
    console.log(feed);
}

export async function handlerAddFeed(cmdName: string, ...args: string[] ) {
    if (args.length === 2){
        const read = readConfig();
        const currentUser = await getUser(read.currentUserName);
        const newFeed = await createFeed(args[0], args[1], currentUser.id);
        printFeed(newFeed, currentUser);
    } else {
        throw new Error("Please provide a user and a url");
    }
}

function printFeed(feed: Feed, user: User) {
    console.log(`User: ${user.name}`);
    console.log(`Feed: ${feed.name}`);
    console.log(`Url: ${feed.url}`);
    console.log(`Created At: ${feed.createdAt}`);
    console.log(`Updated At: ${feed.updatedAt}`);
}

export async function handlerFeeds(feed: Feed, user: User){
    const results = await queryFeeds();
    if (results.feed === undefined){
        for (const result of results){
            console.log(`- Feed: ${result.feedName}`);
            console.log(`   - URL: ${result.feedURL}`);
            console.log(`   - User: ${result.user}`);
        }
    } else {
        throw new Error("There are no feeds in the database.")

    }
}
