from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    ih_hero_autoplay = fields.Boolean(related="website_id.ih_hero_autoplay", readonly=False)
    ih_hero_interval = fields.Integer(related="website_id.ih_hero_interval", readonly=False)
    ih_hero_pause_on_hover = fields.Boolean(related="website_id.ih_hero_pause_on_hover", readonly=False)
    ih_hero_show_dots = fields.Boolean(related="website_id.ih_hero_show_dots", readonly=False)
    ih_hero_transition = fields.Selection(related="website_id.ih_hero_transition", readonly=False)
    ih_popup_active = fields.Boolean(related="website_id.ih_popup_active", readonly=False)
    ih_popup_product_id = fields.Many2one(related="website_id.ih_popup_product_id", readonly=False)
    ih_popup_image = fields.Image(related="website_id.ih_popup_image", readonly=False)
    ih_popup_eyebrow = fields.Char(related="website_id.ih_popup_eyebrow", readonly=False)
    ih_popup_title = fields.Char(related="website_id.ih_popup_title", readonly=False)
    ih_popup_description = fields.Text(related="website_id.ih_popup_description", readonly=False)
    ih_popup_amounts = fields.Char(related="website_id.ih_popup_amounts", readonly=False)
    ih_popup_default_amount = fields.Integer(related="website_id.ih_popup_default_amount", readonly=False)
    ih_popup_explore_url = fields.Char(related="website_id.ih_popup_explore_url", readonly=False)
    ih_popup_delay = fields.Integer(related="website_id.ih_popup_delay", readonly=False)
    ih_popup_frequency = fields.Selection(related="website_id.ih_popup_frequency", readonly=False)

    def action_open_ih_hero_slides(self):
        return self.env["ir.actions.act_window"]._for_xml_id("alihsanwebsite_theme.action_home_hero_slide")
