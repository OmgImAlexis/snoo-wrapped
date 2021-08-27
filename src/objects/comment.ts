import { SnooWrapped } from "../snoo-wrapped";
import { SubredditType } from "../types";
import { RedditUser } from "./reddit-user";
import { Submission } from "./submission";
import { Subreddit } from "./subreddit";
import { VoteableContent } from "./votable-content";

export interface RawComment {
    name: string;
    author: string;
    subreddit: string;
    ups: number;
    downs: number;
    created: number;
    edited: number;
    gilded: number;
    subreddit_type: SubredditType;
    archived: boolean;
    body: string;
    parent_id: string;
}

interface RawResult {
    kind: 'Listing',
    data: {
        children: [{
            kind: 't1',
            data: RawComment;
        }]
    }
}

interface CommentData {
    name: string;
    submission?: Submission;
    subreddit?: Subreddit;
    body?: string;
    created?: Date;
    edited?: Date;
    gilded?: number;
    archived?: boolean;
    subredditType?: SubredditType;
    author?: RedditUser;
    votes?: {
        up?: number;
        down?: number;
    };
}

export class Comment<Data extends CommentData = CommentData> extends VoteableContent<Data> {
    public submission?: Submission;
    public body?: string;
    public created?: Date;
    public edited?: Date;
    public gilded?: number;
    public archived?: boolean;
    public subredditType?: SubredditType;
    public subreddit?: Subreddit;
    public author?: RedditUser;
    public votes?: { up?: number; down?: number; };
    
    constructor(data: Data, snooWrapped: SnooWrapped) {
        super(data, snooWrapped);

        this.submission = data.submission;
        this.subreddit = data.subreddit;
        this.author = data.author;
        this.votes = data.votes ? {
            up: data.votes?.up,
            down: data.votes?.down,
        } : undefined;
        this.created = data.created;
        this.edited = data.edited;
        this.gilded = data.gilded;
        this.subredditType = data.subredditType;
        this.body = data.body;
        this.archived = data.archived;
    }

    static from (snooWrapped: SnooWrapped, rawComment: RawComment, commentData: Partial<CommentData> = {}) {
        return new Comment({
            ...commentData,
            name: rawComment.name,
            submission: new Submission({ name: rawComment.parent_id }, snooWrapped),
            author: new RedditUser({ name: rawComment.author }, snooWrapped),
            subreddit: new Subreddit({ name: rawComment.subreddit }, snooWrapped),
            votes: {
                up: rawComment.ups,
                down: rawComment.downs
            },
            created: new Date(rawComment.created * 1000),
            edited: rawComment.edited ? new Date(rawComment.edited * 1000) : undefined,
            gilded: rawComment.gilded,
            subredditType: rawComment.subreddit_type,
            body: rawComment.body,
            archived: rawComment.archived
        }, snooWrapped);
    }

    protected _populate(data: RawResult) {
        return Comment.from(this.snooWrapped, data.data.children[0].data, this.data);
    }

    protected get uri() {
        return `api/info/?id=${this.name}`;
    }

    /**
     * Adds a new comment to a parent comment.
     * @example await sW.getComment('4e60m3').reply('This was an interesting comment. Thanks.');
     * @param content The content of the comment, in raw markdown text.
     */
    async reply(content: string) {
        return this._reply(content);
    }

    /**
     * Blocks the author of this comment.
     * **Note:** In order for this function to have an effect, this comment **must** be in the authenticated account's inbox or modmail somewhere.
     * The reddit API gives no outward indication of whether this condition is satisfied, so the returned Promise will fulfill even if this is not the case.
     * @example
     *
     * const messages = await sW.getInbox({ limit: 1 });
     * await messages[0].blockAuthor();
     */
     async blockAuthor() {
        return this._blockAuthor();
    }

    /**
     * Report this comment to the moderators of the subreddit.
     */
    async report(reason: string) {
        return this._report(reason);
    }
}
