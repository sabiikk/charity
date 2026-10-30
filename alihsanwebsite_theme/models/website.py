from odoo import api, fields, models
from odoo.exceptions import ValidationError
from odoo.http import request


class Website(models.Model):
    _inherit = "website"

    ih_hero_autoplay = fields.Boolean(string="Hero Autoplay", default=True)
    ih_hero_interval = fields.Integer(string="Hero Slide Duration (seconds)", default=5)
    ih_hero_pause_on_hover = fields.Boolean(string="Hero Pause on Hover", default=True)
    ih_hero_show_dots = fields.Boolean(string="Hero Show Dots", default=True)
    ih_hero_transition = fields.Selection(
        [("fade", "Fade"), ("slide", "Slide")],
        string="Hero Transition",
        default="fade",
        required=True,
    )

    # Home page popup ("Featured project" dialog of index.html of "Al Ihsan web 8")
    ih_popup_active = fields.Boolean(string="Show Home Popup")
    ih_popup_product_id = fields.Many2one(
        "product.template",
        string="Popup Project",
        domain=[("ih_is_donation", "=", True)],
        ondelete="set null",
        help="Donation product shown in the popup. Its goal and amount raised fill the progress bar, "
        "and 'Donate now' adds the selected amount to the cart.",
    )
    ih_popup_image = fields.Image(
        string="Popup Image",
        max_width=1920,
        max_height=1920,
        help="Recommended: 800 x 1000 px (portrait). Leave empty to use the project's image.",
    )
    ih_popup_eyebrow = fields.Char(string="Popup Label", translate=True, default="Featured project")
    ih_popup_title = fields.Char(string="Popup Title", translate=True, help="Leave empty to use the project's name.")
    ih_popup_description = fields.Text(
        string="Popup Text", translate=True, help="Leave empty to use the project's short description.")
    ih_popup_amounts = fields.Char(
        string="Popup Amounts",
        default="10,15,25,50,100,200",
        help="Comma-separated amounts shown as buttons.",
    )
    ih_popup_default_amount = fields.Integer(
        string="Popup Selected Amount", default=50, help="Amount selected when the popup opens.")
    ih_popup_explore_url = fields.Char(
        string="Popup 'Explore More' Link", help="Leave empty to open the project's page.")
    ih_popup_delay = fields.Integer(string="Popup Delay (seconds)", default=1)
    ih_popup_frequency = fields.Selection(
        [("always", "Every time the home page loads"), ("session", "Once per visit")],
        string="Show Popup",
        default="always",
        required=True,
    )

    @api.constrains("ih_hero_interval")
    def _check_ih_hero_interval(self):
        for website in self:
            if not 1 <= website.ih_hero_interval <= 60:
                raise ValidationError(self.env._("The hero slide duration must be between 1 and 60 seconds."))

    @api.constrains("ih_popup_amounts", "ih_popup_default_amount", "ih_popup_delay")
    def _check_ih_popup(self):
        for website in self:
            try:
                website._ih_popup_amounts(strict=True)
            except ValueError:
                raise ValidationError(self.env._("Popup amounts must be whole numbers separated by commas, e.g. 10,25,50,100."))
            if website.ih_popup_default_amount < 0:
                raise ValidationError(self.env._("The popup's selected amount cannot be negative."))
            if not 0 <= website.ih_popup_delay <= 60:
                raise ValidationError(self.env._("The popup delay must be between 0 and 60 seconds."))

    def _ih_popup_amounts(self, strict=False):
        self.ensure_one()
        amounts = []
        for part in (self.ih_popup_amounts or "").replace(" ", "").split(","):
            if not part:
                continue
            try:
                amount = int(part)
            except ValueError:
                if strict:
                    raise
                continue
            if amount > 0:
                amounts.append(amount)
            elif strict:
                raise ValueError(part)
        return amounts

    def _ih_is_home_request(self):
        """True on the home page URL ("/", "/ar"...), not on the other pages."""
        if not request:
            return False
        path = request.httprequest.path.rstrip("/") or "/"
        prefix = request.lang and f"/{request.lang.url_code}"
        if prefix and (path == prefix or path.startswith(prefix + "/")):
            path = path[len(prefix):] or "/"
        return path == "/"

    def _ih_get_popup(self):
        """Values of the home popup, or None when it should not be shown."""
        self.ensure_one()
        product = self.sudo().ih_popup_product_id
        if not (self.ih_popup_active and product.ih_is_donation and product.is_published and product.sale_ok):
            return None
        if self.ih_popup_image:
            image = f"/web/image/website/{self.id}/ih_popup_image?unique={int(self.write_date.timestamp())}"
        else:
            image = f"/web/image/product.template/{product.id}/image_1024?unique={int(product.write_date.timestamp())}"
        goal = product.ih_goal_amount if product.ih_show_progress else 0.0
        return {
            "product": product,
            "variant": product.product_variant_id,
            "image": image,
            "eyebrow": self.ih_popup_eyebrow,
            "title": self.ih_popup_title or product.name,
            "description": self.ih_popup_description or product.ih_short_description or "",
            "amounts": self._ih_popup_amounts(),
            "default": self.ih_popup_default_amount,
            "explore_url": self.ih_popup_explore_url or product.website_url,
            "goal": goal,
            "raised": product.ih_raised_amount,
            "progress": product.ih_progress,
            "currency": self.currency_id.name,
        }

    def _ih_shop_categories(self):
        """Top-level eCommerce categories for the /shop category tabs."""
        self.ensure_one()
        return self.env["product.public.category"].search(
            [("parent_id", "=", False), *self.website_domain()]
        )
