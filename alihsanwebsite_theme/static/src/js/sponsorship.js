import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * Sponsorship snippets (port of sponsorship.js): the Kaflat / Ongoing Charity
 * tabs show only the cards of that category (data-cat); clicking the selected
 * tab again shows all cards. Public interactions are not started in the
 * website editor, so editors always see every card.
 */
export class SponsorshipTabs extends Interaction {
    static selector = ".spn-sec";
    static selectorHas = ".sp-tab";
    dynamicContent = {
        ".sp-tab": {
            "t-on-click": (ev) => {
                const f = ev.currentTarget.dataset.f;
                this.current = this.current === f ? null : f;
            },
            "t-att-class": (el) => ({ selected: !!this.current && el.dataset.f === this.current }),
            "t-att-aria-selected": (el) => String(!!this.current && el.dataset.f === this.current),
        },
        ".sp-card": {
            "t-att-class": (el) => ({ "d-none": !!this.current && el.dataset.cat !== this.current }),
        },
    };

    setup() {
        this.current = null;
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.sponsorship_tabs", SponsorshipTabs);
