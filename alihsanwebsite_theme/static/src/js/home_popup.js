import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * Home page "Featured project" popup (port of #project-modal in script.js of
 * "Al Ihsan web 8"): opens after the delay set in the backend, the amount
 * chips select an amount and "Donate now" adds it to the cart (as a quantity,
 * the product's price is 1) and opens the cart. Not shown inside the website
 * builder's preview, so editing the home page is not interrupted.
 */
export class HomePopup extends Interaction {
    static selector = "dialog.ih-popup";
    dynamicContent = {
        _root: { "t-on-click": (ev) => ev.target === this.el && this.close() },
        ".ip-close": { "t-on-click": () => this.close() },
        ".ip-chip": { "t-on-click": (ev) => this.select(ev.currentTarget) },
        ".ip-donate": { "t-on-click.prevent": (ev) => this.donate(ev.currentTarget) },
    };

    start() {
        if (window.self !== window.top || !this.el.showModal) {
            return;
        }
        const key = "ih_popup_seen_" + this.el.dataset.key;
        if (this.el.dataset.frequency === "session") {
            try {
                if (sessionStorage.getItem(key)) {
                    return;
                }
                sessionStorage.setItem(key, "1");
            } catch {
                // storage blocked: show the popup anyway
            }
        }
        this.waitForTimeout(() => {
            if (!document.querySelector("dialog[open]")) {
                this.el.showModal();
            }
        }, (parseFloat(this.el.dataset.delay) || 0) * 1000);
    }

    close() {
        this.el.close();
    }

    select(chip) {
        for (const el of this.el.querySelectorAll(".ip-chip")) {
            el.classList.toggle("selected", el === chip);
            el.setAttribute("aria-pressed", String(el === chip));
        }
    }

    async donate(button) {
        const chip = this.el.querySelector(".ip-chip.selected");
        if (!chip) {
            // no amount buttons: let the donor choose on the project page
            window.location.href = button.href;
            return;
        }
        button.classList.add("is-busy");
        try {
            await this.waitFor(this.services.cart.add(
                {
                    productTemplateId: parseInt(this.el.dataset.productTemplateId),
                    productId: parseInt(this.el.dataset.productId),
                    quantity: parseInt(chip.dataset.amount),
                },
                { isBuyNow: true, redirectToCart: true, showQuantity: false },
            ));
        } finally {
            button.classList.remove("is-busy");
        }
    }

    destroy() {
        if (this.el.open) {
            this.el.close();
        }
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.home_popup", HomePopup);
