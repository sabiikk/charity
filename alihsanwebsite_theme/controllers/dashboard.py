import base64
import json
import os
from datetime import timedelta

from markupsafe import Markup
from werkzeug.exceptions import Forbidden

from odoo import fields, http
from odoo.exceptions import AccessError, UserError, ValidationError
from odoo.http import request
from odoo.tools import html2plaintext, is_html_empty, plaintext2html

# Media Center kind -> (model, fields the dashboard may write)
MEDIA_KINDS = {
    "images": ("alihsan.media.gallery", {"name", "date", "active"}),
    "videos": ("alihsan.media.video", {"name", "date", "video_url", "active"}),
    "events": ("alihsan.media.event", {"name", "date", "time", "location", "description", "donate_url", "active"}),
}

# Who can open the dashboard. Data is read with the user's own rights, so record rules still apply.
DASHBOARD_GROUP = "sales_team.group_sale_salesman"
SETTINGS_PARAM = "alihsanwebsite_theme.dashboard_settings"
DEFAULT_SETTINGS = {
    "org": "Al Ihsan Charity Association",
    "email": "info@alihsan.ae",
    "phone": "800 16",
    "cur": "AED",
    "minAmt": 10,
    "monthlyGoal": 420000,
    "applePay": True,
    "gpay": True,
    "sms": True,
    "cash": True,
    "autoReceipt": True,
    "receiptAr": True,
    "emailDaily": True,
    "kioskAlert": True,
    "bigGift": True,
    "bigGiftAmt": 5000,
}
# 2 x the longest dashboard period (90 days) so "vs previous period" works, plus a margin
HISTORY_DAYS = 190
DEFAULT_CAMPAIGN_IMG = "/alihsanwebsite_theme/static/src/img/giving.jpg"
# Dashboard role -> group xmlid, checked in this order
ROLE_GROUPS = [
    ("admin", "base.group_system"),
    ("finance", "account.group_account_manager"),
    ("campaign", "sales_team.group_sale_manager"),
    ("content", "website.group_website_designer"),
]


STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "src", "dashboard")


def _asset_version():
    """Changes whenever a dashboard file changes, so browsers never keep a stale copy (static files are cached 7 days)."""
    return str(max(int(os.path.getmtime(os.path.join(STATIC_DIR, name))) for name in os.listdir(STATIC_DIR)))


