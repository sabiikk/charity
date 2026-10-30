import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { Interaction } from "@web/public/interaction";

/**
 * Volunteer snippets (port of volunteer.js):
 * - VolunteerRegister: fills the nationality list, checks the registration form
 *   and shows the thank-you card (no back end yet: nothing is sent);
 * - VolunteerLogin: every [data-vl-login] button on the page opens the
 *   "Volunteers login" dialog, which only checks its fields for now.
 * The banner fade-in comes from the Aid Registration interaction (.ar-sec/.ar-fade).
 * Public interactions are not started in the website editor, and every change
 * made here is undone in cleanups, so no runtime state is ever saved.
 */

const isArabic = () => (document.documentElement.lang || "").startsWith("ar");

/* nationality: GCC first, then every other country A–Z, named in the page language */
const GCC = ["AE", "SA", "KW", "BH", "QA", "OM"];
const REST = "AF AL DZ AD AO AG AR AM AU AT AZ BS BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IT JM JP JO KZ KE KI KP KR XK KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO PK PW PS PA PG PY PE PH PL PT RO RU RW KN LC VC WS SM ST SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA GB US UY UZ VU VA VE VN YE ZM ZW".split(" ");

/** Shows (or clears) the message under a field; the message span is created if the editor dropped it. */
function setError(field, message) {
    field.setAttribute("aria-invalid", String(!!message));
    let el = document.getElementById(`${field.id}-e`);
    if (!el && message) {
        el = document.createElement("span");
        el.className = "vl-err";
        el.id = `${field.id}-e`;
        el.dataset.vlAdded = "";
        field.closest(".vl-f, .vl-terms")?.append(el);
    }
    if (el) {
        el.textContent = message || "";
    }
}

function clearErrors(root) {
    root.querySelectorAll("[aria-invalid]").forEach((f) => f.removeAttribute("aria-invalid"));
    root.querySelectorAll(".vl-err").forEach((el) => (el.dataset.vlAdded !== undefined ? el.remove() : (el.textContent = "")));
}

function digitsOnly(ev) {
    ev.currentTarget.value = ev.currentTarget.value.replace(/\D/g, "").slice(0, 7);
}

function togglePassword(ev) {
    const btn = ev.currentTarget;
    const input = btn.previousElementSibling;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.setAttribute("aria-pressed", String(show));
    btn.setAttribute("aria-label", show ? _t("Hide password") : _t("Show password"));
}

function resetPasswords(root) {
    root.querySelectorAll(".vl-eye").forEach((btn) => {
        btn.previousElementSibling.type = "password";
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-label", "Show password");
    });
}

export class VolunteerRegister extends Interaction {
    static selector = ".vl-page";
    static selectorHas = "#vl-form";
    dynamicContent = {
        "#vl-form": { "t-on-submit.prevent": this.onSubmit },
        "#vl-form [required]": {
            "t-on-blur": (ev) => this.check(ev.currentTarget),
            "t-on-change": (ev) => {
                const f = ev.currentTarget;
                if (f.getAttribute("aria-invalid") === "true" || f.type === "checkbox") {
                    this.check(f);
                }
            },
        },
        "#vl-phone": { "t-on-input": digitsOnly },
        "#vl-pw": { "t-on-input": this.onPasswordInput },
        "#vl-form .vl-eye": { "t-on-click": togglePassword },
        "#vl-again": { "t-on-click": this.onAgain },
    };

    setup() {
        this.form = this.el.querySelector("#vl-form");
        this.done = this.el.querySelector("#vl-done");
        this.nat = this.el.querySelector("#vl-nat");
        this.dob = this.el.querySelector("#vl-dob");
    }

