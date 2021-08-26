import ava, { TestInterface } from 'ava';
import { RequiredArgumentError } from '../../src/errors/required-argument-erorr';
import { RedditUser } from '../../src/objects/reddit-user';
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

test.serial('constructor', t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(() => {
        new RedditUser({ name: 'OmgImAlexis' }, snooWrapped);
    });

    // Missing "name"
    t.throws(() => {
        // @ts-expect-error
        new RedditUser({}, snooWrapped);
    }, { instanceOf: RequiredArgumentError });

    // Missing "snooWrapped"
    t.throws(() => {
        // @ts-expect-error
        new RedditUser({});
    }, { instanceOf: RequiredArgumentError });
});

test.serial('fetch()', async t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(async () => {
        await snooWrapped.getUser('OmgImAlexis').fetch();
    });

    // Returns an unfetched "RedditUser"
    const redditUser = snooWrapped.getUser('OmgImAlexis');
    t.not(redditUser, undefined);
    t.true(redditUser instanceof RedditUser);
    t.is(redditUser.name, 'OmgImAlexis');
    t.is(redditUser.created, undefined);
    t.is(redditUser.isGold, undefined);
    t.is(redditUser.isMod, undefined);
    t.is(redditUser.isVerified, undefined);
    t.is(redditUser.hasVerifiedEmail, undefined);
    t.is(redditUser.karma?.awardee, undefined);
    t.is(redditUser.karma?.awarder, undefined);
    t.is(redditUser.karma?.comment, undefined);
    t.is(redditUser.karma?.link, undefined);
    t.is(redditUser.karma?.total, undefined);

    // Returns a fetched "RedditUser"
    const fetchedRedditUser = await redditUser.fetch();
    t.not(fetchedRedditUser, undefined);
    t.true(fetchedRedditUser instanceof RedditUser);
    t.is(fetchedRedditUser.name, 'OmgImAlexis');
    t.is(fetchedRedditUser.id, 'f29oz');
    t.deepEqual(fetchedRedditUser.created, new Date(1391176276));
    t.true(fetchedRedditUser.isGold);
    t.true(fetchedRedditUser.isMod);
    t.true(fetchedRedditUser.isVerified);
    t.true(fetchedRedditUser.hasVerifiedEmail);
    t.true((fetchedRedditUser.karma?.awardee || 0) >= 461);
    t.true((fetchedRedditUser.karma?.awarder || 0) >= 10343);
    t.true((fetchedRedditUser.karma?.comment || 0) >= 9476);
    t.true((fetchedRedditUser.karma?.link || 0) >= 25392);
    t.true((fetchedRedditUser.karma?.total || 0) >= 45672);
});

test.serial('getMe()', async t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(() => {
        snooWrapped.getMe();
    });

    // Returns an unfetched "RedditUser"
    // Since we passed in a username we know this will return a valid object
    const redditUser = snooWrapped.getMe()!;
    t.not(redditUser, undefined);
    t.true(redditUser instanceof RedditUser);
    t.is(redditUser.name, 'phoenix_starship');
    t.is(redditUser.created, undefined);
    t.is(redditUser.isGold, undefined);
    t.is(redditUser.isMod, undefined);
    t.is(redditUser.isVerified, undefined);
    t.is(redditUser.hasVerifiedEmail, undefined);
    t.is(redditUser.karma?.awardee, undefined);
    t.is(redditUser.karma?.awarder, undefined);
    t.is(redditUser.karma?.comment, undefined);
    t.is(redditUser.karma?.link, undefined);
    t.is(redditUser.karma?.total, undefined);

    // Returns a fetched "RedditUser"
    const fetchedRedditUser = await snooWrapped.fetchMe();
    t.not(fetchedRedditUser, undefined);
    t.true(fetchedRedditUser instanceof RedditUser);
    t.is(fetchedRedditUser.name, 'phoenix_starship');
    t.is(fetchedRedditUser.id, '55t6515a');
    t.deepEqual(fetchedRedditUser.created, new Date(1623671212));
    t.false(fetchedRedditUser.isGold);
    t.true(fetchedRedditUser.isMod);
    t.true(fetchedRedditUser.isVerified);
    t.false(fetchedRedditUser.hasVerifiedEmail);
    t.is(fetchedRedditUser.karma?.awardee, 0);
    t.is(fetchedRedditUser.karma?.awarder, 0);
    t.is(fetchedRedditUser.karma?.comment, 0);
    t.is(fetchedRedditUser.karma?.link, 1);
    t.is(fetchedRedditUser.karma?.total, 1);
});
