import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { Interaction } from "@web/public/interaction";

/**
 * Direct Donation snippets (port of donations.js). One interaction per panel:
 * tabs (banner), direct donation wizard, bank IBAN copy, site representative
 * search + map, delegate form, gift builder and subscriptions.
 *
 * Like the static site, nothing is sent to the server: the forms validate,
 * show their message and the payment buttons go to the section's
 * data-pay-url (Odoo /donation/pay) with ?amount=.
 *
 * Public interactions are not started in the website editor, and every
 * interaction restores the DOM it touched in a cleanup (see snapshot), so no
 * runtime state is ever saved into the page.
 */

const MAX = 50000;
const fmt = (v) => Number(v).toLocaleString("en-US");
const digits = (v) => String(v).replace(/\D/g, "");
const isArabic = () => (document.documentElement.lang || "").startsWith("ar");

/**
 * Remember the state of every element under `root` (classes, hidden, style,
 * form values, src/href, disabled, the text of leaf elements) and restore it
 * when the interaction is destroyed.
 */
function snapshot(interaction, root) {
    const els = [root, ...root.querySelectorAll("*")];
    const state = els.map((el) => ({
        el,
        className: el.getAttribute("class"),
        hidden: el.hidden,
        style: el.getAttribute("style"),
        value: "value" in el ? el.value : undefined,
        checked: "checked" in el ? el.checked : undefined,
        disabled: "disabled" in el ? el.disabled : undefined,
        open: el.tagName === "DETAILS" ? el.open : undefined,
        src: el.getAttribute("src"),
        href: el.getAttribute("href"),
        title: el.getAttribute("title"),
        text: el.childElementCount === 0 && el.tagName !== "svg" ? el.textContent : undefined,
    }));
    interaction.registerCleanup(() => {
        for (const s of state) {
            const { el } = s;
            const set = (attr, v) => (v === null ? el.removeAttribute(attr) : el.setAttribute(attr, v));
            set("class", s.className);
            set("style", s.style);
            el.hidden = s.hidden;
            if (s.value !== undefined) {
                el.value = s.value;
            }
            if (s.checked !== undefined) {
                el.checked = s.checked;
            }
            if (s.disabled !== undefined) {
                el.disabled = s.disabled;
            }
            if (s.open !== undefined) {
                el.open = s.open;
            }
            for (const attr of ["src", "href", "title"]) {
                if (el.getAttribute(attr) !== s[attr]) {
                    set(attr, s[attr]);
                }
            }
            if (s.text !== undefined && el.textContent !== s.text) {
                el.textContent = s.text;
            }
        }
    });
}

function payUrl(sectionEl, amount) {
    const url = sectionEl.dataset.payUrl || "/donation/pay";
    return `${url}${url.includes("?") ? "&" : "?"}amount=${amount}`;
}

/** Range input fill (the CSS paints the track up to --p). */
function setRangeFill(range, v) {
    if (range) {
        range.style.setProperty("--p", ((Math.min(MAX, Math.max(10, v)) - 10) / (MAX - 10)) * 100 + "%");
    }
}

/* ======================================================================
   Tabs (ways-to-give bar): pills are links; a pill whose panel snippet is on
   this page switches to it in place, any other pill opens its link
   ====================================================================== */
const samePath = (a, b) => a.replace(/\/+$/, "") === b.replace(/\/+$/, "");

export class DnTabs extends Interaction {
    static selector = ".dn-sec";
    static selectorHas = ".dn-pill";
    dynamicContent = {
        ".dn-pill": { "t-on-click": this.onPillClick },
        ".pj-arrow.prev": { "t-on-click": () => this.scrollTabs(-1) },
        ".pj-arrow.next": { "t-on-click": () => this.scrollTabs(1) },
        ".pj-tabs": { "t-on-scroll": this.updateArrows },
        _window: { "t-on-resize": this.updateArrows },
    };

