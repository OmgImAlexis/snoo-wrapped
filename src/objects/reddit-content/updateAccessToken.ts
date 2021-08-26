import fetch, { Headers } from 'node-fetch';
import { SnooWrapped } from '../../snoo-wrapped';
import { URLSearchParams } from 'url';
import { isAccessTokenError, RawAccessTokenError } from './isAccessTokenError';
import { RawAccessToken } from './index';

export const updateAccessToken = async (snooWrapped: SnooWrapped) => {
    // If the current access token is missing or expired, and it is possible to get a new one, do so.
    if ((!snooWrapped.credentials.accessToken || Date.now() > (snooWrapped.credentials.tokenExpiration?.getTime() || 0)) &&
        (snooWrapped.credentials.refreshToken || (snooWrapped.credentials.username && snooWrapped.credentials.password))) {
        // Build headers
        const headers = new Headers();
        headers.append("Authorization", `Basic ${Buffer.from(`${snooWrapped.credentials.clientId}:${snooWrapped.credentials.clientSecret}`).toString('base64')}`);
        headers.append("User-Agent", snooWrapped.userAgent);
        headers.append("Content-Type", "application/x-www-form-urlencoded");

        // Build body
        const body = new URLSearchParams();
        body.append('scope', '*');
        if (snooWrapped.credentials.refreshToken) {
            body.append('grant_type', 'refresh_token');
            body.append('refresh_token', snooWrapped.credentials.refreshToken);
        } else {
            body.append('grant_type', 'password');
            body.append('username', snooWrapped.credentials.username as string);
            body.append('password', snooWrapped.credentials.password as string);
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
            snooWrapped.updateAccessToken(response.access_token, new Date(Date.now() + (response.expires_in * 1000)), response.scope.split(','));

            // Return the newly saved token
            return response.access_token;
        }
    }

    // Otherwise, just return the existing token.
    return snooWrapped.credentials.accessToken;
};
