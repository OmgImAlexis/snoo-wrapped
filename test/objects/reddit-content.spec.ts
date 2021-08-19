import ava, { TestInterface } from 'ava';
import { RequiredArgumentError } from '../../src/errors/required-argument-erorr';
import { RedditContent } from '../../src/objects/reddit-content';
import { SnooWrapped } from '../../src/snoo-wrapped';
import { credentials } from '../_helpers/credentials';
import { mockServer } from '../_helpers/mock-fetch';

const test = ava as TestInterface<{
    snooWrapped: SnooWrapped;
}>;

test.before(t => {
    // Enable API mocking
    mockServer.listen();

    t.context = {
        snooWrapped: new SnooWrapped(credentials)
    };
});

// Reset any runtime request handlers we may add during the tests.
test.afterEach(() => mockServer.resetHandlers());

// Disable API mocking after the tests are done.
test.after(() => mockServer.close());

test('constructor', t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(() => {
        new RedditContent({ name: 'cmfwyl2' }, snooWrapped);
    });

    // Missing "data.name"
    t.throws(() => {
        // @ts-expect-error
        new RedditContent({}, snooWrapped);
    }, { instanceOf: RequiredArgumentError, message: 'Missing required argument "data.name"' });

    // Missing "snooWrapped"
    t.throws(() => {
        // @ts-expect-error
        new RedditContent({ name: 'cmfwyl2', this_has_no_snoowrapped: true });
    }, { instanceOf: RequiredArgumentError, message: 'Missing required argument "snooWrapped"' });

    // Missing both "data.name" and "snooWrapped"
    // Since the data.name check is first it'll be the one that's returned
    t.throws(() => {
        // @ts-expect-error
        new RedditContent();
    }, { instanceOf: RequiredArgumentError, message: 'Missing required argument "data.name"' });
});

test('if the accessToken is expired it gets refreshed before trying the request', async t => {
    const { snooWrapped } = t.context;

    const accessToken = 'THIS_IS_A_FAKE_EXPIRED_ACCESS_TOKEN';
    const tokenExpiration = new Date(0);
    const scope = ['*'];
    snooWrapped.updateAccessToken(accessToken, tokenExpiration, scope);
    const comment = await snooWrapped.getComment('c0b6xx0').fetch();

    // Credentials are different to what we passed in
    t.not(snooWrapped.credentials.accessToken, accessToken);
    t.not(snooWrapped.credentials.tokenExpiration, tokenExpiration);
    t.deepEqual(snooWrapped.credentials.scope, scope);

    // Fetch worked
    t.is(comment.name, 't1_c0b6xx0');
    t.is(comment.body, 'Don\'t tell me what to do!\nUpvoted.');
});

test('the existing accessToken is used for the request if it\'s still valid and there\'s a refreshToken', async t => {
    const username = 'THIS_IS_A_FAKE_USERNAME';
    const password = 'THIS_IS_A_FAKE_PASSWORD';
    const accessToken = 'THIS_IS_A_FAKE_ACCESS_TOKEN';
    const refreshToken = 'THIS_IS_A_FAKE_REFRESH_TOKEN';
    const tokenExpiration = new Date(Date.now() + 10000000000);
    const scope = ['*'];
    const snooWrapped = new SnooWrapped({
        userAgent: credentials.userAgent,
        username,
        password,
        accessToken,
        refreshToken,
        tokenExpiration,
        scope,
    });
    const comment = await snooWrapped.getComment('c0b6xx0').fetch();

    // Credentials are the same we passed in
    t.is(snooWrapped.credentials.username, username);
    t.is(snooWrapped.credentials.password, password);
    t.is(snooWrapped.credentials.accessToken, accessToken);
    t.is(snooWrapped.credentials.refreshToken, refreshToken);
    t.is(snooWrapped.credentials.tokenExpiration, tokenExpiration);
    t.is(snooWrapped.credentials.scope, scope);

    // Fetch worked
    t.is(comment.name, 't1_c0b6xx0');
    t.is(comment.body, 'Don\'t tell me what to do!\nUpvoted.');
});