    start() {
        this.tabs = [...this.el.querySelectorAll(".dn-pill")];
        this.strip = this.el.querySelector(".pj-tabs");
        snapshot(this, this.el);
        const crumb = document.querySelector(".dn-bc b");
        if (crumb && !this.el.contains(crumb)) {
            const text = crumb.textContent;
            this.registerCleanup(() => (crumb.textContent = text));
        }
        const panels = [...document.querySelectorAll("section[data-dn-panel]")];
        this.registerCleanup(() => panels.forEach((p) => p.classList.remove("d-none")));

        const asked = new URLSearchParams(window.location.search).get("tab");
        const byKey = (k) => this.tabs.find((t) => t.dataset.tab === k);
        const byUrl = this.tabs.find((t) => {
            const href = t.getAttribute("href");
            return href && !href.startsWith("#") && samePath(new URL(href, window.location.href).pathname, window.location.pathname);
        });
        const withPanel = this.tabs.find((t) => this.hasPanel(t.dataset.tab));
        const first = (asked && byKey(asked)) || byUrl || withPanel || this.tabs.find((t) => t.classList.contains("selected"));
        if (first) {
            this.select(first.dataset.tab, false);
        }
        if (asked && first?.dataset.tab === asked) {
            this.waitForTimeout(() => this.el.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
        }
        this.updateArrows();
    }

    hasPanel(key) {
        return !!document.querySelector(`section[data-dn-panel="${key}"]`);
    }

    onPillClick(ev) {
        const key = ev.currentTarget.dataset.tab;
        if (this.hasPanel(key)) {
            ev.preventDefault();
            this.select(key, true);
        }
        // otherwise: a link pill opens its page (an old button pill does nothing)
    }

    select(key, animate) {
        const tab = this.tabs.find((t) => t.dataset.tab === key);
        if (!tab) {
            return;
        }
        for (const t of this.tabs) {
            t.classList.toggle("selected", t === tab);
            if (t === tab) {
                t.setAttribute("aria-current", "page");
            } else {
                t.removeAttribute("aria-current");
            }
        }
        // only switch panels when the selected way to give has one on this page
        if (this.hasPanel(key)) {
            for (const panel of document.querySelectorAll("section[data-dn-panel]")) {
                const on = panel.dataset.dnPanel === key;
                panel.classList.toggle("d-none", !on);
                const box = panel.querySelector(".dn-panel, .dn-other");
                if (on && animate && box) {
                    box.style.animation = "none";
                    void box.offsetWidth;
                    box.style.animation = "dnin .5s ease both";
                }
            }
        }
        const crumb = document.querySelector(".dn-bc b");
        const label = tab.querySelector("span:not(.ti)");
        if (crumb && label) {
            crumb.textContent = label.textContent;
        }
        // bring the selected pill to the middle of the strip (horizontally only)
        if (this.strip) {
            const left = tab.offsetLeft - (this.strip.clientWidth - tab.offsetWidth) / 2;
            this.strip.scrollTo({ left, behavior: animate ? "smooth" : "auto" });
        }
    }

    scrollTabs(dir) {
        const rtl = getComputedStyle(this.el).direction === "rtl";
        this.strip?.scrollBy({ left: (rtl ? -dir : dir) * 250 });
    }

    updateArrows() {
        if (!this.strip) {
            return;
        }
        const rtl = getComputedStyle(this.el).direction === "rtl";
        const max = this.strip.scrollWidth - this.strip.clientWidth;
        const x = Math.abs(this.strip.scrollLeft);
        const atStart = x < 4;
        const atEnd = x > max - 4;
        const prev = this.el.querySelector(".pj-arrow.prev");
        const next = this.el.querySelector(".pj-arrow.next");
        if (prev && next) {
            prev.disabled = rtl ? atEnd : atStart;
            next.disabled = rtl ? atStart : atEnd;
        }
    }
}

/* ======================================================================
   Direct donation: 2-step wizard + ticket
   ====================================================================== */
export class DnDirect extends Interaction {
    static selector = ".dn-sec";
    static selectorHas = "form.dw";
    dynamicContent = {
        "form.dw": { "t-on-submit.prevent": () => this.onNext() },
        ".dw-chip": { "t-on-click": (ev) => this.setAmount(ev.currentTarget.dataset.v) },
        ".dn-range": { "t-on-input": (ev) => this.setAmount(ev.currentTarget.value) },
        ".dn-amount": { "t-on-input": this.onAmountInput, "t-on-blur": () => !this.amount() && this.setAmount(1) },
        ".dw-proj input": { "t-on-change": () => this.refresh(true) },
        ".dw-next": { "t-on-click": this.onNext },
        ".dw-back": { "t-on-click": () => this.go(this.step - 1) },
        ".dw-mode button": { "t-on-click": (ev) => this.setMode(ev.currentTarget.dataset.mode) },
        ".dw-otpbtn": { "t-on-click": this.onGetOtp },
        "input[name=otp]": { "t-on-input": (ev) => (ev.currentTarget.value = digits(ev.currentTarget.value).slice(0, 6)) },
    };

    setup() {
        this.q = (s) => this.el.querySelector(s);
        this.qa = (s) => [...this.el.querySelectorAll(s)];
        this.form = this.q("form.dw");
        this.step = 1;
        this.mode = "guest";
        this.otpSent = false;
    }

