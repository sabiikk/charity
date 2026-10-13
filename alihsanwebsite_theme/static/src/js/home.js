import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { Interaction } from "@web/public/interaction";

/**
 * Home page snippets (port of the home scripts of "Al Ihsan web 7": script.js
 * reveal, scroll-fade.js, hover-fx.js, campaign-rotator.js, cat-carousel.js,
 * flips.js + the featured-project part of experience.js, method-hover.js,
 * giving-method-motion.js, leadership-motion.js, gallery-timeline.js, the
 * partners marquee, section-rail.js, quick-actions.js and back-to-top.js).
 *
 * Everything the static site generated with JavaScript (other tab panels,
 * every archive year) is plain markup in the snippets so it can be edited;
 * these interactions only show / hide / animate it.
 *
 * Public interactions are not started in the website editor, and each one
 * restores the DOM it touched in a cleanup (see snapshot), so no runtime
 * state is ever saved into the page.
 */

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isRtl = () => document.documentElement.dir === "rtl";
const isArabic = () => (document.documentElement.lang || "").startsWith("ar");

/**
 * Remember every attribute of every element under `root` (plus form values
 * and the text of leaf elements) and put it back once the last interaction
 * running on that root is destroyed. Several interactions share a section
 * root (HomeSection + the section's own one), so the state is taken by the
 * first to start, before anyone touched the DOM. Registered first, so it runs
 * last (cleanups are LIFO), after the nodes the interaction added are removed.
 */
const snapshots = new WeakMap();

function snapshot(interaction, root) {
    let entry = snapshots.get(root);
    if (!entry) {
        entry = { count: 0, state: captureState(root) };
        snapshots.set(root, entry);
    }
    entry.count++;
    interaction.registerCleanup(() => {
        if (--entry.count === 0) {
            snapshots.delete(root);
            restoreState(entry.state);
        }
    });
}

function captureState(root) {
    return [root, ...root.querySelectorAll("*")].map((el) => ({
        el,
        attrs: [...el.attributes].map((a) => [a.name, a.value]),
        value: el.tagName === "INPUT" || el.tagName === "SELECT" ? el.value : undefined,
        text: el.childElementCount === 0 && el.namespaceURI !== "http://www.w3.org/2000/svg" ? el.textContent : undefined,
    }));
}

function restoreState(state) {
    for (const { el, attrs, value, text } of state) {
        const names = new Set(attrs.map(([n]) => n));
        for (const a of [...el.attributes]) {
            if (!names.has(a.name)) {
                el.removeAttribute(a.name);
            }
        }
        for (const [n, v] of attrs) {
            if (el.getAttribute(n) !== v) {
                el.setAttribute(n, v);
            }
        }
        if (value !== undefined) {
            el.value = value;
        }
        if (text !== undefined && el.textContent !== text) {
            el.textContent = text;
        }
    }
}

/** IntersectionObserver that is disconnected on destroy. */
function observe(interaction, els, callback, options) {
    if (!("IntersectionObserver" in window)) {
        return null;
    }
    const io = new IntersectionObserver(callback, options);
    els.forEach((el) => io.observe(el));
    interaction.registerCleanup(() => io.disconnect());
    return io;
}

/** Interval cleared on destroy; returns a function that clears it early. */
function every(interaction, fn, delay) {
    const id = setInterval(fn, delay);
    interaction.registerCleanup(() => clearInterval(id));
    return () => clearInterval(id);
}

// ---------------------------------------------------------------------------
// Every home section: reveal (script.js), scroll fade-in (scroll-fade.js) and
// hover polish (hover-fx.js). The CSS only hides content while the root has
// the runtime classes hm-js / hm-sf-on, so the editor always shows it all.
// ---------------------------------------------------------------------------

const SF_SKIP = "nav,.mega-panel,dialog,.modal,[role=dialog],.pj-tabs-wrap,.sf-skip,script,style,noscript";
const HV_SKIP = ".campaign-slides,.campaign-hero,.pj-stage,.logo,.hv-skip,nav,.mega-panel,dialog,[role=dialog],.modal";

export class HomeSection extends Interaction {
    static selector = ".hm-sec";

