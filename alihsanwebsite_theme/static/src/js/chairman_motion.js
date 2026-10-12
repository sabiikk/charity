import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * Chairman snippets: staggered fade-ins as each block scrolls into view, and
 * the hero portrait drifting with the cursor (port of chairman-motion.js).
 * Public interactions are not started in the website editor, and everything
 * set here is undone in cleanups, so no animation state is ever saved.
 */
export class ChairmanMotion extends Interaction {
    static selector = ".ch-sec";

    // [selector, kind, start delay, step between siblings]
    static STEPS = [
        [".chair-hero-copy>.chair-kicker", "up", 0.05, 0.1],
        [".chair-hero-copy>div:not(.chair-kicker)", "up", 0.18, 0.1],
        [".chair-hero-portrait", "right", 0.2, 0.1],
        [".chair-hero-card", "up", 0.8, 0.1],
        [".chair-aside-card", "left", 0, 0.1],
        [".chair-aside-links a", "left", 0.15, 0.09],
        [".chair-article>*", "up", 0.05, 0.12],
        [".chair-next-card", "up", 0, 0.16],
    ];

    start() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        this.setupReveal();
        this.setupPortraitDrift();
    }

    setupReveal() {
        const items = [];
        for (const [selector, kind, start, step] of ChairmanMotion.STEPS) {
            this.el.querySelectorAll(selector).forEach((el, i) => {
                el.dataset.cm = kind;
                el.style.setProperty("--cm-d", (start + i * step).toFixed(2) + "s");
                items.push(el);
            });
        }
        if (!items.length) {
            return;
        }
        const reset = (el) => {
            delete el.dataset.cm;
            el.classList.remove("cm-in");
            el.style.removeProperty("--cm-d");
        };
        this.el.classList.add("cm-on");
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) {
                        continue;
                    }
                    const el = entry.target;
                    observer.unobserve(el);
                    el.classList.add("cm-in");
                    // once finished, drop the reveal state so hover effects take over
                    const delay = parseFloat(el.style.getPropertyValue("--cm-d")) || 0;
                    this.waitForTimeout(() => reset(el), (delay + 1.1) * 1000);
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        );
        items.forEach((el) => observer.observe(el));
        this.registerCleanup(() => {
            observer.disconnect();
            items.forEach(reset);
            this.el.classList.remove("cm-on");
        });
    }

    setupPortraitDrift() {
        const portrait = this.el.querySelector(".chair-hero-portrait");
        if (!portrait || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            return;
        }
        this.addListener(portrait, "pointermove", (ev) => {
            const r = portrait.getBoundingClientRect();
            portrait.style.setProperty("--mx", ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
            portrait.style.setProperty("--my", ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
        });
        this.addListener(portrait, "pointerleave", () => {
            portrait.style.setProperty("--mx", 0);
            portrait.style.setProperty("--my", 0);
        });
        this.registerCleanup(() => {
            portrait.style.removeProperty("--mx");
            portrait.style.removeProperty("--my");
        });
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.chairman_motion", ChairmanMotion);
