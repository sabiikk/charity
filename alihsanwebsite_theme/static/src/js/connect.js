import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * Social + feedback CTA bar (port of the .connect part of footer.js): the bar
 * fades in once scrolled into view, and the feedback faces work as a single
 * choice (one selected at a time).
 * Public interactions are not started in the website editor, and everything
 * set here is undone in cleanups, so no runtime state is ever saved.
 */
export class ConnectBar extends Interaction {
    static selector = ".s_connect";

    start() {
        this.faces = [...this.el.querySelectorAll(".feedback-scale button")];
        const saved = this.faces.map((b) => [b, b.getAttribute("class"), b.getAttribute("aria-pressed")]);
        this.registerCleanup(() => {
            this.el.classList.remove("cn-js", "visible");
            for (const [b, cls, pressed] of saved) {
                cls === null ? b.removeAttribute("class") : b.setAttribute("class", cls);
                pressed === null ? b.removeAttribute("aria-pressed") : b.setAttribute("aria-pressed", pressed);
            }
        });

        // html.js .reveal / .connect.visible of the static site: hidden until scrolled into view
        this.el.classList.add("cn-js");
        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver((entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    this.el.classList.add("visible");
                    io.disconnect();
                }
            }, { threshold: 0.15 });
            io.observe(this.el);
            this.registerCleanup(() => io.disconnect());
        } else {
            this.el.classList.add("visible");
        }

        for (const face of this.faces) {
            this.addListener(face, "click", () => {
                for (const b of this.faces) {
                    b.classList.toggle("selected", b === face);
                    b.setAttribute("aria-pressed", String(b === face));
                }
            });
        }
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.connect_bar", ConnectBar);
