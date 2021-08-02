import { SnooWrapped } from "../snoo-wrapped";
import { RedditContent } from "./reddit-content";

interface SubredditData {
    name: string;
    subscribers?: number;
}

export class Subreddit<Data extends SubredditData = SubredditData> extends RedditContent<Data> {
    public subscribers?: number;

    constructor(data: Data, snooWrapped: SnooWrapped) {
        super(data, snooWrapped);

        this.subscribers = data.subscribers;
    }
}