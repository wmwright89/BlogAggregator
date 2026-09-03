import { XMLParser } from "fast-xml-parser";

export type Channel = {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
}

export type RSSItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
}

export async function fetchFeed(feedURL: string): Promise<Channel> {
    const response = await fetch(feedURL, {
        method: "GET",
        headers: {            
            "User-Agent": "gator"
        }
    });
    
    if (!response.ok){
        throw new Error(`HTTP network error. Status: ${response.status}`);
    }

    const textData: string = await response.text();

    const parser = new XMLParser({ processEntities: false });
    const parserJSON = parser.parse(textData);
    
    if (parserJSON.rss?.channel === undefined){
        throw new Error("Returned XML does not contain either rss or channel");
    }
    const ch = parserJSON.rss.channel;
    if (ch.title === undefined || ch.link === undefined || ch.description == undefined) {
        throw new Error("Returned XML does not contain title, link or description");
    }

    const newChannel: Channel = {
        title: ch.title,
        link: ch.link,
        description: ch.description,
        item: []
    };

    if (Array.isArray(ch.item)){
        for (let item of ch.item){
            if (item !== undefined){
                const newRSSItem: RSSItem = {
                    title: item.title,
                    link: item.link,
                    description: item.description,
                    pubDate: item.pubDate
                }
                newChannel.item.push(newRSSItem);
            }
        }
    } else if (ch.item === undefined){

    } else {
        const newRSSItem: RSSItem = {
            title: ch.item.title,
            link: ch.item.link,
            description: ch.item.description,
            pubDate: ch.item.pubDate
        }
        newChannel.item.push(newRSSItem);
    }
    
    return newChannel;
}
