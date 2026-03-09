import {pgTable, timestamp, uuid, text, unique} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    name: text("name").notNull().unique(),
});
export type User = typeof users.$inferSelect; // feeds is the table object in schema.ts



export const feeds = pgTable("feeds",{
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
    name: text("name").notNull(),
    url: text("url").notNull().unique(),
    userId: uuid("user_id").notNull()
        .references(() => users.id,{ onDelete: "cascade", onUpdate: "cascade" }),
    lastFetchedAt: timestamp("last_fetched_at")
    }
    )
export type Feed = typeof feeds.$inferSelect; // feeds is the table object in schema.ts

export const feed_follows = pgTable("feed_follows",{
    feedId: uuid("feed_id").notNull()
        .references(() => feeds.id,{ onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id").notNull()
        .references(() => users.id,{ onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
},
    (t) => [
        unique("feeds_user_unique").on(t.userId,t.feedId)
    ])
export type FeedFollow = typeof feed_follows.$inferSelect;

export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
    feedId: uuid("feed_id").notNull()
        .references(() => feeds.id, {onDelete: "cascade", onUpdate: "cascade"}),
    title: text("title").notNull(),
    url: text("link").notNull(),
    description: text("description").notNull(),
    publishedAt: timestamp("published_at").notNull()
    }
    )
export type Post = typeof posts.$inferSelect;
