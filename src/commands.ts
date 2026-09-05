import { setUser, readConfig } from "./config.js";
import { createUser, getUser, resetUsers, getUsers } from "./lib/db/queries/users.js";
import { fetchFeed } from "./lib/rss.js";
import { createFeed, 
        queryFeeds, 
        createFeedFollow, 
        querySingleFeed, 
        getFollowsForUser, 
        deleteFeedFollow,
        markFeedFetched,
        getNextFeedToFetch } from "./lib/db/queries/feeds.js";
import type { Feed, User } from "./lib/db/schema.js";
import { middlewareLoggedIn } from "./middleware.js";
import { fetchFeed } from "./lib/rss.js";
import { createPost, getPostsForUser } from "./lib/db/queries/posts.js";

export type CommandHandler = (cmd: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export type UserCommandHandler = (
    cmdName: string,
    user: User,
    ...args: string[]
) => Promise<void>;

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

export async function scrapeFeeds(){
    const nextFeed = await getNextFeedToFetch();
    if (!nextFeed) {
        console.error("There are no feeds under the current user in the database");
        return;
    }
    const feed = await fetchFeed(nextFeed.url);
    await markFeedFetched(nextFeed.id);
    for (let item of feed.item){
        try {
            const publishedDate = new Date(item.pubDate);
            await createPost(item.title, item.link, publishedDate, nextFeed.id, item.description);
            console.log(`${item.title}`);
        } catch (err) {
            if (err instanceof Error) {
                console.error(err.message);
            } else {
                console.error("Unknown error");
            }
        }
    }
}

function parseDuration(durationStr: string): number {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    if (match === null){
        throw new Error("Unresolved timing error")
    } else {
        console.log(`Collecting feeds every ${match[0]}`)
    }
    const amount = Number(match[1]);
    switch(match[2]){
        case "ms":
            return amount;
        case "s":
            return amount * 1000;
        case "m":
            return amount * 60000;
        default:
            return amount * 3600000;
    }
}

export async function handlerAgg(cmdName: string, ...args: string[]){
    console.log("duration received:", args[0]);
    const time = parseDuration(args[0]);
    scrapeFeeds().catch((err) => {
        console.error(err);
    });
    const run = setInterval(() => {
        scrapeFeeds().catch((err) => {
            console.error(err);
        });
    }, time);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(run);
            resolve();
        });
    });
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[] ) {
    if (args.length === 2){
        const newFeed = await createFeed(args[0], args[1], user.id);
        printFeed(newFeed, user);
        await handlerFollow(cmdName, user, args[1]);
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

export async function handlerFollow(cmdName: string, user: User, ...args: string[]){
    if (args.length !== 1){
        throw new Error("Usage: follow <url>");
    }
        const feedToFollow = await querySingleFeed(args[0]);
        const feedFollow = await createFeedFollow(user.id, feedToFollow.id);
        console.log(`- Feed Followed: ${feedFollow.feeds}`);
        console.log(`- User: ${feedFollow.user}`);
}


export async function handlerFollowing(cmdName?: string, user: User, ...args?: string[]) {
        const following = await getFollowsForUser(user.id);
        if (following.length !== 0){
            let userPrinted = false;
            for (const f of following){
                if (userPrinted === false){
                    console.log(`${f.user} is following:\n  ${f.feeds}`);
                    userPrinted = true;
                } else {
                console.log(`  ${f.feeds}`);
                }
            }
        } else {
            console.log("User is not currently following any feeds.");
        }
        
}

export async function handlerDeleteFollow(cmdName: string, user: User, ...args: string[]){
    if (args.length !== 1) {
        throw new Error("Usage: unfollow <url>");
    }
    try {
        const feed = await querySingleFeed(args[0]); 
        await deleteFeedFollow(user.id, feed.id);
        console.log(`${user.name} unfollowed ${args[0]}`);
    } catch (err) {
        throw new Error(err.message);
    }
}

export async function handlerBrowse(cmdName: string, user: User, ...args?: string[]) {
    let limitString = args[0];
    let limit = Number(limitString);
    if ( Number.isNaN(limit) ){
        limit = 2;
    }

    const userPosts = await getPostsForUser(user.id, limit);
    for (const item of userPosts) {
        console.log(`- ${item.posts.title}\n* ${item.posts.url}\n* ${item.posts.publishedAt}`);
    }

}
