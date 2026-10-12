import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * Aid Registration snippets (port of aidregistration.js):
 * - blocks marked .ar-fade fade in as they scroll into view;
 * - the "Apply" link stays disabled until the terms checkbox is ticked.
 * Public interactions are not started in the website editor, and every change
 * made here is undone in cleanups, so no runtime state is ever saved.
 */
export class AidRegistration extends Interaction {
    static selector = ".ar-sec";
    dynamicContent = {
        ".ar-ok": { "t-on-change": this.onAgreeChange },
    };

    start() {
        this.setupReveal();
        // the page is always saved/edited in its locked state
        this.registerCleanup(() => {
            this.el.querySelectorAll(".ar-apply").forEach((el) => el.setAttribute("aria-disabled", "true"));
            this.el.querySelectorAll(".ar-hint").forEach((el) => el.classList.remove("ok"));
        });
    }

    setupReveal() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const items = [...this.el.querySelectorAll(".ar-fade")];
        const reset = (el) => {
            delete el.dataset.arv;
            el.classList.remove("ar-in");
        };
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) {
                        continue;
                    }
                    const el = entry.target;
                    observer.unobserve(el);
                    el.classList.add("ar-in");
                    // once finished, drop the reveal state so hover effects take over
                    const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
                    this.waitForTimeout(() => reset(el), (delay + 0.9) * 1000);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        items.forEach((el) => {
            el.dataset.arv = "";
            observer.observe(el);
        });
        this.registerCleanup(() => {
            observer.disconnect();
            items.forEach(reset);
        });
    }

    onAgreeChange(ev) {
        const agreed = ev.currentTarget.checked;
        this.el.querySelectorAll(".ar-apply").forEach((el) => {
            el.setAttribute("aria-disabled", String(!agreed));
        });
        this.el.querySelectorAll(".ar-hint").forEach((el) => el.classList.toggle("ok", agreed));
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.aid_registration", AidRegistration);