    start() {
        snapshot(this, this.el);
        this.added = [];
        this.registerCleanup(() => this.added.forEach((n) => n.remove()));
        this.el.classList.add("hm-js");

        // script.js: .reveal blocks get .visible once scrolled into view
        const reveals = [this.el, ...this.el.querySelectorAll(".reveal")].filter((el) => el.classList.contains("reveal"));
        const revealIo = observe(this, reveals, (entries) => {
            for (const e of entries) {
                if (e.isIntersecting) {
                    e.target.classList.add("visible");
                    revealIo.unobserve(e.target);
                }
            }
        }, { threshold: 0.07 });
        if (!revealIo) {
            reveals.forEach((el) => el.classList.add("visible"));
        }

        if (!reduceMotion()) {
            this.el.classList.add("hm-sf-on");
            this.fadeIo = observe(this, [], (entries) => {
                for (const e of entries) {
                    e.target.classList.toggle("sf-in", e.isIntersecting);
                }
            }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
        }
        this.refresh();
        this.waitForTimeout(() => this.refresh(), 900);
        this.waitForTimeout(() => this.refresh(), 2200);
        // tabs / archive years show new content: give it the same treatment
        this.addListener(this.el, "hm-content", () => this.waitForTimeout(() => this.refresh(), 60));
    }

    refresh() {
        if (this.fadeIo) {
            this.scanFade();
        }
        this.hoverImages();
        this.hoverCards();
        this.hoverButtons();
    }

    // --- scroll-fade.js -----------------------------------------------------
    badFade(el) {
        if (el.nodeType !== 1 || el.matches(SF_SKIP) || el.closest(SF_SKIP)) {
            return true;
        }
        const cs = getComputedStyle(el);
        return cs.position === "fixed" || cs.position === "sticky" || cs.display === "none" || cs.display === "contents";
    }

    addFade(el, delay) {
        if (el.dataset.sf || this.badFade(el)) {
            return;
        }
        el.dataset.sf = "1";
        if (delay != null && !el.style.getPropertyValue("--sfd")) {
            el.style.setProperty("--sfd", delay + "s");
        }
        el.classList.add("sf");
        this.fadeIo.observe(el);
    }

    scanFade() {
        this.addFade(this.el);
        // repeated items inside grids / wrapped flex rows
        const walk = (parent, depth) => {
            if (depth > 4) {
                return;
            }
            const cs = getComputedStyle(parent);
            const kids = [...parent.children].filter((k) => !this.badFade(k));
            const repeated =
                (cs.display.includes("grid") && kids.length >= 2) ||
                (cs.display.includes("flex") && cs.flexWrap !== "nowrap" && kids.length >= 3) ||
                (cs.display.includes("flex") && cs.flexDirection.startsWith("row") && kids.length >= 3 && depth > 0);
            if (repeated) {
                kids.forEach((k, i) => {
                    const r = k.getBoundingClientRect();
                    if (r.width > 60 && r.height > 30) {
                        this.addFade(k, Math.min(i % 4, 3) * 0.1);
                    }
                });
            }
            kids.forEach((k) => walk(k, depth + 1));
        };
        if (!this.badFade(this.el)) {
            walk(this.el, 0);
        }
    }

    // --- hover-fx.js --------------------------------------------------------
    /** Append a property to an element's transition list instead of replacing it. */
    addTransition(el, prop, dur = ".5s", ease = "ease") {
        const cs = getComputedStyle(el);
        const props = cs.transitionProperty.split(",").map((s) => s.trim());
        if (props.includes(prop) || props.includes("all")) {
            return;
        }
        const none = props.length === 1 && props[0] === "all" && cs.transitionDuration === "0s";
        const d = cs.transitionDuration.split(",").map((s) => s.trim());
        const e = cs.transitionTimingFunction.split(",").map((s) => s.trim());
        const dl = cs.transitionDelay.split(",").map((s) => s.trim());
        const list = props.map((p, i) => `${p} ${d[i % d.length]} ${e[i % e.length]} ${dl[i % dl.length]}`);
        el.style.transition = (none ? [] : list).concat(`${prop} ${dur} ${ease}`).join(", ");
    }

    within(selector) {
        return [this.el, ...this.el.querySelectorAll("*")].filter((el) => el.matches(selector));
    }

    hoverImages() {
        for (const img of this.within("img")) {
            if (img.dataset.hv || img.closest(HV_SKIP)) {
                continue;
            }
            const p = img.parentElement;
            img.dataset.hv = "1";
            const ir = img.getBoundingClientRect();
            if (ir.width && ir.width < 70) {
                continue;
            }
            const pr = p.getBoundingClientRect();
            const pcs = getComputedStyle(p);
            const fills = !ir.width || (pr.width - ir.width < 24 && pr.height - ir.height < 24) || pcs.overflow === "hidden";
            if (!fills || pcs.display === "inline") {
                continue;
            }
            img.classList.add("hv-img");
            this.addTransition(img, "scale", ".6s", "cubic-bezier(.22,.7,.2,1)");
            if (!p.classList.contains("hv-wrap")) {
                p.classList.add("hv-wrap");
                if (pcs.position === "static") {
                    p.style.position = "relative";
                }
                const shine = document.createElement("i");
                shine.className = "hv-shine";
                shine.setAttribute("aria-hidden", "true");
                p.appendChild(shine);
                this.added.push(shine);
            }
        }
    }

    hoverCards() {
        for (const el of this.within(".sf,.reveal,[class*=card]")) {
            if (el.dataset.hvc || el.closest(HV_SKIP)) {
                continue;
            }
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (r.width < 140 || r.width > 760 || r.height < 80 || r.height > 900) {
                continue;
            }
            const box = parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== "none" ||
                (/rgba?\((?!0, 0, 0, 0)/.test(cs.backgroundColor) && cs.backgroundColor !== "rgba(0, 0, 0, 0)");
            if (!box) {
                continue;
            }
            el.dataset.hvc = "1";
            el.classList.add("hv-card");
            this.addTransition(el, "translate", ".35s", "cubic-bezier(.22,.7,.2,1)");
            this.addTransition(el, "box-shadow", ".35s");
        }
    }

    hoverButtons() {
        const sel = "a[class*=btn],button:not(.pj-arrow):not([class*=dot]),a[class*=hero],.pp-sel";
        for (const el of this.within(sel)) {
            if (el.dataset.hvb || el.closest(HV_SKIP)) {
                continue;
            }
            el.dataset.hvb = "1";
            el.classList.add("hv-btn");
            this.addTransition(el, "translate", ".25s");
            this.addTransition(el, "filter", ".25s");
            this.addTransition(el, "scale", ".15s");
            if (getComputedStyle(el).position === "static") {
                el.style.position = "relative";
            }
            if (getComputedStyle(el).overflow === "visible") {
                el.style.overflow = "hidden";
            }
            this.addListener(el, "pointerdown", (ev) => {
                const r = el.getBoundingClientRect();
                const s = Math.max(r.width, r.height) * 2;
                const rip = document.createElement("span");
                rip.className = "hv-rip";
                rip.style.cssText = `width:${s}px;height:${s}px;left:${ev.clientX - r.left - s / 2}px;top:${ev.clientY - r.top - s / 2}px`;
                el.appendChild(rip);
                this.added.push(rip);
                this.waitForTimeout(() => rip.remove(), 650);
            });
        }
    }
}

// ---------------------------------------------------------------------------
// Campaign hero: rotating slides with dots (campaign-rotator.js)
// ---------------------------------------------------------------------------

export class HomeHero extends Interaction {
    static selector = ".s_hm_hero";

    start() {
        snapshot(this, this.el);
        this.slides = [...this.el.querySelectorAll(".campaign-slide")];
        this.dots = [...this.el.querySelectorAll(".campaign-dot")];
        if (this.slides.length < 2) {
            return;
        }
        this.active = Math.max(0, this.slides.findIndex((s) => s.classList.contains("is-active")));
        this.stopTimer = null;
        this.dots.forEach((dot, i) => this.addListener(dot, "click", () => {
            this.setSlide(i);
            this.restart();
        }));
        this.addListener(this.el, "mouseenter", this.stop);
        this.addListener(this.el, "mouseleave", this.restart);
        this.addListener(this.el, "focusin", this.stop);
        this.addListener(this.el, "focusout", (ev) => !this.el.contains(ev.relatedTarget) && this.restart());
        this.addListener(document, "visibilitychange", this.restart);
        this.setSlide(this.active);
        this.restart();
    }

    setSlide(index) {
        this.active = (index + this.slides.length) % this.slides.length;
        this.slides.forEach((s, i) => {
            s.classList.toggle("is-active", i === this.active);
            s.setAttribute("aria-hidden", i === this.active ? "false" : "true");
        });
        this.dots.forEach((d, i) => {
            d.classList.toggle("is-active", i === this.active);
            d.setAttribute("aria-pressed", i === this.active ? "true" : "false");
        });
    }

    stop() {
        this.stopTimer?.();
        this.stopTimer = null;
    }

    restart() {
        this.stop();
        if (!reduceMotion() && !document.hidden) {
            this.stopTimer = every(this, () => this.setSlide(this.active + 1), 5000);
        }
    }
}

// ---------------------------------------------------------------------------
// Project categories: arrow carousel with autoplay (cat-carousel.js)
// ---------------------------------------------------------------------------

export class HomeCategories extends Interaction {
    static selector = ".s_hm_categories";

    start() {
        snapshot(this, this.el);
        this.track = this.el.querySelector(".cat-track");
        this.prev = this.el.querySelector(".cat-nav.prev");
        this.next = this.el.querySelector(".cat-nav.next");
        if (!this.track || !this.prev || !this.next) {
            return;
        }
        this.hold = false;
        this.seen = true;
        this.stopTimer = null;
        this.addListener(this.prev, "click", () => {
            this.go(this.pos() - this.step());
            this.restart();
        });
        this.addListener(this.next, "click", () => {
            this.go(this.pos() + this.step());
            this.restart();
        });
        this.addListener(this.track, "scroll", this.update, { passive: true });
        this.addListener(window, "resize", this.update);
        this.waitForTimeout(this.update, 80);
        this.update();
        if (reduceMotion()) {
            return;
        }
        this.addListener(this.el, "pointerenter", (ev) => ev.pointerType === "mouse" && (this.hold = true));
        this.addListener(this.el, "pointerleave", (ev) => {
            if (ev.pointerType === "mouse") {
                this.hold = false;
                this.restart();
            }
        });
        this.addListener(this.track, "touchstart", () => (this.hold = true), { passive: true });
        this.addListener(this.track, "touchend", () => this.waitForTimeout(() => {
            this.hold = false;
            this.restart();
        }, 1500), { passive: true });
        this.addListener(this.el, "focusin", () => (this.hold = true));
        this.addListener(this.el, "focusout", (ev) => {
            if (!this.el.contains(ev.relatedTarget)) {
                this.hold = false;
                this.restart();
            }
        });
        observe(this, [this.el], (entries) => (this.seen = entries[0].isIntersecting));
        this.restart();
    }

    step() {
        const card = this.track.querySelector(".cat-card");
        return (card ? card.getBoundingClientRect().width : 200) + (parseFloat(getComputedStyle(this.track).columnGap) || 0);
    }

    max() {
        return this.track.scrollWidth - this.track.clientWidth;
    }

    pos() {
        return Math.abs(this.track.scrollLeft);
    }

    go(x) {
        this.track.scrollTo({ left: (isRtl() ? -1 : 1) * Math.max(0, Math.min(x, this.max())) });
    }

    update() {
        const x = this.pos();
        const atStart = x < 6;
        const atEnd = x > this.max() - 6;
        this.prev.disabled = isRtl() ? atEnd : atStart;
        this.next.disabled = isRtl() ? atStart : atEnd;
    }

    restart() {
        this.stopTimer?.();
        this.stopTimer = every(this, () => {
            if (this.hold || !this.seen || document.hidden) {
                return;
            }
            this.pos() >= this.max() - 6 ? this.go(0) : this.go(this.pos() + this.step());
        }, 3000);
    }
}

// ---------------------------------------------------------------------------
// Featured projects: category filters, flip cards and the amount picker
// (featured() + click handlers of experience.js, flips.js). "Donate now"
// opens the Direct Donation page with the chosen amount.
// ---------------------------------------------------------------------------

export class HomeFeatured extends Interaction {
    static selector = ".s_hm_featured";

    start() {
        snapshot(this, this.el);
        this.cards = [...this.el.querySelectorAll(".flip-card")];
        this.lastScroll = 0;
        this.cards.forEach((card) => this.setFlipped(card, false));

        // filters
        const filters = [...this.el.querySelectorAll("[data-project-filter]")];
        filters.forEach((b) => this.addListener(b, "click", () => {
            const f = b.dataset.projectFilter;
            filters.forEach((x) => {
                x.classList.toggle("selected", x === b);
                x.setAttribute("aria-pressed", String(x === b));
            });
            this.cards.forEach((c) => (c.hidden = f !== "all" && c.dataset.category !== f));
            this.el.dispatchEvent(new CustomEvent("hm-content"));
        }));

        // amount slider + presets
        this.el.querySelectorAll(".amount-range").forEach((input) => this.syncSlider(input));
        this.addListener(this.el, "input", (ev) => ev.target.matches(".amount-range") && this.syncSlider(ev.target));
        this.addListener(this.el.querySelectorAll("[data-preset]"), "click", (ev) => {
            const b = ev.currentTarget;
            const input = b.closest(".flip-card").querySelector(".amount-range");
            input.value = b.dataset.preset;
            this.syncSlider(input);
        });
        this.addListener(this.el.querySelectorAll("a[data-donate]"), "click", (ev) => {
            const a = ev.currentTarget;
            const input = a.closest(".flip-card").querySelector(".amount-range");
            if (!input || !input.reportValidity() || Number(input.value) < 1) {
                ev.preventDefault();
                input?.focus();
                return;
            }
            const url = new URL(a.getAttribute("href") || "/directdonation", window.location.href);
            url.searchParams.set("amount", input.value);
            ev.preventDefault();
            window.location.href = url.toString();
        });

        // flipping: hover with a real mouse move, tap / keyboard on the trigger
        this.addListener(window, "scroll", () => (this.lastScroll = performance.now()), { passive: true });
        this.addListener(this.el, "pointerover", (ev) => {
            const card = ev.target.closest(".flip-card");
            if (!card || ev.pointerType !== "mouse" || card.contains(ev.relatedTarget) || this.scrolledRecently()) {
                return;
            }
            if (!card.classList.contains("suppress-hover")) {
                this.setFlipped(card, true);
            }
        });
        this.addListener(this.el, "pointermove", (ev) => {
            if (ev.pointerType !== "mouse" || this.scrolledRecently()) {
                return;
            }
            const card = ev.target.closest(".flip-card");
            if (card && !card.classList.contains("flipped") && !card.classList.contains("suppress-hover")) {
                this.setFlipped(card, true);
            }
        }, { passive: true });
        this.addListener(this.el, "pointerout", (ev) => {
            const card = ev.target.closest(".flip-card");
            if (!card || ev.pointerType !== "mouse" || card.contains(ev.relatedTarget)) {
                return;
            }
            if (card.dataset.autoFlip && this.scrolledRecently()) {
                return;
            }
            delete card.dataset.autoFlip;
            card.classList.remove("suppress-hover");
            if (!card.contains(document.activeElement)) {
                this.setFlipped(card, false);
            }
        });
        this.addListener(this.el, "click", (ev) => {
            const trigger = ev.target.closest(".flip-trigger");
            if (trigger) {
                const card = trigger.closest(".flip-card");
                card.classList.remove("suppress-hover");
                this.setFlipped(card, true, true);
            }
            const close = ev.target.closest(".flip-close");
            if (close) {
                const card = close.closest(".flip-card");
                this.setFlipped(card, false, true);
                card.classList.add("suppress-hover");
            }
        });
        this.addListener(this.el, "keydown", (ev) => {
            const card = ev.target.closest(".flip-card");
            if (ev.key === "Escape" && card?.classList.contains("flipped")) {
                this.setFlipped(card, false, true);
                card.classList.add("suppress-hover");
            }
        });
        this.addListener(this.el, "focusout", (ev) => {
            const card = ev.target.closest(".flip-card");
            if (card && !card.contains(ev.relatedTarget) && !card.matches(":hover")) {
                this.setFlipped(card, false);
            }
        });

        // scroll showcase: a row flips to its donation side (left to right) when it scrolls into view
        if (!reduceMotion()) {
            const timers = new Map();
            this.registerCleanup(() => timers.forEach((t) => clearTimeout(t)));
            const column = (card) => {
                const cols = getComputedStyle(card.parentElement).gridTemplateColumns.split(" ").length || 1;
                return [...card.parentElement.children].filter((c) => !c.hidden).indexOf(card) % cols;
            };
            observe(this, this.cards, (entries) => {
                for (const e of entries) {
                    const card = e.target;
                    clearTimeout(timers.get(card));
                    if (e.intersectionRatio >= 0.6) {
                        if (!card.classList.contains("flipped") && !card.classList.contains("suppress-hover")) {
                            timers.set(card, setTimeout(() => {
                                if (!this.isDestroyed) {
                                    this.setFlipped(card, true);
                                    card.dataset.autoFlip = "1";
                                }
                            }, 250 + column(card) * 180));
                        }
                    } else if (!e.isIntersecting && card.dataset.autoFlip) {
                        delete card.dataset.autoFlip;
                        card.classList.remove("suppress-hover");
                        if (!card.contains(document.activeElement)) {
                            this.setFlipped(card, false);
                        }
                    }
                }
            }, { threshold: [0, 0.6] });
        }
    }

    scrolledRecently() {
        return performance.now() - this.lastScroll < 200;
    }

    setFlipped(card, on, moveFocus = false) {
        const front = card.querySelector(".flip-front");
        const back = card.querySelector(".flip-back");
        if (!front || !back) {
            return;
        }
        const [show, hide] = on ? [back, front] : [front, back];
        show.inert = false;
        show.setAttribute("aria-hidden", "false");
        hide.inert = true;
        hide.setAttribute("aria-hidden", "true");
        if (moveFocus) {
            show.querySelector(on ? ".flip-close" : ".flip-trigger")?.focus({ preventScroll: true });
        }
        card.classList.toggle("flipped", on);
        card.querySelector(".flip-trigger")?.setAttribute("aria-expanded", String(on));
    }

    syncSlider(input) {
        const pct = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
        input.style.setProperty("--fill", pct + "%");
        const card = input.closest(".flip-card");
        const value = card.querySelector(".amount-value");
        if (value) {
            value.textContent = Number(input.value).toLocaleString();
        }
        card.querySelectorAll("[data-preset]").forEach((b) => {
            const on = b.dataset.preset === input.value;
            b.classList.toggle("selected", on);
            b.setAttribute("aria-pressed", String(on));
        });
    }
}

// ---------------------------------------------------------------------------
// Ways to give: staggered entrance + cursor glow / tilt (giving-method-motion.js, method-hover.js)
// ---------------------------------------------------------------------------

export class HomeWays extends Interaction {
    static selector = ".s_hm_ways";

    start() {
        snapshot(this, this.el);
        const groups = [...this.el.querySelectorAll(".donation-methods")];
        if (reduceMotion() || !("IntersectionObserver" in window)) {
            groups.forEach((g) => g.classList.add("is-visible"));
            return;
        }
        groups.forEach((g) => g.classList.add("motion-ready"));
        const io = observe(this, groups, (entries) => {
            for (const e of entries) {
                if (e.isIntersecting) {
                    e.target.classList.add("is-visible");
                    io.unobserve(e.target);
                }
            }
        }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

        if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
            return;
        }
        for (const m of this.el.querySelectorAll(".method")) {
            const glow = document.createElement("span");
            glow.className = "method-glow";
            glow.setAttribute("aria-hidden", "true");
            m.prepend(glow);
            this.registerCleanup(() => glow.remove());
        }
        this.addListener(this.el, "pointermove", (ev) => {
            const m = ev.target.closest(".method");
            if (!m) {
                return;
            }
            const r = m.getBoundingClientRect();
            const x = ev.clientX - r.left;
            const y = ev.clientY - r.top;
            m.style.setProperty("--mx", x + "px");
            m.style.setProperty("--my", y + "px");
            m.style.setProperty("--ry", ((x / r.width - 0.5) * 7).toFixed(2) + "deg");
            m.style.setProperty("--rx", ((0.5 - y / r.height) * 5).toFixed(2) + "deg");
            m.classList.remove("is-leaving");
        });
        this.addListener(this.el, "pointerout", (ev) => {
            const m = ev.target.closest(".method");
            if (!m || m.contains(ev.relatedTarget)) {
                return;
            }
            m.classList.add("is-leaving");
            m.style.setProperty("--rx", "0deg");
            m.style.setProperty("--ry", "0deg");
        });
    }
}

// ---------------------------------------------------------------------------
// Projects with a personal story: tabs (renderLatest() of experience.js)
// ---------------------------------------------------------------------------

export class HomeLatest extends Interaction {
    static selector = ".s_hm_latest";

    start() {
        snapshot(this, this.el);
        this.tabs = [...this.el.querySelectorAll("[data-latest]")];
        this.panels = [...this.el.querySelectorAll("[data-latest-panel]")];
        this.grid = this.el.querySelector(".recent-grid");
        this.tabs.forEach((b) => this.addListener(b, "click", () => this.show(b.dataset.latest, true)));
        const first = this.tabs.find((b) => b.classList.contains("selected")) || this.tabs[0];
        if (first) {
            this.show(first.dataset.latest, false);
        }
    }

    show(tab, animate) {
        this.tabs.forEach((b) => {
            b.classList.toggle("selected", b.dataset.latest === tab);
            b.setAttribute("aria-pressed", String(b.dataset.latest === tab));
        });
        this.panels.forEach((p) => (p.hidden = p.dataset.latestPanel !== tab));
        if (animate && this.grid) {
            this.grid.classList.remove("projects-enter");
            void this.grid.offsetWidth;
            this.grid.classList.add("projects-enter");
            this.el.dispatchEvent(new CustomEvent("hm-content"));
        }
    }
}

// ---------------------------------------------------------------------------
// Leadership: heading entrance, tap-to-flip cards on touch screens (leadership-motion.js)
// ---------------------------------------------------------------------------

export class HomeLeadership extends Interaction {
    static selector = ".s_hm_leadership";

    start() {
        snapshot(this, this.el);
        const io = observe(this, [this.el], (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                this.el.classList.add("is-visible");
                io.unobserve(this.el);
            }
        }, { threshold: 0.12 });
        if (!io) {
            this.el.classList.add("is-visible");
        }
        this.addListener(this.el.querySelectorAll(".lflip"), "click", (ev) => {
            if (ev.target.closest("a") || window.matchMedia("(hover:hover)").matches) {
                return;
            }
            ev.currentTarget.classList.toggle("is-flipped");
        });
    }
}

// ---------------------------------------------------------------------------
// Media centre: archive year rail (gallery-timeline.js)
// ---------------------------------------------------------------------------

export class HomeMedia extends Interaction {
    static selector = ".s_hm_media";

