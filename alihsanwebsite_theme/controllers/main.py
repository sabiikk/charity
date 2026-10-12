import logging

from markupsafe import Markup, escape

from odoo import http
from odoo.http import request

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