    start() {
        snapshot(this, this.el);
        const asked = +new URLSearchParams(window.location.search).get("amount");
        if (asked > 0) {
            this.setAmount(asked);
        }
        setRangeFill(this.q(".dn-range"), this.amount());
        this.refresh();
    }

    amount() {
        return Math.max(0, Math.min(MAX, Math.round(+digits(this.q(".dn-amount").value)) || 0));
    }

    projectName() {
        return this.q(".dw-proj input:checked")?.closest(".dw-proj").querySelector(".dw-pname").textContent.trim() || "";
    }

    setAmount(v) {
        v = Math.max(1, Math.min(MAX, Math.round(+v) || 1));
        this.q(".dn-amount").value = fmt(v);
        this.syncAmount(v);
    }

    onAmountInput() {
        const input = this.q(".dn-amount");
        const raw = digits(input.value).slice(0, 5);
        input.value = raw ? fmt(Math.min(MAX, +raw)) : "";
        this.syncAmount(this.amount());
    }

    syncAmount(v) {
        this.qa(".dw-chip").forEach((c) => c.classList.toggle("on", +c.dataset.v === v));
        const range = this.q(".dn-range");
        if (range) {
            range.value = v;
            setRangeFill(range, v);
        }
        this.refresh();
    }

    /** Ticket, "For" box, mini summary and the Continue / Donate label. */
    refresh(clearError = false) {
        const name = this.projectName();
        const checked = this.q(".dw-proj input:checked");
        const set = (sel, text) => {
            const el = this.q(sel);
            if (el) {
                el.textContent = text;
            }
        };
        set(".tk-name", name || "—");
        set(".tk-freq", ""); // no frequency choice on this form (the static page blanks it too)
        set(".dw-oname-v", name || "—");
        set(".mini-proj", name || "—");
        set(".tk-amt", fmt(this.amount()));
        set(".mini-amt", fmt(this.amount()));
        if (checked) {
            const src = checked.closest(".dw-proj").querySelector("img")?.getAttribute("src");
            for (const sel of [".tk-img", ".dw-oimg-img"]) {
                const img = this.q(sel);
                if (img && src) {
                    img.setAttribute("src", src);
                    img.setAttribute("alt", name);
                }
            }
        }
        set(".dw-next-t", this.step === 2 ? `${_t("Donate now")} · ${fmt(this.amount())} ${_t("AED")}` : _t("Continue"));
        if (clearError) {
            this.q(".dn-err").hidden = true;
        }
    }

    loginMobile() {
        return (this.form.elements.lmobile?.value || "").replace(/[\s-]/g, "");
    }

    check(step) {
        const f = this.form.elements;
        if (step === 1) {
            if (!this.q(".dw-proj input:checked")) {
                return _t("Please select a project to donate for.");
            }
            if (this.amount() < 1) {
                return _t("Please enter an amount of at least 1 AED.");
            }
            return "";
        }
        this.qa(".dw-f").forEach((x) => x.classList.remove("bad"));
        if (this.mode === "login") {
            if (!/^05\d{8}$/.test(this.loginMobile())) {
                f.lmobile.closest(".dw-f").classList.add("bad");
                return _t("Please enter a valid UAE mobile number (05X XXX XXXX).");
            }
            if (!this.otpSent || f.otp.value.length < 4) {
                if (this.otpSent) {
                    this.q(".dw-otpf").classList.add("bad");
                }
                return _t("Please get an OTP and enter the code.");
            }
        } else {
            const bad = ["fullname", "mobile"].filter((k) => !f[k].value.trim());
            bad.forEach((k) => f[k].closest(".dw-f").classList.add("bad"));
            if (bad.length) {
                return _t("Please enter your full name and mobile number.");
            }
        }
        return this.q(".dn-terms-in").checked ? "" : _t("Please accept the Terms & Conditions.");
    }

