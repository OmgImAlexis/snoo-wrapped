import { SnooWrapped } from "../snoo-wrapped";
import { RedditContent } from "./reddit-content";
import { RedditUser } from "./reddit-user";

interface RemovedInfo {
    by: string;
    reason: string;
    category: 'admin' | 'moderator';
}

export class ReplyableContent<Data extends { name: string; author?: RedditUser; removed?: RemovedInfo; }> extends RedditContent<Data> {
    public removed?: RemovedInfo;

    constructor(data: Data, snooWrapped: SnooWrapped) {
        super(data, snooWrapped);

        this.removed = data.removed;
    }

    /**
     * Removes this Comment, Submission or PrivateMessage from public listings.
     * This requires the authenticated user to be a moderator of the subreddit with the `posts` permission.
     * @param options
     * @param options.spam Determines whether this should be marked as spam
     */
    protected async _remove({ spam = false } = {}) {
        return this._fetch('api/remove', { method: 'POST', query: { spam, id: this.name } }).then(() => this);
    }

    /**
     * Approves this Comment, Submission or PrivateMessage, re-adding it to public listings if it had been removed.
     */
    protected async _approve() {
        return this._fetch('api/approve', { method: 'POST', query: { id: this.name } }).then(() => this);
    }

    /**
     * Submits a new reply to this object.
     * This takes the form of a new Comment if this object is a Submission/Comment, or a new PrivateMessage if this object is a PrivateMessage.
     * @param content The content of the reply, in raw markdown text.
     */
    protected async _reply(content: string) {
        return this._fetch('api/comment', {
            body: JSON.stringify({
                text: content,
                thing_id: this.name
            })
        });
    }

    /**
     * Blocks the author of this content.
     */
    protected async _blockAuthor() {
        const name = this.author?.name ? this.author?.name : await this.fetch().then(submission => submission.author?.name!);
        return this._fetch('api/block_user', { method: 'POST', query: { name } }).then(() => this);
    }
}
