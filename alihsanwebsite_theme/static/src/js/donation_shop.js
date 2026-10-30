import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * /shop donation cards: the basket button adds the typed amount to the cart
 * (as a quantity, the product's price is 1); "Donate now" does the same and
 * opens the cart. Without an amount, the product's default amount is used.
 */
export class DonationShopCard extends Interaction {
    static selector = ".ih-pj-card";
    dynamicContent = {
        ".pj-cart": { "t-on-click.prevent": (ev) => this.addToCart(ev.currentTarget, false) },
        ".pj-donate": { "t-on-click.prevent": (ev) => this.addToCart(ev.currentTarget, true) },
        ".pj-amt": { "t-on-keydown": (ev) => ev.key === "Enter" && this.addToCart(this.el.querySelector(".pj-donate"), true) },
    };

    amount() {
        const data = this.el.dataset;
        const min = parseInt(data.min) || 1;
        const max = parseInt(data.max) || 50000;
        const input = this.el.querySelector(".pj-amt");
        const value = Math.max(min, Math.min(parseInt(input.value) || parseInt(data.default) || min, max));
        input.value = value;
        return value;
    }

    async addToCart(button, isDonateNow) {
        const quantity = this.amount();
        button.classList.add("is-busy");
        try {
            await this.waitFor(this.services.cart.add(
                {
                    productTemplateId: parseInt(this.el.dataset.productTemplateId),
                    productId: parseInt(this.el.dataset.productId),
                    quantity,
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

registry.category("public.interactions").add("alihsanwebsite_theme.donation_shop_card", DonationShopCard);
