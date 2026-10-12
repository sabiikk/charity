import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { Interaction } from "@web/public/interaction";

const RATE = 0.025;
const fmt = (v) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Zakat calculator (port of zakat.js): 2.5% of gold value + wealth, with the
 * nisab check and the "Pay My Zakat" link carrying the amount. Settings come
 * from the section's data-base24 / data-nisab-g / data-currency / data-pay-url.
 * Public interactions are not started in the website editor, and every change
 * made here is undone in cleanups, so no computed values are ever saved.
 */
export class ZakatCalculator extends Interaction {
    static selector = ".zk-sec";
    static selectorHas = ".zk-result";
    dynamicContent = {
        ".zk-k input": { "t-on-change": this.onKaratChange },
        ".zk-in-price": { "t-on-input": this.render },
        ".zk-in-gold": { "t-on-input": () => this.syncRange("gold", 10000) },
        ".zk-in-wealth": { "t-on-input": () => this.syncRange("wealth", 1000000) },
        ".zk-in-gold-r": { "t-on-input": () => this.syncNumber("gold") },
        ".zk-in-wealth-r": { "t-on-input": () => this.syncNumber("wealth") },
    };

    setup() {
        const d = this.el.dataset;
        this.base24 = parseFloat(d.base24) || 595.45;
        this.nisabG = parseFloat(d.nisabG) || 85;
        this.currency = d.currency || "AED";
        this.payUrl = d.payUrl || "/donation/pay";
        this.q = (s) => this.el.querySelector(s);
    }

    start() {
        const pay = this.q(".zk-pay");
        const originalHref = pay?.getAttribute("href");
        const texts = [...this.el.querySelectorAll(".zk-out, .zk-break dd, .zk-nisab-t")].map((el) => [el, el.textContent]);
        const inputs = [...this.el.querySelectorAll("input")].map((el) => [el, el.value, el.checked]);
        this.registerCleanup(() => {
            texts.forEach(([el, t]) => (el.textContent = t));
            inputs.forEach(([el, v, c]) => {
                el.value = v;
                el.checked = c;
            });
            pay?.setAttribute("href", originalHref);
            pay?.classList.remove("off");
            this.q(".zk-nisab")?.classList.remove("low");
        });
        this.setPrice();
        this.render();
    }

    num(el) {
        return Math.max(0, parseFloat(el?.value) || 0);
    }

    setPrice() {
        const karat = +(this.q(".zk-k input:checked")?.value || 24);
        this.q(".zk-in-price").value = ((this.base24 * karat) / 24).toFixed(2);
    }

    onKaratChange() {
        this.setPrice();
        this.render();
    }

    syncRange(key, max) {
        this.q(`.zk-in-${key}-r`).value = Math.min(max, this.num(this.q(`.zk-in-${key}`)));
        this.render();
    }

    syncNumber(key) {
        this.q(`.zk-in-${key}`).value = this.q(`.zk-in-${key}-r`).value;
        this.render();
    }

    render() {
        const gold = this.num(this.q(".zk-in-gold"));
        const wealth = this.num(this.q(".zk-in-wealth"));
        const price = this.num(this.q(".zk-in-price"));
        const goldValue = gold * price;
        const total = goldValue + wealth;
        const zakat = total * RATE;
        const nisab = this.nisabG * this.base24;
        const cur = this.currency + " ";

        this.q(".zk-out").textContent = fmt(zakat);
        this.q(".zk-b-gold").textContent = cur + fmt(goldValue);
        this.q(".zk-b-wealth").textContent = cur + fmt(wealth);
        this.q(".zk-b-total").textContent = cur + fmt(total);

        const ok = total >= nisab;
        this.q(".zk-nisab")?.classList.toggle("low", !ok);
        const text = this.q(".zk-nisab-t");
        if (text) {
            text.textContent = ok
                ? _t("Your wealth reaches the nisab — Zakat is due.")
                : _t(
                      "Below the nisab (≈ %(currency)s %(nisab)s). Zakat is not obligatory, but you can still give as Sadaqah.",
                      { currency: this.currency, nisab: fmt(nisab) }
                  );
        }

        const pay = this.q(".zk-pay");
        if (pay) {
            const sep = this.payUrl.includes("?") ? "&" : "?";
            pay.setAttribute("href", `${this.payUrl}${sep}amount=${Math.ceil(zakat)}`);
            pay.classList.toggle("off", zakat <= 0);
        }
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.zakat_calculator", ZakatCalculator);
