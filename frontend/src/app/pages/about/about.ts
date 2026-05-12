import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../services/seo.service';

/**
 * Static "Redaktion" page — the about / contact / project-info section.
 * Content is intentionally short and editable in markup; nothing here calls
 * the backend, so it's safe to prerender if we ever want to.
 */
@Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  private readonly seo = inject(SeoService);

  constructor() {
    this.seo.update({
      title: 'Redaktion',
      description:
        'Roter Dorn — ein studentisches Projekt, das die Vorlage roterdorn.de mit Angular und Strapi nachbaut.',
    });
  }
}
