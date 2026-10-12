from odoo import fields, models


class WebsiteMenu(models.Model):
    _inherit = "website.menu"

    # Shown by the Al Ihsan header: under a top-level menu it is the mega panel's
    # heading, under a sub-menu it is the grey line below the link.
    ih_description = fields.Char(
        string="Header Description",
        translate=True,
        help="Al Ihsan header: heading of the dropdown panel (top-level menus) "
        "or the short line shown under the link (sub-menus).",
    )