    go(step) {
        this.step = step;
        this.qa(".dw-pane").forEach((p) => p.classList.toggle("on", +p.dataset.step === step));
        this.qa(".dw-prog li").forEach((li) => {
            const s = +li.dataset.s;
            li.classList.toggle("cur", s === step);
            li.classList.toggle("done", s < step);
        });
        this.q(".dw-back").hidden = step === 1;
        this.q(".dn-err").hidden = true;
        this.q(".dn-ok").hidden = true;
        this.refresh();
        const card = this.q(".dw-card");
        if (card.getBoundingClientRect().top < 0) {
            card.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    onNext() {
        const message = this.check(this.step);
        const err = this.q(".dn-err");
        err.hidden = !message;
        err.textContent = message;
        if (message) {
            return;
        }
        if (this.step < 2) {
            this.go(this.step + 1);
            return;
        }
        const ok = this.q(".dn-ok");
        ok.textContent = _t("Thank you! Your donation of %(amount)s AED to “%(project)s” is ready — you will be taken to secure payment.", {
            amount: fmt(this.amount()),
            project: this.projectName(),
        });
        ok.hidden = false;
        ok.scrollIntoView({ behavior: "smooth", block: "center" });
        this.waitForTimeout(() => (window.location.href = payUrl(this.el, this.amount())), 1800);
    }

    setMode(mode) {
        this.mode = mode;
        this.qa(".dw-mode button").forEach((b) => {
            const on = b.dataset.mode === mode;
            b.classList.toggle("on", on);
            b.setAttribute("aria-selected", String(on));
        });
        this.q(".dw-guest-pane").hidden = mode !== "guest";
        this.q(".dw-login-pane").hidden = mode !== "login";
        this.q(".dn-err").hidden = true;
        this.qa(".dw-f").forEach((x) => x.classList.remove("bad"));
    }

    onGetOtp() {
        const field = this.form.elements.lmobile.closest(".dw-f");
        const err = this.q(".dn-err");
        field.classList.remove("bad");
        if (!/^05\d{8}$/.test(this.loginMobile())) {
            field.classList.add("bad");
            err.textContent = _t("Please enter a valid UAE mobile number (05X XXX XXXX).");
            err.hidden = false;
            this.form.elements.lmobile.focus();
            return;
        }
        err.hidden = true;
        this.otpSent = true;
        this.q(".dw-otpf").hidden = false;
        const note = this.q(".dw-otpnote");
        note.textContent = _t("Design preview · no SMS was sent to %s. Enter any 4–6 digit code.", this.loginMobile());
        note.hidden = false;
        this.q(".dw-otp-t").textContent = _t("Resend OTP");
        this.form.elements.otp.value = "";
        this.form.elements.otp.focus();
    }
}

/* ======================================================================
   Bank: copy IBAN
   ====================================================================== */
export class DnBank extends Interaction {
    static selector = ".dn-sec";
    static selectorHas = ".bk-copy";
    dynamicContent = {
        ".bk-copy": { "t-on-click": this.onCopy },
    };

    start() {
        snapshot(this, this.el);
    }

    async onCopy(ev) {
        const button = ev.currentTarget;
        const value = button.dataset.copy;
        try {
            await this.waitFor(navigator.clipboard.writeText(value));
        } catch {
            const t = document.createElement("textarea");
            t.value = value;
            document.body.appendChild(t);
            t.select();
            document.execCommand("copy");
            t.remove();
        }
        const label = button.querySelector("span");
        const original = label.textContent;
        label.textContent = _t("Copied ✓");
        button.classList.add("done");
        this.waitForTimeout(() => {
            label.textContent = original;
            button.classList.remove("done");
        }, 1600);
    }
}

/* ======================================================================
   Site representative: keyword + emirate filter, map toggle
   ====================================================================== */
export class DnRepresentatives extends Interaction {
    static selector = ".dn-sec";
    static selectorHas = ".st-wrap";
    dynamicContent = {
        ".st-q": { "t-on-input": this.filter },
        ".st-em": { "t-on-change": this.filter },
        ".st-tg": { "t-on-change": (ev) => (this.el.querySelector(".st-mapbox").hidden = !ev.currentTarget.checked) },
    };

    start() {
        snapshot(this, this.el);
    }

    filter() {
        const text = this.el.querySelector(".st-q").value.trim().toLowerCase();
        const emirate = this.el.querySelector(".st-em").value;
        let n = 0;
        for (const card of this.el.querySelectorAll(".st-card")) {
            const ok =
                (emirate === "all" || card.dataset.em === emirate) &&
                (!text || (card.dataset.t || "").includes(text) || card.textContent.toLowerCase().includes(text));
            card.hidden = !ok;
            n += ok ? 1 : 0;
        }
        this.el.querySelector(".st-empty").hidden = n > 0;
        const all = [...this.el.querySelectorAll(".st-em option")].map((o) => o.value).filter((v) => v !== "all").join(", ");
        const frame = this.el.querySelector(".st-mapbox iframe");
        if (frame) {
            frame.setAttribute("src", `https://maps.google.com/maps?q=${encodeURIComponent(emirate === "all" ? all : emirate)}&output=embed`);
        }
    }
}

/* ======================================================================
   Request for a delegate
   ====================================================================== */
export class DnDelegate extends Interaction {
    static selector = ".dn-sec";
    static selectorHas = ".dg-form";
    dynamicContent = {
        ".dg-form": { "t-on-submit.prevent": this.onSubmit },
    };

    start() {
        snapshot(this, this.el);
        const date = this.el.querySelector(".dg-form [name=date]");
        if (date) {
            date.min = new Date().toISOString().slice(0, 10);
            this.registerCleanup(() => date.removeAttribute("min"));
        }
    }

    onSubmit() {
        const form = this.el.querySelector(".dg-form");
        const f = form.elements;
        const err = this.el.querySelector(".dg-err");
        const ok = this.el.querySelector(".dg-ok");
        ok.hidden = true;
        form.querySelectorAll(".dg-f").forEach((x) => x.classList.remove("bad"));
        const bad = ["first", "mobile", "location", "date", "time"].filter((k) => !String(f[k].value).trim());
        bad.forEach((k) => f[k].closest(".dg-f").classList.add("bad"));
        let message = "";
        if (bad.length) {
            message = _t("Please fill in the required fields.");
        } else if (!/^[+\d][\d\s-]{6,}$/.test(f.mobile.value.trim())) {
            f.mobile.closest(".dg-f").classList.add("bad");
            message = _t("Please enter a valid mobile number.");
        } else if (f.email.value && !f.email.checkValidity()) {
            f.email.closest(".dg-f").classList.add("bad");
            message = _t("Please enter a valid email.");
        } else if (!f.terms.checked) {
            message = _t("Please accept the Terms & Conditions.");
        }
        err.hidden = !message;
        err.textContent = message;
        if (message) {
            err.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        ok.textContent = _t("Thank you! Your request was received and we will contact you to confirm the slot.");
        ok.hidden = false;
        form.reset();
        ok.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

/* ======================================================================
   Gift builder: occasion, project, colour, sender, receiver + live card
   ====================================================================== */
const ORDER = ["occ", "prj", "col", "snd", "rcv"];
const hsvToRgb = (h, s, v) => {
    s /= 100;
    v /= 100;
    const f = (n) => {
        const k = (n + h / 60) % 6;
        return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return [f(5), f(3), f(1)].map((x) => Math.round(x * 255));
};
const rgbToHsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const m = Math.max(r, g, b);
    const d = m - Math.min(r, g, b);
    let h = 0;
    if (d) {
        h = m === r ? ((g - b) / d) % 6 : m === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h = Math.round(h * 60);
        if (h < 0) {
            h += 360;
        }
    }
    return [h, m ? Math.round((d / m) * 100) : 0, Math.round(m * 100)];
};
const toHex = (r, g, b) => [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

export class DnGifts extends Interaction {
    static selector = ".dn-sec";
    static selectorHas = ".gf-wrap";
    dynamicContent = {
        ".gf-tab": { "t-on-click": (ev) => this.go(ev.currentTarget.dataset.t) },
        ".gf-next": { "t-on-click": this.onNext },
        ".gf-opt:not(.gf-p)": { "t-on-click": this.onOccasion },
        ".gf-p": { "t-on-click": (ev) => this.setProject(ev.currentTarget) },
        ".gf-sw": { "t-on-click": (ev) => this.setHex(ev.currentTarget.dataset.c.slice(1)) },
        ".cp-sv": { "t-on-pointerdown": (ev) => this.drag(ev, "sv"), "t-on-keydown": this.onSvKey },
        ".cp-hue": { "t-on-pointerdown": (ev) => this.drag(ev, "hue"), "t-on-keydown": this.onHueKey },
        ".cp-fields [data-k]": { "t-on-input": this.onField },
        ".cp-hex-in": { "t-on-input": this.onHexInput },
        ".gf-from-in, .gf-show": { "t-on-input": this.syncFrom, "t-on-change": this.syncFrom },
        ".gf-mob, .gf-rmob": { "t-on-input": (ev) => this.onlyDigits(ev.currentTarget, 10) },
        ".gf-go:not(.gf-send)": { "t-on-click": this.onSendOtp },
        ".gf-to": { "t-on-input": this.onRecipientName },
        ".gf-rchip": { "t-on-click": (ev) => this.setGiftAmount(ev.currentTarget.dataset.v) },
        ".gf-ramt": { "t-on-input": this.onGiftAmountInput },
        ".gf-rrange": { "t-on-input": (ev) => this.setGiftAmount(ev.currentTarget.value, true) },
        ".gf-showamt": { "t-on-change": () => this.syncGiftAmount() },
        ".gf-send": { "t-on-click": this.onSend },
    };

    setup() {
        this.q = (s) => this.el.querySelector(s);
        this.qa = (s) => [...this.el.querySelectorAll(s)];
        this.H = 160;
        this.S = 100;
        this.V = 44;
    }

    start() {
        snapshot(this, this.el);
        this.card = this.q(".gf-card");
        const project = this.q(".gf-p.on");
        if (project) {
            this.setProject(project);
        }
        const current = this.q(".cp-cur");
        if (current) {
            current.style.background = "#00705a";
        }
        this.setHex("00705a");
        this.syncGiftAmount();
    }

    go(key) {
        this.qa(".gf-tab").forEach((t) => t.classList.toggle("on", t.dataset.t === key));
        this.qa(".gf-pane").forEach((p) => p.classList.toggle("on", p.dataset.p === key));
    }

    onNext() {
        const current = this.q(".gf-pane.on")?.dataset.p;
        const next = ORDER[ORDER.indexOf(current) + 1];
        if (next) {
            this.go(next);
        }
    }

    onOccasion(ev) {
        const option = ev.currentTarget;
        this.qa(".gf-opt:not(.gf-p)").forEach((x) => x.classList.toggle("on", x === option));
        this.q(".gf-p-em").textContent = option.dataset.emoji || "";
    }

    setProject(option) {
        this.qa(".gf-p").forEach((x) => x.classList.toggle("on", x === option));
        this.q(".gf-p-prj").textContent = option.querySelector("b")?.textContent.trim() || option.dataset.v;
    }

    /* ---------- colour picker ---------- */
    paint(skip) {
        const [r, g, b] = hsvToRgb(this.H, this.S, this.V);
        const hex = toHex(r, g, b);
        const color = "#" + hex;
        const sv = this.q(".cp-sv");
        sv.style.setProperty("--h", this.H);
        const dot = this.q(".cp-dot");
        dot.style.left = this.S + "%";
        dot.style.top = 100 - this.V + "%";
        this.q(".cp-hd").style.top = (this.H / 360) * 100 + "%";
        this.q(".cp-new").style.background = color;
        this.card.style.setProperty("--gc", color);
        const values = { h: this.H, s: this.S, v: this.V, r, g, b };
        for (const input of this.qa(".cp-fields [data-k]")) {
            if (input.dataset.k !== skip) {
                input.value = values[input.dataset.k];
            }
        }
        if (skip !== "hex") {
            this.q(".cp-hex-in").value = hex;
        }
        this.qa(".gf-sw").forEach((x) => x.classList.toggle("on", x.dataset.c.toLowerCase() === color));
    }

    setRgb(r, g, b) {
        [this.H, this.S, this.V] = rgbToHsv(r, g, b);
    }

    setHex(hex) {
        this.setRgb(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4), 16));
        this.paint();
    }

    drag(ev, which) {
        const el = ev.currentTarget;
        const move = (e) => {
            const rect = el.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            if (which === "sv") {
                this.S = Math.round(x * 100);
                this.V = Math.round((1 - y) * 100);
            } else {
                this.H = Math.round(y * 360) % 360;
            }
            this.paint();
        };
        el.setPointerCapture?.(ev.pointerId);
        move(ev);
        const removeMove = this.addListener(el, "pointermove", move);
        const removeUp = this.addListener(el, "pointerup", () => {
            removeMove();
            removeUp();
        });
    }

    onSvKey(ev) {
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
        if (d) {
            this.S = Math.max(0, Math.min(100, this.S + d[0] * 2));
            this.V = Math.max(0, Math.min(100, this.V + d[1] * 2));
            this.paint();
            ev.preventDefault();
        }
    }

    onHueKey(ev) {
        if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
            this.H = (this.H + (ev.key === "ArrowUp" ? -6 : 6) + 360) % 360;
            this.paint();
            ev.preventDefault();
        }
    }

    onField(ev) {
        const input = ev.currentTarget;
        const k = input.dataset.k;
        const v = Math.max(0, +input.value || 0);
        if ("hsv".includes(k)) {
            if (k === "h") {
                this.H = Math.min(360, v) % 360;
            } else if (k === "s") {
                this.S = Math.min(100, v);
            } else {
                this.V = Math.min(100, v);
            }
        } else {
            const field = (q) => this.q(`.cp-fields [data-k=${q}]`);
            const rgb = ["r", "g", "b"].map((q) => Math.min(255, q === k ? v : +field(q).value || 0));
            this.setRgb(...rgb);
        }
        this.paint(k);
    }

    onHexInput(ev) {
        let v = ev.currentTarget.value.replace(/[^0-9a-f]/gi, "");
        if (v.length === 3) {
            v = v
                .split("")
                .map((c) => c + c)
                .join("");
        }
        if (v.length === 6) {
            this.setRgb(parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4), 16));
            this.paint("hex");
        }
    }

    /* ---------- sender ---------- */
    onlyDigits(input, max) {
        input.value = digits(input.value).slice(0, max);
        input.classList.remove("bad");
    }

    syncFrom() {
        const name = this.q(".gf-show").checked ? this.q(".gf-from-in").value.trim() : "";
        this.q(".gf-p-from").textContent = name;
        this.q(".gf-p-by").hidden = !name;
    }

    say(el, text, ok) {
        el.textContent = text;
        el.classList.toggle("ok", !!ok);
        el.hidden = false;
    }

    onSendOtp() {
        const msg = this.q(".gf-err:not(.gf-rerr)");
        const from = this.q(".gf-from-in");
        if (this.q(".gf-show").checked && !from.value.trim()) {
            this.say(msg, _t("Please enter your name to show it to the recipient."));
            from.focus();
            return;
        }
        const receiver = this.q(".gf-tab[data-t=rcv]");
        receiver.disabled = false;
        receiver.removeAttribute("title");
        this.go("rcv");
        msg.hidden = true;
        this.q(".gf-rmob")?.focus({ preventScroll: true });
    }

    /* ---------- receiver ---------- */
    giftAmount() {
        return +digits(this.q(".gf-ramt").value) || 0;
    }

    setGiftAmount(v, fromRange = false) {
        this.q(".gf-ramt").value = fmt(v);
        this.syncGiftAmount(fromRange);
    }

    onGiftAmountInput() {
        const input = this.q(".gf-ramt");
        const raw = digits(input.value).slice(0, 5);
        input.value = raw ? fmt(Math.min(MAX, +raw)) : "";
        this.syncGiftAmount();
    }

    syncGiftAmount(fromRange = false) {
        const v = this.giftAmount();
        this.qa(".gf-rchip").forEach((c) => c.classList.toggle("on", +c.dataset.v === v));
        const range = this.q(".gf-rrange");
        if (range) {
            if (!fromRange) {
                range.value = Math.max(10, v);
            }
            setRangeFill(range, v);
        }
        const pAmt = this.q(".gf-p-amt");
        pAmt.textContent = v ? `${fmt(v)} ${_t("AED")}` : "";
        pAmt.hidden = !(this.q(".gf-showamt").checked && v);
    }

    onRecipientName(ev) {
        this.q(".gf-p-to").textContent = ev.currentTarget.value;
        ev.currentTarget.classList.remove("bad");
    }

    onSend() {
        const msg = this.q(".gf-rerr");
        const mobile = this.q(".gf-rmob");
        const to = this.q(".gf-to");
        if (!/^05\d{8}$/.test(mobile.value)) {
            mobile.classList.add("bad");
            mobile.focus();
            return this.say(msg, _t("Please enter the recipient’s mobile number (10 digits starting with 05)."));
        }
        if (!to.value.trim()) {
            to.classList.add("bad");
            to.focus();
            return this.say(msg, _t("Please enter the recipient’s name."));
        }
        if (this.giftAmount() < 10) {
            this.q(".gf-ramt").focus();
            return this.say(msg, _t("Please enter an amount of at least 10 AED."));
        }
        this.say(msg, _t("Thank you! Your gift of %(amount)s AED to %(name)s is ready — you will be taken to secure payment.", {
            amount: fmt(this.giftAmount()),
            name: to.value.trim(),
        }), true);
        this.waitForTimeout(() => (window.location.href = payUrl(this.el, this.giftAmount())), 1800);
    }
}

/* ======================================================================
   Subscriptions
   ====================================================================== */
export class DnSubscriptions extends Interaction {
    static selector = ".dn-sec";
    static selectorHas = ".sb-form";
    dynamicContent = {
        ".sb-form": { "t-on-submit.prevent": this.onSubmit },
        ".sb-range": { "t-on-input": (ev) => this.setAmount(ev.currentTarget.value, "range") },
        ".sb-amount": {
            "t-on-input": (ev) => ev.currentTarget.value !== "" && this.setAmount(ev.currentTarget.value, "amt"),
            "t-on-blur": (ev) => this.setAmount(ev.currentTarget.value || 10),
        },
        ".sb-chip": { "t-on-click": (ev) => this.setAmount(ev.currentTarget.dataset.v) },
        ".sb-minus": { "t-on-click": () => this.setAmount(this.amount() - 10) },
        ".sb-plus": { "t-on-click": () => this.setAmount(this.amount() + 10) },
        ".sb-type": { "t-on-click": (ev) => this.setType(ev.currentTarget) },
        ".sb-csub": { "t-on-click": this.onCause },
        ".sb-freq": { "t-on-click": this.onFrequency },
    };

