from odoo import api, fields, models
from odoo.exceptions import ValidationError

from odoo.addons.html_editor.tools import get_video_source_data, get_video_thumbnail, get_video_url_data


class MediaCenterMixin(models.AbstractModel):
    """Fields shared by the Images, Videos and Events items of the Media Center."""
    _name = "alihsan.media.mixin"
    _description = "Media Center Item"
    _order = "date desc, id desc"

    name = fields.Char(string="Title", required=True, translate=True)
    date = fields.Date(required=True, default=fields.Date.context_today)
    active = fields.Boolean(default=True, help="Uncheck to hide this item without deleting it.")
    website_id = fields.Many2one(
        "website",
        string="Website",
        ondelete="cascade",
        help="Leave empty to show it on every website.",
    )

    @api.model
    def _get_published(self, website):
        return self.search([("website_id", "in", [False, website.id])])


class MediaGallery(models.Model):
    _name = "alihsan.media.gallery"
    _inherit = "alihsan.media.mixin"
    _description = "Media Center Image Gallery"

    image = fields.Image(
        string="Cover Image",
        max_width=1920,
        max_height=1920,
        help="Shown on the gallery card. Leave empty to use the first photo.",
    )
    photo_ids = fields.One2many("alihsan.media.gallery.photo", "gallery_id", string="Photos")
    photo_count = fields.Integer(compute="_compute_photo_count", string="Photos")

    @api.depends("photo_ids")
    def _compute_photo_count(self):
        for gallery in self:
            gallery.photo_count = len(gallery.photo_ids)

    # "name" is always written on create, so the check also runs for galleries created without images
    @api.constrains("name", "image", "photo_ids")
    def _check_has_image(self):
        for gallery in self:
            if not gallery.image and not gallery.photo_ids:
                raise ValidationError(self.env._("Add a cover image or at least one photo to the gallery “%s”.", gallery.name))

    def _cover(self):
        """(record, field) of the image shown on the card."""
        self.ensure_one()
        return (self, "image") if self.image else (self.photo_ids[:1], "image")


class MediaGalleryPhoto(models.Model):
    _name = "alihsan.media.gallery.photo"
    _description = "Media Center Gallery Photo"
    _order = "sequence, id"

    gallery_id = fields.Many2one("alihsan.media.gallery", required=True, ondelete="cascade", index=True)
    name = fields.Char(string="Caption", translate=True)
    sequence = fields.Integer(default=10)
    image = fields.Image(required=True, max_width=1920, max_height=1920)


class MediaVideo(models.Model):
    _name = "alihsan.media.video"
    _inherit = "alihsan.media.mixin"
    _description = "Media Center Video"

    video_url = fields.Char(
        string="Video Link",
        help="A YouTube, Vimeo, Dailymotion, Instagram or Facebook link, or the address of an .mp4 file. "
        "Leave empty to show “The video will be available here soon”.",
    )
    image = fields.Image(
        string="Thumbnail",
        max_width=1920,
        max_height=1920,
        help="Leave empty to use the thumbnail of the YouTube / Vimeo video.",
    )
    platform = fields.Char(compute="_compute_embed")
    embed_url = fields.Char(compute="_compute_embed", help="Player address for YouTube, Vimeo... links.")

    @api.depends("video_url")
    def _compute_embed(self):
        for video in self:
            data = video.video_url and get_video_url_data(video.video_url, autoplay=True)
            if data and "error" not in data:
                video.platform = data["platform"]
                video.embed_url = data["embed_url"]
            else:
                video.platform = video.embed_url = False

    def _fill_thumbnails(self):
        for video in self:
            if not video.image and video.video_url and get_video_source_data(video.video_url):
                thumbnail = get_video_thumbnail(video.video_url)
                if thumbnail:
                    video.image = thumbnail

    @api.model_create_multi
    def create(self, vals_list):
        videos = super().create(vals_list)
        videos._fill_thumbnails()
        return videos

    def write(self, vals):
        result = super().write(vals)
        if "video_url" in vals or "image" in vals:
            self._fill_thumbnails()
        return result


class MediaEvent(models.Model):
    _name = "alihsan.media.event"
    _inherit = "alihsan.media.mixin"
    _description = "Media Center Event"

    time = fields.Float(string="Start Time", help="Leave empty when the time is not known yet.")
    location = fields.Char(translate=True, help="E.g. Venue to be announced")
    description = fields.Text(translate=True, help="Shown on the card and in the details pop-up.")
    image = fields.Image(required=True, max_width=1920, max_height=1920)
    donate_url = fields.Char(
        string="Donate Link",
        help="Where “Donate to support” goes in the details pop-up. Leave empty to use the section's link (/shop).",
    )
    upcoming = fields.Boolean(compute="_compute_upcoming")

    @api.depends("date")
    def _compute_upcoming(self):
        today = fields.Date.context_today(self)
        for event in self:
            event.upcoming = event.date >= today

    def _time_label(self):
        """'7:00 PM' (empty when no time is set)."""
        self.ensure_one()
        if not self.time:
            return ""
        hours, minutes = divmod(round(self.time * 60), 60)
        return f"{(hours % 12) or 12}:{minutes:02d} {'AM' if hours < 12 else 'PM'}"