    start() {
        const natHTML = this.nat?.innerHTML;
        this.fillNationality("AE");
        /* date of birth: participation is allowed from 5 years old */
        if (this.dob) {
            const max = new Date();
            max.setFullYear(max.getFullYear() - 5);
            this.dob.max = max.toISOString().slice(0, 10);
            this.dob.min = "1920-01-01";
        }
        this.registerCleanup(() => {
            this.form.reset();
            clearErrors(this.form);
            resetPasswords(this.form);
            this.form.hidden = false;
            if (this.done) {
                this.done.hidden = true;
            }
            const name = this.el.querySelector("#vl-done-name");
            if (name) {
                name.textContent = "";
            }
            if (this.nat) {
                this.nat.innerHTML = natHTML;
            }
            this.dob?.removeAttribute("max");
            this.dob?.removeAttribute("min");
        });
    }

    fillNationality(value) {
        if (!this.nat) {
            return;
        }
        const ar = isArabic();
        const locale = ar ? "ar" : "en";
        const names = new Intl.DisplayNames([locale], { type: "region" });
        const name = (c) => (c === "AE" ? (ar ? "الإمارات" : "Emirates") : names.of(c));
        const rest = REST.map((c) => [c, name(c)]).sort((a, b) => a[1].localeCompare(b[1], locale));
        const options = [["", _t("Select Nationality")], ...GCC.map((c) => [c, name(c)]), ...rest];
        this.nat.replaceChildren(...options.map(([code, label]) => new Option(label, code)));
        this.nat.value = value;
    }

    get requiredFields() {
        return [...this.form.querySelectorAll("input[required], select[required]")];
    }

