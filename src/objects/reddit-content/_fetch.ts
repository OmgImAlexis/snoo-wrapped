import fetch from 'node-fetch';
import mergeDeep from 'merge-deep';
import { SnooWrapped } from '../../snoo-wrapped';
import { URL } from 'url';
import { updateAccessToken } from "./updateAccessToken";
import { isHttpStatusError, RawHttpStatusError } from "./isHttpStatusError";

export const _fetch = async <Data = unknown>(snooWrapped: SnooWrapped, uri: string, { query, ...options }: Parameters<typeof fetch>[1] & { query?: Record<string, string | number | boolean>; } = {}, attempts = 1) => {
    // Update access token
    const accessToken = await updateAccessToken(snooWrapped);

    // Resolve URL
    const url = new URL(uri, 'https://oauth.reddit.com/');
    Object.entries(query ?? {}).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
    });

    // Resolve options
    const opts = mergeDeep({
        headers: {
            'User-Agent': snooWrapped.userAgent,
            'Authorization': `Bearer ${accessToken}`
        }
    }, options);

    // Send query to Reddit
    return fetch(url.href, opts)
        .then(async (response) => response.json() as Promise<RawHttpStatusError | Data>)
        .then(response => {
            if (isHttpStatusError(response))
                throw new Error(`${response.error} ${response.message}`);
            return response;
        });
};
