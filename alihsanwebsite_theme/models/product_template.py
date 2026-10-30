from odoo import api, fields, models
from odoo.exceptions import ValidationError


class ProductTemplate(models.Model):
    _inherit = "product.template"

    ih_is_donation = fields.Boolean(
        string="Donation Page",
        help="Show this product with the Al Ihsan donation design: progress bar, amount picker, "
        "quick amounts, Donate now / SMS / Add to basket. The donated amount is added to the cart "
        "as a quantity, so keep the Sales Price at 1.",
    )
    ih_short_description = fields.Text(
        string="Short Description",
        translate=True,
        help="Text under the title (the gold-bordered paragraph).",
    )
    ih_show_progress = fields.Boolean(string="Show Funding Progress", default=True)
    ih_goal_amount = fields.Float(string="Goal", help="Target amount. Leave 0 to hide the progress bar.")
    ih_raised_offline = fields.Float(
        string="Raised Outside the Website",
        help="Donations received by other means (bank transfer, SMS, cash...), added to the online total.",
    )
    ih_raised_online = fields.Float(
        string="Raised Online",
        compute="_compute_ih_raised",
        compute_sudo=True,
        help="Total of confirmed orders for this product.",
    )
    ih_raised_amount = fields.Float(string="Current", compute="_compute_ih_raised", compute_sudo=True)
    ih_progress = fields.Float(string="Progress (%)", compute="_compute_ih_raised", compute_sudo=True)
    ih_min_amount = fields.Integer(string="Minimum Amount", default=1)
    ih_max_amount = fields.Integer(string="Maximum Amount", default=50000, help="End of the amount slider.")
    ih_default_amount = fields.Integer(string="Default Amount", default=1)
    ih_quick_amounts = fields.Char(
        string="Quick Amounts",
        default="10,15,25,50,100,200,500,1000,2500,5000",
        help="Comma-separated amounts shown as buttons.",
    )
    ih_sms_link = fields.Char(
        string="SMS Donation Link",
        help="Optional, e.g. sms:4040?body=1000. The 'SMS donation' button is hidden when empty.",
    )
    ih_show_related = fields.Boolean(string="Show Related Projects", default=True)

    @api.depends("ih_raised_offline", "ih_goal_amount")
    def _compute_ih_raised(self):
        online = {}
        donations = self.filtered(lambda t: t.ih_is_donation and t.id)
        if donations:
            groups = self.env["sale.order.line"]._read_group(
                [("product_id.product_tmpl_id", "in", donations.ids), ("state", "=", "sale")],
                ["product_id"],
                ["price_total:sum"],
            )
            for product, total in groups:
                tmpl_id = product.product_tmpl_id.id
                online[tmpl_id] = online.get(tmpl_id, 0.0) + total
        for template in self:
            template.ih_raised_online = online.get(template.id, 0.0)
            template.ih_raised_amount = template.ih_raised_online + template.ih_raised_offline
            goal = template.ih_goal_amount
            template.ih_progress = min(100.0, template.ih_raised_amount / goal * 100) if goal > 0 else 0.0

    @api.onchange("ih_is_donation")
    def _onchange_ih_is_donation(self):
        if self.ih_is_donation:
            self.list_price = 1.0

    @api.constrains("ih_min_amount", "ih_max_amount", "ih_default_amount", "ih_quick_amounts")
    def _check_ih_amounts(self):
        for template in self.filtered("ih_is_donation"):
            if template.ih_min_amount < 1 or template.ih_max_amount <= template.ih_min_amount:
                raise ValidationError(self.env._("The maximum amount must be greater than the minimum amount (at least 1)."))
            if not template.ih_min_amount <= template.ih_default_amount <= template.ih_max_amount:
                raise ValidationError(self.env._("The default amount must be between the minimum and maximum amounts."))
            try:
                template._ih_get_quick_amounts(strict=True)
            except ValueError:
                raise ValidationError(self.env._("Quick amounts must be whole numbers separated by commas, e.g. 10,25,50,100."))

    def _ih_get_quick_amounts(self, strict=False):
        self.ensure_one()
        amounts = []
        for part in (self.ih_quick_amounts or "").replace(" ", "").split(","):
            if not part:
                continue
            try:
                amounts.append(int(part))
            except ValueError:
                if strict:
                    raise
        return amounts

    def _ih_get_slider_ticks(self):
        """Six evenly spaced labels under the amount slider (10, 10K, 20K...)."""
        self.ensure_one()
        lo, hi = self.ih_min_amount, self.ih_max_amount

        def label(value):
            return f"{round(value / 1000)}K" if value >= 1000 else str(value)

        return [label(round(lo + (hi - lo) * i / 5)) for i in range(6)]

    def _ih_get_related_projects(self, website, limit=3):
        """Other donation products of the website, same category first."""
        self.ensure_one()
        others = self.search(
            [("ih_is_donation", "=", True), ("id", "!=", self.id), ("is_published", "=", True),
             *website.website_domain()],
        )
        cats = set(self.public_categ_ids.ids)
        return others.sorted(lambda t: not (cats & set(t.public_categ_ids.ids)))[:limit]