class AlihsanDashboard(http.Controller):

    # ------------------------------------------------------------------ helpers
    def _check_access(self):
        user = request.env.user
        if not user._is_internal() or not user.has_group(DASHBOARD_GROUP):
            raise Forbidden()

    def _settings(self):
        raw = request.env["ir.config_parameter"].sudo().get_param(SETTINGS_PARAM)
        settings = dict(DEFAULT_SETTINGS)
        if raw:
            try:
                settings.update(json.loads(raw))
            except ValueError:
                pass
        return settings

    def _arabic_lang(self):
        lang = request.env["res.lang"].search([("code", "=like", "ar%")], limit=1)
        return lang.code if lang else False

    @staticmethod
    def _iso(dt):
        return dt and fields.Datetime.to_datetime(dt).isoformat() + "Z"

    def _campaign_data(self, ar_lang):
        Template = request.env["product.template"].with_context(active_test=False, lang="en_US")
        templates = Template.search([("ih_is_donation", "=", True)], order="is_published desc, write_date desc")
        ar_names = {}
        if ar_lang:
            for tmpl in templates.with_context(lang=ar_lang):
                ar_names[tmpl.id] = (tmpl.name, tmpl.ih_short_description or "")
        campaigns = []
        for tmpl in templates:
            ar_name, ar_desc = ar_names.get(tmpl.id, (tmpl.name, tmpl.ih_short_description or ""))
            if not tmpl.active:
                status = "ended"
            elif tmpl.is_published:
                status = "active"
            else:
                status = "draft"
            campaigns.append({
                "id": str(tmpl.id),
                "en": tmpl.name,
                "ar": ar_name,
                "den": tmpl.ih_short_description or "",
                "dar": ar_desc,
                "img": f"/web/image/product.template/{tmpl.id}/image_512" if tmpl.image_1920 else DEFAULT_CAMPAIGN_IMG,
                "goal": tmpl.ih_goal_amount or 0,
                "raised": tmpl.ih_raised_amount,
                "cat": tmpl.public_categ_ids[:1].name or "",
                "status": status,
                "ch": ["web"],
                "end": None,
                "url": tmpl.website_url,
            })
        return campaigns

    def _donation_data(self):
        since = fields.Datetime.now() - timedelta(days=HISTORY_DAYS)
        lines = request.env["sale.order.line"].search([
            ("state", "=", "sale"),
            ("product_id.product_tmpl_id.ih_is_donation", "=", True),
            ("order_id.date_order", ">=", since),
        ], order="id desc")
        public_partners = request.env["website"].sudo().search([]).user_id.partner_id
        cities, city_index = [], {}
        donors = {}
        donations = []
        seen_orders = {}

        def city_of(partner):
            name = partner.state_id.name or partner.city or request.env._("Unknown")
            if name not in city_index:
                city_index[name] = len(cities)
                cities.append([name, name])
            return city_index[name]

        for line in lines:
            order = line.order_id
            partner = order.partner_id.commercial_partner_id
            donor_id = None
            if partner and partner not in public_partners:
                donor_id = f"DN{partner.id}"
                if donor_id not in donors:
                    donors[donor_id] = {
                        "id": donor_id,
                        "name": partner.name or "?",
                        "phone": partner.phone or "",
                        "email": partner.email or "",
                        "city": city_of(partner),
                        "odoo": partner.id,
                    }
            tx = order.transaction_ids.filtered(lambda t: t.state == "done")[:1]
            count = seen_orders.get(order.id, 0)
            seen_orders[order.id] = count + 1
            donations.append({
                "id": f"#{order.name}" + (f"-{count + 1}" if count else ""),
                "order": order.id,
                "date": self._iso(order.date_order),
                "camp": str(line.product_id.product_tmpl_id.id),
                "ch": "web",
                "amt": line.price_total,
                "pay": tx.provider_id.name if tx else "Manual",
                "kiosk": None,
                "city": city_of(partner) if partner else city_of(order.partner_id),
                "donor": donor_id,
                "rc": "issued" if order.invoice_ids.filtered(lambda m: m.state == "posted") else "pending",
            })
        return donations, list(donors.values()), cities

    def _user_data(self):
        users = request.env["res.users"].with_context(active_test=False).search(
            [("share", "=", False), ("id", "!=", request.env.ref("base.user_root").id)]
        )
        role_groups = [(role, request.env.ref(xmlid, raise_if_not_found=False)) for role, xmlid in ROLE_GROUPS]
        now = fields.Datetime.now()
        result = []
        for user in users:
            groups = user.sudo().all_group_ids
            role = next((role for role, group in role_groups if group and group in groups), "viewer")
            last = user.sudo().login_date
            result.append({
                "id": user.id,
                "name": user.name,
                "email": user.email or user.login,
                "role": role,
                "active": user.active,
                "last": round((now - last).total_seconds() / 3600, 1) if last else 99999,
            })
        return result

    def _website_data(self):
        website = request.website
        pages = request.env["website.page"].search(website.website_domain(), order="write_date desc")
        now = fields.Datetime.now()
        page_list = [{
            "id": page.id,
            "en": page.name,
            "ar": page.name,
            "url": page.url,
            "pub": page.is_published,
            "ed": (now - page.write_date).days,
        } for page in pages]
        Visitor = request.env["website.visitor"].sudo()
        visitors = Visitor.search_count([("last_connection_datetime", ">=", now - timedelta(days=30))])
        prev_visitors = Visitor.search_count([
            ("last_connection_datetime", ">=", now - timedelta(days=60)),
            ("last_connection_datetime", "<", now - timedelta(days=30)),
        ])
        web_orders = request.env["sale.order"].sudo().search_count([
            ("website_id", "!=", False), ("state", "=", "sale"),
            ("date_order", ">=", now - timedelta(days=30)),
        ])
        return page_list, {"visitors": visitors, "prevVisitors": prev_visitors, "orders": web_orders}

    def _media_data(self):
        attachments = request.env["ir.attachment"].search([
            ("public", "=", True), ("mimetype", "=like", "image/%"), ("res_field", "=", False),
            ("type", "=", "binary"),
        ], order="id desc", limit=60)
        return [{
            "id": att.id,
            "src": f"/web/image/{att.id}",
            "name": att.name,
            "title": att.name.rsplit(".", 1)[0],
            "size": f"{max(1, round(att.file_size / 1024))} KB",
            "used": None,
        } for att in attachments]

    def _dashboard_data(self):
        ar_lang = self._arabic_lang()
        donations, donors, cities = self._donation_data()
        pages, web_stats = self._website_data()
        user = request.env.user
        return {
            "user": {"name": user.name, "admin": user.has_group("base.group_system")},
            "currency": request.env.company.currency_id.name,
            "arabic": bool(ar_lang),
            "campaigns": self._campaign_data(ar_lang),
            "donations": donations,
            "donors": donors,
            "cities": cities,
            "users": self._user_data(),
            "pages": pages,
            "web": web_stats,
            "media": self._media_data(),
            "settings": self._settings(),
            "now": self._iso(fields.Datetime.now()),
        }

    @staticmethod
    def _error(exc):
        return {"ok": False, "error": str(exc.args[0] if exc.args else exc)}

    # ------------------------------------------------------------------ pages
    @http.route("/alihsan/dashboard", type="http", auth="user", website=True, sitemap=False)
    def dashboard(self, live=None, **kwargs):
        """Sample data by default (same as the static design); ?live=1 shows the real Odoo data."""
        self._check_access()
        data = self._dashboard_data() if live else None
        return request.render("alihsanwebsite_theme.dashboard_page", {
            # "<" escaped so the JSON can never close the <script> it is embedded in
            "dashboard_json": Markup(json.dumps(data, default=str).replace("<", "\\u003c") if data else "null"),
            "user_name": request.env.user.name,
            "asset_version": _asset_version(),
        })

    @http.route("/alihsan/dashboard/data", type="http", auth="user", website=True, sitemap=False)
    def dashboard_data(self, **kwargs):
        self._check_access()
        return request.make_json_response(self._dashboard_data())

    # ------------------------------------------------------------------ writes
    # All writes run with the user's own rights: Odoo access rules decide what is allowed.
    @http.route("/alihsan/dashboard/campaign/save", type="jsonrpc", auth="user", website=True)
    def campaign_save(self, campaign_id=None, en=None, ar=None, desc=None, goal=0, publish=None, image=None, **kwargs):
        self._check_access()
        en = (en or "").strip()
        if not en:
            return {"ok": False, "error": request.env._("The campaign name is required.")}
        vals = {"name": en, "ih_goal_amount": float(goal or 0)}
        if desc is not None:
            vals["ih_short_description"] = desc
        if image:
            vals["image_1920"] = image.split(",", 1)[-1]
        if publish is not None:
            vals["is_published"] = bool(publish)
        Template = request.env["product.template"].with_context(lang="en_US")
        try:
            if campaign_id:
                tmpl = Template.browse(int(campaign_id)).exists()
                if not tmpl or not tmpl.ih_is_donation:
                    return {"ok": False, "error": request.env._("Campaign not found.")}
                tmpl.write(vals)
            else:
                vals.update({"ih_is_donation": True, "list_price": 1.0, "type": "service", "sale_ok": True})
                tmpl = Template.create(vals)
            ar_lang = self._arabic_lang()
            if ar_lang and (ar or "").strip():
                tmpl.with_context(lang=ar_lang).name = ar.strip()
        except (AccessError, UserError, ValueError) as exc:
            return self._error(exc)
        return {"ok": True, "id": str(tmpl.id)}

    @http.route("/alihsan/dashboard/campaign/state", type="jsonrpc", auth="user", website=True)
    def campaign_state(self, campaign_id, state, **kwargs):
        self._check_access()
        tmpl = request.env["product.template"].with_context(active_test=False).browse(int(campaign_id)).exists()
        if not tmpl or not tmpl.ih_is_donation:
            return {"ok": False, "error": request.env._("Campaign not found.")}
        try:
            if state == "active":
                tmpl.write({"active": True, "is_published": True})
            elif state == "draft":
                tmpl.is_published = False
            elif state == "archive":
                tmpl.write({"active": False, "is_published": False})
        except (AccessError, UserError) as exc:
            return self._error(exc)
        return {"ok": True}

    @http.route("/alihsan/dashboard/page/publish", type="jsonrpc", auth="user", website=True)
    def page_publish(self, page_id, published, **kwargs):
        self._check_access()
        try:
            request.env["website.page"].browse(int(page_id)).is_published = bool(published)
        except (AccessError, UserError) as exc:
            return self._error(exc)
        return {"ok": True}

    @http.route("/alihsan/dashboard/page/new", type="jsonrpc", auth="user", website=True)
    def page_new(self, name, **kwargs):
        self._check_access()
        name = (name or "").strip()
        if not name:
            return {"ok": False, "error": request.env._("The page title is required.")}
        try:
            page = request.website.new_page(name=name, page_values={"is_published": False})
        except (AccessError, UserError) as exc:
            return self._error(exc)
        return {"ok": True, "url": page.get("url")}

    @http.route("/alihsan/dashboard/media/upload", type="jsonrpc", auth="user", website=True)
    def media_upload(self, files, **kwargs):
        self._check_access()
        try:
            for item in files or []:
                request.env["ir.attachment"].create({
                    "name": item["name"],
                    "datas": item["data"].split(",", 1)[-1],
                    "public": True,
                    "res_model": "ir.ui.view",
                    "res_id": 0,
                    "website_id": request.website.id,
                })
        except (AccessError, UserError, ValueError, base64.binascii.Error) as exc:
            return self._error(exc)
        return {"ok": True}

    @http.route("/alihsan/dashboard/settings", type="jsonrpc", auth="user", website=True)
    def settings_save(self, settings, **kwargs):
        self._check_access()
        if not request.env.user.has_group("base.group_system"):
            return {"ok": False, "error": request.env._("Only administrators can change these settings.")}
        clean = {key: settings.get(key, default) for key, default in DEFAULT_SETTINGS.items()}
        request.env["ir.config_parameter"].sudo().set_param(SETTINGS_PARAM, json.dumps(clean))
        return {"ok": True}

    # ------------------------------------------------------------------ home page content
    # Hero slides and home categories are always real Odoo records (also in sample-data mode).
    def _home_slides(self):
        return request.env["alihsan.home.hero.slide"].with_context(active_test=False).search(
            [("website_id", "in", [False, request.website.id])], order="sequence, id")

    def _home_categories(self, shown_only=False):
        domain = list(request.website.website_domain())
        if shown_only:
            domain.append(("ih_home_display", "=", "shown"))
        return request.env["product.public.category"].search(domain, order="ih_home_sequence, sequence, id")

    @staticmethod
    def _move(records, record, direction, field):
        """Swap ``record`` with its neighbour in ``records`` and renumber ``field`` 10, 20, 30..."""
        ids = records.ids
        if record.id not in ids:
            return
        i = ids.index(record.id)
        j = i - 1 if direction == "up" else i + 1
        if 0 <= j < len(ids):
            ids[i], ids[j] = ids[j], ids[i]
        for position, rec in enumerate(records.browse(ids), 1):
            if rec[field] != position * 10:
                rec[field] = position * 10

    @staticmethod
    def _image(data):
        return data.split(",", 1)[-1] if data else False

    @http.route("/alihsan/dashboard/home/data", type="jsonrpc", auth="user", website=True)
    def home_data(self, **kwargs):
        self._check_access()
        user = request.env.user
        slides = [{
            "id": slide.id,
            "name": slide.name,
            "tagline": slide.tagline or "",
            "link": slide.link_url or "",
            "new_tab": slide.link_new_tab,
            "active": slide.active,
            "state": slide.state,
            "start": self._iso(slide.date_start) or None,
            "end": self._iso(slide.date_end) or None,
            "img": f"/web/image/alihsan.home.hero.slide/{slide.id}/image?unique={int(slide.write_date.timestamp())}",
            "img_mobile": slide.image_mobile and
                f"/web/image/alihsan.home.hero.slide/{slide.id}/image_mobile?unique={int(slide.write_date.timestamp())}",
        } for slide in self._home_slides()]
        Category = request.env["product.public.category"]
        categories = [{
            "id": cat.id,
            "name": cat.name,
            "path": cat.display_name,
            "parent": cat.parent_id.id or False,
            "shown": cat.ih_home_display == "shown",
            "icon": cat.ih_home_icon,
            "url": cat.ih_home_url or "",
            "has_img": bool(cat.image_128),
            "img": cat.image_128 and f"/web/image/product.public.category/{cat.id}/image_128?unique={int(cat.write_date.timestamp())}",
            "preview": str(cat.ih_home_icon_preview or ""),
        } for cat in self._home_categories()]
        return {
            "slides": slides,
            "categories": categories,
            "icons": Category._fields["ih_home_icon"]._description_selection(request.env),
            "news": self._news_list(),
            "popup": self._popup_data(),
            **self._media_center_lists(),
            "can_edit": user.has_group("website.group_website_designer"),
            "slide_action": "action-alihsanwebsite_theme.action_home_hero_slide",
            "category_action": "action-alihsanwebsite_theme.action_home_categories",
            "news_action": "action-alihsanwebsite_theme.action_news_post",
            "images_action": "action-alihsanwebsite_theme.action_media_gallery",
            "videos_action": "action-alihsanwebsite_theme.action_media_video",
            "events_action": "action-alihsanwebsite_theme.action_media_event",
        }

    @http.route("/alihsan/dashboard/slide/save", type="jsonrpc", auth="user", website=True)
    def slide_save(self, slide_id=None, vals=None, image=None, image_mobile=None, remove_mobile=False, **kwargs):
        self._check_access()
        allowed = {"name", "tagline", "link_url", "link_new_tab", "active", "date_start", "date_end"}
        vals = {key: value for key, value in (vals or {}).items() if key in allowed}
        if not (vals.get("name") or "").strip():
            return {"ok": False, "error": request.env._("The slide title is required.")}
        if image:
            vals["image"] = self._image(image)
        if image_mobile:
            vals["image_mobile"] = self._image(image_mobile)
        elif remove_mobile:
            vals["image_mobile"] = False
        Slide = request.env["alihsan.home.hero.slide"].with_context(active_test=False)
        try:
            if slide_id:
                Slide.browse(int(slide_id)).write(vals)
            else:
                if not image:
                    return {"ok": False, "error": request.env._("Choose a desktop image for the new slide.")}
                last = self._home_slides()[-1:]
                vals["sequence"] = (last.sequence if last else 0) + 10
                Slide.create(vals)
        except (AccessError, UserError, ValueError) as exc:
            return self._error(exc)
        return {"ok": True}

    @http.route("/alihsan/dashboard/slide/action", type="jsonrpc", auth="user", website=True)
    def slide_action(self, slide_id, action, **kwargs):
        """action: up / down / delete / show / hide"""
        self._check_access()
        slide = request.env["alihsan.home.hero.slide"].with_context(active_test=False).browse(int(slide_id)).exists()
        if not slide:
            return {"ok": False, "error": request.env._("Slide not found.")}
        try:
            if action in ("up", "down"):
                self._move(self._home_slides(), slide, action, "sequence")
            elif action == "delete":
                slide.unlink()
            elif action in ("show", "hide"):
                slide.active = action == "show"
        except (AccessError, UserError) as exc:
            return self._error(exc)
        return {"ok": True}

    @http.route("/alihsan/dashboard/category/save", type="jsonrpc", auth="user", website=True)
    def category_save(self, category_id=None, vals=None, image=None, **kwargs):
        self._check_access()
        allowed = {"name", "parent_id", "ih_home_display", "ih_home_icon", "ih_home_url"}
        vals = {key: value for key, value in (vals or {}).items() if key in allowed}
        if not (vals.get("name") or "").strip():
            return {"ok": False, "error": request.env._("The category name is required.")}
        vals["parent_id"] = int(vals.get("parent_id") or 0) or False
        if image:
            vals["image_1920"] = self._image(image)
        Category = request.env["product.public.category"]
        try:
            category = Category.browse(int(category_id)) if category_id else Category
            if vals.get("ih_home_display") == "shown" and category.ih_home_display != "shown":
                last = self._home_categories(shown_only=True)[-1:]
                vals["ih_home_sequence"] = (last.ih_home_sequence if last else 0) + 10
            if category:
                category.write(vals)
            else:
                Category.create(vals)
        except (AccessError, UserError, ValueError) as exc:
            return self._error(exc)
        return {"ok": True}

    @http.route("/alihsan/dashboard/category/action", type="jsonrpc", auth="user", website=True)
    def category_action(self, category_id, action, **kwargs):
        """action: up / down / delete / show / hide"""
        self._check_access()
        category = request.env["product.public.category"].browse(int(category_id)).exists()
        if not category:
            return {"ok": False, "error": request.env._("Category not found.")}
        try:
            if action in ("up", "down"):
                self._move(self._home_categories(shown_only=True), category, action, "ih_home_sequence")
            elif action == "delete":
                category.unlink()
            elif action == "show":
                last = self._home_categories(shown_only=True)[-1:]
                category.write({"ih_home_display": "shown", "ih_home_sequence": (last.ih_home_sequence if last else 0) + 10})
            elif action == "hide":
                category.ih_home_display = "unlisted"
        except (AccessError, UserError) as exc:
            return self._error(exc)
        return {"ok": True}

    @http.route("/alihsan/dashboard/home/reorder", type="jsonrpc", auth="user", website=True)
    def home_reorder(self, kind, ids, **kwargs):
        """Drag and drop: ``ids`` is the new order of the slides / home categories (kind = slide / category)."""
        self._check_access()
        if kind == "slide":
            records, field = self._home_slides(), "sequence"
        else:
            records, field = self._home_categories(shown_only=True), "ih_home_sequence"
        wanted = [int(i) for i in ids if int(i) in records.ids]
        ordered = wanted + [i for i in records.ids if i not in wanted]
        try:
            for position, rec in enumerate(records.browse(ordered), 1):
                if rec[field] != position * 10:
                    rec[field] = position * 10
        except (AccessError, UserError) as exc:
            return self._error(exc)
        return {"ok": True}

    # ------------------------------------------------------------------ home popup
    # The "Featured project" dialog of the home page: fields of the current website.
    def _popup_data(self):
        website = request.website
        product = website.ih_popup_product_id
        projects = request.env["product.template"].search(
            [("ih_is_donation", "=", True), *website.website_domain()], order="is_published desc, name")
        return {
            "active": website.ih_popup_active,
            "product_id": product.id or False,
            "eyebrow": website.ih_popup_eyebrow or "",
            "title": website.ih_popup_title or "",
            "description": website.ih_popup_description or "",
            "amounts": website.ih_popup_amounts or "",
            "default": website.ih_popup_default_amount,
            "explore_url": website.ih_popup_explore_url or "",
            "delay": website.ih_popup_delay,
            "frequency": website.ih_popup_frequency,
            "has_img": bool(website.ih_popup_image),
            "img": website.ih_popup_image and
                f"/web/image/website/{website.id}/ih_popup_image?unique={int(website.write_date.timestamp())}",
            "projects": [{
                "id": tmpl.id,
                "name": tmpl.name,
                "published": tmpl.is_published,
                "goal": tmpl.ih_goal_amount,
                "offline": tmpl.ih_raised_offline,
                "raised": tmpl.ih_raised_amount,
                "progress": tmpl.ih_progress,
                "desc": tmpl.ih_short_description or "",
                "url": tmpl.website_url,
                "img": tmpl.image_1920 and f"/web/image/product.template/{tmpl.id}/image_512" or DEFAULT_CAMPAIGN_IMG,
            } for tmpl in projects],
            "currency": website.currency_id.name,
            "settings_action": "settings#ih_home_popup_settings",
        }

    @http.route("/alihsan/dashboard/popup/save", type="jsonrpc", auth="user", website=True)
    def popup_save(self, vals=None, image=None, remove_image=False, product_vals=None, **kwargs):
        self._check_access()
        allowed = {
            "ih_popup_active", "ih_popup_product_id", "ih_popup_eyebrow", "ih_popup_title", "ih_popup_description",
            "ih_popup_amounts", "ih_popup_default_amount", "ih_popup_explore_url", "ih_popup_delay", "ih_popup_frequency",
        }
        vals = {key: value for key, value in (vals or {}).items() if key in allowed}
        if vals.get("ih_popup_active") and not vals.get("ih_popup_product_id"):
            return {"ok": False, "error": request.env._("Choose the project shown in the popup.")}
        if image:
            vals["ih_popup_image"] = self._image(image)
        elif remove_image:
            vals["ih_popup_image"] = False
        try:
            request.website.write(vals)
            # goal / amount raised outside the website belong to the project (also used by its own page)
            product = request.website.ih_popup_product_id
            product_vals = {key: float(value or 0) for key, value in (product_vals or {}).items()
                            if key in {"ih_goal_amount", "ih_raised_offline"}}
            if product and product_vals:
                product.write(product_vals)
        except (AccessError, UserError, ValueError) as exc:
            return self._error(exc)
        return {"ok": True}

    # ------------------------------------------------------------------ media center news
    # Stories of the "News List Section" snippet (always real Odoo records, also in sample-data mode).
    def _news_posts(self):
        return request.env["alihsan.news.post"].with_context(active_test=False).search(
            [("website_id", "in", [False, request.website.id])])

    def _news_unfeature_others(self, post):
        """Only one featured story (the large card) at a time."""
        others = (self._news_posts() - post).filtered("featured")
        if others:
            others.featured = False

    def _news_list(self):
        return [{
            "id": post.id,
            "name": post.name,
            "summary": post.summary or "",
            "tag": post.tag or "",
            "date": fields.Date.to_string(post.date),
            "link": post.link_url or "",
            "new_tab": post.link_new_tab,
            "url": post.website_url,
            "body": "" if is_html_empty(post.body) else html2plaintext(post.body),
            "featured": post.featured,
            "active": post.active,
            "img": f"/web/image/alihsan.news.post/{post.id}/image/512x512?unique={int(post.write_date.timestamp())}",
        } for post in self._news_posts()]

    @http.route("/alihsan/dashboard/news/save", type="jsonrpc", auth="user", website=True)
    def news_save(self, post_id=None, vals=None, image=None, **kwargs):
        self._check_access()
        allowed = {"name", "summary", "tag", "date", "link_url", "link_new_tab", "featured", "active", "body"}
        vals = {key: value for key, value in (vals or {}).items() if key in allowed}
        if not (vals.get("name") or "").strip():
            return {"ok": False, "error": request.env._("The news title is required.")}
        if "body" in vals:
            # plain text from the dashboard: blank lines separate paragraphs
            vals["body"] = plaintext2html(vals["body"].strip()) if (vals["body"] or "").strip() else False
        if "date" in vals and not vals["date"]:
            vals["date"] = fields.Date.context_today(request.env.user)
        if image:
            vals["image"] = self._image(image)
        Post = request.env["alihsan.news.post"].with_context(active_test=False)
        try:
            if post_id:
                post = Post.browse(int(post_id))
                post.write(vals)
            else:
                if not image:
                    return {"ok": False, "error": request.env._("Choose an image for the new story.")}
                post = Post.create(vals)
            if vals.get("featured"):
                self._news_unfeature_others(post)
        except (AccessError, UserError, ValueError) as exc:
            return self._error(exc)
        return {"ok": True}

    @http.route("/alihsan/dashboard/news/action", type="jsonrpc", auth="user", website=True)
    def news_action(self, post_id, action, **kwargs):
        """action: delete / show / hide / feature / unfeature"""
        self._check_access()
        post = request.env["alihsan.news.post"].with_context(active_test=False).browse(int(post_id)).exists()
        if not post:
            return {"ok": False, "error": request.env._("Story not found.")}
        try:
            if action == "delete":
                post.unlink()
            elif action in ("show", "hide"):
                post.active = action == "show"
            elif action == "feature":
                post.featured = True
                self._news_unfeature_others(post)
            elif action == "unfeature":
                post.featured = False
        except (AccessError, UserError) as exc:
            return self._error(exc)
        return {"ok": True}

    # ------------------------------------------------------------------ media center: images, videos, events
    def _media_items(self, kind):
        return request.env[MEDIA_KINDS[kind][0]].with_context(active_test=False).search(
            [("website_id", "in", [False, request.website.id])])

    @staticmethod
    def _img_url(record, field="image", size="512x512"):
        return f"/web/image/{record._name}/{record.id}/{field}/{size}?unique={int(record.write_date.timestamp())}"

    def _media_center_lists(self):
        images = []
        for gallery in self._media_items("images"):
            record, field = gallery._cover()
            images.append({
                "id": gallery.id, "name": gallery.name, "date": fields.Date.to_string(gallery.date), "active": gallery.active,
                "img": self._img_url(record, field) if record else "",
                "has_cover": bool(gallery.image),
                "photos": [{"id": photo.id, "img": self._img_url(photo, size="256x256")} for photo in gallery.photo_ids],
            })
        videos = [{
            "id": video.id, "name": video.name, "date": fields.Date.to_string(video.date), "active": video.active,
            "img": self._img_url(video) if video.image else "",
            "url": video.video_url or "",
            "platform": video.platform or ("file" if video.video_url else ""),
        } for video in self._media_items("videos")]
        events = [{
            "id": event.id, "name": event.name, "date": fields.Date.to_string(event.date), "active": event.active,
            "img": self._img_url(event),
            "time": event.time, "time_label": event._time_label(),
            "location": event.location or "", "description": event.description or "",
            "donate_url": event.donate_url or "", "upcoming": event.upcoming,
        } for event in self._media_items("events")]
        return {"images": images, "videos": videos, "events": events}

    @http.route("/alihsan/dashboard/media_center/save", type="jsonrpc", auth="user", website=True)
    def media_center_save(self, kind, rec_id=None, vals=None, image=None, photos=None, remove_photo_ids=None, **kwargs):
        """Create / update an image gallery, a video or an event. ``photos``: new gallery photos (data URLs)."""
        self._check_access()
        if kind not in MEDIA_KINDS:
            return {"ok": False, "error": request.env._("Unknown media type.")}
        model, allowed = MEDIA_KINDS[kind]
        vals = {key: value for key, value in (vals or {}).items() if key in allowed}
        if not (vals.get("name") or "").strip():
            return {"ok": False, "error": request.env._("The title is required.")}
        if "date" in vals and not vals["date"]:
            vals["date"] = fields.Date.context_today(request.env.user)
        if image:
            vals["image"] = self._image(image)
        commands = [(2, int(photo_id)) for photo_id in remove_photo_ids or []]
        commands += [(0, 0, {"image": self._image(photo), "sequence": 1000 + i}) for i, photo in enumerate(photos or []) if photo]
        if kind == "images" and commands:
            vals["photo_ids"] = commands
        Record = request.env[model].with_context(active_test=False)
        if not rec_id and kind == "events" and not image:
            return {"ok": False, "error": request.env._("Choose an image for the new event.")}
        record = Record.browse(int(rec_id)).exists() if rec_id else Record
        if rec_id and not record:
            return {"ok": False, "error": request.env._("Item not found.")}
        try:
            # savepoint: a failed constraint must not leave a half-saved record behind
            with request.env.cr.savepoint():
                if record:
                    record.write(vals)
                else:
                    Record.create(vals)
        except (AccessError, UserError, ValidationError, ValueError) as exc:
            return self._error(exc)
        return {"ok": True}

    @http.route("/alihsan/dashboard/media_center/action", type="jsonrpc", auth="user", website=True)
    def media_center_action(self, kind, rec_id, action, **kwargs):
        """action: delete / show / hide"""
        self._check_access()
        if kind not in MEDIA_KINDS:
            return {"ok": False, "error": request.env._("Unknown media type.")}
        record = request.env[MEDIA_KINDS[kind][0]].with_context(active_test=False).browse(int(rec_id)).exists()
        if not record:
            return {"ok": False, "error": request.env._("Item not found.")}
        try:
            if action == "delete":
                record.unlink()
            elif action in ("show", "hide"):
                record.active = action == "show"
        except (AccessError, UserError) as exc:
            return self._error(exc)
        return {"ok": True}
