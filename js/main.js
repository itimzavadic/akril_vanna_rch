(function () {
  "use strict";

  var modal = document.querySelector("[data-modal]");
  var openBtns = document.querySelectorAll("[data-open-modal]");
  var closeEls = document.querySelectorAll("[data-close-modal]");
  var modalTitleEl = document.getElementById("modal-title");
  var lightbox = document.querySelector("[data-lightbox]");
  var lightboxImg = document.querySelector("[data-lightbox-img]");
  var lightboxLinks = document.querySelectorAll(".before-after__link");
  var lightboxCloseEls = document.querySelectorAll("[data-lightbox-close]");
  var lastActive = null;
  var lastLightboxActive = null;
  var pricesConfigPath = "txt/prices.json";

  function applyPrices(pricesData) {
    if (!pricesData || typeof pricesData !== "object") return;
    var prices = pricesData.prices;
    var currency = typeof pricesData.currency === "string" ? pricesData.currency.trim() : "BYN";
    if (!prices || typeof prices !== "object") return;

    document.querySelectorAll("[data-price-key]").forEach(function (priceEl) {
      var key = priceEl.getAttribute("data-price-key");
      if (!key) return;
      var value = prices[key];
      if (typeof value !== "number" && typeof value !== "string") return;
      var parsedValue = typeof value === "number" ? value : Number(String(value).replace(",", "."));
      if (!Number.isFinite(parsedValue)) return;
      priceEl.textContent = "от " + Math.round(parsedValue) + " " + currency;
    });
  }

  function initPrices() {
    if (!window.fetch) return;
    fetch(pricesConfigPath, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load prices JSON");
        }
        return response.json();
      })
      .then(function (data) {
        applyPrices(data);
      })
      .catch(function () {
        // Keep hardcoded prices in HTML as fallback.
      });
  }

  function openModal(fromBtn) {
    if (!modal) return;
    closeMobileMenu();
    lastActive = document.activeElement;
    if (fromBtn && modalTitleEl) {
      var t = fromBtn.getAttribute("data-modal-title");
      if (t) modalTitleEl.textContent = t;
    }
    modal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    var first = modal.querySelector("input, button");
    if (first) setTimeout(function () { first.focus(); }, 0);
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute("hidden", "hidden");
    document.body.style.overflow = "";
    if (lastActive && typeof lastActive.focus === "function") {
      lastActive.focus();
    }
  }

  function openLightbox(linkEl) {
    if (!lightbox || !lightboxImg || !linkEl) return;
    var src = linkEl.getAttribute("href");
    if (!src) return;
    var imgEl = linkEl.querySelector("img");
    lastLightboxActive = document.activeElement;
    lightboxImg.setAttribute("src", src);
    lightboxImg.setAttribute("alt", imgEl ? imgEl.getAttribute("alt") || "" : "");
    lightbox.removeAttribute("hidden");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImg) return;
    lightbox.setAttribute("hidden", "hidden");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.setAttribute("src", "");
    lightboxImg.setAttribute("alt", "");
    document.body.style.overflow = "";
    if (lastLightboxActive && typeof lastLightboxActive.focus === "function") {
      lastLightboxActive.focus();
    }
  }

  openBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(btn);
    });
  });
  closeEls.forEach(function (el) {
    el.addEventListener("click", closeModal);
  });
  lightboxLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openLightbox(link);
    });
  });
  lightboxCloseEls.forEach(function (el) {
    el.addEventListener("click", closeLightbox);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var mMenu = document.querySelector("[data-mobile-menu]");
    if (mMenu && !mMenu.hasAttribute("hidden")) {
      closeMobileMenu();
      return;
    }
    if (modal && !modal.hasAttribute("hidden")) {
      closeModal();
      return;
    }
    if (lightbox && !lightbox.hasAttribute("hidden")) {
      closeLightbox();
    }
  });

  var mobileMenu = document.querySelector("[data-mobile-menu]");
  var openNavBtn = document.querySelector("[data-nav-open]");
  var lastMenuFocus = null;

  function openMobileMenu() {
    if (!mobileMenu) return;
    lastMenuFocus = document.activeElement;
    mobileMenu.removeAttribute("hidden");
    if (openNavBtn) {
      openNavBtn.setAttribute("aria-expanded", "true");
    }
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.setAttribute("hidden", "hidden");
    if (openNavBtn) openNavBtn.setAttribute("aria-expanded", "false");
    if (lastMenuFocus && typeof lastMenuFocus.focus === "function") {
      lastMenuFocus.focus();
    }
  }

  if (openNavBtn) {
    openNavBtn.addEventListener("click", function () {
      if (mobileMenu && mobileMenu.hasAttribute("hidden")) openMobileMenu();
      else closeMobileMenu();
    });
  }
  document.querySelectorAll("[data-nav-link]").forEach(function (a) {
    a.addEventListener("click", function () {
      closeMobileMenu();
    });
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 900 && mobileMenu && !mobileMenu.hasAttribute("hidden")) {
      closeMobileMenu();
    }
  });

  // Плавающий звонок: слежение за #header-content (логотип+тел), иначе залипшая плашка #top в IO всегда «в кадре»
  var headerForFloat = document.getElementById("header-content");
  var floatPhone = document.getElementById("float-phone");
  var mqFloat = window.matchMedia("(max-width: 899px)");
  function setFloatPhoneVisible(isVisible) {
    if (!floatPhone) return;
    if (!mqFloat.matches) {
      floatPhone.classList.remove("float-phone--visible");
      floatPhone.setAttribute("aria-hidden", "true");
      return;
    }
    floatPhone.classList.toggle("float-phone--visible", isVisible);
    floatPhone.setAttribute("aria-hidden", isVisible ? "false" : "true");
  }
  function isHeaderGone() {
    if (!headerForFloat) return false;
    return headerForFloat.getBoundingClientRect().bottom <= 0;
  }
  if (headerForFloat && floatPhone) {
    if ("IntersectionObserver" in window) {
      var floatObs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            setFloatPhoneVisible(!e.isIntersecting);
          });
        },
        { root: null, rootMargin: "0px", threshold: 0 }
      );
      if (mqFloat.matches) floatObs.observe(headerForFloat);
      mqFloat.addEventListener("change", function () {
        if (mqFloat.matches) {
          floatObs.observe(headerForFloat);
        } else {
          floatObs.unobserve(headerForFloat);
        }
        setFloatPhoneVisible(false);
      });
    } else {
      var floatTick = function () {
        if (!mqFloat.matches) {
          setFloatPhoneVisible(false);
          return;
        }
        setFloatPhoneVisible(isHeaderGone());
      };
      window.addEventListener("scroll", floatTick, { passive: true });
      window.addEventListener("resize", floatTick);
      mqFloat.addEventListener("change", floatTick);
      floatTick();
    }
  }

  // Якоря: смещение только под реальную мешающую область. На мобайле шапка не full-width — большой
  // getAnchorOffset оставлял 60–100px вью золотыми, где виден «хвост» предыдущего блока.
  var anchorBufDesktop = 24;
  var anchorBufMobile = 10;
  var anchorScrollCorrectMs = 500;

  function getAnchorOffset() {
    if (window.innerWidth >= 900) {
      var t = document.getElementById("top");
      if (t) {
        var a = t.offsetHeight;
        var b = 0;
        try {
          b = t.getBoundingClientRect().height;
        } catch (e) {
          b = 0;
        }
        return Math.max(a, b) + anchorBufDesktop;
      }
      return 140;
    }
    // мобайл: кнопка в углу, не вся ширина — минимум, иначе сверху «лента» из низа чужой секции
    return anchorBufMobile;
  }

  function scrollToAnchor(el, useSmooth) {
    if (!el) return;
    if (el.id === "top") {
      window.scrollTo({ top: 0, left: 0, behavior: useSmooth ? "smooth" : "auto" });
      return;
    }
    var sy = function () {
      return window.pageYOffset != null
        ? window.pageYOffset
        : document.documentElement.scrollTop;
    };
    var step = function (smooth) {
      var y = el.getBoundingClientRect().top + sy();
      var t = y - getAnchorOffset();
      if (t < 0) t = 0;
      window.scrollTo({ top: t, left: 0, behavior: smooth ? "smooth" : "auto" });
    };
    step(!!useSmooth);
    if (useSmooth) {
      setTimeout(function () {
        step(false);
      }, anchorScrollCorrectMs);
    }
  }

  function onInPageLinkClick(e) {
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest("a[href^='#']");
    if (!a) return;
    if (a.getAttribute("data-open-modal") != null) return;
    if (a.getAttribute("data-no-anchor-scroll") != null) return;
    var href = a.getAttribute("href");
    if (!href || href === "#" || href.length < 2) return;
    var id = href.slice(1);
    if (!id) return;
    try {
      id = decodeURIComponent(id);
    } catch (e2) {
      return;
    }
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    closeMobileMenu();
    if (a.hasAttribute("data-nav-link")) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          scrollToAnchor(el, true);
          if (window.history && window.history.pushState) {
            window.history.pushState(null, "", href);
          } else {
            location.hash = id;
          }
        });
      });
    } else {
      scrollToAnchor(el, true);
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", href);
      } else {
        location.hash = id;
      }
    }
  }

  document.addEventListener("click", onInPageLinkClick, true);

  function applyHashOnLoad() {
    var h = location.hash;
    if (!h || h.length < 2) return;
    var id = h.slice(1);
    if (!id) return;
    try {
      id = decodeURIComponent(id);
    } catch (e) {
      return;
    }
    var el = document.getElementById(id);
    if (!el) return;
    setTimeout(function () {
      requestAnimationFrame(function () {
        scrollToAnchor(el, false);
      });
    }, 0);
  }
  if (location.hash) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyHashOnLoad);
    } else {
      applyHashOnLoad();
    }
  }

  window.addEventListener("hashchange", function () {
    var h = location.hash;
    if (!h || h.length < 2) {
      if (h === "" || h === "#") {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
      return;
    }
    var id = h.slice(1);
    if (!id) return;
    try {
      id = decodeURIComponent(id);
    } catch (e) {
      return;
    }
    if (id === "top" && document.getElementById("top")) {
      scrollToAnchor(document.getElementById("top"), true);
      return;
    }
    var el2 = document.getElementById(id);
    if (el2) scrollToAnchor(el2, true);
  });

  // Forms: без бэкенда — показ подтверждения
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var success = form.querySelector("[data-form-success]");
      if (success) {
        success.removeAttribute("hidden");
        form.reset();
      }
    });
  });

  // Год в футере
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());

  // Карусель отзывов
  var dataRoot = document.querySelector("[data-reviews]");
  var quote = document.querySelector("[data-carousel-quote] p");
  var prev = document.querySelector("[data-carousel-prev]");
  var next = document.querySelector("[data-carousel-next]");
  var dotsRoot = document.querySelector("[data-carousel-dots]");

  if (dataRoot && quote && prev && next) {
    var parts = Array.prototype.map.call(
      dataRoot.querySelectorAll("p"),
      function (p) { return p.textContent.replace(/\s+/g, " ").trim(); }
    );
    if (parts.length) {
      var i = 0;
      function show() {
        quote.textContent = parts[i];
        if (dotsRoot) {
          var dots = dotsRoot.querySelectorAll("button");
          dots.forEach(function (d, j) {
            d.classList.toggle("is-active", j === i);
          });
        }
      }
      if (dotsRoot && parts.length > 1) {
        parts.forEach(function (_, j) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "review-dot" + (j === 0 ? " is-active" : "");
          b.setAttribute("aria-label", "Отзыв " + (j + 1));
          b.addEventListener("click", function () {
            i = j;
            show();
          });
          dotsRoot.appendChild(b);
        });
      }
      show();
      prev.addEventListener("click", function () {
        i = (i - 1 + parts.length) % parts.length;
        show();
      });
      next.addEventListener("click", function () {
        i = (i + 1) % parts.length;
        show();
      });
    }
  }

  // FAQ-аккордеон: одна открыта
  var acc = document.querySelector("[data-accordion]");
  if (acc) {
    acc.querySelectorAll("[data-accordion-item]").forEach(function (item) {
      var trigger = item.querySelector("[data-accordion-btn]");
      var panel = item.querySelector("[data-accordion-panel]");
      if (!trigger || !panel) return;
      var content = panel.querySelector(".faq__content");
      trigger.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
        acc.querySelectorAll(".faq__item.is-open").forEach(function (o) {
          o.classList.remove("is-open");
          var t = o.querySelector("[data-accordion-btn]");
          var p = o.querySelector("[data-accordion-panel]");
          if (t) t.setAttribute("aria-expanded", "false");
          if (p) p.style.maxHeight = "0px";
        });
        if (!isOpen) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
          if (content) {
            var h = content.offsetHeight;
            panel.style.maxHeight = h + "px";
          }
        } else {
          trigger.setAttribute("aria-expanded", "false");
          panel.style.maxHeight = "0px";
        }
      });
    });
    // Пересчёт при ресайзе
    window.addEventListener("resize", function () {
      var open = acc.querySelector(".faq__item.is-open [data-accordion-panel]");
      if (open) {
        var c = open.querySelector(".faq__content");
        if (c) open.style.maxHeight = c.offsetHeight + "px";
      }
    });
  }

  initPrices();

})();
