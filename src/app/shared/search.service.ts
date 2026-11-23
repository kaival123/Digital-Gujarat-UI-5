import { Injectable, signal } from '@angular/core';
import citizen from '../data/citizen.json';
import sugam from '../data/sugam.json';
import dss from '../data/dss.json';
import janseva from '../data/janseva.json';
import linked from '../data/linked.json';

export interface SearchHit {
  title: string;
  kind: string;
  icon: string;
  route?: string;
  query?: string;
  url?: string;
}

const PAGES: SearchHit[] = [
  { title: 'About Us', kind: 'Page', icon: 'pi pi-info-circle', route: '/about-us' },
  { title: 'Latest Update – news, circulars, GRs', kind: 'Page', icon: 'pi pi-megaphone', route: '/latest-update' },
  { title: 'FAQ – frequently asked questions', kind: 'Page', icon: 'pi pi-question-circle', route: '/faq' },
  { title: 'Helpdesk Support – toll free number', kind: 'Page', icon: 'pi pi-headphones', route: '/help-desk' },
  { title: 'Feedback', kind: 'Page', icon: 'pi pi-comment', route: '/feedback' },
  { title: 'Videos – how to apply tutorials', kind: 'Page', icon: 'pi pi-video', route: '/videos' },
  { title: 'Sugam User Manual – PDF guides', kind: 'Page', icon: 'pi pi-book', route: '/user-manual' },
  { title: 'Promotional Campaign', kind: 'Page', icon: 'pi pi-images', route: '/promotional-campaign' },
  { title: 'Site Map', kind: 'Page', icon: 'pi pi-sitemap', route: '/sitemap' },
  { title: 'Privacy Policy', kind: 'Policy', icon: 'pi pi-lock', route: '/privacy-policy' },
  { title: 'Terms & Conditions', kind: 'Policy', icon: 'pi pi-file', route: '/terms-conditions' },
  { title: 'Scholarship Services (GSSP portal)', kind: 'External', icon: 'pi pi-graduation-cap', url: 'https://gssp.gujarat.gov.in/' },
];

const group = (items: { title: string }[], kind: string, icon: string, route: string): SearchHit[] =>
  items.map((i) => ({ title: i.title, kind, icon, route, query: i.title }));

/** Global "smart search" state and index shared by the header, hero and command palette. */
@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly open = signal(false);
  readonly query = signal('');
  readonly trending = ['Income Certificate', 'Ration Card', 'Widow Certificate', 'Domicile Certificate', 'Senior Citizen', 'Caste Certificate'];

  private index: { hit: SearchHit; hay: string }[] = [
    ...PAGES,
    ...group(citizen, 'Citizen Service', 'pi pi-user', '/services/citizen'),
    ...group(sugam, 'Sugam Service', 'pi pi-bolt', '/sugam-digital-gujarat'),
    ...group(dss, 'Digital SevaSetu', 'pi pi-briefcase', '/services/digital-sevasetu'),
    ...group(janseva, 'Janseva Service', 'pi pi-building', '/services/janseva'),
    ...linked.rows.map((r): SearchHit => ({ title: r.name, kind: r.dept, icon: 'pi pi-link', route: '/services/linked', query: r.name })),
  ].map((hit) => ({ hit, hay: (hit.title + ' ' + hit.kind).toLowerCase() }));

  show(q = '') { this.query.set(q); this.open.set(true); }

  /** Ranked token search: every word must match; earlier / whole-word / prefix matches score higher. */
  find(q: string, limit = 30): SearchHit[] {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    const scored: { hit: SearchHit; score: number }[] = [];
    for (const { hit, hay } of this.index) {
      let score = 0;
      let ok = true;
      for (const t of tokens) {
        const i = hay.indexOf(t);
        if (i < 0) { ok = false; break; }
        score += 10 - Math.min(9, i / 8) + (i === 0 ? 8 : 0) + (hay[i - 1] === ' ' ? 4 : 0);
      }
      if (ok) scored.push({ hit, score: score - hit.title.length / 40 });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.hit);
  }
}
