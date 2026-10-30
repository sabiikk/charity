import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * Donation product page (port of project.js of "Al Ihsan web 7"): the amount
 * input, slider and quick-amount chips stay in sync; "Donate now" and
 * "Add to basket" add the amount to the Odoo cart as a quantity (the
 * product's price is 1).
 */
export class DonationProduct extends Interaction {
    static selector = ".ih-donation";
    dynamicContent = {
        ".pd-minus": { "t-on-click": () => this.stepBy(-1) },
        ".pd-plus": { "t-on-click": () => this.stepBy(1) },
        ".pd-range": { "t-on-input": (ev) => this.sync(ev.currentTarget.value, "range") },
        ".pd-amt": {
            "t-on-input": (ev) => this.sync(ev.currentTarget.value, "amt"),
            "t-on-change": () => this.sync(this.amount(), "init"),
        },
        ".pd-chips button": { "t-on-click": (ev) => this.sync(ev.currentTarget.dataset.v) },
        ".pd-donate": { "t-on-click.prevent": (ev) => this.addToCart(ev.currentTarget, true) },
        ".pd-cart": { "t-on-click.prevent": (ev) => this.addToCart(ev.currentTarget, false) },
    };

    setup() {
        const data = this.el.dataset;
        this.min = parseInt(data.min) || 1;
        this.max = parseInt(data.max) || 50000;
        this.currency = data.currency || "";
        this.amt = this.el.querySelector(".pd-amt");
        this.range = this.el.querySelector(".pd-range");
        this.sum = this.el.querySelector(".pd-sum");
        this.chips = [...this.el.querySelectorAll(".pd-chips button")];
    }

    start() {
        this.sync(parseInt(this.el.dataset.default) || this.min, "init");
    }

    amount() {
        return Math.max(this.min, Math.min(parseInt(this.amt.value) || 0, this.max));
    }

    sync(value, from) {
        const v = Math.max(0, Math.min(parseInt(value) || 0, this.max));
        if (from !== "amt") {
            this.amt.value = v || "";
        }
        if (from !== "range") {
            this.range.value = Math.max(this.min, v);
        }
        const p = ((Math.max(this.min, v) - this.min) / (this.max - this.min)) * 100;
        this.range.style.setProperty("--p", `${p}%`);
        this.chips.forEach((b) => b.classList.toggle("on", parseInt(b.dataset.v) === v));
        this.sum.textContent = `${this.currency} ${(v || 0).toLocaleString("en-US")}`;
    }

    stepBy(direction) {
        const v = parseInt(this.amt.value) || 0;
        const step = v >= 1000 ? 500 : v >= 100 ? 50 : v >= 10 ? 10 : 1;
        this.sync(Math.max(this.min, v + direction * step));
    }

    async addToCart(button, isDonateNow) {
        const amount = this.amount();
        this.sync(amount, "init");
        button.classList.add("is-busy");
        try {
            await this.waitFor(this.services.cart.add(
                {
                    productTemplateId: parseInt(this.el.dataset.productTemplateId),
                    productId: parseInt(this.el.dataset.productId),
                    quantity: amount,
                },
                { isBuyNow: true, redirectToCart: isDonateNow, showQuantity: false },
            ));
            if (!isDonateNow) {
                button.classList.add("is-done");
                this.waitForTimeout(() => button.classList.remove("is-done"), 1500);
            }
        } finally {
            button.classList.remove("is-busy");
        }
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.donation_product", DonationProduct);
