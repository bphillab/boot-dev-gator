import {desc, eq} from "drizzle-orm";
import {db} from "../index";
import {feed_follows, feeds, posts} from "../schema";

export type Post = {
    feedId:string,
    title:string,
    url:string,
    description:string,
    publishedAt:Date
}
export function createPost(post:Post) {
    return db.insert(posts).values(post).returning();
}
export function getPostsForUser(userId:string, numPosts:number){
    return db
        .select({
            id: posts.id,
            feedId: posts.feedId,
            feedName: feeds.name,
            title: posts.title,
            url: posts.url,
            description: posts.description,
            publishedAt: posts.publishedAt,
        })
        .from(feed_follows)
        .innerJoin(posts, eq(posts.feedId, feed_follows.feedId))
        .innerJoin(feeds, eq(feeds.id, posts.feedId))
        .where(eq(feed_follows.userId, userId))
        .orderBy(desc(posts.publishedAt))
        .limit(numPosts);
}
