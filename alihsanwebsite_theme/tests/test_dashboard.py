from datetime import timedelta

from odoo import fields
from odoo.tests import HttpCase, new_test_user, tagged

# Opens every dashboard view, switches to Arabic and back, and fails on any JS error.
WALK_VIEWS_JS = """
(async () => {
    const wait = (ms = 300) => new Promise(r => setTimeout(r, ms));
    const views = ['overview', 'website', 'campaigns', 'kiosks', 'donations', 'donors', 'receipts',
                   'reports', 'media', 'users', 'settings', 'search/Education'];
    for (const v of views) {
        location.hash = '#' + v;
        await wait();
        if (!document.querySelector('#db-view h1')) throw new Error('view ' + v + ' did not render');
    }
    location.hash = '#website';
    await wait(1500);
    document.querySelector('[data-htab=media]').click();
    for (const tab of ['news', 'images', 'videos', 'events']) {
        await wait();
        document.querySelector('[data-mtab=' + tab + ']').click();
        await wait();
        if (!document.querySelector(tab === 'news' ? '#hnews-l' : '#mc-l')) throw new Error(tab + ' tab did not render');
    }
    document.querySelector('.db-lang [data-lang=ar]').click();
    await wait();
    if (document.documentElement.dir !== 'rtl') throw new Error('Arabic did not switch to RTL');
    document.querySelector('.db-lang [data-lang=en]').click();
    location.hash = '#campaigns';
    await wait();
    if (!document.querySelector('#db-view').textContent.includes(%(campaign)r)) throw new Error('campaign missing');
    console.log('test successful');
})().catch(e => console.error(e.message));
"""


