/**
 * Spin Academy & Makeup Studio — landing page behaviour.
 * Vanilla JS, no dependencies. Each feature is an isolated init function.
 */
(() => {
  "use strict";

  const CONFIG = {
    whatsappNumber: "918248431617",
    // Slot range used for bookings (24h). Hours are 9:30 am to 8:30 pm;
    // the last bookable slot leaves an hour before closing.
    firstSlot: { h: 9, m: 30 },
    lastSlot: { h: 19, m: 30 },
    slotMinutes: 30,
    closesAt: { h: 20, m: 30 },
    // Optional: POST enquiries to your backend as JSON as well (e.g. "/api/enquiry").
    endpoint: "",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------------------------------------------------------------- */
  /* Header: solid background after scrolling                          */
  /* ---------------------------------------------------------------- */
  function initHeader() {
    const header = $("[data-header]");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------------------------------------------------------------- */
  /* Mobile menu                                                        */
  /* ---------------------------------------------------------------- */
  function initMenu() {
    const toggle = $("[data-menu-toggle]");
    const nav = $("#mobile-nav");
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      $("[data-icon-open]", toggle).classList.toggle("hidden", open);
      $("[data-icon-close]", toggle).classList.toggle("hidden", !open);
    };

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => e.target.closest("a") && setOpen(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Open / closed status in the hero                                   */
  /* ---------------------------------------------------------------- */
  function initOpenStatus() {
    const el = $("[data-open-status]");
    if (!el) return;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const open = CONFIG.firstSlot.h * 60 + CONFIG.firstSlot.m;
    const close = CONFIG.closesAt.h * 60 + CONFIG.closesAt.m;
    if (minutes >= open && minutes < close) return;

    el.textContent = minutes < open ? "Opens today at 9:30 am" : "Closed now, opens tomorrow at 9:30 am";
    const dot = $("[data-open-dot]");
    dot?.querySelector(".animate-ping")?.remove();
    dot?.lastElementChild?.classList.replace("bg-temple", "bg-ink-soft");
  }

  /* ---------------------------------------------------------------- */
  /* Service tabs (WAI-ARIA tabs pattern)                               */
  /* ---------------------------------------------------------------- */
  function initTabs() {
    const list = $("[data-tabs]");
    if (!list) return;
    const tabs = $$('[role="tab"]', list);

    const select = (tab, focus = true) => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    };

    list.addEventListener("click", (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) select(tab, false);
    });

    list.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length]);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Carousels: dots, arrows, pause and autoplay                       */
  /*                                                                    */
  /* Markup: [data-carousel data-autoplay=ms] > [data-carousel-track]   */
  /* plus optional [data-carousel-prev|next], [data-carousel-dots] and  */
  /* [data-carousel-toggle]. A track that isn't scrollable (e.g. the    */
  /* course grid on tablet/desktop) simply stays idle.                  */
  /* ---------------------------------------------------------------- */
  const PAUSE_ICON = '<svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>';
  const PLAY_ICON = '<svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function initCarousels() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    $$("[data-carousel]").forEach((root) => {
      const track = $("[data-carousel-track]", root);
      if (!track) return;
      const slides = [...track.children];
      const dotsWrap = $("[data-carousel-dots]", root);
      const controls = $("[data-carousel-controls]", root);
      const toggle = $("[data-carousel-toggle]", root);
      const delay = Number(root.dataset.autoplay) || 0;

      let stoppedByUser = reduceMotion.matches; // explicit pause, or reduced motion
      let hovering = false;
      let visible = false;
      let resumeAt = 0; // a touch/scroll by the user pauses for a while

      const scrollable = () => track.scrollWidth > track.clientWidth + 4;
      const padLeft = () => parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      const maxScroll = () => track.scrollWidth - track.clientWidth;

      const currentIndex = () => {
        const x = track.scrollLeft + padLeft();
        let best = 0;
        slides.forEach((s, i) => {
          if (Math.abs(s.offsetLeft - x) < Math.abs(slides[best].offsetLeft - x)) best = i;
        });
        return track.scrollLeft >= maxScroll() - 4 ? slides.length - 1 : best;
      };

      const goTo = (i) => {
        const index = (i + slides.length) % slides.length;
        track.scrollTo({
          left: Math.min(slides[index].offsetLeft - padLeft(), maxScroll()),
          behavior: reduceMotion.matches ? "instant" : "smooth",
        });
      };

      // Dots
      const dots = slides.map((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "carousel-dot";
        b.setAttribute("aria-label", `Go to slide ${i + 1} of ${slides.length}`);
        b.addEventListener("click", () => {
          pauseForAWhile();
          goTo(i);
        });
        dotsWrap?.appendChild(b);
        return b;
      });

      // Many slides: dots would wrap on phones, so show a "3 / 13" counter there instead
      let counter = null;
      if (dotsWrap && slides.length > 8) {
        dotsWrap.classList.add("hidden", "sm:flex");
        counter = document.createElement("span");
        counter.className = "text-sm tabular-nums text-ink-soft sm:hidden";
        dotsWrap.after(counter);
      }

      let raf = 0;
      const syncDots = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const active = currentIndex();
          dots.forEach((d, i) => d.setAttribute("aria-current", String(i === active)));
          if (counter) counter.textContent = `${active + 1} / ${slides.length}`;
        });
      };
      track.addEventListener("scroll", syncDots, { passive: true });

      // Arrows
      $("[data-carousel-prev]", root)?.addEventListener("click", () => {
        pauseForAWhile();
        goTo(currentIndex() - 1);
      });
      $("[data-carousel-next]", root)?.addEventListener("click", () => {
        pauseForAWhile();
        goTo(currentIndex() + 1);
      });

      // Autoplay
      const renderToggle = () => {
        if (!toggle) return;
        toggle.innerHTML = stoppedByUser ? PLAY_ICON : PAUSE_ICON;
        toggle.setAttribute("aria-label", stoppedByUser ? "Play slideshow" : "Pause slideshow");
        toggle.hidden = !delay;
      };
      toggle?.addEventListener("click", () => {
        stoppedByUser = !stoppedByUser;
        renderToggle();
      });

      function pauseForAWhile() {
        resumeAt = Date.now() + 8000;
      }

      const tick = () => {
        if (stoppedByUser || hovering || !visible || document.hidden || Date.now() < resumeAt || !scrollable()) return;
        const atEnd = track.scrollLeft >= maxScroll() - 4;
        goTo(atEnd ? 0 : currentIndex() + 1);
      };

      if (delay) {
        root.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && (hovering = true));
        root.addEventListener("pointerleave", () => (hovering = false));
        root.addEventListener("focusin", () => (hovering = true));
        root.addEventListener("focusout", () => (hovering = false));
        track.addEventListener("touchstart", pauseForAWhile, { passive: true });
        track.addEventListener("wheel", pauseForAWhile, { passive: true });

        new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0.35 }).observe(track);
        setInterval(tick, delay);
        reduceMotion.addEventListener?.("change", (e) => {
          if (e.matches) stoppedByUser = true;
          renderToggle();
        });
      }

      // Hide controls when there's nothing to scroll (e.g. grid layout on desktop)
      const syncControls = () => {
        if (controls) controls.hidden = !scrollable();
        syncDots();
      };
      window.addEventListener("resize", syncControls, { passive: true });

      renderToggle();
      syncControls();
    });
  }

  /* ---------------------------------------------------------------- */
  /* Enquiry form: Book appointment / Walk in                           */
  /* ---------------------------------------------------------------- */
  function initEnquiry() {
    const form = $("#enquiry-form");
    if (!form) return;

    const els = {
      switcher: $("[data-mode-switch]", form),
      hint: $("[data-mode-hint]", form),
      submit: $("[data-submit]", form),
      date: $("#f-date", form),
      time: $("#f-time", form),
      service: $("#f-service", form),
      area: $("#f-area", form),
      success: $("[data-success]"),
      successTitle: $("[data-success-title]"),
      waLink: $("[data-wa-link]"),
    };

    const COPY = {
      book: {
        hint: "Pick a date and time and we'll confirm your slot.",
        submit: "Send booking request",
        done: "Booking request ready",
      },
      walkin: {
        hint: "No fixed slot needed. Tell us roughly when, and we'll keep a chair ready.",
        submit: "Send walk-in request",
        done: "Walk-in request ready",
      },
    };

    let mode = "book";

    /* -- Date & time slots ------------------------------------------ */
    const pad = (n) => String(n).padStart(2, "0");
    const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const fmtTime = (h, m) => `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "am" : "pm"}`;

    els.date.min = toISODate(new Date());

    const renderSlots = () => {
      const prev = els.time.value;
      const isToday = els.date.value === toISODate(new Date());
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes() + 30; // 30 min buffer for same-day
      const start = CONFIG.firstSlot.h * 60 + CONFIG.firstSlot.m;
      const end = CONFIG.lastSlot.h * 60 + CONFIG.lastSlot.m;

      const options = ['<option value="">Choose a time</option>'];
      for (let t = start; t <= end; t += CONFIG.slotMinutes) {
        if (isToday && t < nowMin) continue;
        const label = fmtTime(Math.floor(t / 60), t % 60);
        options.push(`<option${label === prev ? " selected" : ""}>${label}</option>`);
      }
      if (options.length === 1) options[0] = '<option value="">No slots left today — pick another date</option>';
      els.time.innerHTML = options.join("");
    };
    els.date.addEventListener("change", renderSlots);
    renderSlots();

    /* -- Mode switching --------------------------------------------- */
    const syncConditional = () => {
      const home = form.elements.location.value === "At my home";
      $$("[data-only]", form).forEach((el) => {
        const only = el.dataset.only;
        el.hidden = only === "home" ? !(mode === "book" && home) : only !== mode;
      });
    };

    const setMode = (next) => {
      mode = next;
      form.dataset.mode = next;
      els.switcher.dataset.mode = next;
      $$("[data-set-mode]", els.switcher).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setMode === next)));
      els.hint.textContent = COPY[next].hint;
      els.submit.textContent = COPY[next].submit;
      syncConditional();
      clearErrors();
    };

    els.switcher.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-set-mode]");
      if (btn) setMode(btn.dataset.setMode);
    });
    form.addEventListener("change", (e) => e.target.name === "location" && syncConditional());

    /* -- Links elsewhere on the page that preset the form ----------- */
    const showForm = () => {
      els.success.classList.add("hidden");
      form.classList.remove("hidden");
    };

    document.addEventListener("click", (e) => {
      const modeLink = e.target.closest("[data-mode-link]");
      const bookBtn = e.target.closest("[data-book]");
      if (modeLink) {
        showForm();
        setMode(modeLink.dataset.modeLink);
      }
      if (bookBtn) {
        e.preventDefault();
        showForm();
        els.service.value = bookBtn.dataset.book;
        clearError(els.service);
        document.getElementById("enquire").scrollIntoView({ behavior: "smooth" });
        setTimeout(() => $("#f-name", form).focus({ preventScroll: true }), 600);
      }
    });

    /* -- Validation ------------------------------------------------- */
    const phone = $("#f-phone", form);
    phone.addEventListener("input", () => {
      phone.value = phone.value.replace(/\D/g, "").slice(0, 10);
    });

    function showError(field) {
      field.setAttribute("aria-invalid", "true");
      document.getElementById(field.getAttribute("aria-describedby"))?.classList.add("is-visible");
    }
    function clearError(field) {
      field.removeAttribute("aria-invalid");
      document.getElementById(field.getAttribute("aria-describedby"))?.classList.remove("is-visible");
    }
    function clearErrors() {
      $$("[aria-describedby]", form).forEach(clearError);
    }

    form.addEventListener("input", (e) => {
      if (e.target.getAttribute("aria-invalid") === "true") clearError(e.target);
    });

    const validate = () => {
      const invalid = [];
      const check = (field, ok) => (ok ? clearError(field) : (showError(field), invalid.push(field)));

      check($("#f-name", form), form.elements.name.value.trim().length >= 2);
      check(phone, /^[6-9]\d{9}$/.test(phone.value));
      check(els.service, !!els.service.value);

      if (mode === "book") {
        check(els.date, !!els.date.value && els.date.value >= els.date.min);
        check(els.time, !!els.time.value);
        if (form.elements.location.value === "At my home") check(els.area, els.area.value.trim().length >= 3);
      }
      invalid[0]?.focus();
      return invalid.length === 0;
    };

    /* -- Submit ----------------------------------------------------- */
    const buildPayload = () => {
      const f = form.elements;
      const base = {
        type: mode === "book" ? "Booking" : "Walk-in",
        name: f.name.value.trim(),
        phone: `+91 ${f.phone.value}`,
        service: f.service.value,
        notes: f.notes.value.trim(),
      };
      if (mode === "book") {
        const date = new Date(`${f.date.value}T00:00`).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        return { ...base, when: `${date}, ${f.time.value}`, where: f.location.value, area: f.location.value === "At my home" ? f.area.value.trim() : "" };
      }
      return { ...base, when: `${f.day.value}, ${f.window.value.toLowerCase()}`, where: "At the studio" };
    };

    const toMessage = (p) =>
      [
        `Hi Spin, I'd like to ${p.type === "Booking" ? "book an appointment" : "walk in"}.`,
        "",
        `Name: ${p.name}`,
        `Phone: ${p.phone}`,
        `Service: ${p.service}`,
        `When: ${p.when}`,
        `Where: ${p.where}${p.area ? ` (${p.area})` : ""}`,
        p.notes ? `Notes: ${p.notes}` : null,
      ]
        .filter((line) => line !== null)
        .join("\n");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) return;

      const payload = buildPayload();
      const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(toMessage(payload))}`;

      if (CONFIG.endpoint) {
        els.submit.disabled = true;
        try {
          await fetch(CONFIG.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch {
          /* WhatsApp handoff below still delivers the enquiry */
        } finally {
          els.submit.disabled = false;
        }
      }

      window.open(waUrl, "_blank", "noopener");

      els.waLink.href = waUrl;
      els.successTitle.textContent = COPY[mode].done;
      form.classList.add("hidden");
      els.success.classList.remove("hidden");
      els.success.focus();
    });

    $("[data-reset]")?.addEventListener("click", () => {
      form.reset();
      renderSlots();
      setMode("book");
      showForm();
      $("#f-name", form).focus();
    });

    setMode("book");
  }

  /* ---------------------------------------------------------------- */
  function initYear() {
    const el = $("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  initHeader();
  initMenu();
  initOpenStatus();
  initTabs();
  initCarousels();
  initEnquiry();
  initYear();
})();
