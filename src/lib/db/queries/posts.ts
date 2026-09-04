import { db } from "..";
import { feeds, users, posts, feedFollows } from "../schema.js";
import { eq, desc } from "drizzle-orm";


export async function createPost(title: string, url: string, published_at: string, feed_id: string, description?: string) {
    await db.insert(posts).values({
        title: title,
        url: url,
        description: description ? description : null,
        publishedAt: published_at,
        feedId: feed_id
    });
}

export async function getPostsForUser(user: string, limit?: number) {
    let query = db.select()
            .from(posts)
            .innerJoin(feedFollows, eq(feedFollows.feed_id, posts.feedId))
            .where(eq(feedFollows.user_id, user))
            .orderBy(desc(posts.publishedAt))
    if (limit !== undefined){
        query = query.limit(limit)
    }
    
    const result = await query;
    
}

