/**
 * TypeScript types mirroring the Strapi 5 REST response shape.
 *
 * Strapi 5 flattened the response: entity fields live directly on the object
 * (no more nested `attributes`), and relations / media are populated inline
 * when requested via `?populate=…`.
 */

export type Genre = 'buch' | 'film' | 'musik' | 'spiel';

/** Map technical genre values to user-facing German labels. */
export const GENRE_LABELS: Record<Genre, string> = {
  buch: 'Bücher',
  film: 'Filme',
  musik: 'Musik',
  spiel: 'Spiele',
};

/** Singular form for breadcrumbs and detail pages. */
export const GENRE_LABELS_SINGULAR: Record<Genre, string> = {
  buch: 'Buch',
  film: 'Film',
  musik: 'Musik',
  spiel: 'Spiel',
};

export const ALL_GENRES: Genre[] = ['buch', 'film', 'musik', 'spiel'];

export interface StrapiImageFormat {
  url: string;
  width: number;
  height: number;
  mime: string;
  size: number;
}

export interface StrapiImage {
  id: number;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  formats?: {
    thumbnail?: StrapiImageFormat;
    small?: StrapiImageFormat;
    medium?: StrapiImageFormat;
    large?: StrapiImageFormat;
  };
}

export interface Review {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  genre: Genre;
  cover: StrapiImage | null;
  /**
   * Absolute URL to an externally-hosted cover image (e.g. legacy WordPress
   * uploads). Used when no Strapi Media `cover` is attached. ReviewCard /
   * ReviewDetail prefer the Strapi Media if both are set.
   */
  coverUrl: string | null;
  excerpt: string | null;
  /** Strapi Blocks rich text. Used for reviews authored in the Strapi admin. */
  body: unknown[] | null;
  /**
   * Raw HTML — used for legacy WordPress-imported reviews. When present,
   * frontends should render this through a sanitised innerHTML binding
   * inside a `.prose` container and skip the Blocks renderer.
   */
  bodyHtml: string | null;
  rating: number | null;
  subjectTitle: string | null;
  subjectCreator: string | null;
  subjectYear: number | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Comment {
  id: number;
  documentId: string;
  body: string;
  authorName: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewComment {
  body: string;
  authorName: string;
  authorEmail?: string;
  /** Strapi expects the related review's id (numeric) or documentId. */
  review: number | string;
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiCollectionResponse<T> {
  data: T[];
  meta: { pagination: StrapiPagination };
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}