    setup() {
        this.q = (s) => this.el.querySelector(s);
        this.qa = (s) => [...this.el.querySelectorAll(s)];
        this.cause = null;
    }

    start() {
        snapshot(this, this.el);
        this.type = this.q(".sb-type.on") || this.q(".sb-type");
        this.render();
    }

    amount() {
        return +this.q(".sb-amount").value || 10;
    }

    render() {
        const freq = this.q(".sb-freq.on");
        const v = this.amount();
        const label = (el, fallback) => el?.querySelector("b")?.textContent.trim() || fallback;
        this.q(".sb-s-amt").textContent = fmt(v);
        if (freq) {
            this.q(".sb-s-every").textContent = freq.dataset.ev || "";
            this.q(".sb-s-freq").textContent = freq.textContent.trim();
            this.q(".sb-s-year").textContent = `${fmt(v * +freq.dataset.n)} ${_t("AED")}`;
        }
        this.q(".sb-for").textContent = this.cause
            ? this.cause.querySelector("h4")?.textContent.trim() || this.cause.dataset.n
            : this.type?.dataset.t === "Case"
              ? label(this.type, this.type.dataset.t)
              : this.type?.dataset.t || "";
    }

    setAmount(v, from) {
        v = Math.max(10, Math.min(MAX, Math.round(+v) || 10));
        if (from !== "range") {
            this.q(".sb-range").value = v;
        }
        if (from !== "amt") {
            this.q(".sb-amount").value = v;
        }
        this.qa(".sb-chip").forEach((c) => c.classList.toggle("on", +c.dataset.v === v));
        this.render();
    }

