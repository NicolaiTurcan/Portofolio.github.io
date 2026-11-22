"use strict";

const root = document.documentElement;

function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
}

/* ---------------- Language (EN / DE) ---------------- */
const i18nNodes = document.querySelectorAll("[data-i18n]");
const metaDescription = document.querySelector('meta[name="description"]');
const photo = document.querySelector(".hero__photo img");
const themeBtn = document.querySelector(".theme-toggle");
const menuBtn = document.querySelector(".menu-toggle");
const langBtn = document.querySelector(".lang-toggle");

// English is the source of truth in the HTML: capture it once.
const EN = {
    "meta.title": document.title,
    "meta.description": metaDescription ? metaDescription.content : "",
    "ui.theme": themeBtn.getAttribute("aria-label"),
    "ui.menuOpen": "Open menu",
    "ui.menuClose": "Close menu",
    "ui.photo": photo ? photo.alt : ""
};
i18nNodes.forEach(el => { EN[el.dataset.i18n] = el.innerHTML; });

let currentLang = root.getAttribute("lang") === "de" ? "de" : "en";

function t(key) {
    const dict = (window.I18N && window.I18N[currentLang]) || {};
    return dict[key] !== undefined ? dict[key] : EN[key];
}

function applyLanguage(lang) {
    currentLang = lang;
    root.setAttribute("lang", lang);
    i18nNodes.forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    document.title = t("meta.title");
    if (metaDescription) metaDescription.content = t("meta.description");
    if (photo) photo.alt = t("ui.photo");
    themeBtn.setAttribute("aria-label", t("ui.theme"));
    updateMenuLabel();
    langBtn.querySelectorAll("[data-lang]").forEach(opt => {
        opt.classList.toggle("is-active", opt.dataset.lang === lang);
    });
}

langBtn.addEventListener("click", () => {
    const next = currentLang === "en" ? "de" : "en";
    applyLanguage(next);
    store("lang", next);
    // keep a shareable URL in sync if it already carries ?lang=
    const url = new URL(location.href);
    if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", next);
        history.replaceState(null, "", url);
    }
});

/* ---------------- Theme (light / dark) ---------------- */
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function effectiveTheme() {
    return root.getAttribute("data-theme") || (systemDark.matches ? "dark" : "light");
}

themeBtn.addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store("theme", next);
});

/* ---------------- Mobile menu ---------------- */
const header = document.querySelector(".header");

function updateMenuLabel() {
    const open = header.classList.contains("is-open");
    menuBtn.setAttribute("aria-label", t(open ? "ui.menuClose" : "ui.menuOpen"));
}

function setMenu(open) {
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("no-scroll", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    updateMenuLabel();
}

menuBtn.addEventListener("click", () => setMenu(!header.classList.contains("is-open")));
document.querySelectorAll(".nav__link").forEach(link => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
window.matchMedia("(min-width: 860px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

/* ---------------- Header shadow on scroll ---------------- */
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------------- Active nav link ---------------- */
const navLinks = [...document.querySelectorAll(".nav__link")];
if ("IntersectionObserver" in window) {
    const sections = navLinks
        .map(link => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);
    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(link => {
                link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
            });
        });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(s => spy.observe(s));
}

/* ---------------- Reveal on scroll ---------------- */
const revealEls = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                obs.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(el => io.observe(el));
} else {
    revealEls.forEach(el => el.classList.add("is-visible"));
}

/* ---------------- Init ---------------- */
document.getElementById("year").textContent = new Date().getFullYear();
applyLanguage(currentLang);