    start() {
        snapshot(this, this.el);
        this.buttons = [...this.el.querySelectorAll("[data-year-index]")];
        this.cards = [...this.el.querySelectorAll(".timeline-card[data-year]")];
        this.list = this.el.querySelector(".timeline-cards");
        this.readout = this.el.querySelector(".timeline-year-readout strong");
        if (!this.buttons.length) {
            return;
        }
        this.buttons.forEach((b, i) => this.addListener(b, "click", () => this.render(i, true)));
        const next = this.el.querySelector(".year-next");
        if (next) {
            next.setAttribute("aria-label", _t("Next year"));
            this.addListener(next, "click", () => this.render(this.selected + 1, true));
        }
        this.el.querySelector(".year-rail")?.setAttribute("aria-label", _t("Choose an archive year"));
        this.render(0, false);
    }

    render(index, animate) {
        this.selected = (index + this.buttons.length) % this.buttons.length;
        const year = this.buttons[this.selected].textContent.trim();
        if (this.readout) {
            this.readout.textContent = year;
        }
        const span = Math.max(1, this.buttons.length - 1);
        this.el.style.setProperty("--year-progress", `${(this.selected / span) * 100}%`);
        this.buttons.forEach((b, i) => {
            b.setAttribute("aria-pressed", String(i === this.selected));
            b.classList.toggle("is-active", i === this.selected);
        });
        this.cards.forEach((c) => (c.hidden = c.dataset.year !== year));
        if (this.list) {
            this.list.classList.remove("is-entering");
            this.waitForAnimationFrame(() => this.list.classList.add("is-entering"));
        }
        if (animate) {
            this.el.dispatchEvent(new CustomEvent("hm-content"));
        }
    }
}

// ---------------------------------------------------------------------------
// Community: photo fades in once loaded, zoom follows the cursor (leadership-motion.js)
// ---------------------------------------------------------------------------

export class HomeCommunity extends Interaction {
    static selector = ".s_hm_community";

