import test from 'ava';
import { addFullnamePrefix } from '../../src/utils/add-fullname-prefix';

test('Adds prefix to string', t=> {
    const fullName = addFullnamePrefix('test', 't2_');
    t.is(fullName, 't2_test');
});

test('Don\'t add prefix if the name starts with the prefix', t=> {
    const fullName = addFullnamePrefix('t2_test', 't3_');
    t.is(fullName, 't2_test');
});

test('Allows items to pass through if they\'re an object with a name field', t=> {
    const fullName = addFullnamePrefix({ name: 'test' } as any, 't2_');
    t.is(fullName, 'test');
});