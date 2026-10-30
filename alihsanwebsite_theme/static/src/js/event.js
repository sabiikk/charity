import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { DATE_ICON, esc, Gallery } from "@alihsanwebsite_theme/js/image";

const ICONS = {
    date: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    time: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    loc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3z"/><path d="M13 6v12" stroke-dasharray="2 2"/></svg>',
};

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/**
 * Event snippets (port of event.js): the image gallery (search, year filter,
 * pager, fade-in) plus an Upcoming / Past status worked out from each event's
 * date, the All / Upcoming / Past filter buttons in the header snippet, and a
 * details pop-up instead of the photo lightbox.
 */
export class EventGallery extends Gallery {
    static selectorHas = ".ev-card";
    static selectorNotHas = "";

    get kind() {
        return "events";
    }

    setup() {
        super.setup();
        this.status = "all";
        this.upcoming = new Map();
        this.filterButtons = [...document.querySelectorAll(".gl-sec .ev-filter .nw-chip[data-f]")];
    }

    cardHtml(item) {
        const title = esc(item.title);
        return `<article class="gl-card ev-card gl-fade" data-donate-url="${esc(item.donateUrl)}">
            <button class="gl-img" type="button" aria-label="${esc(_t("Details:"))} ${title}"><img src="${esc(item.image)}" alt="${title}" loading="lazy"/><span class="ev-date"><b>${esc(item.day)}</b><small>${esc(item.month)}</small></span><span class="ev-status"></span></button>
            <div class="gl-meta"><span>${DATE_ICON}<time datetime="${esc(item.date)}">${esc(item.dateLabel)}</time></span>${item.time ? `<span>${ICONS.time}<span>${esc(item.time)}</span></span>` : ""}</div>
            ${item.location ? `<div class="ev-loc">${ICONS.loc}<span>${esc(item.location)}</span></div>` : ""}
            <h3>${title}</h3>
            ${item.description ? `<p class="ev-d">${esc(item.description)}</p>` : ""}
            <button class="ev-more nw-more" type="button"><span>${esc(_t("View details"))}</span>${ARROW}</button></article>`;
    }

    start() {
        this.renderItems();
        this.markStatuses();
        for (const button of this.filterButtons) {
            this.addListener(button, "click", () => {
                this.status = button.dataset.f;
                this.filterButtons.forEach((b) => b.classList.toggle("selected", b === button));
                this.render(1);
            });
        }
        this.registerCleanup(() => {
            this.filterButtons.forEach((b) => b.classList.toggle("selected", b.dataset.f === "all"));
        });
        super.start();
    }

    /**
     * The visible date wins (it is what editors change in static cards); fall
     * back to datetime="". Backend cards: datetime="" (the label may be Arabic).
     */
    dateOf(card) {
        const time = card.querySelector("time");
        if (this.rendered) {
            return new Date(`${time?.getAttribute("datetime")}T00:00`);
        }
        let date = new Date((time?.textContent || "").trim());
        if (isNaN(date)) {
            date = new Date(time?.getAttribute("datetime") || "");
        }
        return date;
    }

    markStatuses() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (const card of this.cards) {
            const date = this.dateOf(card);
            const upcoming = !isNaN(date) && date >= today;
            this.upcoming.set(card, upcoming);
            const badge = card.querySelector(".ev-status");
            if (badge) {
                badge.classList.toggle("past", !upcoming);
                badge.textContent = upcoming ? _t("Upcoming") : _t("Past");
            }
        }
        this.registerCleanup(() => {
            this.cards.forEach((card) => {
                const badge = card.querySelector(".ev-status");
                if (badge) {
                    badge.classList.remove("past");
                    badge.textContent = "";
                }
            });
        });
    }

    cardOpeners(card) {
        return card.querySelectorAll(".gl-img, .ev-more");
    }

    cardMatches(card) {
        return this.status === "all" || this.upcoming.get(card) === (this.status === "upcoming");
    }

    buildLightbox() {
        const lb = document.createElement("div");
        lb.className = "gl-lb ev-lb d-none";
        lb.setAttribute("role", "dialog");
        lb.setAttribute("aria-modal", "true");
        lb.setAttribute("aria-label", _t("Event details"));
        lb.innerHTML = `<button type="button" class="gl-x">×</button><div class="ev-modal"><img alt=""/><div class="ev-mb"><span class="ev-status"></span><h3></h3><ul><li>${ICONS.date}<span class="m-date"></span></li><li>${ICONS.time}<span class="m-time"></span></li><li>${ICONS.loc}<span class="m-loc"></span></li></ul><p></p><a class="ev-donate">${ICONS.ticket}<span></span></a></div></div>`;
        lb.querySelector(".gl-x").setAttribute("aria-label", _t("Close"));
        const donate = lb.querySelector(".ev-donate");
        this.donateDefault = this.el.dataset.donateUrl || "/shop";
        donate.href = this.donateDefault;
        donate.querySelector("span").textContent = _t("Donate to support");
        this.addListener(lb.querySelector(".gl-x"), "click", this.closeLightbox);
        this.addListener(lb, "click", (ev) => ev.target === lb && this.closeLightbox());
        document.body.appendChild(lb);
        return lb;
    }

    openLightbox(index) {
        const card = this.matches[index];
        if (!card) {
            return;
        }
        this.lightbox ||= this.buildLightbox();
        const lb = this.lightbox;
        const text = (sel) => (card.querySelector(sel)?.textContent || "").trim();
        const upcoming = this.upcoming.get(card);
        const img = lb.querySelector(".ev-modal>img");
        img.src = card.querySelector("img")?.src || "";
        img.alt = card.querySelector("img")?.alt || "";
        const badge = lb.querySelector(".ev-status");
        badge.classList.toggle("past", !upcoming);
        badge.textContent = upcoming ? _t("Upcoming") : _t("Past");
        lb.querySelector("h3").textContent = text("h3");
        lb.querySelector(".m-date").textContent = text("time");
        lb.querySelector(".m-time").textContent = text(".gl-meta>span:nth-child(2)");
        lb.querySelector(".m-loc").textContent = text(".ev-loc span");
        // hide the time / place lines the event does not have
        for (const sel of [".m-time", ".m-loc"]) {
            const line = lb.querySelector(sel);
            line.parentElement.classList.toggle("d-none", !line.textContent);
        }
        lb.querySelector(".ev-donate").href = card.dataset.donateUrl || this.donateDefault;
        lb.querySelector(".ev-mb>p").textContent = text(".ev-d");
        lb.classList.remove("d-none");
        document.body.style.overflow = "hidden";
    }

    onKeydown(ev) {
        if (this.lightbox && !this.lightbox.classList.contains("d-none") && ev.key === "Escape") {
            this.closeLightbox();
        }
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.event_gallery", EventGallery);
