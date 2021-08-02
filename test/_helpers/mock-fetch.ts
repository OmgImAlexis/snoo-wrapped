import { rest } from 'msw';
import { setupServer } from 'msw/node';
import * as info from '../_mocks/oauth.reddit.com/api/info';
import * as askRedditArticle from '../_mocks/r/AskReddit/comments/article';
import * as publicSfwSubArticle from '../_mocks/r/public_sfw_sub/comments/article';
import { About as OmgImAlexisAbout } from '../_mocks/user/OmgImAlexis/about';

export const mockServer = setupServer(
    rest.post('https://www.reddit.com/api/v1/access_token', (req, res, ctx) => {
        return res(ctx.json({
            access_token: 'mocked_user_token',
            expires_in: 3600,
            scope: '*',
            token_type: 'bearer'
        }));
    }),
    rest.get('https://oauth.reddit.com/api/info/', (req, res, ctx) => {
        const id = req.url.searchParams.get('id');
        return res(ctx.json(info[id]));
    }),
    rest.post('https://oauth.reddit.com/api/marknsfw', (req, res, ctx) => {
        const id = req.url.searchParams.get('id');
        info[id].data.children[0].data.over_18 = true;
        return res(ctx.json({}));
    }),
    rest.post('https://oauth.reddit.com/api/unmarknsfw', (req, res, ctx) => {
        const id = req.url.searchParams.get('id');
        info[id].data.children[0].data.over_18 = false;
        return res(ctx.json({}));
    }),
    rest.post('https://oauth.reddit.com/api/lock', (req, res, ctx) => {
        const id = req.url.searchParams.get('id');
        info[id].data.children[0].data.locked = true;
        return res(ctx.json({}));
    }),
    rest.post('https://oauth.reddit.com/api/unlock', (req, res, ctx) => {
        const id = req.url.searchParams.get('id');
        info[id].data.children[0].data.locked = false;
        return res(ctx.json({}));
    }),
    rest.post('https://oauth.reddit.com/api/hide', (req, res, ctx) => {
        const id = req.url.searchParams.get('id');
        info[id].data.children[0].data.hidden = true;
        return res(ctx.json({}));
    }),
    rest.post('https://oauth.reddit.com/api/unhide', (req, res, ctx) => {
        const id = req.url.searchParams.get('id');
        info[id].data.children[0].data.hidden = false;
        return res(ctx.json({}));
    }),
    rest.get('https://oauth.reddit.com/r/AskReddit/comments/article', (req, res, ctx) => {
        const article = req.url.searchParams.get('article');
        return res(ctx.json(askRedditArticle[`t3_${article}`]));
    }),
    rest.get('https://oauth.reddit.com/r/public_sfw_sub/comments/article', (req, res, ctx) => {
        const article = req.url.searchParams.get('article');
        return res(ctx.json(publicSfwSubArticle[`t3_${article}`]));
    }),
    rest.get('https://oauth.reddit.com/user/OmgImAlexis/about', (req, res, ctx) => {
        return res(ctx.json(OmgImAlexisAbout));
    })
);