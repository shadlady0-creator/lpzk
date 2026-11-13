(function () {
  "use strict";

  /* ---------- Меню на телефоне ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Гонка: зайчата против законов ---------- */
  var bunniesEl = document.getElementById("bunnies");
  var lawsEl = document.getElementById("laws");
  var start = Date.now();
  function tick() {
    var sec = (Date.now() - start) / 1000;
    bunniesEl.textContent = Math.floor(sec * 3.7).toLocaleString("ru-RU");
    // Дума принимает один закон примерно раз в 10 минут. В лучшем случае.
    lawsEl.textContent = Math.floor(sec / 600).toLocaleString("ru-RU");
  }
  tick();
  setInterval(tick, 250);

  /* ---------- Состав ---------- */
  var team = window.LPZK_TEAM || {};
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function renderTeam(id, list) {
    var el = document.getElementById(id);
    if (!el || !list) return;
    el.innerHTML = list.map(function (p) {
      var vacant = !p.name;
      var initials = vacant ? "?" : p.name.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2);
      return '<article class="person' + (vacant ? " person--vacant" : "") + '">' +
        '<div class="person__avatar" aria-hidden="true">' + esc(initials) + "</div>" +
        '<div class="person__role">' + esc(p.role) + "</div>" +
        '<div class="person__name">' + (vacant ? "Вакантно" : esc(p.name)) + "</div>" +
        '<div class="person__meta">' + esc(p.official || "") +
        (p.passport ? " · паспорт " + esc(p.passport) : "") + "</div>" +
        "</article>";
    }).join("");
  }
  renderTeam("team-leaders", team.leaders);
  renderTeam("team-council", team.council);
  renderTeam("team-commission", team.commission);

  /* ---------- Устав: поиск и раскрытие ---------- */
  var charter = document.getElementById("charter-body");
  var details = Array.prototype.slice.call(charter.querySelectorAll("details"));
  var toggleBtn = document.getElementById("charter-toggle");
  var search = document.getElementById("charter-search");
  var hint = document.getElementById("charter-hint");

  function updateToggleLabel() {
    var allOpen = details.every(function (d) { return d.open; });
    toggleBtn.textContent = allOpen ? "Свернуть всё" : "Развернуть всё";
  }
  toggleBtn.addEventListener("click", function () {
    var allOpen = details.every(function (d) { return d.open; });
    details.forEach(function (d) { d.open = !allOpen; });
    updateToggleLabel();
  });
  details.forEach(function (d) { d.addEventListener("toggle", updateToggleLabel); });

  var originals = new Map();
  charter.querySelectorAll("article p, article h4").forEach(function (n) { originals.set(n, n.innerHTML); });

  function runSearch() {
    var q = search.value.trim().toLowerCase();
    originals.forEach(function (html, n) { n.innerHTML = html; });
    charter.querySelectorAll("article").forEach(function (a) { a.hidden = false; });
    details.forEach(function (d) { d.hidden = false; });
    if (q.length < 2) { hint.hidden = true; return; }

    var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    var hits = 0;
    details.forEach(function (d) {
      var any = false;
      d.querySelectorAll("article").forEach(function (a) {
        var match = a.textContent.toLowerCase().indexOf(q) !== -1;
        a.hidden = !match;
        if (match) {
          any = true;
          a.querySelectorAll("p, h4").forEach(function (n) {
            if (n.textContent.toLowerCase().indexOf(q) !== -1) {
              hits++;
              n.innerHTML = n.textContent.replace(/[&<>]/g, function (c) {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
              }).replace(re, "<mark>$1</mark>");
            }
          });
        }
      });
      d.hidden = !any;
      d.open = any;
    });
    hint.hidden = false;
    hint.textContent = hits ? "Найдено совпадений: " + hits : "Ничего не найдено — попробуйте другое слово.";
    updateToggleLabel();
  }
  search.addEventListener("input", runSearch);

  /* ---------- Заявление о вступлении ---------- */
  var form = document.getElementById("join-form");
  var errEl = document.getElementById("form-error");
  var letterWrap = document.getElementById("letter-wrap");
  var letterEl = document.getElementById("letter");
  var copiedEl = document.getElementById("copied");

  function val(id) { return document.getElementById(id).value.trim(); }
  function today() {
    var d = new Date();
    return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = val("f-name"), passport = val("f-passport"), age = val("f-age"),
        phone = val("f-phone"), job = val("f-job"), mail = val("f-mail"), copy = val("f-copy");
    var problems = [];
    if (!name) problems.push("имя и фамилию");
    if (!passport) problems.push("номер паспорта");
    if (!age) problems.push("возраст");
    if (!mail) problems.push("почту");
    if (!copy) problems.push("ссылку на ксерокопию паспорта");
    if (problems.length) return showError("Укажите " + problems.join(", ") + ".");
    if (Number(age) < 18) return showError("Вступить в Партию можно с 18 лет (ст. 5 Устава). Подрастайте — мы подождём!");
    if (!document.getElementById("f-agree").checked) return showError("Подтвердите, что ознакомлены с Уставом и соответствуете условиям членства.");
    errEl.hidden = true;

    var text =
      "Председателю Либеральной партии зайцев и кроликов\n" +
      "От гражданина Российского Округа " + name + "\n\n" +
      "ЗАЯВЛЕНИЕ\n" +
      "о вступлении в Либеральную партию зайцев и кроликов\n\n" +
      "Я, " + name + ", прошу принять меня в члены Либеральной партии зайцев и кроликов.\n" +
      "С Уставом и программой Партии ознакомлен(а), их положения признаю и обязуюсь соблюдать. " +
      "Подтверждаю, что не являюсь членом иной политической партии, не признан(а) судом недееспособным(ой) " +
      "и не отбываю наказание в местах лишения свободы.\n\n" +
      "Сведения о заявителе:\n" +
      "1. Имя Фамилия: " + name + "\n" +
      "2. Номер паспорта: " + passport + "\n" +
      "3. Возраст: " + age + "\n" +
      "4. Номер телефона, при наличии: " + (phone || "—") + "\n" +
      "5. Место работы и должность (при наличии): " + (job || "—") + "\n" +
      "6. Почта: " + mail + "\n\n" +
      "К заявлению прикладываю:\n" +
      "1. Ксерокопия паспорта: " + copy + "\n\n" +
      "Дата: " + today() + "\n" +
      "Подпись: " + name;

    letterEl.textContent = text;
    letterWrap.hidden = false;
    copiedEl.textContent = "";
    letterWrap.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function showError(msg) {
    errEl.textContent = msg;
    errEl.hidden = false;
  }

  document.getElementById("copy-btn").addEventListener("click", function () {
    var text = letterEl.textContent;
    var done = function () { copiedEl.textContent = "Скопировано ✓"; };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { copiedEl.textContent = "Выделите текст и скопируйте вручную"; }
      document.body.removeChild(ta);
    }
  });

  document.getElementById("dl-btn").addEventListener("click", function () {
    var blob = new Blob(["﻿" + letterEl.textContent], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Заявление_ЛПЗК_" + (val("f-name").replace(/\s+/g, "_") || "кандидат") + ".txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
})();
