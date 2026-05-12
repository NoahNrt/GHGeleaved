// import type { Core } from '@strapi/strapi';

/**
 * Actions that the public (unauthenticated) role should be able to perform.
 * The list is applied idempotently on every boot, so removing an entry here
 * does NOT revoke an already-granted permission — revoke those via the
 * Strapi admin panel (Settings → Users & Permissions → Roles → Public).
 */
const PUBLIC_PERMISSIONS = [
  'api::review.review.find',
  'api::review.review.findOne',
  'api::comment.comment.find',
  'api::comment.comment.findOne',
  'api::comment.comment.create',
];

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) {
      strapi.log.warn(
        '[bootstrap] Public role not found — skipping permission setup. Is the users-permissions plugin enabled?'
      );
      return;
    }

    for (const action of PUBLIC_PERMISSIONS) {
      const existing = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: publicRole.id } });

      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action, role: publicRole.id },
        });
        strapi.log.info(`[bootstrap] Granted public permission: ${action}`);
      }
    }
  },
};
