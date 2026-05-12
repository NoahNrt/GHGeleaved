/**
 * review controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::review.review', ({ strapi }) => ({
  /**
   * Create a Review and publish it in one shot.
   *
   * Strapi 5's default POST on draft-and-publish content types creates a
   * draft — to publish you'd have to call the Document Service separately,
   * which isn't exposed in the public REST API. This action wraps both for
   * the WordPress migration script (`scripts/migrate-wp.mjs`).
   *
   * Auth: only reachable with a Full-Access API token. Public/authenticated
   * roles cannot call it because no permission is granted for the action.
   */
  async importPublished(ctx) {
    const data = ctx.request.body?.data ?? {};

    const result = await strapi
      .documents('api::review.review')
      .create({ data, status: 'published' });

    ctx.body = { data: result };
  },
}));
