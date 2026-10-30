import { patch } from "@web/core/utils/patch";
import { CartService } from "@website_sale/js/cart_service";

/**
 * The donation product page replaces #product_detail, so there is no
 * .oe_website_sale element to receive add_to_cart_event. Adding that class
 * would start the WebsiteSale interaction, which needs the standard product
 * page DOM, so skip the tracking event instead when the element is missing.
 */
patch(CartService.prototype, {
    _trackProducts(trackingInfo) {
        if (document.querySelector(".oe_website_sale")) {
            return super._trackProducts(trackingInfo);
        }
    },
});
