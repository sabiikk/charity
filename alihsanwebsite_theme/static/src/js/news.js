import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { Interaction } from "@web/public/interaction";
import { rpc } from "@web/core/network/rpc";

/**
 * News snippets (port of news.js):
 * - the stories of the news list snippet come from the backend (dashboard >
 *   Website > News, or Website > Site > Content > News); the static stories
 *   in the snippet are only shown if they cannot be loaded;
 * - blocks marked .nw-fade fade in as they scroll into view;
 * - the search box (header snippet) filters the stories of every news list
 *   snippet on the page by their visible text.
 * Public interactions are not started in the website editor, and every change
 * made here is undone in cleanups, so no runtime state is ever saved.
 */
const ARROW = '<path d="M5 12h14M13 6l6 6-6 6"/>';

function node(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
    }
    el.append(...children.filter((c) => c !== null));
    return el;
}

/** <a> to the story (no href when it has no link), opened in a new tab when asked. */
function storyLink(post, attrs, ...children) {
    if (post.url) {
        attrs = { ...attrs, href: post.url, ...(post.newTab ? { target: "_blank", rel: "noopener" } : {}) };
    }
    return node("a", attrs, ...children);
}

function readMore(post) {
    if (!post.url) {
        return null;
    }
    const link = storyLink(post, { class: "nw-more" }, node("span", {}, _t("Read more")));
    link.insertAdjacentHTML("beforeend",
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ARROW}</svg>`);
    return link;
}

function featuredStory(post) {
    return node("article", { class: "nw-feat nw-fade" },
        storyLink(post, { class: "nw-fimg" }, node("img", { src: post.image, alt: post.title })),
        node("div", { class: "nw-fbody" },
            post.tag ? node("span", { class: "nw-tag" }, post.tag) : null,
            node("h3", {}, storyLink(post, {}, post.title)),
            post.summary ? node("p", {}, post.summary) : null,
            node("div", { class: "nw-meta" }, node("time", { datetime: post.date }, post.dateLabel), readMore(post))));
}

function storyCard(post, index) {
    return node("article", { class: "nw-card nw-fade", style: `--d:${(index % 3) / 10}s` },
        storyLink(post, { class: "nw-img" },
            node("img", { src: post.image, alt: post.title, loading: "lazy" }),
            post.tag ? node("span", { class: "nw-tag" }, post.tag) : null),
        node("div", { class: "nw-body" },
            node("time", { datetime: post.date }, post.dateLabel),
            node("h3", {}, storyLink(post, {}, post.title)),
            post.summary ? node("p", {}, post.summary) : null,
            readMore(post)));
}

export class NewsReveal extends Interaction {
    static selector = ".nw-sec";

    async willStart() {
        this.list = this.el.querySelector(".nw-list");
        if (!this.list) {
            return;
        }
        try {
            this.posts = await this.waitFor(rpc("/alihsan/news"));
        } catch {
            this.posts = null; // keep the static stories
        }
    }

    start() {
        if (this.posts) {
            this.renderPosts(this.posts);
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const items = [...this.el.querySelectorAll(".nw-fade")];
        const reset = (el) => {
            delete el.dataset.nwv;
            el.classList.remove("nw-in");
        };
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) {
                        continue;
                    }
                    const el = entry.target;
                    observer.unobserve(el);
                    el.classList.add("nw-in");
                    // once finished, drop the reveal state so hover effects take over
                    const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
                    this.waitForTimeout(() => reset(el), (delay + 0.9) * 1000);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        items.forEach((el) => {
            el.dataset.nwv = "";
            observer.observe(el);
        });
        this.registerCleanup(() => {
            observer.disconnect();
            items.forEach(reset);
        });
    }

    /**
     * Replace the static stories with the backend ones (same markup); the
     * original nodes are put back on cleanup so the editor never saves them.
     */
    renderPosts(posts) {
        const oldNodes = [...this.list.childNodes];
        const empty = this.list.querySelector(".nw-empty") || node("p", { class: "nw-empty d-none" }, _t("No matching news."));
        const [first, ...rest] = posts;
        const grid = node("div", { class: "nw-grid" }, ...rest.map(storyCard));
        this.list.replaceChildren(...(first ? [featuredStory(first), grid] : []), empty);
        if (!first) {
            this.emptyText = empty.textContent;
            empty.textContent = _t("No news yet.");
            empty.classList.remove("d-none");
        }
        this.registerCleanup(() => {
            if (this.emptyText !== undefined) {
                empty.textContent = this.emptyText;
                empty.classList.add("d-none");
            }
            this.list.replaceChildren(...oldNodes);
        });
    }
}

export class NewsSearch extends Interaction {
    static selector = ".nw-sec .nw-q";
    dynamicContent = {
        _root: { "t-on-input": this.filter },
    };

    get stories() {
        return document.querySelectorAll(".nw-sec .nw-feat, .nw-sec .nw-card");
    }

    start() {
        this.registerCleanup(() => {
            this.stories.forEach((el) => el.classList.remove("d-none"));
            document.querySelectorAll(".nw-sec .nw-empty").forEach((el) => el.classList.add("d-none"));
        });
    }

    filter() {
        const term = this.el.value.trim().toLowerCase();
        for (const list of document.querySelectorAll(".nw-sec .nw-list")) {
            let shown = 0;
            list.querySelectorAll(".nw-feat, .nw-card").forEach((el) => {
                const match = !term || el.textContent.toLowerCase().includes(term);
                el.classList.toggle("d-none", !match);
                shown += match ? 1 : 0;
            });
            list.querySelectorAll(".nw-empty").forEach((el) => el.classList.toggle("d-none", shown > 0));
        }
    }
}

registry
    .category("public.interactions")
    .add("alihsanwebsite_theme.news_reveal", NewsReveal)
    .add("alihsanwebsite_theme.news_search", NewsSearch);
