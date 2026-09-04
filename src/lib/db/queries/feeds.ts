import { db } from "..";
import { feeds, users, feedFollows } from "../schema.js";
import { eq, and, asc, sql } from "drizzle-orm";

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

export async function createFeedFollow(user: string, feed: string){
    const [result] = await db.insert(feedFollows).values({user_id: user, feed_id: feed}).returning();
    const [query] = await db.select({id: feedFollows.id, 
                                  createdAt: feedFollows.createdAt, 
                                  updatedAt: feedFollows.updatedAt, 
                                  feeds: feeds.name,
                                  user: users.name})
                                  .from(feedFollows)
                                  .innerJoin(feeds, eq(feedFollows.feed_id, feeds.id))
                                  .innerJoin(users, eq(feedFollows.user_id, users.id))
                                  .where(eq(feedFollows.id, result.id));
    return query;
}

export async function getFollowsForUser(currentUser: string) {
    const query = await db.select({feeds: feeds.name,
                                   user: users.name})
                                   .from(feedFollows)
                                   .where(eq(users.id, currentUser))
                                   .innerJoin(feeds, eq(feedFollows.feed_id, feeds.id))
                                   .innerJoin(users, eq(feedFollows.user_id, users.id));
    return query;
}

export async function querySingleFeed(feedUrl: string){
    const [feed] = await db
        .select()
        .from(feeds)
        .where(eq(feeds.url, feedUrl));

    return feed;
}

export async function deleteFeedFollow(currentUser: string, feed: string) {
    await db.delete(feedFollows).where(
        and(
            eq(feedFollows.user_id, currentUser),
            eq(feedFollows.feed_id, feed)));
}

export async function markFeedFetched(feed: string) {
    await db.update(feeds)
        .set({lastFetchedAt: new Date(), updatedAt: new Date()})
        .where(eq(feeds.id, feed));
}

export async function getNextFeedToFetch() {
    const [nextFeed] = await db.select()
        .from(feeds)
        .orderBy(sql`${feeds.lastFetchedAt} ASC NULLS FIRST`)        
        .limit(1);

    return nextFeed;
}
