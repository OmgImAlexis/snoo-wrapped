import ava, { TestInterface } from 'ava';
import { RequiredArgumentError } from '../../src/errors/required-argument-erorr';
import { Comment } from '../../src/objects/comment';
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
        new Comment({ name: 'cmfwyl2' }, snooWrapped);
    });

    // Missing "name"
    t.throws(() => {
        // @ts-expect-error
        new Comment({}, snooWrapped);
    }, { instanceOf: RequiredArgumentError });

    // Missing "snooWrapped"
    t.throws(() => {
        // @ts-expect-error
        new Comment({});
    }, { instanceOf: RequiredArgumentError });
});

test('toJSON()', t => {
    const { snooWrapped } = t.context;

    const comment = new Comment({ name: 'cmfwyl2' }, snooWrapped);
    t.is(JSON.stringify(comment), JSON.stringify({ name: 'cmfwyl2' }));
});

test.serial('fetch()', async t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(async () => {
        await snooWrapped.getComment('c0b6xx0').fetch();
    });

    // Returns an unfetched "Comment"
    const comment = snooWrapped.getComment('c0b6xx0');
    t.not(comment, undefined);
    t.true(comment instanceof Comment);
    t.is(comment.name, 't1_c0b6xx0');
    t.is(comment.author, undefined);
    t.is(comment.votes?.up, undefined);
    t.is(comment.votes?.down, undefined);
    t.is(comment.created, undefined);
    t.is(comment.edited, undefined);
    t.is(comment.gilded, undefined);
    t.is(comment.subredditType, undefined);
    t.is(comment.body, undefined);
    t.is(comment.archived, undefined);

    // Returns a fetched "Comment"
    const fetchedComment = await comment.fetch();
    t.not(fetchedComment, undefined);
    t.true(fetchedComment instanceof Comment);
    t.is(fetchedComment.name, 't1_c0b6xx0');
    t.is(fetchedComment.author?.name, 'Kharos');
    t.true((fetchedComment.votes?.up || 0) >= 6200);
    t.is((fetchedComment.votes?.down || 0), 0);
    t.deepEqual(fetchedComment.created, new Date('2009-07-18 16:01:01 UTC'));
    t.is(fetchedComment.edited, undefined);
    t.is(fetchedComment.gilded, 3);
    t.is(fetchedComment.subredditType, 'public');
    t.is(fetchedComment.body, 'Don\'t tell me what to do!\nUpvoted.');
    t.true(fetchedComment.archived);
});
