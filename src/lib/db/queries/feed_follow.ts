import {db} from "../index";
import {feed_follows, feeds, users} from "../schema";
import {readConfig} from "../../../config";
import {getUser} from "./users";
import {getFeed} from "./feeds";
import {and, eq} from "drizzle-orm";

export async function addFeedFollow(userId:string, feedId:string) {
    await db.insert(feed_follows).values({ feedId: feedId, userId:userId}).returning();
    const [result] = await db.select().from(feed_follows).innerJoin(feeds, eq(feeds.id, feed_follows.feedId)).where(eq(feeds.id, feedId)).innerJoin(users,eq(users.id, feed_follows.userId)).limit(1);
    return result;
}

export async function getFeedFollowsForUser(userId:string){
     return db.select().from(feed_follows).innerJoin(feeds, eq(feeds.id, feed_follows.feedId)).where(eq(feed_follows.userId, userId)).innerJoin(users,eq(users.id, feed_follows.userId));
}

export async function dropFeedFollow(userId:string, feedId:string){
    return db.delete(feed_follows).where(and(eq(feed_follows.userId, userId),eq(feed_follows.feedId, feedId)));
}
