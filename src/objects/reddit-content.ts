import fetch, { Headers } from 'node-fetch';
import mergeDeep from 'merge-deep';
import { RequiredArgumentError } from '../errors/required-argument-erorr';
import { SnooWrapped } from '../snoo-wrapped';
import { URL, URLSearchParams } from 'url';

export interface RawHttpStatusError {
    error: 403 | 404;
    message: string;
}

interface RawAccessTokenError {
    error: 'invalid_grant';
    error_description?: string;
}

interface RawAccessToken {
    access_token: string;
    expires_in: number;
    scope: string;
};

export const isHttpStatusError = <Data>(response: Data | RawHttpStatusError): response is RawHttpStatusError => 'error' in response;
export const isAccessTokenError = <Data>(response: Data | RawAccessTokenError): response is RawAccessTokenError => 'error' in response && response.error === 'invalid_grant';

export class RedditContent<Data extends { name: string; }> {
    public readonly name: string;
    protected snooWrapped: SnooWrapped;
    protected data: Data;

    constructor(data: Data, snooWrapped: SnooWrapped) {
        if (!data?.name) throw new RequiredArgumentError('data.name');
        if (!snooWrapped) throw new RequiredArgumentError('snooWrapped');

        // Save data
        this.data = data;
        this.name = data.name;

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

    private async _updateAccessToken () {
        // If the current access token is missing or expired, and it is possible to get a new one, do so.
        if (
            (!this.snooWrapped.credentials.accessToken || Date.now() > (this.snooWrapped.credentials.tokenExpiration?.getTime() || 0)) &&
            (this.snooWrapped.credentials.refreshToken || (this.snooWrapped.credentials.username && this.snooWrapped.credentials.password))
        ) {
            // Build headers
            const headers = new Headers();
            headers.append("Authorization", `Basic ${Buffer.from(`${this.snooWrapped.credentials.clientId}:${this.snooWrapped.credentials.clientSecret}`).toString('base64')}`);
            headers.append("User-Agent", this.snooWrapped.userAgent);
            headers.append("Content-Type", "application/x-www-form-urlencoded");

            // Build body
            const body = new URLSearchParams();
            body.append('scope', '*');
            if (this.snooWrapped.credentials.refreshToken) {
                body.append('grant_type', 'refresh_token');
                body.append('refresh_token', this.snooWrapped.credentials.refreshToken);
            } else {
                body.append('grant_type', 'password');
                body.append('username', this.snooWrapped.credentials.username as string);
                body.append('password', this.snooWrapped.credentials.password as string);
            }

            // Send request
            const response = await fetch('https://www.reddit.com/api/v1/access_token', { method: 'POST', headers, body })
                .then(response => response.json() as Promise<RawAccessTokenError | RawAccessToken>)
                .then(response => 'error' in response ? response as RawAccessTokenError : response as RawAccessToken);

            // Check for errors
            if (isAccessTokenError(response)) {
                if (response.error === 'invalid_grant') {
                  throw new Error('"Invalid grant" error returned from reddit. (You might have incorrect credentials.)');
                } else if (response.error_description !== undefined) {
                  throw new Error(`Reddit returned an error: ${response.error}: ${response.error_description}`);
                } else if (response.error !== undefined) {
                  throw new Error(`Reddit returned an error: ${response.error}`);
                }
            } else {
                // Save access token
                this.snooWrapped.updateAccessToken(response.access_token, new Date(Date.now() + (response.expires_in * 1000)), response.scope.split(','));

                // Return the newly saved token
                return response.access_token;
            }
        }

        // Otherwise, just return the existing token.
        return this.snooWrapped.credentials.accessToken;
    }

    protected async _fetch<Data = unknown>(uri: string, { query, ...options }: Parameters<typeof fetch>[1] & { query?: Record<string, string | number | boolean>; } = {}, attempts = 1) {
        // Update access token
        const accessToken = await this._updateAccessToken();

        // Resolve URL
        const url = new URL(uri, 'https://oauth.reddit.com/');
        Object.entries(query ?? {}).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });

        // Resolve options
        const opts = mergeDeep({
            headers: {
                'User-Agent': this.snooWrapped.userAgent,
                'Authorization': `Bearer ${accessToken}`
            }
        }, options);

        // Send query to Reddit
        return fetch(url.href, opts)
            .then(response => response.json() as Promise<RawHttpStatusError | Data>)
            .then(response => {
                if (isHttpStatusError(response)) throw new Error(`${response.error} ${response.message}`);
                return response;
            });
    }

    protected async _fetchAndPopulate<T = this>(uri: string, { query, ...options }: Parameters<typeof fetch>[1] & { query?: Record<string, any>; } = {}, attempts = 1) {
        return this._fetch(uri, options).then(response => this._populate(response) as T);
    }
}