    setType(type) {
        this.type = type;
        const isCase = type.dataset.t === "Case";
        if (!isCase) {
            this.cause = null;
            this.qa(".sb-cause").forEach((x) => x.classList.remove("on"));
        }
        this.q(".sb-causes").hidden = !isCase;
        this.q(".sb-form").classList.toggle("is-case", isCase);
        this.qa(".sb-type").forEach((x) => {
            x.classList.toggle("on", x === type);
            x.setAttribute("aria-pressed", String(x === type));
        });
        this.render();
    }

    onCause(ev) {
        const cause = ev.currentTarget.closest(".sb-cause");
        this.cause = cause;
        this.qa(".sb-cause").forEach((x) => x.classList.toggle("on", x === cause));
        if (cause.dataset.amt) {
            this.setAmount(cause.dataset.amt);
        } else {
            this.render();
        }
    }

    onFrequency(ev) {
        this.qa(".sb-freq").forEach((x) => x.classList.toggle("on", x === ev.currentTarget));
        this.render();
    }

    fail(text) {
        const msg = this.q(".sb-msg");
        msg.className = "sb-msg";
        msg.textContent = text;
        msg.hidden = false;
    }

    onSubmit() {
        const name = this.q(".sb-name");
        const mobile = this.q(".sb-mobile");
        if (this.type?.dataset.t === "Case" && !this.cause) {
            this.fail(_t("Please select the specific cause you want to donate for."));
            this.q(".sb-causes").scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        [name, mobile].forEach((i) => i.classList.toggle("bad", !i.value.trim()));
        if (!name.value.trim() || !mobile.value.trim()) {
            this.fail(_t("Please fill in your name and mobile number."));
            (name.value.trim() ? mobile : name).focus();
            return;
        }
        if (!this.q(".sb-terms-in").checked) {
            this.fail(_t("Please accept the Terms & Conditions."));
            return;
        }
        const freq = this.q(".sb-freq.on");
        const msg = this.q(".sb-msg");
        msg.className = "sb-msg ok";
        msg.textContent = _t("Thank you! Your %(frequency)s subscription of %(amount)s AED is ready — you will be taken to secure payment.", {
            frequency: (freq?.textContent.trim() || "").toLowerCase(),
            amount: fmt(this.amount()),
        });
        msg.hidden = false;
        this.waitForTimeout(() => (window.location.href = payUrl(this.el, this.amount())), 1800);
    }
}

registry
    .category("public.interactions")
    .add("alihsanwebsite_theme.dn_tabs", DnTabs)
    .add("alihsanwebsite_theme.dn_direct", DnDirect)
    .add("alihsanwebsite_theme.dn_bank", DnBank)
    .add("alihsanwebsite_theme.dn_representatives", DnRepresentatives)
    .add("alihsanwebsite_theme.dn_delegate", DnDelegate)
    .add("alihsanwebsite_theme.dn_gifts", DnGifts)
    .add("alihsanwebsite_theme.dn_subscriptions", DnSubscriptions);
