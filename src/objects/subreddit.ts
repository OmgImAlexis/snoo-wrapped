import { SnooWrapped } from "../snoo-wrapped";
import { Comment, RawComment } from "./comment";
import { RedditContent } from "./reddit-content";
import { RawSubmission, Submission } from "./submission";

interface SubredditData {
    name: string;
    subscribers?: number;
    created?: Date;
    nsfw?: boolean;
}

interface RawSubreddit {
    name: string;
    display_name: string;
    title: string;
    subscribers: number;
    created_utc: number;
    over18: boolean;
    lang: string;
}

interface RawResult {
    kind: 't5',
    data: RawSubreddit
}

interface RawSubmissionsResult {
    kind: 'Listing',
    data: {
        children: {
            kind: 't2' | 't3',
            data: RawSubmission | RawComment;
        }[]
    }
}

export class Subreddit<Data extends SubredditData = SubredditData> extends RedditContent<Data> {
    public subscribers?: number;
    public created?: Date;
    public nsfw?: boolean;

    constructor(data: Data, snooWrapped: SnooWrapped) {
        super(data, snooWrapped);

        this.subscribers = data.subscribers;
        this.created = data.created;
        this.nsfw = data.nsfw;
    }

    protected get uri() {
        return `r/${this.name}/about`;
    }

    // async getHot() {
    //     const rawSubmissions = await this._fetch<RawSubmissionsResult>(`r/${this.name}/hot`, { method: 'GET', query: { count: 100 } });
    //     return rawSubmissions.data.children.map(rawSubmission => Submission.from(this.snooWrapped, rawSubmission.data));
    // }

    async getNew(): Promise<(Submission | Comment)[]> {
        const rawSubmissionsAndComments = await this._fetch<RawSubmissionsResult>(`r/${this.name}/new`, { method: 'GET', query: { count: 100 } });
        return rawSubmissionsAndComments.data.children.map(rawSubmissionOrComment => {
            if (rawSubmissionOrComment.kind === 't3') return Submission.from(this.snooWrapped, rawSubmissionOrComment.data as RawSubmission);
            if (rawSubmissionOrComment.kind === 't2') return Comment.from(this.snooWrapped, rawSubmissionOrComment.data as RawComment);
        }).filter(_ => _ !== undefined) as (Submission | Comment)[];
    }

    static async from(snooWrapped: SnooWrapped, raw: RawSubreddit, data: Partial<SubredditData> = {}): Promise<Subreddit> {
        return new Subreddit({
            ...data,
            name: data.name ?? raw.display_name,
            subscribers: raw.subscribers,
            created: new Date(raw.created_utc * 1000),
            nsfw: raw.over18
        }, snooWrapped);
    }

    protected async _populate(data: RawResult) {
        return Subreddit.from(this.snooWrapped, data.data, this.data);
    }
}