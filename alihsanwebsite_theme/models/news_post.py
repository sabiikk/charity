from odoo import api, fields, models


class NewsPost(models.Model):
    _name = "alihsan.news.post"
    _description = "Media Center News"
    _order = "date desc, id desc"

    name = fields.Char(
        string="Title",
        required=True,
        translate=True,
        help="Also used as the image's alternative text (read by screen readers and search engines).",
    )
    summary = fields.Text(string="Summary", translate=True, help="Short text shown under the title.")
    body = fields.Html(
        string="Full Story",
        translate=True,
        sanitize=True,
        help="Text of the story's own page (opened by 'Read more'). Can also be edited on that page in the website editor.",
    )
    tag = fields.Char(string="Tag", translate=True, help="Small label on the story, e.g. Campaigns, Awards, Events.")
    date = fields.Date(required=True, default=fields.Date.context_today)
    image = fields.Image(
        required=True,
        max_width=1920,
        max_height=1920,
        help="Recommended: 1200 x 800 px (landscape).",
    )
    link_url = fields.Char(
        string="Other Read More Link",
        help="Optional. Leave empty so the image, the title and 'Read more' open the story's own page "
        "(title, image, date, full story and the other news of the year). Fill it to send visitors "
        "somewhere else instead, e.g. https://...",
    )
    link_new_tab = fields.Boolean(string="Open in New Tab")
    featured = fields.Boolean(
        help="Shown in the large card at the top of the news list. "
        "When several stories are featured, the most recent one is used; when none is, the most recent story.",
    )
    active = fields.Boolean(default=True, help="Uncheck to hide this story without deleting it.")
    website_url = fields.Char(string="Story Page", compute="_compute_website_url")
    website_id = fields.Many2one(
        "website",
        string="Website",
        ondelete="cascade",
        help="Leave empty to show the story on every website.",
    )

    @api.depends("name")
    def _compute_website_url(self):
        for post in self:
            post.website_url = post.id and f"/news/{self.env['ir.http']._slug(post)}"

    def _ih_link(self):
        """(url, new_tab) of the story's links: its own page unless another link is set."""
        self.ensure_one()
        if self.link_url:
            return self.link_url, self.link_new_tab
        return self.website_url, False

    @api.model
    def _get_published(self, website):
        """Published stories of ``website``, the featured story first."""
        posts = self.search([("website_id", "in", [False, website.id])])
        featured = posts.filtered("featured")[:1] or posts[:1]
        return featured | (posts - featured)
