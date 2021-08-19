import { SnooWrapped } from "../snoo-wrapped";
import { RedditContent } from "./reddit-content";

export class ReplyableContent<Data extends { name: string; removed?: boolean; }> extends RedditContent<Data> {
    public removed?: boolean;

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
     * **Note:** In order for this function to have an effect, this item **must** be in the authenticated account's inbox or modmail somewhere.
     * The reddit API gives no outward indication of whether this condition is satisfied, so the returned Promise will fulfill even if this is not the case.
     */
    protected async _blockAuthor() {
        return this._fetch('api/block', { method: 'POST', query: { id: this.name } }).then(() => this);
    }
}
