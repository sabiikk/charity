import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { Interaction } from "@web/public/interaction";

const PER_PAGE = 6;

/**
 * Personalised Projects wizard (port of personalisedprojects.js):
 * 1. choose country + category, 2. pick an existing project (filters + pager),
 * 3. name it and accept the terms, 4. share the link and donate.
 * Nothing is sent to the server: like the static site, the wizard only builds
 * a share link and sends the donor to data-pay-url with ?amount=.
 * Public interactions are not started in the website editor (all steps are
 * shown there), and every change made here is undone in cleanups, so no
 * runtime state is ever saved.
 */
export class PersonalisedWizard extends Interaction {
    static selector = ".pp-sec";
    static selectorHas = ".pp-wizard";
    dynamicContent = {
        ".pp-st": { "t-on-click": this.onStepClick },
        "[data-back]": { "t-on-click": (ev) => this.go(+ev.currentTarget.dataset.back) },
        ".pp-go": { "t-on-click": this.onShowProjects },
        ".pp-f-co, .pp-f-cat": { "t-on-change": this.onFilterChange },
        ".pp-pager": { "t-on-click": this.onPagerClick },
        ".pp-sel": { "t-on-click": this.onSelectProject },
        ".pp-agree-link": { "t-on-click.prevent": this.onAgreeLink },
        ".pp-to4": { "t-on-click": this.onStartProject },
        ".pp-name, .pp-name-ar": { "t-on-input": (ev) => ev.currentTarget.value.trim() && this.hideError() },
        ".pp-agree-in": { "t-on-change": (ev) => ev.currentTarget.checked && this.hideError() },
        ".pp-copy": { "t-on-click": this.onCopy },
        ".pp-amt": { "t-on-input": this.updateDonateLink },
    };

    setup() {
        this.q = (s) => this.el.querySelector(s);
        this.qa = (s) => [...this.el.querySelectorAll(s)];
        this.cards = this.qa(".pp-card");
        this.payUrl = this.el.dataset.payUrl || "/donation/pay";
        this.step = 1;
        this.page = 1;
        this.selected = null;
    }

    start() {
        this.snapshot();
        this.addMissingOptions();
        // arriving from another page with ?cat=&country=: apply them to the filters
        const params = new URLSearchParams(window.location.search);
        for (const [key, selectors] of [["cat", [".pp-cat", ".pp-f-cat"]], ["country", [".pp-country", ".pp-f-co"]]]) {
            const value = params.get(key);
            for (const sel of selectors) {
                const select = this.q(sel);
                if (value && select && [...select.options].some((o) => o.value === value)) {
                    select.value = value;
                }
            }
        }
        this.el.dataset.ppStep = "1";
        this.renderCards();
        this.go(2, params.has("cat") || params.has("country"));
    }

    /** Remember everything the wizard changes so cleanup can put it back. */
    snapshot() {
        const steps = this.qa(".pp-st").map((el) => [el, el.className]);
        const texts = this.qa(".pp-count, .pp-d-title, .pp-d-cat, .pp-d-co, .pp-d-amt, .pp-d-desc, .pp-fname, .pp-fmeta, .pp-err").map((el) => [el, el.textContent]);
        const inputs = this.qa("input, select").map((el) => [el, el.value, el.checked]);
        const attrs = this.qa(".pp-d-img, .pp-don, .pp-wa, .pp-x, .pp-fb").map((el) => [el, el.getAttribute("src"), el.getAttribute("href")]);
        this.addedOptions = [];
        this.registerCleanup(() => {
            delete this.el.dataset.ppStep;
            this.qa(".pp-head, .pp-pane").forEach((el) => el.classList.remove("on"));
            steps.forEach(([el, cls]) => (el.className = cls));
            texts.forEach(([el, t]) => (el.textContent = t));
            this.addedOptions.forEach((o) => o.remove());
            inputs.forEach(([el, v, c]) => {
                el.value = v;
                el.checked = c;
                el.removeAttribute("aria-invalid");
            });
            attrs.forEach(([el, src, href]) => {
                src !== null && el.setAttribute("src", src);
                href !== null && el.setAttribute("href", href);
            });
            this.cards.forEach((c) => c.classList.remove("d-none"));
            this.q(".pp-empty")?.classList.add("d-none");
            this.q(".pp-err")?.classList.add("d-none");
            this.q(".pp-pager")?.replaceChildren();
            const terms = this.q(".pp-terms-box");
            if (terms) {
                terms.open = false;
            }
        });
    }

