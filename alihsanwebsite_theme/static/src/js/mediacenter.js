import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * Media Center snippets (port of mediacenter.js): blocks marked .mc-fade fade
 * in as they scroll into view. Public interactions are not started in the
 * website editor, and the reveal state is removed in cleanups, so it is never saved.
 */
export class MediaCenterReveal extends Interaction {
    static selector = ".mc-sec";

    start() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const items = [...this.el.querySelectorAll(".mc-fade")];
        const reset = (el) => {
            delete el.dataset.mcv;
            el.classList.remove("mc-in");
        };
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) {
                        continue;
                    }
                    const el = entry.target;
                    observer.unobserve(el);
                    el.classList.add("mc-in");
                    // once finished, drop the reveal state so hover effects take over
                    const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
                    this.waitForTimeout(() => reset(el), (delay + 0.9) * 1000);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        items.forEach((el) => {
            el.dataset.mcv = "";
            observer.observe(el);
        });
        this.registerCleanup(() => {
            observer.disconnect();
            items.forEach(reset);
        });
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.mediacenter_reveal", MediaCenterReveal);
