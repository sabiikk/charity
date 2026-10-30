import { registry } from "@web/core/registry";
import { Interaction } from "@web/public/interaction";
import { getScrollingElement } from "@web/core/utils/scrolling";

const isMobile = () => window.matchMedia("(max-width:1000px)").matches;

/**
 * Al Ihsan header (port of mega-menu.js, the mobile drawer and sticky-header.js):
 * - mega panels open on hover (desktop) or click, close on outside click / Esc / backdrop;
 * - the ☰ button opens the mobile drawer, where panels become one-at-a-time accordions;
 * - once the page scrolls the header turns green and swaps to the white logo;
 * - the signed-in user's name opens a small account menu (My account, Log out...).
 * Public interactions are not started in the website editor, and every change
 * made here is undone in cleanups, so no runtime state is ever saved.
 */
export class IhsanHeader extends Interaction {
    static selector = "#top.ih-header";

    setup() {
        this.nav = this.el.querySelector("#navigation");
        this.items = [...this.el.querySelectorAll("#navigation .has-mega")];
        this.menuButton = this.el.querySelector(".menu");
        this.logo = this.el.querySelector("img.logo");
        this.logoSrc = this.logo?.getAttribute("src");
        this.logoScrolled = this.logo?.dataset.logoScrolled;
        this.scroller = getScrollingElement(this.el.ownerDocument);
    }

    start() {
        this.setupMegaMenu();
        this.setupDrawer();
        this.setupSticky();
        this.setupUserMenu();
    }

    // ---------------------------------------------------------------- account menu
    setupUserMenu() {
        const button = this.el.querySelector(".ih-user > .login-toggle");
        const menu = this.el.querySelector(".ih-user-menu");
        if (!button || !menu) {
            return;
        }
        const toggle = (open) => {
            menu.classList.toggle("d-none", !open);
            button.setAttribute("aria-expanded", String(open));
        };
        this.addListener(button, "click", () => toggle(menu.classList.contains("d-none")));
        this.addListener(document, "click", (ev) => !button.parentElement.contains(ev.target) && toggle(false));
        this.addListener(document, "keydown", (ev) => {
            if (ev.key === "Escape" && !menu.classList.contains("d-none")) {
                toggle(false);
                button.focus();
            }
        });
        this.registerCleanup(() => toggle(false));
    }

    // ---------------------------------------------------------------- mega menu
    setMegaOn(on) {
        document.documentElement.classList.toggle("mega-on", on);
    }

    closeAll(except) {
        for (const item of this.items) {
            if (item !== except) {
                item.classList.remove("open");
                item.querySelector(".ih-nav-link")?.setAttribute("aria-expanded", "false");
            }
        }
        if (!except) {
            this.setMegaOn(false);
        }
    }

    setupMegaMenu() {
        if (!this.items.length) {
            return;
        }
        // inside #wrapwrap, next to the header, so it stacks under it (see header.css)
        const backdrop = document.createElement("div");
        backdrop.className = "mega-backdrop";
        this.el.before(backdrop);
        this.addListener(backdrop, "click", () => this.closeAll());

        for (const item of this.items) {
            const button = item.querySelector(".ih-nav-link");
            this.addListener(button, "click", (ev) => {
                ev.preventDefault();
                const open = !item.classList.contains("open");
                this.closeAll(item);
                item.classList.toggle("open", open);
                button.setAttribute("aria-expanded", String(open));
                this.setMegaOn(open && !isMobile());
            });
            this.addListener(item, "mouseenter", () => {
                if (!isMobile()) {
                    this.closeAll(item);
                    this.setMegaOn(true);
                }
            });
            this.addListener(item, "mouseleave", () => {
                if (!isMobile()) {
                    item.classList.remove("open");
                    button.setAttribute("aria-expanded", "false");
                    this.setMegaOn(false);
                }
            });
        }
        this.addListener(document, "click", (ev) => {
            if (!ev.target.closest("#navigation")) {
                this.closeAll();
            }
        });
        this.addListener(document, "keydown", (ev) => {
            if (ev.key === "Escape") {
                this.closeAll();
            }
        });
        this.registerCleanup(() => {
            this.closeAll();
            backdrop.remove();
        });
    }

    // ---------------------------------------------------------------- mobile drawer
    syncDrawer() {
        const on = this.nav.classList.contains("open") && isMobile();
        document.body.classList.toggle("menu-open", on);
        this.menuButton.setAttribute("aria-expanded", String(on));
    }

    closeDrawer() {
        this.nav.classList.remove("open");
        this.closeAll();
        this.syncDrawer();
    }

    setupDrawer() {
        if (!this.nav || !this.menuButton) {
            return;
        }
        const backdrop = document.createElement("div");
        backdrop.className = "ih-drawer-backdrop";
        this.el.before(backdrop);
        this.addListener(backdrop, "click", () => this.closeDrawer());
        this.addListener(this.menuButton, "click", (ev) => {
            ev.stopPropagation();
            this.nav.classList.toggle("open");
            this.syncDrawer();
        });
        this.addListener(this.nav, "click", (ev) => {
            if (isMobile() && ev.target.closest("a[href]")) {
                this.closeDrawer();
            }
        });
        this.addListener(document, "keydown", (ev) => {
            if (ev.key === "Escape" && this.nav.classList.contains("open")) {
                this.closeDrawer();
            }
        });
        this.addListener(document, "click", (ev) => {
            if (isMobile() && this.nav.classList.contains("open") && !ev.target.closest("#navigation, .menu")) {
                this.closeDrawer();
            }
        });
        this.addListener(window, "resize", () => {
            if (!isMobile() && this.nav.classList.contains("open")) {
                this.closeDrawer();
            }
        });
        this.registerCleanup(() => {
            backdrop.remove();
            this.nav.classList.remove("open");
            document.body.classList.remove("menu-open");
            this.menuButton.setAttribute("aria-expanded", "false");
        });
    }

    // ---------------------------------------------------------------- sticky / scrolled
    updateHeight() {
        document.documentElement.style.setProperty("--hh", Math.round(this.el.getBoundingClientRect().height) + "px");
    }

    onScroll() {
        const scrolled = this.scroller.scrollTop > 40;
        if (scrolled === this.el.classList.contains("is-scrolled")) {
            return;
        }
        this.el.classList.toggle("is-scrolled", scrolled);
        if (this.logoScrolled) {
            this.logo.src = scrolled ? this.logoScrolled : this.logoSrc;
        }
    }

    setupSticky() {
        if (this.logoScrolled) {
            new Image().src = this.logoScrolled; // preload so the swap is instant
        }
        // the scrolling element is #wrapwrap on Odoo pages, the document otherwise
        const target = this.scroller === document.scrollingElement ? window : this.scroller;
        // onScroll only flips a class when crossing 40px, so it is cheap enough to run
        // on every event (no rAF batching that could stall if a frame is skipped)
        this.addListener(target, "scroll.noUpdate", () => this.onScroll(), { passive: true });
        this.addListener(this.el, "transitionend", (ev) => ev.propertyName === "height" && this.updateHeight());
        this.addListener(window, "resize", () => this.updateHeight());
        this.updateHeight();
        this.onScroll();
        this.registerCleanup(() => {
            this.el.classList.remove("is-scrolled");
            if (this.logo && this.logoSrc) {
                this.logo.src = this.logoSrc;
            }
            document.documentElement.style.removeProperty("--hh");
        });
    }
}

registry.category("public.interactions").add("alihsanwebsite_theme.header", IhsanHeader);
