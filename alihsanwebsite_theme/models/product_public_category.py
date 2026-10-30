from markupsafe import Markup

from odoo import api, fields, models

# Line icons offered for the home page "Our Projects" carousel (24x24 stroke icons).
HOME_ICONS = {
    "house": '<path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6"/>',
    "heart": '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.500-7 10-7 10z"/>',
    "moon": '<path d="M20 14.5A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z"/>',
    "megaphone": '<path d="M3 11v3l12 5V6zM15 9a3 3 0 0 1 0 6M6 14l1.500 6h3L9 15"/>',
    "bulb": '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.5 1 1.200 1 2V16h5v-.1c0-.8.4-1.500 1-2A6 6 0 0 0 12 3z"/>',
    "medical": '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
    "people": '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c0-4 3-6 6.500-6s6.500 2 6.500 6M17 4.500a3.500 3.500 0 0 1 0 7M21.500 20c0-3-1.500-5-4-5.700"/>',
    "water": '<path d="M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z"/>',
    "food": '<path d="M3 12h18a9 9 0 0 1-18 0zM8 8c0-1.500 1-2 1-3.500M12 8c0-1.500 1-2 1-3.500M16 8c0-1.500 1-2 1-3.500"/>',
    "book": '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7"/>',
    "gift": '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S10.500 3 8 3a2.500 2.500 0 0 0 0 5h4zm0 0s1.500-5 4-5a2.500 2.500 0 0 1 0 5h-4z"/>',
}
SVG = (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>'
)


class ProductPublicCategory(models.Model):
    _inherit = "product.public.category"

    ih_home_display = fields.Selection(
        [("shown", "On Home Page"), ("unlisted", "Not on Home Page")],
        string="Home Page",
        default="unlisted",
        required=True,
        group_expand=True,
        help="Show this category in the 'Our Projects' carousel of the home page.",
    )
    ih_home_sequence = fields.Integer(string="Home Order", default=10)
    ih_home_icon = fields.Selection(
        [
            ("house", "Building / Endowment"),
            ("heart", "Heart / Charity"),
            ("moon", "Crescent / Seasonal"),
            ("megaphone", "Megaphone / Campaign"),
            ("bulb", "Light Bulb / Initiative"),
            ("medical", "Medical / Hospital"),
            ("people", "People / Sponsorship"),
            ("water", "Water Drop"),
            ("food", "Food"),
            ("book", "Book / Education"),
            ("gift", "Gift"),
            ("image", "Use the category image"),
        ],
        string="Home Icon",
        default="heart",
        required=True,
    )
    ih_home_url = fields.Char(
        string="Home Link",
        help="Optional. Where the card goes. Leave empty to open this category in the shop.",
    )
    ih_home_icon_preview = fields.Html(compute="_compute_ih_home_icon_preview", sanitize=False)

    @api.depends("ih_home_icon", "image_128")
    def _compute_ih_home_icon_preview(self):
        for category in self:
            category.ih_home_icon_preview = category._ih_home_icon_markup(
                f"/web/image/product.public.category/{category.id}/image_128" if category.id else ""
            )

    def _ih_home_icon_markup(self, image_url):
        self.ensure_one()
        if self.ih_home_icon == "image" and self.image_128 and image_url:
            return Markup('<img src="%s" alt="" loading="lazy"/>') % image_url
        return Markup(SVG % HOME_ICONS.get(self.ih_home_icon, HOME_ICONS["heart"]))

    @api.model
    def _ih_get_home_categories(self, website):
        return self.search(
            [("ih_home_display", "=", "shown"), *website.website_domain()],
            order="ih_home_sequence, sequence, id",
        )
