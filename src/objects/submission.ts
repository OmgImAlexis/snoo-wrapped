import { RequiredArgumentError } from "../errors/required-argument-erorr";
import { SnooWrapped } from "../snoo-wrapped";
import { SubredditType } from "../types";
import { Comment } from "./comment";
import { _fetch } from "../objects/reddit-content/_fetch";
import { RedditUser } from "./reddit-user";
import { Subreddit } from "./subreddit";
import { VoteableContent } from "./votable-content";

export interface RawSubmission {
    title: string;
    id: string;
    name: string;
    subreddit: string;
    author: string;
    ups: number;
    downs: number;
    created_utc: number;
    edited: number;
    gilded: number;
    subreddit_type: SubredditType;
    domain: string;
    selftext: string;
    url?: string;
    archived: boolean;
    over_18: boolean;
    spoiler: boolean;
    hidden: boolean;
    permalink: string;
    stickied: boolean;
    subreddit_subscribers: number;
    removed_by: string | null;
    removed_by_category?: 'admin' | 'mod';
    mod_reason_title?: string;
    ban_note?: string;
}

interface RawResult {
    kind: 'Listing',
    data: {
        children: [{
            kind: 't3',
            data: RawSubmission;
        }]
    }
}

interface SubmissionData {
    id?: string;
    name: string;
    subreddit?: Subreddit;
    comments?: Comment[];
    title?: string;
    author?: RedditUser;
    votes?: {
        up?: number;
        down?: number;
    };
    created?: Date;
    edited?: Date;
    gilded?: number;
    subredditType?: SubredditType;
    domain?: string;
    body?: string;
    url?: string;
    archived?: boolean;
    nsfw?: boolean;
    spoilered?: boolean;
    hidden?: boolean;
    permalink?: string;
    stickied?: boolean;
    subscribers?: number;
    locked?: boolean;
}

export class Submission<Data extends SubmissionData = SubmissionData> extends VoteableContent<Data> {
    public subreddit?: Subreddit;
    public comments?: Comment[];
    public title?: string;
    public author?: RedditUser;
    public votes: { up?: number; down?: number; };
    public created?: Date;
    public edited?: Date;
    public gilded?: number;
    public subredditType?: string;
    public domain?: string;
    public body?: string;
    public url?: string;
    public archived?: boolean;
    public nsfw?: boolean;
    public spoilered?: boolean;
    public hidden?: boolean;
    public permalink?: string;
    public stickied?: boolean;
    public subscribers?: number;
    public locked?: boolean;
    
    constructor(data: Data, snooWrapped: SnooWrapped) {
        super(data, snooWrapped);
        this.subreddit = data.subreddit;
        this.comments = data.comments;
        this.title = data.title;
        this.author = data.author;
        this.votes = {
            up: data.votes?.up,
            down: data.votes?.down,
        };
        this.created = data.created;
        this.edited = data.edited;
        this.gilded = data.gilded;
        this.subredditType = data.subredditType;
        this.domain = data.domain;
        this.body = data.body;
        this.url = data.url;
        this.archived = data.archived;
        this.nsfw = data.nsfw;
        this.spoilered = data.spoilered;
        this.hidden = data.hidden;
        this.permalink = data.permalink;
        this.stickied = data.stickied;
        this.subscribers = data.subscribers;
        this.locked = data.locked;
    }

    static async fetchRandom(snooWrapped: SnooWrapped) {
        const randomSubmission = await _fetch<RawResult>(snooWrapped, 'r/random');
        return Submission.from(snooWrapped, randomSubmission.data.children[0].data);
    }

    static from(snooWrapped: SnooWrapped, rawSubmission: RawSubmission, submissionData: Partial<SubmissionData> = {}): Submission<SubmissionData> {
        return new Submission({
            ...submissionData,
            id: rawSubmission.id,
            name: rawSubmission.name,
            author: new RedditUser({ name: rawSubmission.author }, snooWrapped),
            subreddit: new Subreddit({ name: rawSubmission.subreddit, subscribers: rawSubmission.subreddit_subscribers }, snooWrapped),
            title: rawSubmission.title,
            votes: {
                up: rawSubmission.ups,
                down: rawSubmission.downs
            },
            created: new Date(rawSubmission.created_utc * 1000),
            edited: rawSubmission.edited ? new Date(rawSubmission.edited * 1000) : undefined,
            gilded: rawSubmission.gilded,
            subredditType: rawSubmission.subreddit_type,
            domain: rawSubmission.domain,
            body: rawSubmission.selftext,
            url: rawSubmission.url,
            archived: rawSubmission.archived,
            nsfw: rawSubmission.over_18,
            spoilered: rawSubmission.spoiler,
            hidden: rawSubmission.hidden,
            permalink: rawSubmission.permalink,
            stickied: rawSubmission.stickied,
            removed: (rawSubmission.removed_by && rawSubmission.removed_by_category) ? {
                by: rawSubmission.removed_by,
                reason: rawSubmission.mod_reason_title,
                category: rawSubmission.removed_by_category
            } : undefined
        }, snooWrapped);
    }

    protected get uri() {
        return `api/info/?id=${this.name}`;
    }

