from odoo import models


class SaleOrder(models.Model):
    _inherit = "sale.order"

    def _compute_cart_info(self):
        # A donation is added as "amount x 1 AED": count each donation line once in the cart badge
        super()._compute_cart_info()
        for order in self:
            lines = order.website_order_line
            donations = lines.filtered(lambda line: line.product_id.product_tmpl_id.ih_is_donation)
            if donations:
                order.cart_quantity = int(sum((lines - donations).mapped("product_uom_qty"))) + len(donations)