    check(f) {
        const v = f.value.trim();
        let k = "";
        if (f.type === "checkbox" ? !f.checked : !v) {
            k = f.type === "checkbox" ? _t("Please agree to the Terms & Conditions") : f.id === "vl-net" ? _t("Choose a network") : _t("This field is required");
        } else if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
            k = _t("Enter a valid e-mail address");
        } else if (f.id === "vl-phone" && v.length !== 7) {
            k = _t("Enter the 7 digits after the network code");
        } else if (f.id === "vl-pw" && !(v.length >= 8 && /[a-z]/i.test(v) && /\d/.test(v))) {
            k = _t("At least 8 characters, with letters and numbers");
        } else if (f.id === "vl-pw2" && v !== this.el.querySelector("#vl-pw").value) {
            k = _t("Passwords do not match");
        } else if (f.id === "vl-dob" && this.dob.max && v > this.dob.max) {
            k = _t("Participation is allowed from 5 years old");
        }
        setError(f, k);
        return !k;
    }

    onPasswordInput() {
        const confirm = this.el.querySelector("#vl-pw2");
        if (confirm?.value) {
            this.check(confirm);
        }
    }

    onSubmit() {
        const bad = this.requiredFields.filter((f) => !this.check(f));
        if (bad.length) {
            bad[0].focus();
            bad[0].scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        /* no back end yet: show the confirmation instead of sending the form */
        const name = this.el.querySelector("#vl-done-name");
        if (name) {
            name.textContent = this.el.querySelector("#vl-first").value.trim();
        }
        this.form.hidden = true;
        this.done.hidden = false;
        this.done.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    onAgain() {
        this.form.reset();
        this.fillNationality("AE");
        clearErrors(this.form);
        resetPasswords(this.form);
        this.done.hidden = true;
        this.form.hidden = false;
    }
}

export class VolunteerLogin extends Interaction {
    static selector = ".vl-page";
    static selectorHas = ".vl-dlg";
    dynamicContent = {
        // the banner's button lives in another section, so listen on the document
        _document: { "t-on-click": this.onDocumentClick },
        ".vl-dlg": {
            "t-on-close": () => (document.body.style.overflow = ""),
            "t-on-click": (ev) => ev.target === this.dlg && this.close(),
        },
        "#vl-lclose": { "t-on-click": this.close },
        "#vl-lphone": { "t-on-input": digitsOnly },
        "#vl-lform .vl-eye": { "t-on-click": togglePassword },
        "#vl-lnet, #vl-lphone, #vl-lpw": {
            "t-on-blur": (ev) => {
                const f = ev.currentTarget;
                if (f.value || f.getAttribute("aria-invalid") === "true") {
                    this.check(f);
                }
            },
        },
        "#vl-lform": { "t-on-submit.prevent": this.onSubmit },
        "#vl-forgot": { "t-on-click": () => this.say(_t("To reset your password, please call 800 16 or e-mail us.")) },
        "#vl-toreg": { "t-on-click": this.onToRegister },
    };

    setup() {
        this.dlg = this.el.querySelector(".vl-dlg");
        this.lform = this.el.querySelector("#vl-lform");
        this.msg = this.el.querySelector("#vl-lmsg");
    }

    start() {
        this.registerCleanup(() => {
            this.close();
            document.body.style.overflow = "";
            this.lform.reset();
            clearErrors(this.lform);
            resetPasswords(this.lform);
            if (this.msg) {
                this.msg.hidden = true;
                this.msg.textContent = "";
                this.msg.className = "vl-lmsg";
            }
        });
    }

    get fields() {
        return ["#vl-lnet", "#vl-lphone", "#vl-lpw"].map((s) => this.el.querySelector(s));
    }

    check(f) {
        const v = f.value.trim();
        let k = "";
        if (f.id === "vl-lnet" && !v) {
            k = _t("Choose a network");
        } else if (f.id === "vl-lphone" && v.length !== 7) {
            k = _t("Enter the 7 digits after the network code");
        } else if (f.id === "vl-lpw" && !v) {
            k = _t("Enter your password");
        }
        setError(f, k);
        return !k;
    }

    say(text) {
        if (this.msg) {
            this.msg.textContent = text;
            this.msg.className = "vl-lmsg ok";
            this.msg.hidden = false;
        }
    }

    onDocumentClick(ev) {
        if (ev.target.closest("[data-vl-login]")) {
            this.open();
        }
    }

    open() {
        if (this.msg) {
            this.msg.hidden = true;
        }
        try {
            const saved = JSON.parse(localStorage.getItem("vl-remember") || "null");
            if (saved) {
                this.el.querySelector("#vl-lnet").value = saved.n;
                this.el.querySelector("#vl-lphone").value = saved.p;
                this.el.querySelector("#vl-lremember").checked = true;
            }
        } catch {
            // storage may be blocked; the form simply starts empty
        }
        if (this.dlg.showModal) {
            this.dlg.showModal();
        } else {
            this.dlg.setAttribute("open", "");
        }
        document.body.style.overflow = "hidden";
        this.waitForTimeout(() => {
            const net = this.el.querySelector("#vl-lnet");
            (net.value ? this.el.querySelector("#vl-lphone") : net).focus();
        }, 50);
    }

    close() {
        if (this.dlg.close) {
            this.dlg.close();
        } else {
            this.dlg.removeAttribute("open");
        }
    }

    onSubmit() {
        if (this.msg) {
            this.msg.hidden = true;
        }
        const bad = this.fields.filter((f) => !this.check(f));
        if (bad.length) {
            bad[0].focus();
            return;
        }
        try {
            if (this.el.querySelector("#vl-lremember").checked) {
                localStorage.setItem("vl-remember", JSON.stringify({ n: this.el.querySelector("#vl-lnet").value, p: this.el.querySelector("#vl-lphone").value }));
            } else {
                localStorage.removeItem("vl-remember");
            }
        } catch {
            // storage may be blocked; remembering is only a convenience
        }
        /* no back end yet: only confirm that the details were checked */
        this.say(_t("Login is not connected yet — this is a preview. Your details were not sent."));
    }

    onToRegister() {
        this.close();
        const form = document.querySelector("#vl-form");
        form?.querySelector("#vl-first")?.focus();
        form?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

registry
    .category("public.interactions")
    .add("alihsanwebsite_theme.volunteer_register", VolunteerRegister)
    .add("alihsanwebsite_theme.volunteer_login", VolunteerLogin);
