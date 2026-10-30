import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";
import { rpc } from "@web/core/network/rpc";

/**
 * Image + Video gallery snippets (port of image.js / video.js; video cards are
 * .vd-card with an optional data-src and open in the video stage). The cards
 * come from the backend (dashboard > Website > Media Center); the static cards
 * of the snippet are only shown if they cannot be loaded. Public interactions are not
 * started in the website editor (so editors see every card, unpaginated), and
 * every change made here is undone in cleanups, so no runtime state is saved.
 */

const PER_PAGE = 6;
const isRtl = () => document.documentElement.dir === "rtl";

export const esc = (text) =>
    String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const SVG = (paths) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
export const DATE_ICON = SVG('<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>');
const PHOTO_ICON = SVG('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4"/>');
const ZOOM_ICON = SVG('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>');
const PLAY_ICON = SVG('<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>');

/** Blocks marked .gl-fade fade in as they scroll into view. */
export class GalleryReveal extends Interaction {
    static selector = ".gl-sec";

    start() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const items = [...this.el.querySelectorAll(".gl-fade")];
        const reset = (el) => {
            delete el.dataset.glv;
            el.classList.remove("gl-in");
        };
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) {
                        continue;
                    }
                    const el = entry.target;
                    observer.unobserve(el);
                    el.classList.add("gl-in");
                    // once finished, drop the reveal state so hover effects take over
                    const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
                    this.waitForTimeout(() => reset(el), (delay + 0.9) * 1000);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        items.forEach((el) => {
            el.dataset.glv = "";
            observer.observe(el);
        });
        this.registerCleanup(() => {
            observer.disconnect();
            items.forEach(reset);
        });
    }
}

/** The filter button opens the year popover; any click outside closes it. */
export class GalleryFilterToggle extends Interaction {
    static selector = ".gl-sec .gl-filter";
    dynamicContent = {
        ".gl-fb": {
            "t-on-click": () => (this.open = !this.open),
            "t-att-aria-expanded": () => String(this.open),
        },
        ".gl-pop": { "t-att-class": () => ({ "d-none": !this.open }) },
        _document: {
            "t-on-click": (ev) => {
                if (!this.el.contains(ev.target)) {
                    this.open = false;
                }
            },
        },
    };

    setup() {
        this.open = false;
    }
}

/** Keyword search, year filter, pagination and lightbox for a gallery grid. */
export class Gallery extends Interaction {
    static selector = ".gl-sec";
    static selectorHas = ".gl-grid";
    // event grids are handled by EventGallery (event.js), a subclass
    static selectorNotHas = ".ev-card";

    /** Backend source of the cards: /alihsan/media_center/<kind> */
    get kind() {
        return this.el.classList.contains("s_vd_gallery") ? "videos" : "images";
    }

    setup() {
        this.grid = this.el.querySelector(".gl-grid");
        this.cards = [...this.el.querySelectorAll(".gl-card")];
        this.pager = this.el.querySelector(".gl-pager");
        this.empty = this.el.querySelector(".gl-empty");
        // the search box and year filter live in the header snippet
        this.search = document.querySelector(".gl-sec .gl-q");
        this.year = document.querySelector(".gl-sec .gl-year");
        this.page = 1;
        this.matches = this.cards;
        this.current = 0;
        this.lightbox = null;
    }

    async willStart() {
        try {
            this.items = await this.waitFor(rpc(`/alihsan/media_center/${this.kind}`));
        } catch {
            this.items = null; // keep the static cards
        }
    }

    /**
     * Replace the static cards with the backend ones (same markup); the
     * original cards are put back on cleanup so the editor never saves them.
     */
    renderItems() {
        if (this.rendered || !this.items || !this.grid) {
            return;
        }
        this.rendered = true;
        const oldCards = [...this.grid.childNodes];
        this.grid.innerHTML = this.items.map((item) => this.cardHtml(item)).join("");
        this.cards = this.matches = [...this.grid.querySelectorAll(".gl-card")];
        this.registerCleanup(() => this.grid.replaceChildren(...oldCards));
    }

    cardHtml(item) {
        const title = esc(item.title);
        const date = `<span>${DATE_ICON}<span>${esc(_t("Held on:"))}</span> <time datetime="${esc(item.date)}">${esc(item.dateLabel)}</time></span>`;
        if (this.kind === "videos") {
            return `<article class="gl-card vd-card gl-fade" data-src="${esc(item.src)}" data-embed="${esc(item.embed)}">
                <button class="gl-img" type="button" aria-label="${esc(_t("Play video:"))} ${title}"><img src="${esc(item.image)}" alt="${title}" loading="lazy"/><span class="vd-play">${PLAY_ICON}</span></button>
                <div class="gl-meta">${date}</div><h3>${title}</h3></article>`;
        }
        const count = esc(_t("%s photo(s)", item.photos.length));
        return `<article class="gl-card gl-fade" data-photos="${esc(JSON.stringify(item.photos))}">
            <button class="gl-img" type="button" aria-label="${esc(_t("Open gallery:"))} ${title}"><img src="${esc(item.image)}" alt="${title}" loading="lazy"/><span class="gl-zoom">${ZOOM_ICON}</span></button>
            <div class="gl-meta">${date}<span>${PHOTO_ICON}<span>${esc(_t("Gallery:"))}</span> <span>${count}</span></span></div>
            <h3>${title}</h3></article>`;
    }

