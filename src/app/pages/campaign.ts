import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Image } from 'primeng/image';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import { IMG, SITE } from '../shared/site';

const P = IMG + 'assets/img/';
const hoardings = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => P + `hoarding/hoardings0${n}.jpg`);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-campaign',
  imports: [ButtonDirective, Image, Tabs, TabList, Tab, TabPanels, TabPanel, PageHero, Reveal],
  template: `
    <app-page-hero title="Promotional Campaign" subtitle="Promoting digital services and initiatives for a better tomorrow." icon="pi pi-megaphone" />
    <section class="section" data-main tabindex="-1">
      <div class="container">
        <p-tabs value="all">
          <p-tablist>
            <p-tab value="all">All Campaigns</p-tab>
            <p-tab value="videos">Videos</p-tab>
            <p-tab value="standee">Standee</p-tab>
            <p-tab value="bus">Bus Panel</p-tab>
            <p-tab value="hoardings">Hoardings</p-tab>
          </p-tablist>
          <p-tabpanels>
            <p-tabpanel value="all">
              <div class="promo-cards">
                @for (c of cards; track c.title; let i = $index) {
                  <article class="promo-card" [appReveal]="'up'" [revealDelay]="i * 90">
                    <img [src]="c.img" alt="" loading="lazy">
                    <div><h3>{{ c.title }}</h3><h4>{{ c.sub }}</h4><p>{{ c.text }}</p></div>
                  </article>
                }
              </div>
            </p-tabpanel>
            <p-tabpanel value="videos">
              <p>Campaign TV commercials are hosted on the official portal.</p>
              <a pButton [href]="site + 'Campaign.aspx'" target="_blank" rel="noopener"><i class="pi pi-video"></i> Watch campaign videos</a>
            </p-tabpanel>
            <p-tabpanel value="standee"><div class="gallery">@for (i of standee; track i) { <p-image [src]="i" alt="Standee" [preview]="true" appendTo="body" imageClass="gal-img" /> }</div></p-tabpanel>
            <p-tabpanel value="bus"><div class="gallery">@for (i of bus; track i) { <p-image [src]="i" alt="Bus panel" [preview]="true" appendTo="body" imageClass="gal-img" /> }</div></p-tabpanel>
            <p-tabpanel value="hoardings"><div class="gallery">@for (i of hoardings; track i) { <p-image [src]="i" alt="Hoarding" [preview]="true" appendTo="body" imageClass="gal-img" /> }</div></p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>
    </section>
  `,
})
export class CampaignPage {
  site = SITE;
  standee = [P + 'standeebuspanel/standeedesign.jpeg', P + 'standeebuspanel/standeemockup.jpeg'];
  bus = [P + 'standeebuspanel/buspaneldesign.jpeg', P + 'standeebuspanel/buspanelmockup.jpeg'];
  hoardings = hoardings;
  cards = [
    { title: 'Videos', sub: 'Watch our campaign videos', text: 'Promoting digital services and initiatives for a better tomorrow.', img: P + 'promotion04.jpg' },
    { title: 'Standee', sub: 'View campaign standees', text: 'Promoting digital services and initiatives for a better tomorrow.', img: P + 'promotion01.jpg' },
    { title: 'Bus Panel', sub: 'On-road campaign visibility', text: 'Reaching citizens across cities and towns.', img: P + 'promotion02.jpg' },
    { title: 'Hoardings', sub: 'Outdoor campaign reach', text: 'Spreading awareness across Gujarat with impactful hoardings.', img: P + 'promotion03.jpg' },
  ];
}