    start() {
        snapshot(this, this.el);
        for (const img of this.el.querySelectorAll(".cm-img img")) {
            if (img.complete) {
                img.classList.add("is-in");
            } else {
                this.addListener(img, "load", () => img.classList.add("is-in"));
                this.addListener(img, "error", () => img.classList.add("is-in"));
            }
        }
        const photo = this.el.querySelector(".cm-img");
        if (!photo) {
            return;
        }
        this.addListener(photo, "mousemove", (ev) => {
            const r = photo.getBoundingClientRect();
            photo.style.setProperty("--mx", (((ev.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
            photo.style.setProperty("--my", (((ev.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
        });
        this.addListener(photo, "mouseleave", () => {
            photo.style.removeProperty("--mx");
            photo.style.removeProperty("--my");
        });
    }
}

// ---------------------------------------------------------------------------
// Partners: endless logo marquee (inline script of index.html)
// ---------------------------------------------------------------------------

export class HomePartners extends Interaction {
    static selector = ".s_hm_partners";

    start() {
        snapshot(this, this.el);
        for (const track of this.el.querySelectorAll("[data-marquee]")) {
            const items = [...track.children];
            if (!items.length) {
                continue;
            }
            const clones = [];
            const add = (item, hidden) => {
                const c = item.cloneNode(true);
                if (hidden) {
                    c.setAttribute("aria-hidden", "true");
                }
                track.appendChild(c);
                clones.push(c);
            };
            let rounds = 0;
            while (track.scrollWidth < window.innerWidth * 1.2 && rounds++ < 6) {
                items.forEach((i) => add(i, false));
            }
            [...track.children].forEach((i) => add(i, true));
            this.registerCleanup(() => clones.forEach((c) => c.remove()));
        }
    }
}

// ---------------------------------------------------------------------------
// Page widgets shown with the home snippets: section rail on the right,
// quick actions on the left, back-to-top button (section-rail.js,
// quick-actions.js, back-to-top.js). Built at runtime, never saved.
// ---------------------------------------------------------------------------

const svg = (paths, width = "1.6") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const RAIL_STOPS = [
    [".s_hm_hero", () => _t("Home"), '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>'],
    [".s_hm_categories", () => _t("Our Projects"), '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'],
    [".s_hm_featured", () => _t("Featured Projects"), '<path d="m6 4.5.9 1.8 2 .3-1.45 1.4.35 2L6 9.05l-1.8.95.35-2L3.1 6.6l2-.3z"/><path d="m6 13.5.9 1.8 2 .3-1.45 1.4.35 2L6 18.05l-1.8.95.35-2L3.1 15.6l2-.3z"/><path d="M12 6h9M12 9h6M12 15h9M12 18h6"/>'],
    [".s_hm_ways", () => _t("Donate & Other"), '<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 15 6 6"/><path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z"/>'],
    [".s_hm_media", () => _t("Media"), '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'],
    [".s_hm_partners", () => _t("Partners"), '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>'],
];

export class HomeWidgets extends Interaction {
    static selector = "#wrapwrap";
    static selectorHas = ".hm-sec";

    start() {
        this.footer = document.querySelector("footer#bottom, footer");
        this.buildRail();
        this.buildQuickActions();
        this.buildBackToTop();
        this.addListener(window, "scroll", this.onScroll, { passive: true });
        this.addListener(window, "resize", this.onScroll);
        this.onScroll();
    }

    mount(el) {
        document.body.appendChild(el);
        this.registerCleanup(() => el.remove());
    }

    footerWithin(ratio) {
        return !!this.footer && this.footer.getBoundingClientRect().top < window.innerHeight * ratio;
    }

    buildRail() {
        this.stops = RAIL_STOPS.map(([sel, label, icon]) => ({ el: this.el.querySelector(sel), label: label(), icon })).filter((s) => s.el);
        if (this.stops.length < 2) {
            return;
        }
        const nav = document.createElement("nav");
        nav.className = "hm-rail";
        nav.setAttribute("aria-label", _t("Page sections"));
        nav.innerHTML = '<span class="hm-rail-thumb" aria-hidden="true"></span>' +
            this.stops.map((s, i) => `<a href="#" class="hm-rail-dot" data-i="${i}">${svg(s.icon)}<span class="hm-rail-tag"></span></a>`).join("");
        this.railLinks = [...nav.querySelectorAll(".hm-rail-dot")];
        this.railThumb = nav.querySelector(".hm-rail-thumb");
        this.railLinks.forEach((a, i) => {
            a.querySelector(".hm-rail-tag").textContent = this.stops[i].label;
            a.setAttribute("aria-label", this.stops[i].label);
            this.addListener(a, "click", (ev) => {
                ev.preventDefault();
                const header = document.querySelector("header#top");
                const offset = header ? header.getBoundingClientRect().height : 0;
                const y = i === 0 ? 0 : this.stops[i].el.getBoundingClientRect().top + window.scrollY - offset - 12;
                window.scrollTo({ top: y, behavior: "smooth" });
            });
        });
        this.rail = nav;
        this.railCurrent = -1;
        this.mount(nav);
    }

    buildQuickActions() {
        const box = document.createElement("div");
        box.className = "hm-qa";
        const other = document.querySelector("#top .ha-lang .ha-l:not(.on)");
        if (other) {
            const lang = document.createElement("a");
            lang.className = "hm-qa-btn hm-qa-lang";
            lang.href = other.getAttribute("href");
            const label = isArabic() ? "English" : "العربية";
            lang.setAttribute("aria-label", label);
            lang.innerHTML = svg('<path d="M4 5h8M8 3v2M5.5 5c.8 3.2 3.2 5.6 6 6.5M10.5 5c-.7 2.9-2.9 5.6-6 7"/><path d="M13 20l3.5-8 3.5 8M14.2 17.3h4.6"/>', "1.7") + '<span class="hm-qa-tip"></span>';
            lang.querySelector(".hm-qa-tip").textContent = label;
            box.appendChild(lang);
        }
        const donate = document.createElement("a");
        donate.className = "hm-qa-donate";
        donate.href = "/directdonation";
        donate.innerHTML = svg('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>', "1.7") + "<b></b>";
        donate.querySelector("b").textContent = _t("Donate");
        box.appendChild(donate);
        const calc = document.createElement("a");
        calc.className = "hm-qa-btn hm-qa-calc";
        calc.href = "/zakat";
        calc.setAttribute("aria-label", _t("Zakat calculator"));
        calc.innerHTML = svg('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>', "1.7") + '<span class="hm-qa-tip"></span>';
        calc.querySelector(".hm-qa-tip").textContent = _t("Zakat calculator");
        box.appendChild(calc);
        this.qa = box;
        this.mount(box);
    }

    buildBackToTop() {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hm-btt";
        b.setAttribute("aria-label", _t("Back to top"));
        b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
        this.addListener(b, "click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        this.btt = b;
        this.mount(b);
    }

    onScroll() {
        this.btt.classList.toggle("on", window.scrollY > 400);
        this.qa.classList.toggle("away", this.footerWithin(0.6));
        if (!this.rail) {
            return;
        }
        // active = last section whose top has passed 40% of the viewport
        const line = window.innerHeight * 0.4;
        let k = 0;
        this.stops.forEach((s, i) => {
            if (s.el.getBoundingClientRect().top <= line) {
                k = i;
            }
        });
        if (k !== this.railCurrent) {
            this.railCurrent = k;
            this.railLinks.forEach((a, i) => {
                a.classList.toggle("on", i === k);
                i === k ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
            });
        }
        this.railThumb.style.transform = `translateY(${this.railLinks[k].offsetTop}px)`;
        // step aside once the footer is reached so it never sits over it
        this.rail.classList.toggle("away", this.footerWithin(0.75));
    }
}

const interactions = registry.category("public.interactions");
interactions.add("alihsanwebsite_theme.home_section", HomeSection);
interactions.add("alihsanwebsite_theme.home_hero", HomeHero);
interactions.add("alihsanwebsite_theme.home_categories", HomeCategories);
interactions.add("alihsanwebsite_theme.home_featured", HomeFeatured);
interactions.add("alihsanwebsite_theme.home_ways", HomeWays);
interactions.add("alihsanwebsite_theme.home_latest", HomeLatest);
interactions.add("alihsanwebsite_theme.home_leadership", HomeLeadership);
interactions.add("alihsanwebsite_theme.home_media", HomeMedia);
interactions.add("alihsanwebsite_theme.home_community", HomeCommunity);
interactions.add("alihsanwebsite_theme.home_partners", HomePartners);
interactions.add("alihsanwebsite_theme.home_widgets", HomeWidgets);