    start() {
        this.renderItems();
        this.fillYears();
        if (this.search) {
            this.addListener(this.search, "input", () => this.render(1));
        }
        if (this.year) {
            this.addListener(this.year, "change", () => this.render(1));
        }
        if (this.pager) {
            this.addListener(this.pager, "click", this.onPagerClick);
        }
        this.cards.forEach((card) => {
            for (const button of this.cardOpeners(card)) {
                this.addListener(button, "click", () => this.openLightbox(this.matches.indexOf(card)));
            }
        });
        this.addListener(document, "keydown", this.onKeydown);
        this.registerCleanup(() => {
            this.cards.forEach((card) => {
                card.classList.remove("d-none");
                card.style.removeProperty("--d");
            });
            this.empty?.classList.add("d-none");
            this.pager?.replaceChildren();
            this.closeLightbox();
            this.lightbox?.remove();
        });
        this.render(1);
    }

    /** Elements of a card that open it in the lightbox. */
    cardOpeners(card) {
        return card.querySelectorAll(".gl-img");
    }

    /** Extra filter applied on top of search + year (subclass hook). */
    cardMatches(card) {
        return true;
    }

    yearOf(card) {
        const time = card.querySelector("time");
        const text = `${time?.textContent || ""} ${time?.getAttribute("datetime") || ""}`;
        return text.match(/\b(19|20)\d{2}\b/)?.[0] || card.dataset.year || "";
    }

    fillYears() {
        if (!this.year) {
            return;
        }
        const years = [...new Set(this.cards.map((c) => this.yearOf(c)).filter(Boolean))].sort().reverse();
        const added = years.map((y) => {
            const option = document.createElement("option");
            option.value = option.textContent = y;
            this.year.appendChild(option);
            return option;
        });
        this.registerCleanup(() => {
            added.forEach((o) => o.remove());
            this.year.value = "all";
        });
    }

    render(page = this.page) {
        const term = (this.search?.value || "").trim().toLowerCase();
        const year = this.year?.value || "all";
        this.matches = this.cards.filter((card) => {
            const title = (card.querySelector("h3")?.textContent || "").toLowerCase();
            return (
                (year === "all" || this.yearOf(card) === year) &&
                (!term || title.includes(term)) &&
                this.cardMatches(card)
            );
        });
        const pages = Math.max(1, Math.ceil(this.matches.length / PER_PAGE));
        this.page = Math.min(Math.max(page, 1), pages);
        const visible = this.matches.slice((this.page - 1) * PER_PAGE, this.page * PER_PAGE);
        this.cards.forEach((card) => card.classList.toggle("d-none", !visible.includes(card)));
        visible.forEach((card, i) => card.style.setProperty("--d", (i % 3) * 0.1 + "s"));
        this.empty?.classList.toggle("d-none", this.matches.length > 0);
        this.renderPager(pages);
    }

    renderPager(pages) {
        if (!this.pager) {
            return;
        }
        const buttons = [];
        if (pages > 1) {
            const make = (p, label, ariaLabel, disabled, on) => {
                const b = document.createElement("button");
                b.type = "button";
                b.dataset.p = p;
                b.textContent = label;
                b.disabled = disabled;
                if (ariaLabel) {
                    b.setAttribute("aria-label", ariaLabel);
                }
                if (on) {
                    b.classList.add("on");
                    b.setAttribute("aria-current", "page");
                }
                return b;
            };
            buttons.push(make("prev", isRtl() ? "›" : "‹", _t("Previous page"), this.page === 1));
            for (let i = 1; i <= pages; i++) {
                buttons.push(make(i, String(i), null, false, i === this.page));
            }
            buttons.push(make("next", isRtl() ? "‹" : "›", _t("Next page"), this.page === pages));
        }
        this.pager.replaceChildren(...buttons);
    }

    onPagerClick(ev) {
        const button = ev.target.closest("button");
        if (!button || button.disabled) {
            return;
        }
        const p = button.dataset.p;
        this.render(p === "prev" ? this.page - 1 : p === "next" ? this.page + 1 : Number(p));
        this.el.scrollIntoView({ behavior: "smooth" });
    }

