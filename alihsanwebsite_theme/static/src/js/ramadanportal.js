import { registry } from "@web/core/registry";
import { getScrollingElement } from "@web/core/utils/scrolling";
import { Interaction } from "@web/public/interaction";

const REVEAL_SELECTOR = [
    ".rm-section",
    ".rm-mission-card",
    ".rm-volunteer-steps article",
    ".rm-guide-note",
    ".rm-faq-list details",
    ".rm-quote-band",
    ".rm-final-cta",
    ".rm-impact-ribbon",
    ".rm-ribbon-item",
    ".rm-ribbon-partners",
].join(",");

/**
 * Ramadan Portal snippets (port of ramadan-portal.js):
 * - RamadanPortalReveal: blocks fade up, staggered, as they scroll into view;
 * - RamadanPortalProgress: the banner's thin bar tracks the page scroll.
 * Public interactions are not started in the website editor, and every change
 * made here is undone in cleanups, so no runtime state is ever saved.
 */
export class RamadanPortalReveal extends Interaction {
    static selector = ".rm-sec";

    start() {
        if (
            !("IntersectionObserver" in window) ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            return;
        }
        const items = [...this.el.querySelectorAll(REVEAL_SELECTOR)];
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("rm-visible");
                        observer.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -28px" }
        );
        items.forEach((el, i) => {
            el.setAttribute("data-reveal", "");
            el.style.setProperty("--reveal-delay", `${(i % 4) * 65}ms`);
            observer.observe(el);
        });
        this.registerCleanup(() => {
            observer.disconnect();
            items.forEach((el) => {
                el.removeAttribute("data-reveal");
                el.classList.remove("rm-visible");
                el.style.removeProperty("--reveal-delay");
            });
        });
    }
}

export class RamadanPortalProgress extends Interaction {
    static selector = ".rm-sec";
    static selectorHas = ".rm-scroll-progress";
    dynamicContent = {
        // capture: the website may scroll #wrapwrap instead of the document
        _window: {
            "t-on-scroll.capture": this.throttled(this.update),
            "t-on-resize": this.throttled(this.update),
        },
    };

    start() {
        this.bar = this.el.querySelector(".rm-scroll-progress");
        this.update();
        this.registerCleanup(() => this.bar.style.removeProperty("width"));
    }

    update() {
        const scroller = getScrollingElement();
        const max = scroller.scrollHeight - scroller.clientHeight;
        const pct = max > 0 ? Math.min(100, Math.max(0, (scroller.scrollTop / max) * 100)) : 0;
        this.bar.style.width = `${pct}%`;
    }
}

registry
    .category("public.interactions")
    .add("alihsanwebsite_theme.ramadan_portal_reveal", RamadanPortalReveal)
    .add("alihsanwebsite_theme.ramadan_portal_progress", RamadanPortalProgress);
