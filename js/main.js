/* =============================================================
   Exksvol Contato — comportamento da página
   Sem dependências. Carregado com defer.
   ============================================================= */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('nav-toggle');
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));

  /* ---------- 1. Menu no mobile ---------- */
  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  }

  function openNav() {
    if (!nav || !toggle) return;
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) closeNav();
      else openNav();
    });

    // fecha ao escolher um destino
    nav.addEventListener('click', function (event) {
      if (event.target.closest('.nav__link')) closeNav();
    });

    // fecha ao clicar fora
    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) return;
      if (event.target.closest('#nav') || event.target.closest('#nav-toggle')) return;
      closeNav();
    });

    // fecha no Esc e devolve o foco ao botão
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });

    // volta ao estado de desktop se a janela crescer
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) closeNav();
    });
  }

  /* ---------- 2. Sombra do topo ao rolar ---------- */
  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle('is-stuck', window.scrollY > 8);
  }

  /* ---------- 3. Link ativo conforme a seção visível ---------- */
  var sections = links
    .map(function (link) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#' || id.length < 2) return null;
      var el = document.querySelector(id);
      return el ? { link: link, el: el } : null;
    })
    .filter(Boolean);

  function updateActiveLink() {
    if (!sections.length) return;

    // ponto de leitura: um terço abaixo do topo da janela
    var probe = window.scrollY + window.innerHeight / 3;
    var current = sections[0];

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].el.offsetTop <= probe) current = sections[i];
    }

    // no fim da página, marca sempre a última seção
    var atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;
    if (atBottom) current = sections[sections.length - 1];

    links.forEach(function (link) {
      link.classList.toggle('is-active', link === current.link);
    });
  }

  /* ---------- 4. Um único listener de scroll, com throttle ---------- */
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateHeaderState();
      updateActiveLink();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateActiveLink);

  updateHeaderState();
  updateActiveLink();

  /* ---------- 5. Modal de projeto ---------- */
  var modal = document.getElementById('project-modal');
  var carousel = document.getElementById('modal-carousel');
  var dotsWrap = document.getElementById('modal-dots');
  var moreBtn = document.getElementById('modal-more');
  var lastFocused = null;
  var slideTimer = null;
  var slideIndex = 0;

  if (modal && carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.modal__slide'));
    var dots = [];

    // monta os indicadores do carrossel a partir dos slides existentes.
    // Projetos sem foto rotativa (como o mockup de dispositivos) não têm
    // #modal-dots no HTML, então isso só roda quando há slide e wrapper.
    if (dotsWrap) {
      slides.forEach(function (slide, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Foto ' + (i + 1));
        if (i === 0) dot.classList.add('is-active');
        dot.addEventListener('click', function () { goToSlide(i); });
        dotsWrap.appendChild(dot);
      });
      dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('button'));
    }

    function goToSlide(i) {
      slides[slideIndex].classList.remove('is-active');
      dots[slideIndex].classList.remove('is-active');
      slideIndex = i;
      slides[slideIndex].classList.add('is-active');
      dots[slideIndex].classList.add('is-active');
    }

    function nextSlide() {
      goToSlide((slideIndex + 1) % slides.length);
    }

    function startCarousel() {
      if (!slides.length) return; // este projeto usa o mockup fixo, sem fotos rotativas
      stopCarousel();
      slideTimer = window.setInterval(nextSlide, 3800);
    }

    function stopCarousel() {
      if (slideTimer) { window.clearInterval(slideTimer); slideTimer = null; }
    }

    // Rodízio das telas do mockup (notebook e celular): cada uma cicla,
    // no seu próprio ritmo, pelas capturas que existirem dentro dela —
    // os dois giram soltos, sem precisar estar sincronizados.
    function makeScreenRotator(container, intervalMs) {
      if (!container) return { start: function () {}, stop: function () {} };
      var frames = Array.prototype.slice.call(container.querySelectorAll('.device-mock__slide'));
      var i = 0, timer = null;
      function show(next) {
        frames[i].classList.remove('is-active');
        i = next;
        frames[i].classList.add('is-active');
      }
      return {
        start: function () {
          if (frames.length < 2 || timer) return;
          timer = window.setInterval(function () { show((i + 1) % frames.length); }, intervalMs);
        },
        stop: function () {
          if (timer) { window.clearInterval(timer); timer = null; }
        },
        index: function () { return i; }
      };
    }
    var laptopRotator = makeScreenRotator(document.getElementById('mock-laptop'), 4200);
    var phoneRotator = makeScreenRotator(document.getElementById('mock-phone'), 3300);

    // ---------- Visualizador em tela cheia (clique numa tela do mockup) ----------
    var lightbox = document.getElementById('device-lightbox');
    var lbImg = document.getElementById('lb-img');
    var lbDotsWrap = document.getElementById('lb-dots');
    var lbPrevBtn = document.getElementById('lb-prev');
    var lbNextBtn = document.getElementById('lb-next');

    if (lightbox && lbImg) {
      var lbImages = [];
      var lbIndex = 0;
      var lbLastFocused = null;

      // as originais (sem a deformação de perspectiva) ficam mais nítidas
      // e mais fáceis de ler numa visualização grande
      var laptopPhotos = [
        'img/Notbook/img1.png',
        'img/Notbook/img2.png',
        'img/Notbook/img4.png'
      ];
      var phonePhotos = [
        'img/Celular/img1.jpeg',
        'img/Celular/img2.jpeg',
        'img/Celular/img3.jpeg',
        'img/Celular/img4.jpeg',
        'img/Celular/img5.jpeg'
      ];

      function renderLightbox() {
        lbImg.src = lbImages[lbIndex];
        Array.prototype.forEach.call(lbDotsWrap.children, function (dot, i) {
          dot.classList.toggle('is-active', i === lbIndex);
        });
      }

      function lbGoTo(i) {
        lbIndex = (i + lbImages.length) % lbImages.length;
        renderLightbox();
      }

      function openLightbox(images, startIndex, trigger) {
        lbLastFocused = trigger;
        lbImages = images;
        lbIndex = startIndex || 0;
        lbDotsWrap.innerHTML = '';
        images.forEach(function (_, i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.setAttribute('aria-label', 'Foto ' + (i + 1));
          dot.addEventListener('click', function () { lbGoTo(i); });
          lbDotsWrap.appendChild(dot);
        });
        renderLightbox();
        lightbox.hidden = false;
        laptopRotator.stop();
        phoneRotator.stop();
        lbPrevBtn.focus();
      }

      function closeLightbox() {
        lightbox.hidden = true;
        if (!modal.hidden) { laptopRotator.start(); phoneRotator.start(); }
        if (lbLastFocused) lbLastFocused.focus();
      }

      var mockLaptop = document.getElementById('mock-laptop');
      var mockPhone = document.getElementById('mock-phone');
      if (mockLaptop) mockLaptop.addEventListener('click', function () {
        openLightbox(laptopPhotos, laptopRotator.index(), mockLaptop);
      });
      if (mockPhone) mockPhone.addEventListener('click', function () {
        openLightbox(phonePhotos, phoneRotator.index(), mockPhone);
      });

      lbPrevBtn.addEventListener('click', function () { lbGoTo(lbIndex - 1); });
      lbNextBtn.addEventListener('click', function () { lbGoTo(lbIndex + 1); });
      lightbox.addEventListener('click', function (event) {
        if (event.target.closest('[data-lb-close]')) closeLightbox();
      });
      document.addEventListener('keydown', function (event) {
        if (lightbox.hidden) return;
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') lbGoTo(lbIndex - 1);
        if (event.key === 'ArrowRight') lbGoTo(lbIndex + 1);
      });
    }

    function openModal(trigger) {
      lastFocused = trigger;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      if (slides.length) goToSlide(0);
      startCarousel();
      laptopRotator.start();
      phoneRotator.start();
      var closeBtn = modal.querySelector('.modal__close');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = '';
      stopCarousel();
      laptopRotator.stop();
      phoneRotator.stop();
      if (lastFocused) lastFocused.focus();
    }

    Array.prototype.slice.call(document.querySelectorAll('.blade[data-project]')).forEach(function (blade) {
      blade.addEventListener('click', function () { openModal(blade); });
    });

    modal.addEventListener('click', function (event) {
      if (event.target.closest('[data-close]')) closeModal();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });

    // pausa a rotação automática enquanto o visitante examina uma foto
    carousel.addEventListener('mouseenter', stopCarousel);
    carousel.addEventListener('mouseleave', function () { if (!modal.hidden) startCarousel(); });

    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        var more = modal.querySelector('#modal-more-content');
        var expanded = !more.hidden;
        more.hidden = expanded;
        moreBtn.textContent = expanded ? 'Ver mais sobre esse projeto' : 'Ver menos';
      });
    }
  }
})();
