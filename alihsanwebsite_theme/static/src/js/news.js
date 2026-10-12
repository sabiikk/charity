import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * News snippets (port of news.js):
 * - blocks marked .nw-fade fade in as they scroll into view;
 * - the search box (header snippet) filters the stories of every news list
 *   snippet on the page by their visible text.
 * Public interactions are not started in the website editor, and every change
 * made here is undone in cleanups, so no runtime state is ever saved.
 */
export class NewsReveal extends Interaction {
    static selector = ".nw-sec";

    start() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const items = [...this.el.querySelectorAll(".nw-fade")];
        const reset = (el) => {
            delete el.dataset.nwv;
            el.classList.remove("nw-in");
        };
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) {
                        continue;
                    }
                    const el = entry.target;
                    observer.unobserve(el);
                    el.classList.add("nw-in");
                    // once finished, drop the reveal state so hover effects take over
                    const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
                    this.waitForTimeout(() => reset(el), (delay + 0.9) * 1000);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        items.forEach((el) => {
            el.dataset.nwv = "";
            observer.observe(el);
        });
        this.registerCleanup(() => {
            observer.disconnect();
            items.forEach(reset);
        });
    }
}

export class NewsSearch extends Interaction {
    static selector = ".nw-sec .nw-q";
    dynamicContent = {
        _root: { "t-on-input": this.filter },
    };

    get stories() {
        return document.querySelectorAll(".nw-sec .nw-feat, .nw-sec .nw-card");
    }

    start() {
        this.registerCleanup(() => {
            this.stories.forEach((el) => el.classList.remove("d-none"));
            document.querySelectorAll(".nw-sec .nw-empty").forEach((el) => el.classList.add("d-none"));
        });
    }

    filter() {
        const term = this.el.value.trim().toLowerCase();
        for (const list of document.querySelectorAll(".nw-sec .nw-list")) {
            let shown = 0;
            list.querySelectorAll(".nw-feat, .nw-card").forEach((el) => {
                const match = !term || el.textContent.toLowerCase().includes(term);
                el.classList.toggle("d-none", !match);
                shown += match ? 1 : 0;
            });
            list.querySelectorAll(".nw-empty").forEach((el) => el.classList.toggle("d-none", shown > 0));
        }
    }
}

registry
    .category("public.interactions")
    .add("alihsanwebsite_theme.news_reveal", NewsReveal)
    .add("alihsanwebsite_theme.news_search", NewsSearch);
