import {db} from "../index";
import {feeds} from "../schema";
import {readConfig} from "../../../config";
import {getUser} from "./users";
import {eq, sql} from "drizzle-orm";

export async function addFeed(name:string, url:string, userId:string) {
    const [result] = await db.insert(feeds).values({ name: name, url:url, userId:userId  }).returning();
    return result;
}

export async function getFeed(name:string){
    const [feed] = await db.select().from(feeds).where(eq(feeds.name,name)).limit(1);
    return feed;
}

export async function getFeedURL(url:string){
    const [feed] = await db.select().from(feeds).where(eq(feeds.url,url)).limit(1);
    return feed;
}

export async function markFeedFetched(feedId:string){
    await db.update(feeds).set({lastFetchedAt: new Date(), updatedAt: new Date()}).where(eq(feeds.id,feedId));
}
export async function getNextFeedToFetch() {
    const [row] = await db
        .select()
        .from(feeds)
        .orderBy(sql`${feeds.lastFetchedAt} asc nulls first`)
        .limit(1);

    return row ?? null;
}
