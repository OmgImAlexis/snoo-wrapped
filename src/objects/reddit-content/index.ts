import fetch from 'node-fetch';
import { RequiredArgumentError } from '../../errors/required-argument-erorr';
import { SnooWrapped } from '../../snoo-wrapped';
import { RedditUser } from '../reddit-user';
import { _fetch } from './_fetch';

export interface RawAccessToken {
    access_token: string;
    expires_in: number;
    scope: string;
};

export class RedditContent<Data extends { name: string; author?: RedditUser; }> {
    public readonly name: string;
    public readonly author?: RedditUser;
    protected snooWrapped: SnooWrapped;
    protected data: Data;

    constructor(data: Data, snooWrapped: SnooWrapped) {
        if (!data?.name) throw new RequiredArgumentError('data.name');
        if (!snooWrapped) throw new RequiredArgumentError('snooWrapped');

        // Save data
        this.data = data;
        this.name = data.name;
        this.author = data.author;

        // Save SnooWrapped instance
        this.snooWrapped = snooWrapped;
    }

    [Symbol.for('nodejs.util.inspect.custom')]() {
        // In debug mode return whole object
        if (process.env.DEBUG) return this;

        // Strip off protected fields
        const { data: _data, snooWrapped: _snooWrapped, ...that } = this;
        return that;
    }

    toJSON() {
        return this[Symbol.for('nodejs.util.inspect.custom')]();
    }

    protected get uri() {
        return '';
    }

    protected _populate(data: unknown) {
        return data;
    }

    async fetch<T = this>() {
        return this._fetchAndPopulate<T>(this.uri);
    }

    protected async _fetch<Data = unknown>(uri: string, { query, ...options }: Parameters<typeof fetch>[1] & { query?: Record<string, string | number | boolean>; } = {}, attempts = 1) {
        return _fetch<Data>(this.snooWrapped, uri, {
            query: {
                ...query,
                api_type: 'json'
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        }, attempts);
    }

    protected async _fetchAndPopulate<T = this>(uri: string, { query, ...options }: Parameters<typeof fetch>[1] & { query?: Record<string, any>; } = {}, attempts = 1) {
        return this._fetch(uri, options).then(response => this._populate(response) as T);
    }
}