    protected async _populate(data: RawResult) {
        // const comments = await this._fetch<[RawSubmission, {
        //     kind: 'Listing',
        //     data: {
        //         children: [{
        //             kind: 't1',
        //             data: RawComment;
        //         }]
        //     }
        // }]>(`r/${rawSubmission.subreddit}/comments/article`, {
        //         query: {
        //             limit: 1000,
        //             showmore: true,
        //             article: rawSubmission.name.substring(3)
        //         }
        //     })
        //     .then(([, comments]) => comments.data.children.map(child => new Comment(child.data, this.snooWrapped)));
        return Submission.from(this.snooWrapped, data.data.children[0].data, this.data);
    }

    /**
     * Marks this Submission as NSFW (Not Safe For Work).
     * @example await sW.getSubmission('2np694').markNsfw();
     */
    async markNsfw () {
        return this._fetch<{}>('api/marknsfw', { method: 'POST', query: { id: this.name } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    nsfw: true,
                }, this.snooWrapped)
            });
    }

    /**
     * Unmarks this Submission as NSFW (Not Safe For Work).
     * @example await sW.getSubmission('2np694').unmarkNsfw();
     */
     async unmarkNsfw () {
        return this._fetch<{}>('api/unmarknsfw', { method: 'POST', query: { id: this.name } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    nsfw: false,
                }, this.snooWrapped);
            })
            .catch();
    }

    /**
     * Locks this Submission, preventing new comments from being posted on it.
     * @example await sW.getSubmission('2np694').lock();
     */
    async lock () {
        return this._fetch<{}>('api/lock', { method: 'POST', query: { id: this.name } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    locked: true
                }, this.snooWrapped);
            });
    }

    /**
     * Unlocks this Submission, allowing comments to be posted on it again.
     * @example await sW.getSubmission('2np694').unlock();
     */
    async unlock () {
        return this._fetch<{}>('api/unlock', { method: 'POST', query: { id: this.name } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    locked: false,
                }, this.snooWrapped);
            });
    }

    /**
     * Hides this Submission, preventing it from appearing on most Listings.
     * @example await sW.getSubmission('2np694').hide();
     */
    async hide () {
        return this._fetch<{}>('api/hide', { method: 'POST', query: { id: this.name } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    hidden: true
                }, this.snooWrapped);
            });
    }

    /**
     * Unhides this Submission, allowing it to reappear on most Listings.
     * @example await sW.getSubmission('2np694').unhide();
     */
    async unhide () {
        return this._fetch<{}>('api/unhide', { method: 'POST', query: { id: this.name } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    hidden: false
                }, this.snooWrapped);
            });
    }

    /**
     * Mark a submission as a spoiler.
     * **Note:** This will silently fail if the subreddit has disabled spoilers.
     * @example await sW.getSubmission('2np694').markSpoiler();
     */
    async spoiler () {
        return this._fetch<{}>('api/spoiler', { method: 'POST', query: { id: this.name } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    spoilered: true
                }, this.snooWrapped);
            });
    }

    /**
     * Unmark a submission as a spoiler.
     * @example await sW.getSubmission('2np694').unmarkSpoiler();
     */
    async unspoiler () {
        return this._fetch<{}>('api/unspoiler', { method: 'POST', query: { id: this.name } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    spoilered: false
                }, this.snooWrapped);
            });
    }

    /**
     * Stickies this Submission.
     * @param slot The sticky slot to put this submission in; This should be either 1 or 2.
     * @example await sW.getSubmission('2np694').sticky(2);
     */
    async sticky (slot: 1 | 2) {
        if (!slot || ![1, 2].includes(slot)) throw new RequiredArgumentError('slot');

        return this._fetch<{}>('api/set_subreddit_sticky', { method: 'POST', query: { id: this.name, num: slot } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    stickied: true
                }, this.snooWrapped);
            });
    }

    /**
     * Unstickies this Submission.
     * @example await sW.getSubmission('2np694').unsticky();
     */
    async unsticky () {
        return this._fetch<{}>('api/set_subreddit_sticky', { method: 'POST', query: { id: this.name, state: false } })
            .then(() => {
                return new Submission({
                    ...this.data,
                    stickied: false
                }, this.snooWrapped);
            });
    }

    /**
     * Removes this submission from public listings.
     * This requires the authenticated user to be a moderator of the subreddit with the `posts` permission.
     * @param options
     * @param options.spam Determines whether this should be marked as spam
     */
    async remove({ spam = false } = {}) {
        await this._remove({ spam });
        return new Submission({
            ...this.data,
            removed: true
        }, this.snooWrapped);
    }

    /**
     * Approves this submission, re-adding it to public listings if it had been removed.
     * @example r.getSubmission('c08pp5z').approve()
     */
    async approve() {
        await this._approve();
        return new Submission({
            ...this.data,
            removed_by: undefined
        }, this.snooWrapped);
    }

    /**
     * Adds a new comment to this submission.
     * @example await sW.getSubmission('4e60m3').reply('This was an interesting post. Thanks.');
     * @param content The content of the comment, in raw markdown text.
     */
    async reply(content: string) {
        return this._reply(content);
    }

    /**
     * Blocks the author of this submission.
     * **Note:** In order for this function to have an effect, this submission **must** be in the authenticated account's inbox or modmail somewhere.
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
     * Report this submission to the moderators of the subreddit.
     */
    async report(reason: string) {
        return this._report(reason);
    }
}
