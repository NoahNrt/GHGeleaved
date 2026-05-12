/**
 * comment controller
 *
 * Custom logic for moderated, anonymous comments:
 *  - `create`: ignore any client-supplied `approved` value, always insert as
 *    `approved: false`. Admin must approve via Strapi admin panel.
 *  - `find` / `findOne`: only return approved comments on the public route.
 *    Strapi admin panel still sees everything because it uses a different
 *    permission scope.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::comment.comment', ({ strapi }) => ({
  async create(ctx) {
    const data = ctx.request.body?.data ?? {};

    // Whitelist fields a public visitor is allowed to set, and force approved=false.
    ctx.request.body = {
      data: {
        body: data.body,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        review: data.review,
        approved: false,
      },
    };

    const response = await super.create(ctx);

    // Hide email from the response so it can't leak back to the page.
    if (response?.data?.attributes) {
      delete response.data.attributes.authorEmail;
    }
    return response;
  },

  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      filters: {
        ...((ctx.query?.filters as object | undefined) ?? {}),
        approved: true,
      },
    };
    return await super.find(ctx);
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    if (!response?.data?.attributes?.approved) {
      return ctx.notFound();
    }
    // Don't leak email in public responses.
    delete response.data.attributes.authorEmail;
    return response;
  },
}));
