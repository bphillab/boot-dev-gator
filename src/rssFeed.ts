import {XMLParser} from "fast-xml-parser";

export type RSSFeed = {
    channel: {
        title: string;
        link: string;
        description: string;
        item: RSSItem[];
    };
};

export type RSSItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
};

export async function fetchFeed(feedUrl:string){
    const results = await fetch(feedUrl, {
        headers: {
            "User-Agent": "gator-rss-feed-fetcher"
        }
    });
    const xml = await results.text();
    const obj =  new XMLParser().parse(xml).rss
    if (!obj.channel)
        throw new Error("invalid feed: No channel");
    const channel = obj.channel;
    if (!channel.title)
        throw new Error("invalid feed: No title");
    if (!channel.link)
        throw new Error("invalid feed: No link");
    if (!channel.description)
        throw new Error("invalid feed: No description");
    if (!channel.item)
        throw new Error("invalid feed: No items");
    const title = channel.title;
    const link = channel.link;
    const description = channel.description;
    let items:RSSItem[] = [];
    if (channel.item)
    {
      if (Array.isArray(channel.item))
          for (const item of channel.item)
              if (validItem(item))
                  items.push(item)
      else
          if (validItem(channel.item))
              items = [channel.item];
    }
    return {title:title,
    link:link,
    description:description,
    item:items
    }
}

function validItem(item:any):item is RSSItem{
    return item.title && item.link && item.description && item.pubDate;
}
