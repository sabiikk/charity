import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * Al Ihsan footer (port of footer.js): the columns fade in one after another
 * when the footer scrolls into view. The CSS only hides them while the
 * runtime class .ft-js is set, so the website editor (where public
 * interactions do not run) always shows the whole footer, and the cleanup
 * removes every class added here so nothing runtime is ever saved.
 */
export class AlihsanFooter extends Interaction {
    static selector = "footer#bottom.ih-footer";

    start() {
        const columns = [...this.el.querySelectorAll(".ftf")];
        this.registerCleanup(() => {
            this.el.classList.remove("ft-js");
            columns.forEach((c) => c.classList.remove("on"));
        });
        if (!columns.length || !("IntersectionObserver" in window)) {
            return;
        }
        this.el.classList.add("ft-js");
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (e.isIntersecting) {
                    e.target.classList.add("on");
                    io.unobserve(e.target);
                }
            }
        }, { threshold: 0.1 });
        columns.forEach((c) => io.observe(c));
        this.registerCleanup(() => io.disconnect());
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.footer", AlihsanFooter);
