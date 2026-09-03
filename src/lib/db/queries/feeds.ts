import { db } from "..";
import { feeds, users } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createFeed(name: string, url: string, user_id: string) {
    const [result] = await db.insert(feeds).values({name: name, url: url, user_id: user_id}).returning();
    return result;
}

export async function queryFeeds() {
    const result = await db.select({feedName: feeds.name, 
                                   feedURL: feeds.url, 
                                   user: users.name})
                                   .from(feeds)
                                   .innerJoin(users, eq(feeds.user_id, users.id));
    return result;
}
