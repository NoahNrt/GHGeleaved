import { Component, computed, inject, input } from '@angular/core';

import { StrapiService } from '../../services/strapi.service';

/**
 * Renders Strapi 5 "Blocks" rich-text JSON as HTML.
 *
 * Why innerHTML and not recursive Angular templates: Blocks are arbitrarily
 * nested and Angular's structural directives don't support clean recursion
 * without one component per block type. Building an HTML string in TS keeps
 * the renderer in one file, and `[innerHTML]` still runs through Angular's
 * default sanitizer so untrusted content can't smuggle in `<script>`.
 *
 * Supported block types: paragraph, heading (h1–h6), list (ordered/unordered),
 * list-item, quote, code, image. Supported inline types: text with formatting
 * (bold / italic / underline / strikethrough / inline-code) and links.
 * Unknown block types fall through silently — log a warning if you hit one.
 */

/** Discriminated union of inline (in-text) nodes. */
type InlineNode = TextNode | LinkNode;

interface TextNode {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

interface LinkNode {
  type: 'link';
  url: string;
  children: InlineNode[];
}

interface BlockImage {
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
}

/** Block-level nodes. */
type BlockNode =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: BlockNode[] }
  | { type: 'list-item'; children: InlineNode[] }
  | { type: 'quote'; children: InlineNode[] }
  | { type: 'code'; children: InlineNode[] }
  | { type: 'image'; image: BlockImage };

@Component({
  selector: 'app-blocks-renderer',
  imports: [],
  template: `<div class="strapi-blocks" [innerHTML]="html()"></div>`,
  styleUrl: './blocks-renderer.css',
})
export class BlocksRenderer {
  private readonly strapi = inject(StrapiService);

  readonly blocks = input<unknown[] | null | undefined>(null);

  protected readonly html = computed(() => {
    const blocks = this.blocks();
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return '';
    return blocks
      .map((b) => this.renderBlock(b as BlockNode))
      .filter(Boolean)
      .join('\n');
  });

  // ─── Block-level rendering ─────────────────────────────────────────────

  private renderBlock(block: BlockNode): string {
    switch (block.type) {
      case 'paragraph':
        return `<p class="mb-4 leading-relaxed text-neutral-200">${this.renderInlines(block.children)}</p>`;
      case 'heading': {
        const level = Math.max(1, Math.min(6, block.level ?? 2));
        const sizeClass = this.headingSize(level);
        return `<h${level} class="mt-8 mb-3 font-bold text-neutral-50 ${sizeClass}">${this.renderInlines(block.children)}</h${level}>`;
      }
      case 'list': {
        const tag = block.format === 'ordered' ? 'ol' : 'ul';
        const listStyle = block.format === 'ordered' ? 'list-decimal' : 'list-disc';
        const items = (block.children ?? [])
          .map((c) => this.renderBlock(c))
          .join('');
        return `<${tag} class="mb-4 ml-6 ${listStyle} space-y-1 text-neutral-200">${items}</${tag}>`;
      }
      case 'list-item':
        return `<li>${this.renderInlines(block.children)}</li>`;
      case 'quote':
        return `<blockquote class="my-6 border-l-4 border-red-600 pl-4 italic text-neutral-300">${this.renderInlines(block.children)}</blockquote>`;
      case 'code':
        return `<pre class="my-4 overflow-x-auto rounded bg-neutral-900 p-4 text-sm text-amber-200"><code>${this.renderInlines(block.children)}</code></pre>`;
      case 'image': {
        const src = this.strapi.mediaUrl(block.image?.url ?? null);
        if (!src) return '';
        const alt = this.escape(block.image?.alternativeText ?? '');
        return `<figure class="my-6"><img src="${this.escape(src)}" alt="${alt}" class="mx-auto rounded shadow-lg" loading="lazy" /></figure>`;
      }
      default:
        return '';
    }
  }

  private headingSize(level: number): string {
    switch (level) {
      case 1:
        return 'text-3xl';
      case 2:
        return 'text-2xl';
      case 3:
        return 'text-xl';
      case 4:
        return 'text-lg';
      default:
        return 'text-base';
    }
  }

  // ─── Inline rendering ──────────────────────────────────────────────────

  private renderInlines(nodes: InlineNode[] | undefined): string {
    if (!nodes) return '';
    return nodes.map((n) => this.renderInline(n)).join('');
  }

  private renderInline(node: InlineNode): string {
    if (node.type === 'link') {
      const href = this.escape(node.url ?? '#');
      const inner = this.renderInlines(node.children);
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-red-400 underline underline-offset-2 hover:text-red-300">${inner}</a>`;
    }
    // text node
    let text = this.escape(node.text ?? '');
    if (node.code) text = `<code class="rounded bg-neutral-800 px-1 py-0.5 text-amber-200">${text}</code>`;
    if (node.bold) text = `<strong>${text}</strong>`;
    if (node.italic) text = `<em>${text}</em>`;
    if (node.underline) text = `<u>${text}</u>`;
    if (node.strikethrough) text = `<s>${text}</s>`;
    return text;
  }

  // ─── HTML escaping ────────────────────────────────────────────────────

  private escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
