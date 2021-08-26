import ava, { TestInterface } from 'ava';
import { RequiredArgumentError } from '../../src/errors/required-argument-erorr';
import { Submission } from '../../src/objects/submission';
import { Subreddit } from '../../src/objects/subreddit';
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
        new Subreddit({ name: 'AskReddit' }, snooWrapped);
    });

    // Missing "name"
    t.throws(() => {
        // @ts-expect-error
        new Subreddit({}, snooWrapped);
    }, { instanceOf: RequiredArgumentError });

    // Missing "snooWrapped"
    t.throws(() => {
        // @ts-expect-error
        new Subreddit({});
    }, { instanceOf: RequiredArgumentError });
});

test.serial('fetch()', async t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(async () => {
        await snooWrapped.getSubreddit('AskReddit').fetch();
    });

    // Returns an unfetched "Subreddit"
    const subreddit = snooWrapped.getSubreddit('AskReddit');
    t.not(subreddit, undefined);
    t.true(subreddit instanceof Subreddit);
    t.is(subreddit.name, 'AskReddit');
    t.is(subreddit.created, undefined);

    // Returns a fetched "Subreddit"
    const fetchedSubreddit = await subreddit.fetch();
    t.not(fetchedSubreddit, undefined);
    t.true(fetchedSubreddit instanceof Subreddit);
    t.is(fetchedSubreddit.name, 'AskReddit');
    t.deepEqual(fetchedSubreddit.created, new Date('2008-01-25 03:52:15 UTC'));
});

test.serial('getNew()', async t => {
    const { snooWrapped } = t.context;
    const subreddit = new Subreddit({ name: 'AskReddit' }, snooWrapped);
    const newSubmissionsOrComments = await subreddit.getNew();
    t.is(newSubmissionsOrComments.length, 25);

    const firstSubmission = (newSubmissionsOrComments[0] as Submission);
    t.is(firstSubmission.name, 't3_p7if57');
    t.is(firstSubmission.title, 'What can the average person anywhere do to legit change the course of climate change and save humanity?');
});