    /** Cards added in the editor with a new country / category also get a filter option. */
    addMissingOptions() {
        const fill = (selectors, attr) => {
            const values = [...new Set(this.cards.map((c) => c.dataset[attr]).filter(Boolean))];
            for (const sel of selectors) {
                const select = this.q(sel);
                if (!select) {
                    continue;
                }
                for (const value of values) {
                    if (![...select.options].some((o) => o.value === value)) {
                        const option = new Option(value, value);
                        select.add(option);
                        this.addedOptions.push(option);
                    }
                }
            }
        };
        fill([".pp-country", ".pp-f-co"], "country");
        fill([".pp-cat", ".pp-f-cat"], "cat");
    }

    go(step, scroll = true) {
        this.step = step;
        this.el.dataset.ppStep = String(step);
        this.qa(".pp-head").forEach((el) => el.classList.toggle("on", +el.dataset.s === step));
        this.qa(".pp-pane").forEach((el) => el.classList.toggle("on", +el.dataset.pane === step));
        this.qa(".pp-st").forEach((el) => {
            const s = +el.dataset.s;
            el.classList.toggle("on", s === step);
            el.classList.toggle("done", s < step);
        });
        if (scroll) {
            this.q(".pp-wizard")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    onStepClick(ev) {
        const li = ev.currentTarget;
        if (li.classList.contains("done")) {
            this.go(+li.dataset.s);
        }
    }

    /* ---------- step 1 -> 2 ---------- */

    onShowProjects() {
        this.q(".pp-f-co").value = this.q(".pp-country").value;
        this.q(".pp-f-cat").value = this.q(".pp-cat").value;
        this.page = 1;
        this.renderCards();
        this.go(2);
    }

    onFilterChange() {
        this.page = 1;
        this.renderCards();
    }

    renderCards() {
        const co = this.q(".pp-f-co")?.value || "all";
        const ca = this.q(".pp-f-cat")?.value || "all";
        const match = this.cards.filter(
            (c) => (co === "all" || c.dataset.country === co) && (ca === "all" || c.dataset.cat === ca)
        );
        const pages = Math.max(1, Math.ceil(match.length / PER_PAGE));
        this.page = Math.min(this.page, pages);
        const shown = match.slice((this.page - 1) * PER_PAGE, this.page * PER_PAGE);
        this.cards.forEach((c) => c.classList.toggle("d-none", !shown.includes(c)));
        this.q(".pp-empty")?.classList.toggle("d-none", match.length > 0);
        const count = this.q(".pp-count");
        if (count) {
            count.textContent = _t("%s results found", match.length);
        }
        this.renderPager(pages);
    }

    renderPager(pages) {
        const pager = this.q(".pp-pager");
        if (!pager) {
            return;
        }
        pager.replaceChildren();
        if (pages < 2) {
            return;
        }
        const rtl = getComputedStyle(this.el).direction === "rtl";
        const button = (p, label, { on = false, disabled = false, aria } = {}) => {
            const b = document.createElement("button");
            b.type = "button";
            b.dataset.p = p;
            b.textContent = label;
            b.disabled = disabled;
            b.classList.toggle("on", on);
            if (aria) {
                b.setAttribute("aria-label", aria);
            }
            pager.append(b);
        };
        button("prev", rtl ? "›" : "‹", { disabled: this.page === 1, aria: _t("Previous") });
        for (let i = 1; i <= pages; i++) {
            button(String(i), String(i), { on: i === this.page });
        }
        button("next", rtl ? "‹" : "›", { disabled: this.page === pages, aria: _t("Next") });
    }

    onPagerClick(ev) {
        const b = ev.target.closest("button");
        if (!b || b.disabled) {
            return;
        }
        const p = b.dataset.p;
        this.page = p === "prev" ? this.page - 1 : p === "next" ? this.page + 1 : +p;
        this.renderCards();
        this.q(".pp-wizard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* ---------- step 2 -> 3 ---------- */

    onSelectProject(ev) {
        this.selected = ev.currentTarget.closest(".pp-card");
        this.fillDetail();
        this.go(3);
    }

    fillDetail() {
        const card = this.selected;
        if (!card) {
            return;
        }
        const title = card.querySelector("h3")?.textContent.trim() || "";
        const facts = [...card.querySelectorAll("li b")].map((b) => b.textContent.trim());
        const amount = (title.match(/(\d[\d,]*)\s*$/) || [])[1];
        const img = this.q(".pp-d-img");
        img.setAttribute("src", card.querySelector("img")?.getAttribute("src") || "");
        img.setAttribute("alt", title);
        this.q(".pp-d-title").textContent = title;
        this.q(".pp-d-cat").textContent = facts[0] || "";
        this.q(".pp-d-co").textContent = facts[1] || "";
        this.q(".pp-d-amt").textContent = amount ? `${amount} ${_t("AED")}` : "—";
        this.q(".pp-d-desc").textContent = card.querySelector(".pp-desc")?.textContent.trim() || "";
    }

    onAgreeLink() {
        const terms = this.q(".pp-terms-box");
        terms.open = true;
        terms.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    /* ---------- step 3 -> 4 ---------- */

    showError(message, el) {
        const err = this.q(".pp-err");
        err.textContent = message;
        err.classList.remove("d-none");
        if (el) {
            el.setAttribute("aria-invalid", "true");
            el.focus();
        }
    }

    hideError() {
        this.q(".pp-err").classList.add("d-none");
    }

    onStartProject() {
        const nameEl = this.q(".pp-name");
        const nameArEl = this.q(".pp-name-ar");
        const agree = this.q(".pp-agree-in");
        const en = nameEl.value.trim();
        const ar = nameArEl.value.trim();
        const isArabic = (document.documentElement.lang || "").startsWith("ar");
        const name = isArabic ? ar || en : en || ar;
        [nameEl, nameArEl, agree].forEach((el) => el.setAttribute("aria-invalid", "false"));
        if (!name) {
            return this.showError(_t("Please enter a name for your project (in English or Arabic)."), nameEl);
        }
        if (!agree.checked) {
            return this.showError(_t("Please accept the Terms & Conditions."), agree);
        }
        this.hideError();
        const url = `${window.location.origin}${window.location.pathname}?project=${encodeURIComponent(name)}`;
        this.q(".pp-fname").textContent = name;
        this.q(".pp-fmeta").textContent = [...this.selected.querySelectorAll("li b")].map((b) => b.textContent.trim()).join(" · ");
        this.q(".pp-url").value = url;
        const text = encodeURIComponent(`${_t("Support my project:")} ${name} ${url}`);
        this.q(".pp-wa").setAttribute("href", `https://wa.me/?text=${text}`);
        this.q(".pp-x").setAttribute("href", `https://twitter.com/intent/tweet?text=${text}`);
        this.q(".pp-fb").setAttribute("href", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        this.updateDonateLink();
        this.go(4);
    }

    /* ---------- step 4 ---------- */

    updateDonateLink() {
        const input = this.q(".pp-amt");
        const min = parseFloat(input?.min) || 10;
        const amount = Math.max(min, parseFloat(input?.value) || 0);
        const sep = this.payUrl.includes("?") ? "&" : "?";
        this.q(".pp-don")?.setAttribute("href", `${this.payUrl}${sep}amount=${amount}`);
    }

    async onCopy(ev) {
        const label = ev.currentTarget.querySelector("span");
        const input = this.q(".pp-url");
        try {
            await this.waitFor(navigator.clipboard.writeText(input.value));
        } catch {
            input.select();
            document.execCommand("copy");
        }
        const original = label.textContent;
        label.textContent = _t("Copied ✓");
        this.waitForTimeout(() => (label.textContent = original), 1600);
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.personalised_wizard", PersonalisedWizard);
