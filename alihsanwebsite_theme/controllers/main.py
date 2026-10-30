import logging
import math
from urllib.parse import quote_plus

from markupsafe import Markup, escape
from werkzeug.exceptions import NotFound

from odoo import fields, http
from odoo.http import request
from odoo.tools.misc import format_date

_logger = logging.getLogger(__name__)


class AlihsanFaq(http.Controller):

    @http.route('/alihsan/faq/ask', type='jsonrpc', auth='public', website=True, methods=['POST'])
    def faq_ask(self, question=None, **kwargs):
        """Email a visitor's question from the FAQ "Can't find your way?" box to the website company."""
        question = (question or '').strip()[:2000]
        if not question:
            return {'ok': False}
        company = request.website.company_id
        if not company.email:
            _logger.warning("FAQ question not sent: company %s has no email address", company.name)
            return {'ok': False}
        body = Markup('<p>%s</p><p>%s</p>') % (
            request.env._("New question from the FAQ page of %s:", request.website.name),
            Markup('<br/>').join(escape(line) for line in question.splitlines()),
        )
        request.env['mail.mail'].sudo().create({
            'subject': request.env._("FAQ question from the website"),
            'email_from': company.email_formatted,
            'email_to': company.email,
            'body_html': body,
        })
        return {'ok': True}


class AlihsanHomeHero(http.Controller):

    @http.route('/alihsan/home_hero/slides', type='jsonrpc', auth='public', website=True, methods=['POST'])
    def home_hero_slides(self, **kwargs):
        """Slides and slider settings managed in Website > Site > Content > Home Hero Slides."""
        website = request.website
        slides = request.env['alihsan.home.hero.slide'].sudo()._get_live_slides(website)
        return {
            'settings': {
                'autoplay': website.ih_hero_autoplay,
                'interval': max(1, website.ih_hero_interval) * 1000,
                'pauseOnHover': website.ih_hero_pause_on_hover,
                'showDots': website.ih_hero_show_dots,
                'transition': website.ih_hero_transition,
            },
            'slides': [{
                'title': slide.name,
                'image': website.image_url(slide, 'image'),
                'imageMobile': slide.image_mobile and website.image_url(slide, 'image_mobile'),
                'tagline': slide.tagline or '',
                'url': slide.link_url or '',
                'newTab': slide.link_new_tab,
            } for slide in slides],
        }


class AlihsanHomeCategories(http.Controller):

    @http.route('/alihsan/home_categories', type='jsonrpc', auth='public', website=True, methods=['POST'])
    def home_categories(self, **kwargs):
        """eCommerce categories marked 'On Home Page' for the "Our Projects" carousel."""
        website = request.website
        categories = request.env['product.public.category'].sudo()._ih_get_home_categories(website)
        slug = request.env['ir.http']._slug
        return [{
            'name': category.name,
            'url': category.ih_home_url or f'/shop/category/{slug(category)}',
            'icon': str(category._ih_home_icon_markup(website.image_url(category, 'image_256'))),
        } for category in categories]


class AlihsanNews(http.Controller):

    @http.route('/alihsan/news', type='jsonrpc', auth='public', website=True, methods=['POST'])
    def news(self, **kwargs):
        """Stories managed in the dashboard (Website > News) or Website > Site > Content > News, featured first."""
        website = request.website
        posts = request.env['alihsan.news.post'].sudo()._get_published(website)
        return [{
            'title': post.name,
            'summary': post.summary or '',
            'tag': post.tag or '',
            'date': fields.Date.to_string(post.date),
            'dateLabel': format_date(request.env, post.date, lang_code=request.lang.code, date_format='d MMM y'),
            'image': website.image_url(post, 'image', size='1024x1024'),
            'url': post._ih_link()[0],
            'newTab': post._ih_link()[1],
        } for post in posts]

    NEWS_PER_PAGE = 6

    @http.route('/news/<string:slug>', type='http', auth='public', website=True, sitemap=False)
    def news_detail(self, slug, page=1, **kwargs):
        """Story page opened by 'Read more' (port of media-details.html?type=news of "Al Ihsan web 8"):
        title, image, date, share links, full story, then the other news of the same year."""
        website = request.website
        post_id = request.env['ir.http']._unslug(slug)[1]
        published = request.env['alihsan.news.post'].sudo()._get_published(website)
        post = published.filtered(lambda p: p.id == post_id)
        if not post:
            raise NotFound()
        if slug != post.website_url.rsplit('/', 1)[-1]:
            return request.redirect(post.website_url, code=301)
        others = published.filtered(lambda p: p != post and p.date.year == post.date.year).sorted(
            lambda p: (p.date, p.id), reverse=True)
        pages = max(1, math.ceil(len(others) / self.NEWS_PER_PAGE))
        try:
            page = min(max(int(page), 1), pages)
        except ValueError:
            page = 1
        start = (page - 1) * self.NEWS_PER_PAGE
        return request.render('alihsanwebsite_theme.news_detail_page', {
            'post': post,
            'others': others[start:start + self.NEWS_PER_PAGE],
            'others_count': len(others),
            'page': page,
            'pages': pages,
            'year': post.date.year,
            'list_url': '/news',
            'ih_share': quote_plus(request.httprequest.url_root.rstrip('/') + post.website_url),
            'format_date': lambda date: format_date(request.env, date, lang_code=request.lang.code, date_format='MMM d, y'),
        })


class AlihsanMediaCenter(http.Controller):

    @http.route('/alihsan/media_center/<string:kind>', type='jsonrpc', auth='public', website=True, methods=['POST'])
    def media_center(self, kind, **kwargs):
        """Image galleries / videos / events managed in the dashboard (Website > Media Center), newest first."""
        website = request.website
        lang = request.lang.code
        model = {'images': 'alihsan.media.gallery', 'videos': 'alihsan.media.video', 'events': 'alihsan.media.event'}.get(kind)
        if not model:
            return []
        result = []
        for item in request.env[model].sudo()._get_published(website):
            data = {
                'title': item.name,
                'date': fields.Date.to_string(item.date),
                'dateLabel': format_date(request.env, item.date, lang_code=lang, date_format='MMM d, y'),
            }
            if kind == 'images':
                record, field = item._cover()
                data.update({
                    'image': website.image_url(record, field, size='1024x1024'),
                    'photos': [website.image_url(photo, 'image') for photo in item.photo_ids]
                              or [website.image_url(item, 'image')],
                })
            elif kind == 'videos':
                data.update({
                    'image': website.image_url(item, 'image', size='1024x1024') if item.image
                             else '/alihsanwebsite_theme/static/src/img/news.jpg',
                    'embed': item.embed_url or '',
                    'src': '' if item.embed_url else (item.video_url or ''),
                })
            else:
                data.update({
                    'image': website.image_url(item, 'image', size='1024x1024'),
                    'day': str(item.date.day),
                    'month': format_date(request.env, item.date, lang_code=lang, date_format='MMM'),
                    'time': item._time_label(),
                    'location': item.location or '',
                    'description': item.description or '',
                    'donateUrl': item.donate_url or '',
                })
            result.append(data)
        return result
