import {readConfig, setUser} from "./config.js";
import {createUser, getAllUsers, getUser, resetUsers} from "./lib/db/queries/users.js"
import {fetchFeed, RSSFeed} from "./rssFeed";
import {addFeed, getFeedURL, getNextFeedToFetch, markFeedFetched} from "./lib/db/queries/feeds";
import {Feed, feeds, User, users} from "./lib/db/schema";
import {db} from "./lib/db";
import {eq} from "drizzle-orm";
import {addFeedFollow, dropFeedFollow, getFeedFollowsForUser} from "./lib/db/queries/feed_follow";
import {createPost, getPostsForUser} from "./lib/db/queries/posts";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type UserCommandHandler = (
    cmdName: string,
    user: User,
    ...args: string[]
) => Promise<void>;
type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;
export const middlewareLoggedIn: middlewareLoggedIn = (handler) => async (cmdName, ...args) => {
    if (readConfig().currentUserName === undefined) {
        console.log("not logged in");
        process.exit(1);
    }
    const user = await getUser(readConfig().currentUserName!);
    if (user === undefined) {
        console.log("user not found");
        process.exit(1);
    }
    await handler(cmdName, user, ...args);
}

export async function handlerLogin(cmdName: string, ...args: string[]) {
    if ([...args].length == 0)
        throw new Error("login requires a username");
    const username = args[0];
    const users = await getUser(username);
    if (users === undefined) {
        console.log("user not found");
        process.exit(1);
    }
    setUser(username);
    console.log(`user has been set as ${username}`);
}

export async function handlerAddUser(cmdName: string, ...args: string[]) {
    if ([...args].length == 0)
        throw new Error("add-user requires a username");
    const username = args[0];
    await createUser(username);
    await setUser(username);
    console.log(`user ${username} has been added`);
}

export async function handlerResetUsers(cmdName: string, ...args: string[]) {
    const res = await resetUsers();
    if (!res)
    {
        console.log("failed to reset users");
        process.exit(1);
    }
    else
        console.log("users have been reset");
}

export async function handlerGetUsers(cmdName: string, ...args: string[]) {
    const users = await getAllUsers();
    const loggedInUser = readConfig().currentUserName;
    for (const user of users)
        if (user.name === loggedInUser)
            console.log(`* ${user.name} (current)`);
        else
            console.log(`* ${user.name}`);
}

function parseDuration(durationStr:string):number {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    if (!match) {
        console.log("invalid duration format");
        process.exit(1);
    }
    const value = parseInt(match[0]);
    const unit = match[2];
    switch (unit) {
        case "ms":
            return value;
            break;
        case "s":
            return value * 1000;
            break;
        case "m":
            return value * 60 * 1000;
            break;
        case "h":
            return value * 60 * 60 * 1000;
            break;
    }
    return value;
}

export async function handlerAgg(cmdName: string, ...args: string[]) {
    if ([...args].length < 1) {
        console.log("agg requires a time_between_reqs");
        process.exit(1);
    }
    const duration = parseDuration(args[0]);
    console.log(`Collecting feeds every ${duration}ms`)
    scrapeFeeds();
    const interval = setInterval(scrapeFeeds, duration);
    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });



}

export async function handlerAddFeed(cmdName: string,user: User, ...args: string[]) {
    if ([...args].length < 2) {
        console.log("add-feed requires a feed name and url");
        process.exit(1);
    }
    const loggedInUser = user.id;
    const name = args[0];
    const url = args[1];
    const feed = await addFeed(name, url, loggedInUser);
    await addFeedFollow(loggedInUser, feed.id);
}

export async function handlerFeeds(cmdName: string, ...args: string[]) {
    const feedsAvail = await db.select().from(feeds);
    for (const feed of feedsAvail) {
        console.log(`feed name: ${feed.name}`);
        console.log(`feed url: ${feed.url}`);
        const nameQuery = await db.select({name: users.name})
                            .from(users)
            .where(eq(users.id, feed.userId));
        const nameOfUser = nameQuery[0]?.name;
        console.log(`feed user: ${nameOfUser}`);
    }
}

export async function handlerFollow(cmdName: string,user:User, ...args: string[]){
    const loggedInUser =  user.id;

    const url = args[0];
    const feed = await getFeedURL(url);
    console.log(feed);
    const feedId = feed.id;
    const record = await addFeedFollow(loggedInUser, feedId);
    console.log(`${record.users.name} followed feed ${record.feeds.name}`);

}

export async function handlerFollowing(cmdName: string,user:User, ...args: string[]){
    const userName = user.id
    const feedFollows = await getFeedFollowsForUser(userName);
    for (const feedFollow of feedFollows)
        console.log(feedFollow.feeds.name);
}

export async function handlerDropFollow(cmdName: string,user:User, ...args: string[]){
    if ([...args].length < 1) {
        console.log("drop-follow requires a url");
        process.exit(1);
    }
    const userId = user.id;
    const feedUrl = args[0];
    const feed = await getFeedURL(feedUrl);
    const feedId = feed.id;
    await dropFeedFollow(userId, feedId);
}

export async function scrapeFeeds(){
    const feed = await getNextFeedToFetch();
    if (!feed)
        return;
    await markFeedFetched(feed.id);
    const newFeed = await fetchFeed(feed.url)
    for(const item of newFeed.item)
    {
        await createPost({feedId:feed.id,
            title:item.title,
            url:item.link,
            description:item.description,
            publishedAt:new Date(item.pubDate)})
        console.log(item.title);
    }
}

export async function handlerBrowse(cmdName: string, user:User, ...args: string[]){
    const userId = user.id;
    let numPosts = 2;
    if (args.length >=1) {
        numPosts=parseInt(args[0])
    }
    const posts = await getPostsForUser(userId, numPosts);
    for (const post of posts)
        console.log(post.title);
}

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler){
    return registry[cmdName] = handler;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]){
    const handler = registry[cmdName];
    if (handler === undefined)
        console.log(`command ${cmdName} not found`);

    await handler(cmdName, ...args);
}

function printFeed(feed:Feed, user:User){
    console.log(feed);
    console.log(user);
}