    buildLightbox() {
        const lb = document.createElement("div");
        lb.className = "gl-lb d-none";
        lb.setAttribute("role", "dialog");
        lb.setAttribute("aria-modal", "true");
        lb.setAttribute("aria-label", _t("Gallery"));
        lb.innerHTML = `<button type="button" class="gl-x">×</button><button type="button" class="gl-a prev">‹</button><figure><img class="gl-lb-img" alt=""/><div class="vd-stage d-none"><video controls="" playsinline="" preload="none"></video><div class="vd-soon"><img alt=""/><p></p><a class="vd-official" target="_blank" rel="noopener"><span></span></a></div></div><figcaption></figcaption></figure><button type="button" class="gl-a next">›</button>`;
        // video cards: shown when no data-src is set yet (same as the static site)
        lb.querySelector(".vd-soon p").textContent = _t("The video will be available here soon.");
        lb.querySelector(".vd-official span").textContent = _t("Watch on the official site");
        lb.querySelector(".vd-official").href = this.el.dataset.fallbackUrl || "https://alihsan.ae/ar";
        lb.querySelector(".gl-x").setAttribute("aria-label", _t("Close"));
        lb.querySelector(".gl-a.prev").setAttribute("aria-label", _t("Previous"));
        lb.querySelector(".gl-a.next").setAttribute("aria-label", _t("Next"));
        this.addListener(lb.querySelector(".gl-x"), "click", this.closeLightbox);
        this.addListener(lb.querySelector(".gl-a.prev"), "click", () => this.step(-1));
        this.addListener(lb.querySelector(".gl-a.next"), "click", () => this.step(1));
        this.addListener(lb, "click", (ev) => ev.target === lb && this.closeLightbox());
        document.body.appendChild(lb);
        return lb;
    }

    openLightbox(index) {
        if (!this.matches.length || index < -1) {
            return;
        }
        this.lightbox ||= this.buildLightbox();
        this.stopVideo();
        this.current = (index + this.matches.length) % this.matches.length;
        const card = this.matches[this.current];
        const src = card.querySelector("img");
        const isVideo = card.classList.contains("vd-card");
        // backend galleries: the lightbox shows the gallery's own photos
        this.photos = card.dataset.photos ? JSON.parse(card.dataset.photos) : [];
        this.photo = 0;
        const img = this.lightbox.querySelector(".gl-lb-img");
        const stage = this.lightbox.querySelector(".vd-stage");
        this.lightbox.classList.toggle("vd-lb", isVideo);
        img.classList.toggle("d-none", isVideo);
        stage.classList.toggle("d-none", !isVideo);
        if (isVideo) {
            const videoSrc = card.dataset.src;
            const embed = card.dataset.embed;
            this.lightbox.querySelector(".vd-soon img").src = src.src;
            stage.classList.toggle("has", !!(videoSrc || embed));
            stage.classList.toggle("is-embed", !!embed);
            if (embed) {
                // YouTube, Vimeo... player
                const iframe = document.createElement("iframe");
                iframe.src = embed;
                iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
                iframe.allowFullscreen = true;
                iframe.title = card.querySelector("h3")?.textContent || "";
                stage.appendChild(iframe);
            } else if (videoSrc) {
                const video = stage.querySelector("video");
                video.src = videoSrc;
                video.play().catch(() => {});
            }
        } else {
            img.src = this.photos[0] || src.src;
            img.alt = src.alt;
        }
        this.updateCaption();
        this.lightbox.classList.remove("d-none");
        document.body.style.overflow = "hidden";
    }

    updateCaption() {
        const card = this.matches[this.current];
        const caption = this.lightbox.querySelector("figcaption");
        const small = document.createElement("small");
        small.textContent = this.photos.length > 1
            ? `${this.photo + 1} / ${this.photos.length}`
            : `${this.current + 1} / ${this.matches.length}`;
        caption.replaceChildren(card.querySelector("h3")?.textContent || "", small);
    }

    /** Previous / next: the photos of a backend gallery, otherwise the cards. */
    step(direction) {
        if (this.photos?.length > 1) {
            this.photo = (this.photo + direction + this.photos.length) % this.photos.length;
            this.lightbox.querySelector(".gl-lb-img").src = this.photos[this.photo];
            this.updateCaption();
        } else {
            this.openLightbox(this.current + direction);
        }
    }

    stopVideo() {
        this.lightbox?.querySelector(".vd-stage iframe")?.remove();
        const video = this.lightbox?.querySelector("video");
        if (video?.getAttribute("src")) {
            video.pause();
            video.removeAttribute("src");
            video.load();
        }
    }

    closeLightbox() {
        this.stopVideo();
        if (this.lightbox && !this.lightbox.classList.contains("d-none")) {
            this.lightbox.classList.add("d-none");
            document.body.style.overflow = "";
        }
    }

    onKeydown(ev) {
        if (!this.lightbox || this.lightbox.classList.contains("d-none")) {
            return;
        }
        const step = isRtl() ? -1 : 1;
        if (ev.key === "Escape") {
            this.closeLightbox();
        } else if (ev.key === "ArrowRight") {
            this.step(step);
        } else if (ev.key === "ArrowLeft") {
            this.step(-step);
        }
    }
}

registry
    .category("public.interactions")
    .add("alihsanwebsite_theme.gallery_reveal", GalleryReveal)
    .add("alihsanwebsite_theme.gallery_filter_toggle", GalleryFilterToggle)
    .add("alihsanwebsite_theme.gallery", Gallery);
