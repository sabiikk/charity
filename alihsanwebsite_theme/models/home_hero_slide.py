from odoo import api, fields, models
from odoo.exceptions import ValidationError


class HomeHeroSlide(models.Model):
    _name = "alihsan.home.hero.slide"
    _description = "Home Hero Slide"
    _order = "sequence, id"

    name = fields.Char(
        string="Title",
        required=True,
        translate=True,
        help="Also used as the image's alternative text (read by screen readers and search engines).",
    )
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True, help="Uncheck to hide this slide without deleting it.")
    image = fields.Image(
        string="Desktop Image",
        required=True,
        max_width=2560,
        max_height=2560,
        help="Recommended: 1920 x 900 px (wide banner).",
    )
    image_mobile = fields.Image(
        string="Mobile Image",
        max_width=1080,
        max_height=1920,
        help="Optional. Shown on phones (screens up to 760px wide) instead of the desktop image.",
    )
    tagline = fields.Char(
        string="Caption",
        translate=True,
        help="Optional. Replaces the small caption line under the slider while this slide is shown.",
    )
    link_url = fields.Char(
        string="Link",
        help="Where the slide, the 'Donate now' button and the 'Explore' link go while this slide is shown. "
        "E.g. /projects-campaigns or https://...",
    )
    link_new_tab = fields.Boolean(string="Open in New Tab")
    website_id = fields.Many2one(
        "website",
        string="Website",
        ondelete="cascade",
        help="Leave empty to show the slide on every website.",
    )
    date_start = fields.Datetime(string="Show From", help="Optional. The slide appears from this moment.")
    date_end = fields.Datetime(string="Show Until", help="Optional. The slide disappears after this moment.")
    position = fields.Integer(compute="_compute_position", string="Position")
    state = fields.Selection(
        [("live", "Live"), ("scheduled", "Scheduled"), ("expired", "Expired"), ("hidden", "Hidden")],
        compute="_compute_state",
        string="Status",
    )

    @api.depends("active", "date_start", "date_end")
    def _compute_state(self):
        now = fields.Datetime.now()
        for slide in self:
            if not slide.active:
                slide.state = "hidden"
            elif slide.date_start and slide.date_start > now:
                slide.state = "scheduled"
            elif slide.date_end and slide.date_end < now:
                slide.state = "expired"
            else:
                slide.state = "live"

    @api.depends("sequence")
    def _compute_position(self):
        ordered = self.with_context(active_test=False).search([]).ids
        for slide in self:
            slide.position = ordered.index(slide.id) + 1 if slide.id in ordered else 0

    @api.constrains("date_start", "date_end")
    def _check_dates(self):
        for slide in self:
            if slide.date_start and slide.date_end and slide.date_end < slide.date_start:
                raise ValidationError(self.env._("'Show Until' must be after 'Show From'."))

    @api.model
    def _get_live_slides(self, website):
        now = fields.Datetime.now()
        return self.search([
            ("website_id", "in", [False, website.id]),
            "|", ("date_start", "=", False), ("date_start", "<=", now),
            "|", ("date_end", "=", False), ("date_end", ">=", now),
        ])
