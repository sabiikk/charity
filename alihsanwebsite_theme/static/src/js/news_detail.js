import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";

/**
 * News story page: Instagram has no web share link, so its button copies the
 * page link (to paste in Instagram) before opening Instagram.
 */
export class NewsDetailShare extends Interaction {
    static selector = ".md-page .md-ig";
    dynamicContent = {
        _root: { "t-on-click": () => navigator.clipboard?.writeText(window.location.href).catch(() => {}) },
    };
}

registry.category("public.interactions").add("alihsanwebsite_theme.news_detail_share", NewsDetailShare);