@tagged("post_install", "-at_install")
class TestDashboard(HttpCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.campaign = cls.env["product.template"].create({
            "name": "Education Fund",
            "ih_is_donation": True,
            "list_price": 1.0,
            "type": "service",
            "taxes_id": [(5, 0, 0)],
            "ih_goal_amount": 10000,
            "is_published": True,
        })
        partner = cls.env["res.partner"].create({"name": "Ahmed Al Nuaimi", "city": "Ajman"})
        for days, amount in [(0, 500), (2, 1200), (10, 250), (40, 5000)]:
            order = cls.env["sale.order"].create({
                "partner_id": partner.id,
                "order_line": [(0, 0, {
                    "product_id": cls.campaign.product_variant_id.id,
                    "product_uom_qty": amount,
                    "price_unit": 1.0,
                    "tax_ids": [(5, 0, 0)],
                })],
            })
            order.action_confirm()
            order.date_order = fields.Datetime.now() - timedelta(days=days)

    def test_dashboard_data(self):
        self.authenticate("admin", "admin")
        response = self.url_open("/alihsan/dashboard/data")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        campaign = next(c for c in data["campaigns"] if c["id"] == str(self.campaign.id))
        self.assertEqual(campaign["raised"], 6950)
        self.assertEqual(campaign["status"], "active")
        donations = [d for d in data["donations"] if d["camp"] == campaign["id"]]
        self.assertEqual(sorted(d["amt"] for d in donations), [250, 500, 1200, 5000])

    def test_dashboard_requires_sales_access(self):
        new_test_user(self.env, login="ih_portal", groups="base.group_portal")
        self.authenticate("ih_portal", "ih_portal")
        self.assertEqual(self.url_open("/alihsan/dashboard/data").status_code, 403)

    def test_dashboard_campaign_write(self):
        self.authenticate("admin", "admin")
        result = self.make_jsonrpc_request("/alihsan/dashboard/campaign/save", {
            "en": "Water Wells", "goal": 80000, "publish": False, "desc": "Dig wells",
        })
        self.assertTrue(result["ok"])
        tmpl = self.env["product.template"].browse(int(result["id"]))
        self.assertTrue(tmpl.ih_is_donation)
        self.assertFalse(tmpl.is_published)
        self.assertEqual(tmpl.ih_goal_amount, 80000)
        self.make_jsonrpc_request("/alihsan/dashboard/campaign/state", {"campaign_id": tmpl.id, "state": "active"})
        self.assertTrue(tmpl.is_published)
        self.make_jsonrpc_request("/alihsan/dashboard/campaign/state", {"campaign_id": tmpl.id, "state": "archive"})
        self.assertFalse(tmpl.active)

    def test_dashboard_views_live(self):
        self.browser_js("/alihsan/dashboard?live=1", WALK_VIEWS_JS % {"campaign": "Education Fund"},
                        ready="document.querySelector('#db-nav a')", login="admin")

    def test_dashboard_views_demo(self):
        self.browser_js("/alihsan/dashboard", WALK_VIEWS_JS % {"campaign": "Education Fund"},
                        ready="document.querySelector('#db-nav a')", login="admin")

    def test_dashboard_home_content(self):
        self.authenticate("admin", "admin")
        image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        save = "/alihsan/dashboard/slide/save"
        self.assertFalse(self.make_jsonrpc_request(save, {"vals": {"name": "No image"}})["ok"])
        for name in ("First", "Second"):
            self.assertTrue(self.make_jsonrpc_request(save, {"vals": {"name": name}, "image": image})["ok"])
        slides = self.env["alihsan.home.hero.slide"].search([("name", "in", ["First", "Second"])], order="sequence, id")
        self.assertEqual(slides.mapped("name"), ["First", "Second"])
        self.make_jsonrpc_request("/alihsan/dashboard/slide/action", {"slide_id": slides[1].id, "action": "up"})
        self.assertEqual(slides.sorted("sequence").mapped("name"), ["Second", "First"])
        self.make_jsonrpc_request("/alihsan/dashboard/slide/action", {"slide_id": slides[0].id, "action": "hide"})
        self.assertFalse(slides[0].active)

        result = self.make_jsonrpc_request("/alihsan/dashboard/category/save", {
            "vals": {"name": "Test Zakat Fund", "ih_home_display": "shown", "ih_home_icon": "moon", "parent_id": ""},
        })
        self.assertTrue(result["ok"])
        category = self.env["product.public.category"].search([("name", "=", "Test Zakat Fund")])
        self.assertEqual(category.ih_home_display, "shown")
        self.make_jsonrpc_request("/alihsan/dashboard/category/action", {"category_id": category.id, "action": "hide"})
        self.assertEqual(category.ih_home_display, "unlisted")
        data = self.make_jsonrpc_request("/alihsan/dashboard/home/data", {})
        self.assertIn("Test Zakat Fund", [c["name"] for c in data["categories"]])
        self.assertTrue(data["can_edit"])

    def test_dashboard_home_reorder(self):
        self.authenticate("admin", "admin")
        image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        Slide = self.env["alihsan.home.hero.slide"]
        Slide.search([]).unlink()
        a, b, c = (Slide.create({"name": n, "image": image, "sequence": s}) for n, s in (("A", 1), ("B", 2), ("C", 3)))
        self.make_jsonrpc_request("/alihsan/dashboard/home/reorder", {"kind": "slide", "ids": [c.id, a.id, b.id]})
        self.assertEqual(Slide.search([], order="sequence").mapped("name"), ["C", "A", "B"])

    def test_dashboard_news(self):
        self.authenticate("admin", "admin")
        image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        Post = self.env["alihsan.news.post"].with_context(active_test=False)
        Post.search([]).unlink()
        save = "/alihsan/dashboard/news/save"
        self.assertFalse(self.make_jsonrpc_request(save, {"vals": {"name": "No image"}})["ok"])
        for name, date in (("Old story", "2026-01-10"), ("New story", "2026-03-05")):
            vals = {"name": name, "date": date, "tag": "Events", "featured": name == "Old story"}
            self.assertTrue(self.make_jsonrpc_request(save, {"vals": vals, "image": image})["ok"])
        old, new = Post.search([("name", "=", "Old story")]), Post.search([("name", "=", "New story")])
        # the featured story comes first on the website, then the newest
        self.assertEqual([p["title"] for p in self.make_jsonrpc_request("/alihsan/news", {})], ["Old story", "New story"])
        action = "/alihsan/dashboard/news/action"
        self.make_jsonrpc_request(action, {"post_id": new.id, "action": "feature"})
        self.assertEqual((old.featured, new.featured), (False, True))
        self.make_jsonrpc_request(action, {"post_id": new.id, "action": "hide"})
        self.assertEqual([p["title"] for p in self.make_jsonrpc_request("/alihsan/news", {})], ["Old story"])
        data = self.make_jsonrpc_request("/alihsan/dashboard/home/data", {})
        self.assertEqual({n["name"] for n in data["news"]}, {"Old story", "New story"})
        self.make_jsonrpc_request(action, {"post_id": old.id, "action": "delete"})
        self.assertFalse(old.exists())

    def test_dashboard_media_center(self):
        self.authenticate("admin", "admin")
        image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        save, action = "/alihsan/dashboard/media_center/save", "/alihsan/dashboard/media_center/action"
        Gallery = self.env["alihsan.media.gallery"].with_context(active_test=False)
        Gallery.search([]).unlink()
        # a gallery needs a cover or photos; the failed save leaves nothing behind
        self.assertFalse(self.make_jsonrpc_request(save, {"kind": "images", "vals": {"name": "Empty"}})["ok"])
        self.assertFalse(Gallery.search([]))
        result = self.make_jsonrpc_request(save, {"kind": "images", "vals": {"name": "Iftar", "date": "2026-03-01"},
                                                  "photos": [image, image, image]})
        self.assertTrue(result["ok"])
        gallery = Gallery.search([])
        self.assertEqual(gallery.photo_count, 3)
        self.make_jsonrpc_request(save, {"kind": "images", "rec_id": gallery.id, "vals": {"name": "Iftar meals"},
                                         "remove_photo_ids": gallery.photo_ids[:1].ids})
        self.assertEqual((gallery.name, gallery.photo_count), ("Iftar meals", 2))
        items = self.make_jsonrpc_request("/alihsan/media_center/images", {})
        self.assertEqual([(i["title"], len(i["photos"])) for i in items], [("Iftar meals", 2)])

        Video = self.env["alihsan.media.video"].with_context(active_test=False)
        Video.search([]).unlink()
        self.assertTrue(self.make_jsonrpc_request(save, {"kind": "videos", "image": image, "vals": {
            "name": "Chairman word", "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}})["ok"])
        self.assertTrue(self.make_jsonrpc_request(save, {"kind": "videos", "image": image, "vals": {
            "name": "Clip", "video_url": "https://example.com/clip.mp4"}})["ok"])
        videos = {v["title"]: v for v in self.make_jsonrpc_request("/alihsan/media_center/videos", {})}
        self.assertIn("youtube.com/embed/dQw4w9WgXcQ", videos["Chairman word"]["embed"])
        self.assertEqual((videos["Clip"]["embed"], videos["Clip"]["src"]), ("", "https://example.com/clip.mp4"))

        Event = self.env["alihsan.media.event"].with_context(active_test=False)
        Event.search([]).unlink()
        self.assertFalse(self.make_jsonrpc_request(save, {"kind": "events", "vals": {"name": "No image"}})["ok"])
        self.assertTrue(self.make_jsonrpc_request(save, {"kind": "events", "image": image, "vals": {
            "name": "Gala", "date": "2099-11-14", "time": 19.5, "location": "Hall"}})["ok"])
        event = Event.search([])
        self.assertTrue(event.upcoming)
        [item] = self.make_jsonrpc_request("/alihsan/media_center/events", {})
        self.assertEqual((item["time"], item["day"], item["location"]), ("7:30 PM", "14", "Hall"))
        self.make_jsonrpc_request(action, {"kind": "events", "rec_id": event.id, "action": "hide"})
        self.assertEqual(self.make_jsonrpc_request("/alihsan/media_center/events", {}), [])
        data = self.make_jsonrpc_request("/alihsan/dashboard/home/data", {})
        self.assertEqual([e["name"] for e in data["events"]], ["Gala"])
        self.make_jsonrpc_request(action, {"kind": "events", "rec_id": event.id, "action": "delete"})
        self.assertFalse(event.exists())
