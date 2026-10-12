import { registry } from "@web/core/registry";
import { rpc } from "@web/core/network/rpc";
import { _t } from "@web/core/l10n/translation";
import { Interaction } from "@web/public/interaction";

/**
 * FAQ snippets (port of faq.js):
 * - FaqAccordion: one question open at a time per list;
 * - FaqSearch: the banner's search box filters every FAQ list on the page;
 * - FaqAsk: the "Can't find your way?" box posts the question to
 *   /alihsan/faq/ask, which emails it to the website company.
 * Public interactions are not started in the website editor, and every change
 * made here is undone in cleanups, so no runtime state is ever saved.
 */
export class FaqAccordion extends Interaction {
    static selector = ".fq-sec";
    static selectorHas = ".fq-list";
    dynamicContent = {
        ".fq-q": { "t-on-click": this.onToggle },
    };

    start() {
        const items = [...this.el.querySelectorAll(".fq-item")];
        const initial = items.map((it) => it.classList.contains("open"));
        this.registerCleanup(() => items.forEach((it, i) => this.setOpen(it, initial[i])));
    }

    setOpen(item, open) {
        item.classList.toggle("open", open);
        item.querySelector(".fq-q")?.setAttribute("aria-expanded", String(open));
    }

    onToggle(ev) {
        const item = ev.currentTarget.closest(".fq-item");
        const open = !item.classList.contains("open");
        this.el.querySelectorAll(".fq-item").forEach((it) => this.setOpen(it, false));
        this.setOpen(item, open);
    }
}

export class FaqSearch extends Interaction {
    static selector = ".fq-sec";
    static selectorHas = ".fq-search-in";
    dynamicContent = {
        ".fq-search-in": { "t-on-input": this.filter },
    };

    start() {
        this.lists = [...document.querySelectorAll(".fq-sec .fq-list")];
        const counts = this.lists.map((l) => l.querySelector(".fq-count")?.textContent);
        this.registerCleanup(() => {
            this.lists.forEach((list, i) => {
                list.querySelectorAll(".fq-item").forEach((it) => it.classList.remove("d-none"));
                list.querySelector(".fq-empty")?.classList.add("d-none");
                const count = list.querySelector(".fq-count");
                if (count) {
                    count.textContent = counts[i];
                }
            });
        });
        this.filter();
    }

    filter() {
        const q = (this.el.querySelector(".fq-search-in")?.value || "").trim().toLowerCase();
        for (const list of this.lists) {
            let n = 0;
            for (const item of list.querySelectorAll(".fq-item")) {
                const ok = !q || item.textContent.toLowerCase().includes(q);
                item.classList.toggle("d-none", !ok);
                n += ok ? 1 : 0;
            }
            list.querySelector(".fq-empty")?.classList.toggle("d-none", n > 0);
            const count = list.querySelector(".fq-count");
            if (count) {
                count.textContent = n === 1 ? _t("1 question") : _t("%s questions", n);
            }
        }
    }
}

export class FaqAsk extends Interaction {
    static selector = ".fq-sec";
    static selectorHas = ".fq-form";
    dynamicContent = {
        ".fq-submit": { "t-on-click": this.onSubmit },
        ".fq-text": { "t-on-input": () => this.text.classList.remove("bad") },
    };

    setup() {
        this.text = this.el.querySelector(".fq-text");
        this.msg = this.el.querySelector(".fq-msg");
        this.button = this.el.querySelector(".fq-submit");
    }

    start() {
        this.registerCleanup(() => {
            this.text.classList.remove("bad");
            this.text.value = "";
            this.msg.className = "fq-msg d-none";
            this.msg.textContent = "";
            this.button.disabled = false;
        });
    }

    showMessage(text, ok) {
        this.msg.className = ok ? "fq-msg ok" : "fq-msg";
        this.msg.textContent = text;
    }

    async onSubmit() {
        const question = this.text.value.trim();
        this.text.classList.toggle("bad", !question);
        if (!question) {
            this.showMessage(_t("Please write your question."), false);
            return;
        }
        this.button.disabled = true;
        let result;
        try {
            result = await this.waitFor(rpc("/alihsan/faq/ask", { question }));
        } catch {
            result = { ok: false };
        }
        this.button.disabled = false;
        if (result?.ok) {
            this.showMessage(_t("Thank you! We received your question and will reply soon."), true);
            this.text.value = "";
        } else {
            this.showMessage(_t("Sorry, your question could not be sent. Please call us on 800 16."), false);
        }
    }
}

registry
    .category("public.interactions")
    .add("alihsanwebsite_theme.faq_accordion", FaqAccordion)
    .add("alihsanwebsite_theme.faq_search", FaqSearch)
    .add("alihsanwebsite_theme.faq_ask", FaqAsk);
