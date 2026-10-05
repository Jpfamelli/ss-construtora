/* =========================================================
   SS Construtora — interações
   O site funciona sem JS (todos os links de WhatsApp estão no
   HTML). Aqui entram: slides do hero com peças sendo assentadas,
   placa de obra, revelações, fitas de fotos, galeria, antes e
   depois guiado pela rolagem, cartão 3D, cursor e formulário.
   ========================================================= */
(() => {
  'use strict';

  const doc = document.documentElement;
  doc.classList.add('js');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const temIO = 'IntersectionObserver' in window;
  // modo de captura para conferência visual: ?shot=<id-da-seção>[&p=0..1][&slide=n]
  const qs = new URLSearchParams(location.search);
  const SHOT = qs.get('shot');
  if (SHOT !== null) doc.classList.add('shot');

  /* ---------- WhatsApp ---------- */
  const WA = { sandro: '5511997231696', samuel: '5511974822368' };
  const NOME = { sandro: 'Sandro', samuel: 'Samuel' };
  const waLink = (quem, msg) => `https://wa.me/${WA[quem] || WA.sandro}?text=${encodeURIComponent(msg)}`;
  // navegador embutido do Instagram/Facebook costuma barrar nova aba
  const embutido = /Instagram|FBAN|FBAV|FB_IAB|Line\//i.test(navigator.userAgent);
  if (embutido) $$('a[data-wa]').forEach(a => a.removeAttribute('target'));
  function abrirWA(url) {
    if (embutido) { location.href = url; return; }
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- trava de rolagem (menu e galeria) ---------- */
  let yTrava = 0, travas = 0;
  function travar(on) {
    const b = document.body;
    if (on) {
      if (travas++ > 0) return;
      yTrava = scrollY;
      Object.assign(b.style, { position: 'fixed', top: `-${yTrava}px`, left: '0', right: '0', width: '100%' });
    } else {
      if (travas === 0 || --travas > 0) return;
      Object.assign(b.style, { position: '', top: '', left: '', right: '', width: '' });
      scrollTo({ top: yTrava, behavior: 'instant' });
    }
  }

  /* ---------- topo ---------- */
  const topo = $('[data-topo]');
  const menuBtn = $('[data-menu-btn]');
  const menuMob = $('[data-menu-mobile]');
  let menuAberto = false, yAnt = scrollY, tickTopo = 0;
  function topoRolar() {
    tickTopo = 0;
    const y = scrollY;
    topo.classList.toggle('solido', y > 30 || menuAberto);
    // com a rolagem travada (menu, galeria) o scrollY é 0: não serve de referência
    if (travas > 0) return;
    if (!menuAberto) {
      if (y > 420 && y > yAnt + 6) topo.classList.add('recolhido');
      else if (y < yAnt - 6 || y < 420) topo.classList.remove('recolhido');
    }
    if (Math.abs(y - yAnt) > 6) yAnt = y;
  }
  addEventListener('scroll', () => { if (!tickTopo) tickTopo = requestAnimationFrame(topoRolar); }, { passive: true });
  topo.addEventListener('focusin', () => topo.classList.remove('recolhido'));
  topoRolar();

  function menu(abrir) {
    if (abrir === menuAberto) return;
    menuAberto = abrir;
    menuBtn.setAttribute('aria-expanded', String(abrir));
    menuMob.classList.toggle('aberto', abrir);
    doc.classList.toggle('menu-aberto', abrir);
    travar(abrir);
    topoRolar();
    if (abrir) setTimeout(() => $('a', menuMob)?.focus({ preventScroll: true }), 320);
  }
  menuBtn?.addEventListener('click', () => menu(!menuAberto));
  $$('a', menuMob).forEach(a => a.addEventListener('click', () => menu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuAberto) { menu(false); menuBtn.focus(); } });
  matchMedia('(min-width: 960px)').addEventListener?.('change', e => { if (e.matches) menu(false); });

  // item do menu da seção visível
  const linksMenu = $$('.menu a');
  if (temIO) {
    const ioMenu = new IntersectionObserver(ents => ents.forEach(en => {
      if (!en.isIntersecting) return;
      linksMenu.forEach(a => {
        if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(s => ioMenu.observe(s));
  }

  /* ---------- títulos: máscara palavra a palavra ---------- */
  function dividir(el) {
    let i = 0;
    const andar = no => {
      Array.from(no.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(parte => {
            if (!parte) return;
            if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(' ')); return; }
            const p = document.createElement('span'); p.className = 'p';
            const s = document.createElement('span'); s.textContent = parte; s.style.setProperty('--i', i++);
            p.appendChild(s); frag.appendChild(p);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') andar(n);
      });
    };
    andar(el);
    el.classList.add('armado');
  }
  if (!reduz) $$('[data-split]').forEach(dividir);

  /* ---------- revelar ao rolar (com salvaguarda) ---------- */
  const alvos = [...$$('.revela'), ...$$('.titulo.armado'), ...$$('[data-passos]')];
  if (SHOT !== null) alvos.forEach(el => el.classList.add('in'));
  else if (temIO && !reduz) {
    const ioRev = new IntersectionObserver(ents => ents.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); ioRev.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    alvos.forEach(el => ioRev.observe(el));
    const salvaguarda = () => {
      const lim = innerHeight * 1.02;
      alvos.forEach(el => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < lim) el.classList.add('in'); });
    };
    setTimeout(salvaguarda, 2800);
    let tSalva = 0;
    addEventListener('scroll', () => { clearTimeout(tSalva); tSalva = setTimeout(salvaguarda, 450); }, { passive: true });
  } else alvos.forEach(el => el.classList.add('in'));

  /* ---------- entrada sutil das fotografias de obra ---------- */
  const cenas = $$('[data-cinema]');
  if (SHOT !== null || !temIO || reduz) cenas.forEach(el => el.classList.add('in'));
  else {
    const ioCinema = new IntersectionObserver(ents => ents.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); ioCinema.unobserve(en.target); }
    }), { threshold: .18 });
    cenas.forEach(el => ioCinema.observe(el));
  }

  /* ---------- HERO: fotos das obras + placa ---------- */
  const SLIDES = [
    { src: 'img/hero/escada-noite.webp', w: 1440, h: 1440, fx: .5, fy: .5, mfx: .36, mfy: .5, obra: 'Escada flutuante com LED', local: 'Santo André · SP', ano: '2025', alvo: '#obra-santo-andre' },
    { src: 'img/hero/piscina-salao.webp', w: 1440, h: 1440, fx: .5, fy: .6, mfx: .5, mfy: .5, obra: 'Piscina e salão de festas', local: 'Suzano · SP', ano: '2025', alvo: '#obra-suzano' },
    { src: 'img/hero/jardim-noite.webp', w: 1440, h: 1440, fx: .5, fy: .62, mfx: .42, mfy: .5, obra: 'Muro e jardim iluminados', local: 'Santo André · SP', ano: '2025', alvo: '#obra-santo-andre' },
    { src: 'img/hero/bloquete.webp', w: 1440, h: 1440, fx: .5, fy: .58, mfx: .52, mfy: .5, obra: 'Caminhos em bloquete', local: 'Suzano · SP', ano: '2024', alvo: '#obra-suzano' },
  ];

  const hero = (() => {
    const sec = $('[data-hero]');
    if (!sec) return null;
    const kb = $('.hero-kb', sec), base = $('.hero-base', sec), pisos = $('.hero-pisos', sec);
    const placa = $('[data-placa]', sec);
    const barra = $('.placa-barra i', placa);
    const nEl = $('[data-placa-n]', placa);
    const link = $('[data-placa-link]', placa);
    const campos = $$('[data-campo]', placa);
    const btnPausa = $('[data-hero-pausa]', placa);
    const DUR = 7000, PASSO = 52, DUR_PECA = 640;
    let atual = 0, ocupado = false, timer = 0, visivel = true, iniciado = false, pausado = reduz || SHOT !== null;

    $('[data-placa-total]', placa).textContent = String(SLIDES.length).padStart(2, '0');
    placa.style.setProperty('--dur', DUR + 'ms');
    if (pausado) { placa.classList.add('parada'); btnPausa.setAttribute('aria-label', 'Retomar a troca de fotos'); }

    const cache = new Map();
    const carregar = i => {
      if (!cache.has(i)) cache.set(i, new Promise(res => {
        const im = new Image();
        im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(res);
        im.onerror = res;
        im.src = SLIDES[i].src;
      }));
      return cache.get(i);
    };
    const quadros = n => new Promise(res => { const f = k => (k ? requestAnimationFrame(() => f(k - 1)) : res()); f(n); });

    function geo(sl) {
      const cw = kb.clientWidth, ch = kb.clientHeight;
      const retrato = ch > cw * 1.05;
      const fx = retrato ? sl.mfx : sl.fx, fy = retrato ? sl.mfy : sl.fy;
      const s = Math.max(cw / sl.w, ch / sl.h);
      const bw = sl.w * s, bh = sl.h * s;
      return { cw, ch, bw, bh, fx, fy, ox: (cw - bw) * fx, oy: (ch - bh) * fy };
    }
    function posicionar(sl) {
      const g = geo(sl);
      base.style.backgroundPosition = `${g.fx * 100}% ${g.fy * 100}%`;
      base.style.transformOrigin = `${g.fx * 100}% ${g.fy * 100}%`;
    }
    function pintar(sl) {
      base.style.backgroundImage = `url("${sl.src}")`;
      posicionar(sl);
      base.style.animation = 'none'; void base.offsetWidth; base.style.animation = '';
    }
    function escrever(dd, txt) {
      dd.textContent = '';
      let i = 0;
      const palavras = txt.split(' ');
      palavras.forEach((pal, k) => {
        const w = document.createElement('span'); w.className = 'palavra';
        for (const ch of pal) {
          const c = document.createElement('span'); c.className = 'letra'; c.textContent = ch;
          c.style.setProperty('--i', i++); w.appendChild(c);
        }
        dd.appendChild(w);
        if (k < palavras.length - 1) dd.appendChild(document.createTextNode(' '));
      });
    }
    function placaPara(sl, i) {
      nEl.textContent = String(i + 1).padStart(2, '0');
      campos.forEach(dd => escrever(dd, sl[dd.dataset.campo]));
      link.setAttribute('href', sl.alvo);
    }
    function correrBarra() {
      barra.classList.remove('corre'); void barra.offsetWidth;
      if (!pausado) barra.classList.add('corre');
    }
    function agendar() {
      clearTimeout(timer);
      if (pausado || !visivel || !iniciado || document.hidden) return;
      timer = setTimeout(() => ir(atual + 1), DUR);
    }

    // a próxima foto entra peça por peça, do canto de baixo à esquerda,
    // com niveladores nos cruzamentos — como piso sendo assentado
    function assentar(sl) {
      return new Promise(res => {
        const g = geo(sl);
        const lado = g.cw < 700 ? 105 : 170;
        const cols = Math.max(3, Math.round(g.cw / lado));
        const rows = Math.max(3, Math.round(g.ch / lado));
        const xs = Array.from({ length: cols + 1 }, (_, i) => Math.round(i * g.cw / cols));
        const ys = Array.from({ length: rows + 1 }, (_, j) => Math.round(j * g.ch / rows));
        const frag = document.createDocumentFragment();
        const pecas = [], nivs = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const el = document.createElement('div');
          el.className = 'piso';
          const x = xs[c], y = ys[r];
          el.style.cssText = `left:${x}px;top:${y}px;width:${xs[c + 1] - x}px;height:${ys[r + 1] - y}px;` +
            `background-image:url("${sl.src}");background-size:${g.bw}px ${g.bh}px;background-position:${g.ox - x}px ${g.oy - y}px;` +
            `transition-delay:${Math.round((c + rows - 1 - r) * PASSO + Math.random() * 45)}ms`;
          frag.appendChild(el); pecas.push(el);
        }
        for (let r = 1; r < rows; r++) for (let c = 1; c < cols; c++) {
          const n = document.createElement('i');
          n.className = 'nivelador';
          n.style.cssText = `left:${xs[c]}px;top:${ys[r]}px;transition-delay:${Math.max(0, (c - 1 + rows - 1 - r) * PASSO - 40)}ms`;
          frag.appendChild(n); nivs.push(n);
        }
        pisos.appendChild(frag);
        const total = (cols + rows - 2) * PASSO + 45 + DUR_PECA;
        quadros(2).then(() => {
          pecas.forEach(p => p.classList.add('assentado'));
          nivs.forEach(n => n.classList.add('on'));
        });
        setTimeout(() => nivs.forEach((n, k) => { n.style.transitionDelay = `${(k % 6) * 35}ms`; n.classList.remove('on'); }), total - 100);
        setTimeout(res, total + 420);
      });
    }

    async function ir(i) {
      if (ocupado) return;
      const prox = (i + SLIDES.length) % SLIDES.length;
      if (prox === atual) return;
      ocupado = true;
      clearTimeout(timer);
      await carregar(prox);
      const sl = SLIDES[prox];
      placaPara(sl, prox);
      if (!reduz && visivel) {
        await assentar(sl);
        pintar(sl);
        await quadros(2);
        pisos.textContent = '';
      } else pintar(sl);
      atual = prox;
      ocupado = false;
      correrBarra();
      agendar();
      carregar((prox + 1) % SLIDES.length);
    }

    $$('[data-hero-ir]', placa).forEach(b => b.addEventListener('click', () => ir(atual + Number(b.dataset.heroIr))));
    btnPausa.addEventListener('click', () => {
      pausado = !pausado;
      placa.classList.toggle('parada', pausado);
      btnPausa.setAttribute('aria-label', pausado ? 'Retomar a troca de fotos' : 'Pausar a troca de fotos');
      if (pausado) clearTimeout(timer);
      else { correrBarra(); agendar(); }
    });

    if (temIO) new IntersectionObserver(([en]) => {
      visivel = en.isIntersecting;
      placa.classList.toggle('fora', !visivel);
      if (visivel && iniciado) { correrBarra(); agendar(); } else clearTimeout(timer);
    }, { threshold: .15 }).observe(sec);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimeout(timer);
      else if (visivel && iniciado) { correrBarra(); agendar(); }
    });
    let tRes = 0;
    addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(() => posicionar(SLIDES[atual]), 120); });

    // paralaxe leve seguindo o mouse
    if (fino && !reduz) {
      let tx = 0, ty = 0, px = 0, py = 0, rodando = false;
      const passo = () => {
        px += (tx - px) * .06; py += (ty - py) * .06;
        kb.style.translate = `${px.toFixed(2)}px ${py.toFixed(2)}px`;
        if (Math.abs(tx - px) > .05 || Math.abs(ty - py) > .05) requestAnimationFrame(passo); else rodando = false;
      };
      sec.addEventListener('pointermove', e => {
        const r = sec.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - .5) * -20;
        ty = ((e.clientY - r.top) / r.height - .5) * -14;
        if (!rodando) { rodando = true; requestAnimationFrame(passo); }
      });
    }

    return {
      iniciar() {
        if (iniciado) return;
        iniciado = true;
        const s0 = Number(qs.get('slide') || 1) - 1;
        if (s0 > 0 && SLIDES[s0]) { atual = s0; pintar(SLIDES[s0]); placaPara(SLIDES[s0], s0); }
        posicionar(SLIDES[atual]);
        correrBarra();
        agendar();
        carregar(1);
      },
    };
  })();

  /* ---------- abertura: piso escuro que sai peça por peça ---------- */
  // espera fontes + 1ª foto (sem piscar o título), com teto de tempo; usa
  // setTimeout/setInterval (rAF para em aba de fundo)
  const comPre = doc.classList.contains('pre-on');
  const pronto = () => { doc.classList.add('pronto'); hero?.iniciar(); };
  if (!comPre) setTimeout(pronto, 60);
  else (() => {
    const pre = $('.pre');
    // JS atrasado (celular lento): a rede de segurança do CSS já está tirando a
    // abertura; em vez de montar o piso de novo, ela some de uma vez
    const rede = pre.getAnimations ? pre.getAnimations().find(a => a.animationName === 'preSai') : null;
    const nav = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    const ja = Math.max((rede && rede.currentTime) || 0, nav ? performance.now() - nav.responseStart : 0);
    if (ja > 2400 || (rede && rede.playState === 'finished')) {
      pre.style.transition = 'opacity .35s ease';
      pre.style.opacity = '0';
      pronto();
      setTimeout(() => doc.classList.remove('pre-on'), 400);
      return;
    }
    const grade = $('.pre-pisos', pre);
    const pctEl = $('[data-pre-pct]', pre), barraEl = $('[data-pre-barra]', pre);
    const lado = innerWidth < 700 ? 96 : 150;
    const cols = Math.max(3, Math.round(innerWidth / lado)), rows = Math.max(3, Math.round(innerHeight / lado));
    const frag = document.createDocumentFragment();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const p = document.createElement('i');
      p.className = 'pre-piso';
      p.style.cssText = `left:${c * 100 / cols}%;top:${r * 100 / rows}%;width:${100 / cols + .1}%;height:${100 / rows + .1}%;--d:${Math.round((r + (cols - 1 - c)) * 34 + Math.random() * 40)}ms`;
      frag.appendChild(p);
    }
    grade.appendChild(frag);
    pre.classList.add('com-pisos');
    pre.style.animationDelay = '6s'; // o JS assumiu: a rede de segurança do CSS fica só para o pior caso
    const inicio = Date.now();
    let alvo = 86, mostrado = 0, fim = false;
    const tick = setInterval(() => {
      const lim = fim ? 100 : Math.min(alvo, (Date.now() - inicio) / 12);
      mostrado += (lim - mostrado) * (fim ? .5 : .25);
      if (fim && mostrado > 99.4) mostrado = 100;
      pctEl.textContent = Math.round(mostrado);
      barraEl.style.setProperty('--p', (mostrado / 100).toFixed(3));
    }, 40);
    const img = new Image();
    const foto = new Promise(res => { img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(res); img.onerror = res; img.src = 'img/hero/escada-noite.webp'; });
    const fontes = document.fonts ? document.fonts.ready : Promise.resolve();
    // tempos contados desde a chegada do HTML, não desde a execução do script
    const minimo = new Promise(r => setTimeout(r, Math.max(500, 1150 - ja)));
    const teto = new Promise(r => setTimeout(r, Math.max(900, 2700 - ja)));
    Promise.race([Promise.all([foto, fontes, minimo]), teto]).then(() => {
      fim = true;
      setTimeout(() => {
        clearInterval(tick);
        pctEl.textContent = '100'; barraEl.style.setProperty('--p', '1');
        pre.classList.add('sai');
        setTimeout(pronto, 180);
        setTimeout(() => { doc.classList.remove('pre-on'); pre.classList.remove('sai', 'com-pisos'); grade.textContent = ''; }, (cols + rows) * 34 + 900);
      }, 260);
    });
  })();

  /* ---------- serviços: foto seguindo o mouse ---------- */
  const previa = $('.previa');
  if (previa && fino && !reduz) {
    const pimg = $('img', previa);
    let tx = 0, ty = 0, px = 0, py = 0, on = false, raf = 0;
    const loop = () => {
      px += (tx - px) * .16; py += (ty - py) * .16;
      const rot = clamp((tx - px) * .06, -9, 9);
      const x = Math.min(px + 30, innerWidth - 300), y = clamp(py - 175, 8, innerHeight - 360);
      previa.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      raf = (on || Math.abs(tx - px) > .5 || Math.abs(ty - py) > .5) ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    $$('.servico[data-preview]').forEach(li => {
      const src = li.dataset.preview;
      li.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse') return;
        if (pimg.getAttribute('src') !== src) pimg.src = src;
        if (!on && !previa.classList.contains('on')) { px = tx = e.clientX; py = ty = e.clientY; }
        on = true;
        previa.classList.add('on');
        if (!raf) raf = requestAnimationFrame(loop);
      });
      li.addEventListener('pointerleave', () => { on = false; previa.classList.remove('on'); });
    });
  }

  /* ---------- diário da obra: fitas arrastáveis ---------- */
  $$('[data-diario]').forEach(d => {
    const trilho = $('.diario-trilho', d);
    const prog = $('.diario-prog i', d);
    const [ant, prox] = $$('.diario-btn', d);
    const medir = () => {
      const max = trilho.scrollWidth - trilho.clientWidth;
      const frac = trilho.scrollWidth ? trilho.clientWidth / trilho.scrollWidth : 1;
      const pos = max > 0 ? trilho.scrollLeft / max : 0;
      prog.style.width = (frac * 100).toFixed(2) + '%';
      prog.style.transform = `translateX(${(pos * (1 / frac - 1) * 100).toFixed(2)}%)`;
      ant.disabled = trilho.scrollLeft <= 4;
      prox.disabled = trilho.scrollLeft >= max - 4;
    };
    trilho.addEventListener('scroll', medir, { passive: true });
    addEventListener('resize', medir);
    addEventListener('load', medir);
    medir();
    [ant, prox].forEach(b => b.addEventListener('click', () => {
      trilho.scrollBy({ left: Number(b.dataset.dir) * trilho.clientWidth * .8, behavior: reduz ? 'auto' : 'smooth' });
    }));

    let x0 = 0, s0 = 0, ativo = false, arrastou = false, vel = 0, ultX = 0, ultT = 0;
    trilho.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      ativo = true; arrastou = false; vel = 0;
      x0 = ultX = e.clientX; s0 = trilho.scrollLeft; ultT = performance.now();
    });
    addEventListener('pointermove', e => {
      if (!ativo) return;
      const dx = e.clientX - x0;
      if (!arrastou && Math.abs(dx) > 6) { arrastou = true; trilho.classList.add('arrastando'); }
      if (!arrastou) return;
      trilho.scrollLeft = s0 - dx;
      const t = performance.now();
      vel = (e.clientX - ultX) / Math.max(1, t - ultT);
      ultX = e.clientX; ultT = t;
    });
    addEventListener('pointerup', () => {
      if (!ativo) return;
      ativo = false;
      if (!arrastou) return;
      trilho.classList.remove('arrastando');
      if (!reduz && Math.abs(vel) > .25) trilho.scrollBy({ left: -vel * 280, behavior: 'smooth' });
      const bloqueia = ev => { ev.preventDefault(); ev.stopPropagation(); };
      trilho.addEventListener('click', bloqueia, { capture: true, once: true });
      setTimeout(() => trilho.removeEventListener('click', bloqueia, { capture: true }), 80);
    });
    trilho.addEventListener('dragstart', e => e.preventDefault());
  });

  /* ---------- galeria em tela cheia ---------- */
  const lb = $('[data-lb]');
  if (lb) {
    const img = $('[data-lb-img]', lb), leg = $('[data-lb-leg]', lb), cont = $('[data-lb-cont]', lb);
    const fechar = $('[data-lb-fechar]', lb), palco = $('[data-lb-palco]', lb);
    let lista = [], idx = 0, voltar = null, aberto = false;
    const mostrar = i => {
      idx = (i + lista.length) % lista.length;
      const it = lista[idx];
      img.classList.remove('ok');
      img.onload = () => img.classList.add('ok');
      img.src = it.src; img.alt = it.leg;
      if (img.complete && img.naturalWidth) img.classList.add('ok');
      leg.textContent = it.leg;
      cont.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(lista.length).padStart(2, '0')}`;
      [1, -1].forEach(k => { const n = lista[(idx + k + lista.length) % lista.length]; if (n) new Image().src = n.src; });
    };
    const abrir = btn => {
      const grupo = $$(`[data-galeria="${btn.dataset.galeria}"]`);
      lista = grupo.map(b => ({ src: b.dataset.full, leg: b.dataset.leg }));
      voltar = btn; aberto = true;
      lb.hidden = false; void lb.offsetWidth; lb.classList.add('aberto');
      mostrar(grupo.indexOf(btn));
      fechar.focus({ preventScroll: true });
      // trava a página por baixo só depois do primeiro quadro (evita engasgo ao abrir)
      requestAnimationFrame(() => { if (aberto) travar(true); });
    };
    const fecharLb = () => {
      if (!aberto) return;
      aberto = false;
      lb.classList.remove('aberto');
      if (travas > 0) travar(false);
      setTimeout(() => { if (!aberto) { lb.hidden = true; img.removeAttribute('src'); } }, 360);
      voltar?.focus({ preventScroll: true });
    };
    document.addEventListener('click', e => { const b = e.target.closest('[data-galeria]'); if (b) abrir(b); });
    fechar.addEventListener('click', fecharLb);
    $$('[data-lb-dir]', lb).forEach(b => b.addEventListener('click', () => mostrar(idx + Number(b.dataset.lbDir))));
    lb.addEventListener('click', e => { if (e.target === palco || e.target === lb) fecharLb(); });
    addEventListener('keydown', e => {
      if (!aberto) return;
      if (e.key === 'Escape') fecharLb();
      else if (e.key === 'ArrowRight') mostrar(idx + 1);
      else if (e.key === 'ArrowLeft') mostrar(idx - 1);
      else if (e.key === 'Tab') {
        const f = $$('button', lb).filter(b => b.offsetParent !== null);
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    let sx = null;
    palco.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') sx = e.clientX; });
    palco.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 45) mostrar(idx + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- antes e depois: peças assentadas pela rolagem ---------- */
  (() => {
    const sec = $('[data-ad]');
    if (!sec) return;
    const pista = $('.ad-pista', sec), cont = $('.ad-pisos', sec), base = $('[data-ad-base]', sec);
    const etiqueta = $('[data-etiqueta]', sec), medidor = $('[data-medidor]', sec), barraM = $('[data-medidor-barra]', sec);
    const btns = $$('[data-ad-ir]', sec);
    const abas = $$('[data-ad-aba]', sec);
    const foto = $('.ad-foto', sec);
    const campos = { desc: $('[data-ad-desc]', sec), quote: $('[data-ad-quote]', sec), cite: $('[data-ad-cite]', sec), leg: $('[data-ad-leg]', sec) };
    // três transformações reais, todas das fotos publicadas pela SS
    const PARES = [
      { antes: 'img/obras/banheiro-antes.webp', depois: 'img/obras/banheiro-depois.webp',
        rotA: 'Antes: banheiro demolido, com paredes no reboco e entulho no chão',
        rotD: 'Depois: banheiro pronto, com revestimento marmorizado do piso ao teto, box de vidro e gabinete com cuba',
        desc: 'Um banheiro refeito do zero: do cômodo demolido ao revestimento marmorizado do piso ao teto, com box de vidro, gabinete com cuba de apoio e luz embutida. Role a página e veja as peças sendo assentadas.',
        quote: '“Aquele antes e depois que é lindo de se ver 💪”', cite: 'Legenda no Instagram · 06/01/2024', leg: 'Reforma de banheiro · jan/2024' },
      { antes: 'img/obras/escada-antes.webp', depois: 'img/obras/escada-depois.webp',
        rotA: 'Antes: degraus em concreto recém-desformados, com terra e entulho em volta',
        rotD: 'Depois: escada flutuante pronta ao lado da casa com pergolado, com grama e piso intertravado',
        desc: 'Em Santo André, os degraus em balanço saíram da fôrma de madeira no meio do barro e viraram a escada flutuante ao lado do pergolado, com grama e piso intertravado.',
        quote: '“Obra de Santo André 🙏”', cite: 'Legenda no Instagram · 06/06/2025', leg: 'Escada flutuante · Santo André · 2025' },
      { antes: 'img/obras/caminho-antes.webp', depois: 'img/obras/caminho-depois.webp',
        rotA: 'Antes: caminho em bloquete recém-assentado, com terra exposta nas laterais',
        rotD: 'Depois: o mesmo caminho com a grama fechada e canteiros floridos',
        desc: 'O mesmo caminho em Suzano, fotografado duas vezes: em agosto de 2024, com o bloquete recém-assentado, e em junho de 2025, com a grama fechada e os canteiros floridos.',
        quote: '“Bloquetes. Obra Suzano”', cite: 'Legendas no Instagram · 10/08/2024 e 06/06/2025', leg: 'Caminho em bloquete · Suzano · 2024 → 2025' },
    ];
    let par = PARES[0];
    const COLS = 5, ROWS = 6;
    const max = COLS + ROWS - 2;
    const pecas = [], nivs = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const el = document.createElement('div');
      el.className = 'ad-piso';
      el.style.cssText = `left:${c * 100 / COLS}%;top:${r * 100 / ROWS}%;width:${100 / COLS + .06}%;height:${100 / ROWS + .06}%;` +
        `background-image:url("${par.depois}");background-size:${COLS * 100}% ${ROWS * 100}%;background-position:${c / (COLS - 1) * 100}% ${r / (ROWS - 1) * 100}%`;
      cont.appendChild(el);
      pecas.push({ el, o: (c + ROWS - 1 - r) / max });
    }
    for (let r = 1; r < ROWS; r++) for (let c = 1; c < COLS; c++) {
      const n = document.createElement('i');
      n.className = 'ad-nivel';
      n.style.left = `${c * 100 / COLS}%`; n.style.top = `${r * 100 / ROWS}%`;
      cont.appendChild(n);
      nivs.push({ el: n, o: (c - .5 + ROWS - .5 - r) / max });
    }
    let ultimo = -1;
    const desenhar = p => {
      if (Math.abs(p - ultimo) < .0008) return;
      ultimo = p;
      let feitas = 0;
      for (const { el, o } of pecas) {
        const t = clamp((p - .04 - o * .78) / .12, 0, 1);
        if (t >= 1) feitas++;
        el.style.opacity = t.toFixed(3);
        el.style.transform = t >= 1 ? 'none' : `translate3d(0, ${((1 - t) * -12).toFixed(2)}px, 0) scale(${(1 + (1 - t) * .06).toFixed(3)})`;
      }
      for (const { el, o } of nivs) {
        const a = clamp((p - o * .78 + .02) / .06, 0, 1) * (1 - clamp((p - .9) / .06, 0, 1));
        el.style.opacity = a.toFixed(3);
      }
      const frac = feitas / pecas.length;
      cont.classList.toggle('completo', frac >= 1);
      medidor.textContent = Math.round(frac * 100) + '%';
      barraM.style.setProperty('--p', frac.toFixed(3));
      etiqueta.textContent = frac >= 1 ? 'Depois' : (p > .02 ? 'Em obra' : 'Antes');
      const depois = p >= .5;
      btns[0].setAttribute('aria-pressed', String(!depois));
      btns[1].setAttribute('aria-pressed', String(depois));
      base.setAttribute('aria-label', depois ? par.rotD : par.rotA);
    };
    // troca de obra pelas abas: pré-carrega as duas fotos e redesenha no mesmo ponto da rolagem
    const cache = {};
    const carregar = src => cache[src] || (cache[src] = new Promise(res => { const i = new Image(); i.onload = i.onerror = res; i.src = src; }));
    const trocar = async (i, foco) => {
      const novo = PARES[i];
      if (!novo || novo === par) return;
      abas.forEach((a, k) => { a.setAttribute('aria-selected', String(k === i)); a.tabIndex = k === i ? 0 : -1; });
      if (foco) abas[i].focus();
      await Promise.all([carregar(novo.antes), carregar(novo.depois)]);
      par = novo;
      base.style.backgroundImage = `url("${par.antes}")`;
      pecas.forEach(({ el }) => { el.style.backgroundImage = `url("${par.depois}")`; });
      campos.desc.textContent = par.desc;
      campos.quote.textContent = par.quote;
      campos.cite.textContent = par.cite;
      campos.leg.textContent = par.leg;
      foto.classList.remove('trocando'); void foto.offsetWidth; foto.classList.add('trocando');
      ultimo = -1;
      desenhar(reduz ? (btns[1].getAttribute('aria-pressed') === 'true' ? 1 : 0) : progresso());
    };
    abas.forEach((a, i) => {
      a.tabIndex = i === 0 ? 0 : -1;
      a.addEventListener('click', () => trocar(i));
      a.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        trocar((i + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length, true);
      });
    });
    // as outras duas obras só baixam quando o visitante se aproxima da seção
    const preCarregar = () => PARES.slice(1).forEach(p => { carregar(p.antes); carregar(p.depois); });
    if (temIO) new IntersectionObserver((ents, o) => { if (ents.some(en => en.isIntersecting)) { o.disconnect(); preCarregar(); } }, { rootMargin: '1500px 0px' }).observe(sec);
    else setTimeout(preCarregar, 4000);
    const progresso = () => {
      const r = pista.getBoundingClientRect();
      const total = r.height - innerHeight;
      return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    };
    let raf = 0, ativo = false;
    const agenda = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; desenhar(progresso()); }); };
    if (!reduz) {
      if (temIO) new IntersectionObserver(([en]) => { ativo = en.isIntersecting; if (ativo) agenda(); }).observe(pista);
      else ativo = true;
      addEventListener('scroll', () => { if (ativo) agenda(); }, { passive: true });
      addEventListener('resize', agenda);
      desenhar(progresso());
    } else desenhar(0);
    btns.forEach(b => b.addEventListener('click', () => {
      const alvo = Number(b.dataset.adIr);
      if (reduz) { desenhar(alvo); return; }
      const topoPista = pista.getBoundingClientRect().top + scrollY;
      scrollTo({ top: alvo ? topoPista + pista.offsetHeight - innerHeight + 2 : topoPista, behavior: 'smooth' });
    }));
  })();

  /* ---------- quem somos: os dois S se encontram ---------- */
  const acro = $('[data-acrostico]');
  if (acro && !reduz) {
    const [l1, l2] = $$('span[aria-hidden]', acro);
    let raf = 0, ativo = !temIO;
    const upd = () => {
      raf = 0;
      const r = acro.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight * .9), 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      l1.style.transform = `translate3d(${((1 - e) * -16).toFixed(2)}vw, 0, 0)`;
      l2.style.transform = `translate3d(${((1 - e) * 16).toFixed(2)}vw, 0, 0)`;
    };
    if (temIO) new IntersectionObserver(([en]) => { ativo = en.isIntersecting; if (ativo && !raf) raf = requestAnimationFrame(upd); }, { rootMargin: '15% 0px' }).observe(acro);
    addEventListener('scroll', () => { if (ativo && !raf) raf = requestAnimationFrame(upd); }, { passive: true });
    upd();
  }

  /* ---------- vídeo do tour ---------- */
  const video = $('[data-tour]');
  if (video) {
    const btn = $('[data-tour-btn]');
    let carregou = false, usuarioPausou = reduz;
    const carregar = () => {
      if (carregou) return;
      carregou = true;
      const s = $('source', video);
      s.src = s.dataset.src;
      video.load();
    };
    const tocar = () => {
      carregar();
      const p = video.play();
      if (p && p.then) p.then(() => { btn.classList.remove('parado'); btn.setAttribute('aria-label', 'Pausar o vídeo'); }).catch(() => {});
    };
    const pausar = () => { video.pause(); btn.classList.add('parado'); btn.setAttribute('aria-label', 'Reproduzir o vídeo'); };
    btn.addEventListener('click', () => { if (video.paused) { usuarioPausou = false; tocar(); } else { usuarioPausou = true; pausar(); } });
    if (temIO) new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !usuarioPausou) tocar();
      else if (!en.isIntersecting && !video.paused) pausar();
    }, { threshold: .4 }).observe(video);
  }

  /* ---------- cartão de visita 3D ---------- */
  const cartao = $('[data-cartao]');
  if (cartao) {
    const cena = $('[data-cartao-cena]');
    let virando = false;
    cartao.addEventListener('click', () => {
      virando = true;
      cartao.classList.remove('mexendo');
      cartao.classList.toggle('virado');
      setTimeout(() => { virando = false; }, 900);
    });
    if (fino && !reduz) {
      cena.addEventListener('pointermove', e => {
        const r = cena.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        cartao.style.setProperty('--ry', (x * 18).toFixed(2) + 'deg');
        cartao.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg');
        cartao.style.setProperty('--gx', ((x + .5) * 100).toFixed(1) + '%');
        cartao.style.setProperty('--gy', ((y + .5) * 100).toFixed(1) + '%');
        if (!virando) cartao.classList.add('mexendo');
      });
      cena.addEventListener('pointerleave', () => {
        cartao.classList.remove('mexendo');
        cartao.style.setProperty('--rx', '0deg');
        cartao.style.setProperty('--ry', '0deg');
      });
    }
  }

  /* ---------- formulário → WhatsApp ---------- */
  const form = $('#form-obra');
  if (form) {
    const erro = $('[data-erro]', form);
    const chipsTipo = $('[data-chips-tipo]', form);
    const el = n => form.elements[n];
    form.addEventListener('input', e => {
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim().length > 1) e.target.removeAttribute('aria-invalid');
    });
    form.addEventListener('change', e => { if (e.target.name === 'tipo') chipsTipo.classList.remove('invalido'); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const tipo = el('tipo').value;
      const nome = el('nome').value.trim();
      const cidade = el('cidade').value.trim();
      const msg = el('msg').value.trim();
      const prazo = el('prazo').value;
      const quem = el('quem').value || 'sandro';
      const faltas = [];
      if (!tipo) { chipsTipo.classList.add('invalido'); faltas.push(['tipo de obra', form.querySelector('[name="tipo"]')]); }
      if (nome.length < 2) { el('nome').setAttribute('aria-invalid', 'true'); faltas.push(['seu nome', el('nome')]); }
      if (cidade.length < 2) { el('cidade').setAttribute('aria-invalid', 'true'); faltas.push(['cidade e bairro da obra', el('cidade')]); }
      if (faltas.length) {
        erro.textContent = `Falta preencher: ${faltas.map(f => f[0]).join(', ')}.`;
        erro.hidden = false;
        faltas[0][1].focus();
        return;
      }
      erro.hidden = true;
      const linhas = [`Olá, ${NOME[quem]}! Meu nome é ${nome}.`, `Quero um orçamento de ${tipo.toLowerCase()} em ${cidade}.`];
      if (msg) linhas.push('', msg);
      if (prazo) linhas.push('', `Pretendo começar: ${prazo}.`);
      linhas.push('', 'Vim pelo site. Já vou mandar as fotos do local.');
      abrirWA(waLink(quem, linhas.join('\n')));
    });
  }

  /* ---------- botões magnéticos ---------- */
  if (fino && !reduz) $$('[data-magnetic]').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      b.style.translate = `${(x * .16).toFixed(1)}px ${(y * .3).toFixed(1)}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });

  /* ---------- cursor ---------- */
  if (fino && !reduz && innerWidth >= 900) {
    doc.classList.add('cursor-on');
    const cur = $('.cursor'), ponto = $('.cursor-ponto'), anel = $('.cursor-anel'), rot = $('b', anel);
    const ROTULOS = { ver: 'Ver', arraste: 'Arraste', role: 'Role' };
    let mx = -100, my = -100, ax = -100, ay = -100, raf = 0, visto = false;
    cur.classList.add('some');
    const seguir = () => {
      ax += (mx - ax) * .2; ay += (my - ay) * .2;
      anel.style.transform = `translate3d(${ax.toFixed(1)}px, ${ay.toFixed(1)}px, 0)`;
      raf = (Math.abs(mx - ax) + Math.abs(my - ay) > .3) ? requestAnimationFrame(seguir) : 0;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!visto) { visto = true; ax = mx; ay = my; cur.classList.remove('some'); }
      ponto.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (!raf) raf = requestAnimationFrame(seguir);
    }, { passive: true });
    doc.addEventListener('mouseleave', () => { visto = false; cur.classList.add('some'); });
    document.addEventListener('pointerover', e => {
      const t = e.target;
      if (t.closest('input, textarea')) { cur.classList.add('some'); return; }
      if (visto) cur.classList.remove('some');
      const marcado = t.closest('[data-cursor]');
      const clicavel = t.closest('a, button, summary, label');
      if (marcado && ROTULOS[marcado.dataset.cursor] && (!clicavel || marcado.contains(clicavel) || clicavel === marcado)) {
        rot.textContent = ROTULOS[marcado.dataset.cursor];
        anel.classList.add('rotulado'); anel.classList.remove('grande');
      } else {
        anel.classList.remove('rotulado');
        anel.classList.toggle('grande', !!clicavel);
      }
    });
  }

  /* =========================================================
     v2
     ========================================================= */

  /* ---------- laço único de animação (só roda com alguém ligado) ---------- */
  const noLaco = new Set();
  let rafLaco = 0, yLaco = scrollY, velY = 0;
  const laco = () => {
    const y = scrollY;
    velY += ((y - yLaco) - velY) * .15;
    yLaco = y;
    noLaco.forEach(f => f(velY));
    rafLaco = noLaco.size ? requestAnimationFrame(laco) : 0;
  };
  const ligar = (f, on) => {
    if (on) noLaco.add(f); else noLaco.delete(f);
    if (noLaco.size && !rafLaco) { yLaco = scrollY; rafLaco = requestAnimationFrame(laco); }
  };

  /* ---------- esteira de serviços: acelera e inclina com a rolagem ---------- */
  $$('[data-esteira]').forEach(linha => {
    const trilho = $('.esteira-trilho', linha);
    const dir = Number(linha.dataset.dir) || -1;
    let w = 0, x = 0, skew = 0;
    const montar = () => {
      $$('.esteira-trilho', linha).slice(1).forEach(t => t.remove());
      w = trilho.offsetWidth;
      const n = Math.max(2, Math.ceil((innerWidth * 2.2) / Math.max(1, w)));
      for (let i = 1; i < n; i++) linha.appendChild(trilho.cloneNode(true));
      x = dir > 0 ? -w : 0;
    };
    montar();
    document.fonts?.ready.then(montar);
    let tRes = 0;
    addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(montar, 200); });
    if (reduz) return;
    const passo = v => {
      const vel = (.6 + Math.min(7, Math.abs(v) * .4)) * dir;
      x += vel;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      skew += (clamp(-v * .3, -7, 7) - skew) * .1;
      linha.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
    };
    if (temIO) new IntersectionObserver(([en]) => ligar(passo, en.isIntersecting)).observe(linha);
    else ligar(passo, true);
  });

  /* ---------- mostruário: no toque, 1º toque vira a amostra, 2º abre a foto ---------- */
  if (!fino) $$('.amostra[data-galeria]').forEach(b => b.addEventListener('click', e => {
    if (b.classList.contains('virada')) return;
    e.preventDefault(); e.stopPropagation();
    $$('.amostra.virada').forEach(o => o.classList.remove('virada'));
    b.classList.add('virada');
  }, true));

  /* ---------- simulador de piso ---------- */
  (() => {
    const sec = $('#simulador');
    const form = $('[data-sim]', sec || document);
    if (!sec || !form) return;
    const svg = $('[data-sim-svg]', sec);
    const out = Object.fromEntries($$('[data-r]', sec).map(e => [e.dataset.r, e]));
    const waBtn = $('[data-sim-wa]', sec);
    const campos = { comp: form.elements.comp, larg: form.elements.larg };
    const faixas = { comp: $('[data-range="comp"]', form), larg: $('[data-range="larg"]', form) };
    const MIN = 1, MAX = 12;
    const fmt = (v, d = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
    const ler = s => { const v = parseFloat(String(s).replace(/\s|m/g, '').replace(',', '.')); return Number.isFinite(v) ? v : NaN; };
    const est = { comp: 4, larg: 3.5, peca: '90x90', modo: 'reto' };

    const medida = (k, v, origem) => {
      v = clamp(Math.round(v * 100) / 100, MIN, MAX);
      est[k] = v;
      if (origem !== 'campo') campos[k].value = fmt(v);
      if (origem !== 'faixa') faixas[k].value = v;
      faixas[k].style.setProperty('--pct', ((v - MIN) / (MAX - MIN) * 100).toFixed(1) + '%');
    };
    const conta = () => {
      const [a, b] = est.peca.split('x').map(n => Number(n) / 100);
      const area = est.comp * est.larg;
      const perc = est.modo === 'diagonal' ? 15 : 10;
      const comPerda = area * (1 + perc / 100);
      return { L: Math.max(a, b), S: Math.min(a, b), area, perc, comPerda, pecas: Math.ceil(comPerda / (a * b) - 1e-9), rodape: 2 * (est.comp + est.larg) };
    };
    const texto = (c, pular) => {
      const pecaTxt = est.peca.replace('x', ' × ');
      const por = (k, t) => {
        const el = out[k];
        if (!el || el.textContent === t) return;
        el.textContent = t;
        if (pular && el.tagName === 'DD') { el.classList.remove('pulo'); void el.offsetWidth; el.classList.add('pulo'); }
      };
      por('area', fmt(c.area) + ' m²');
      por('perc', String(c.perc));
      por('perda', fmt(c.comPerda) + ' m²');
      por('peca', pecaTxt);
      por('pecas', String(c.pecas));
      por('rodape', fmt(c.rodape) + ' m');
      por('legenda', `Planta em escala · ${fmt(est.comp)} × ${fmt(est.larg)} m · peça ${pecaTxt} cm · ${est.modo}`);
      waBtn.href = waLink('sandro', `Olá, Sandro! Fiz a simulação de piso no site: cômodo de ${fmt(est.comp)} × ${fmt(est.larg)} m (${fmt(c.area)} m²), porcelanato ${pecaTxt} cm, assentamento ${est.modo}. Com ${c.perc}% de perda dá ${fmt(c.comPerda)} m², cerca de ${c.pecas} peças. Rodapé: ${fmt(c.rodape)} m. Quero um orçamento.`);
    };
    const f1 = n => n.toFixed(1);
    const planta = (c, animar) => {
      const W = 640, H = 520, ML = 80, MT = 70, MR = 24, MB = 24;
      const aw = W - ML - MR, ah = H - MT - MB;
      const s = Math.min(aw / est.comp, ah / est.larg);
      const w = est.comp * s, h = est.larg * s;
      const x0 = ML + (aw - w) / 2, y0 = MT + (ah - h) / 2;
      const pw = c.L * s, ph = c.S * s;
      let pisos = '';
      if (est.modo === 'reto') {
        const cols = Math.ceil(est.comp / c.L - 1e-9), rows = Math.ceil(est.larg / c.S - 1e-9);
        const passo = Math.min(40, 1000 / (cols + rows));
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const corte = (i + 1) * c.L > est.comp + 1e-6 || (j + 1) * c.S > est.larg + 1e-6;
          pisos += `<rect class="piso-s${corte ? ' corte' : ''}" x="${f1(x0 + i * pw)}" y="${f1(y0 + j * ph)}" width="${f1(pw)}" height="${f1(ph)}" style="--d:${Math.round((i + j) * passo)}ms"/>`;
        }
      } else {
        const cx = x0 + w / 2, cy = y0 + h / 2, diag = Math.hypot(w, h);
        const nc = Math.ceil(diag / pw) + 2, nr = Math.ceil(diag / ph) + 2;
        const gx = cx - nc * pw / 2, gy = cy - nr * ph / 2;
        const k = Math.SQRT1_2;
        const gira = (px, py) => [cx + (px - cx) * k - (py - cy) * k, cy + (px - cx) * k + (py - cy) * k];
        const passo = Math.min(40, 1000 / (nc + nr) * 1.4);
        for (let j = 0; j < nr; j++) for (let i = 0; i < nc; i++) {
          const x = gx + i * pw, y = gy + j * ph;
          const q = [[x, y], [x + pw, y], [x + pw, y + ph], [x, y + ph]].map(([a, b]) => gira(a, b));
          const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
          if (Math.max(...xs) < x0 || Math.min(...xs) > x0 + w || Math.max(...ys) < y0 || Math.min(...ys) > y0 + h) continue;
          const dentro = q.filter(([a, b]) => a >= x0 - .5 && a <= x0 + w + .5 && b >= y0 - .5 && b <= y0 + h + .5).length;
          const ordem = ((xs[0] + xs[2]) / 2 - x0 + (ys[0] + ys[2]) / 2 - y0) / Math.max(pw, ph);
          pisos += `<rect class="piso-s${dentro < 4 ? ' corte' : ''}" x="${f1(x)}" y="${f1(y)}" width="${f1(pw)}" height="${f1(ph)}" style="--d:${Math.max(0, Math.round(ordem * passo))}ms"/>`;
        }
        pisos = `<g transform="rotate(45 ${f1(cx)} ${f1(cy)})">${pisos}</g>`;
      }
      const tique = (x, y) => `<path d="M${f1(x - 5)} ${f1(y + 5)}L${f1(x + 5)} ${f1(y - 5)}"/>`;
      // em tela pequena o SVG encolhe: os textos crescem na mesma proporção
      const e = clamp(560 / Math.max(260, svg.getBoundingClientRect().width || 560), 1, 1.9);
      const rw = f1(88 * e), rh = f1(22 * e), fs = `style="font-size:${f1(14 * e)}px"`;
      const yc = y0 - 34 - 6 * (e - 1), xc = x0 - 42 - 8 * (e - 1);
      svg.innerHTML =
        `<defs><clipPath id="sim-clip"><rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(w)}" height="${f1(h)}"/></clipPath></defs>` +
        `<g clip-path="url(#sim-clip)">${pisos}</g>` +
        `<rect class="parede" x="${f1(x0 - 3)}" y="${f1(y0 - 3)}" width="${f1(w + 6)}" height="${f1(h + 6)}"/>` +
        `<g class="cota"><path d="M${f1(x0)} ${f1(y0 - 10)}V${f1(yc - 8)}M${f1(x0 + w)} ${f1(y0 - 10)}V${f1(yc - 8)}"/><line x1="${f1(x0)}" y1="${f1(yc)}" x2="${f1(x0 + w)}" y2="${f1(yc)}"/>${tique(x0, yc)}${tique(x0 + w, yc)}` +
        `<rect x="${f1(x0 + w / 2 - 44 * e)}" y="${f1(yc - 11 * e)}" width="${rw}" height="${rh}" rx="4"/><text ${fs} x="${f1(x0 + w / 2)}" y="${f1(yc + 5 * e)}" text-anchor="middle">${fmt(est.comp)} m</text></g>` +
        `<g class="cota"><path d="M${f1(x0 - 10)} ${f1(y0)}H${f1(xc - 8)}M${f1(x0 - 10)} ${f1(y0 + h)}H${f1(xc - 8)}"/><line x1="${f1(xc)}" y1="${f1(y0)}" x2="${f1(xc)}" y2="${f1(y0 + h)}"/>${tique(xc, y0)}${tique(xc, y0 + h)}` +
        `<g transform="rotate(-90 ${f1(xc)} ${f1(y0 + h / 2)})"><rect x="${f1(xc - 44 * e)}" y="${f1(y0 + h / 2 - 11 * e)}" width="${rw}" height="${rh}" rx="4"/><text ${fs} x="${f1(xc)}" y="${f1(y0 + h / 2 + 5 * e)}" text-anchor="middle">${fmt(est.larg)} m</text></g></g>` +
        `<text class="rotulo-area" style="font-size:${f1(30 * e)}px" x="${f1(x0 + w / 2)}" y="${f1(y0 + h / 2 + 6 * e)}" text-anchor="middle">${fmt(c.area)} m²</text>` +
        `<text class="rotulo-area-sub" style="font-size:${f1(11 * e)}px" x="${f1(x0 + w / 2)}" y="${f1(y0 + h / 2 + 26 * e)}" text-anchor="middle">${c.pecas} PEÇAS COM PERDA</text>`;
      // cômodo estreito: os rótulos encurtam/encolhem para não invadir as cotas
      const caber = (t, curto) => {
        if (!t || !t.getComputedTextLength) return;
        const lim = w - 16;
        let len = t.getComputedTextLength();
        if (!len || len <= lim) return;
        if (curto) { t.textContent = curto; len = t.getComputedTextLength(); if (len <= lim) return; }
        if (curto && lim / len < .5) { t.remove(); return; }
        t.style.fontSize = f1(parseFloat(t.style.fontSize) * Math.max(.45, lim / len)) + 'px';
      };
      caber($('.rotulo-area', svg));
      caber($('.rotulo-area-sub', svg), `${c.pecas} PEÇAS`);
      svg.classList.remove('anima');
      if (animar && !reduz) { void svg.getBoundingClientRect(); svg.classList.add('anima'); }
    };
    let visto = SHOT !== null || !temIO;
    const render = animar => { const c = conta(); texto(c, animar); planta(c, animar && visto); };

    Object.keys(campos).forEach(k => {
      // seleciona tudo no foco (digitar substitui a medida); o mouseup do clique
      // que deu o foco desfaria a seleção, então só esse é anulado
      let recemFocado = false;
      campos[k].addEventListener('focus', () => { campos[k].select(); recemFocado = true; });
      campos[k].addEventListener('mouseup', e => { if (recemFocado) e.preventDefault(); recemFocado = false; });
      campos[k].addEventListener('keydown', () => { recemFocado = false; });
      campos[k].addEventListener('blur', () => { recemFocado = false; });
      campos[k].addEventListener('input', () => { const v = ler(campos[k].value); if (Number.isFinite(v) && v >= MIN && v <= MAX) { medida(k, v, 'campo'); render(false); } });
      campos[k].addEventListener('change', () => { const v = ler(campos[k].value); medida(k, Number.isFinite(v) ? v : est[k]); render(true); });
      campos[k].addEventListener('keydown', e => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault(); medida(k, est[k] + (e.key === 'ArrowUp' ? .1 : -.1)); render(true);
      });
      faixas[k].addEventListener('input', () => { medida(k, Number(faixas[k].value), 'faixa'); render(false); });
      faixas[k].addEventListener('change', () => render(true));
    });
    $$('[data-passo]', form).forEach(b => b.addEventListener('click', () => { const k = b.dataset.alvo; medida(k, est[k] + Number(b.dataset.passo)); render(true); }));
    form.addEventListener('change', e => { if (e.target.name === 'peca' || e.target.name === 'modo') { est[e.target.name] = e.target.value; render(true); } });
    form.addEventListener('submit', e => e.preventDefault());
    medida('comp', est.comp); medida('larg', est.larg);
    render(false);
    let larguraSvg = svg.getBoundingClientRect().width, tSim = 0;
    addEventListener('resize', () => {
      clearTimeout(tSim);
      tSim = setTimeout(() => { const lw = svg.getBoundingClientRect().width; if (Math.abs(lw - larguraSvg) > 30) { larguraSvg = lw; planta(conta(), false); } }, 200);
    });
    if (!visto) new IntersectionObserver(([en], o) => { if (en.isIntersecting) { visto = true; o.disconnect(); render(true); } }, { threshold: .35 }).observe(svg);
  })();

  /* ---------- manifesto: as frases acendem palavra por palavra ---------- */
  (() => {
    const ps = $$('[data-mani]');
    if (!ps.length) return;
    const grupos = ps.map(p => {
      const ws = [];
      const andar = no => Array.from(no.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = t; ws.push(s); frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) andar(n);
      });
      andar(p);
      return { p, ws };
    });
    if (reduz || SHOT !== null) { grupos.forEach(g => g.ws.forEach(w => w.classList.add('on'))); return; }
    let raf = 0, ativo = !temIO;
    const upd = () => {
      raf = 0;
      for (const g of grupos) {
        const r = g.p.getBoundingClientRect();
        const prog = clamp((innerHeight * .9 - r.top) / (r.height + innerHeight * .3), 0, 1);
        const n = Math.round(prog * g.ws.length * 1.2);
        g.ws.forEach((w, i) => w.classList.toggle('on', i < n));
      }
    };
    if (temIO) new IntersectionObserver(([en]) => { ativo = en.isIntersecting; if (ativo && !raf) raf = requestAnimationFrame(upd); }, { rootMargin: '10% 0px' }).observe($('.frases'));
    addEventListener('scroll', () => { if (ativo && !raf) raf = requestAnimationFrame(upd); }, { passive: true });
    upd();
  })();

  /* ---------- mapa de atuação ---------- */
  (() => {
    const fig = $('[data-mapa]');
    if (!fig) return;
    const cartao = $('[data-mapa-cartao]', fig), cimg = $('img', cartao), ctxt = $('span', cartao);
    // no celular o mapa aproxima o miolo (Mogi, Suzano, Santo André)
    const svgMapa = $('svg', fig), vbOriginal = svgMapa.getAttribute('viewBox');
    const VB_CEL = [120, 130, 700, 540];
    const desloc = g => { const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(g.getAttribute('transform')) || [0, 0, 0]; return [Number(m[1]), Number(m[2])]; };
    const caixa = (t, tx, ty) => { let b; try { b = t.getBBox(); } catch (e) { return null; } return b.width ? { x: tx + b.x, y: ty + b.y, w: b.width, h: b.height } : null; };
    const refs = $$('.ref', svgMapa).map(g => {
      const t = $('text', g), [tx, ty] = desloc(g);
      return { g, t, tx, ty, x: t.getAttribute('x'), y: t.getAttribute('y'), anc: t.getAttribute('text-anchor') };
    });
    const marcosTxt = $$('.marco-mapa', svgMapa).flatMap(g => { const [tx, ty] = desloc(g); return $$('text', g).map(t => () => caixa(t, tx, ty)); });
    // no recorte do celular, o rótulo que sairia pela borda ou cairia em cima de outro
    // texto tenta o outro lado, depois embaixo e em cima do ponto; se nada servir, some
    const ajustarRefs = vb => {
      const pos = (r, x, y, a) => { r.t.setAttribute('x', x); r.t.setAttribute('y', y); r.t.setAttribute('text-anchor', a); };
      refs.forEach(r => { pos(r, r.x, r.y, r.anc); r.g.style.display = ''; });
      if (!vb) return;
      const [vx, vy, vw, vh] = vb;
      const dentro = b => !b || (b.x >= vx + 4 && b.x + b.w <= vx + vw - 4 && b.y >= vy + 4 && b.y + b.h <= vy + vh - 4);
      const ocupadas = marcosTxt.map(f => f()).filter(Boolean);
      const livre = r => {
        const b = caixa(r.t, r.tx, r.ty);
        if (!b) return true;
        if (!dentro(b) || ocupadas.some(o => b.x < o.x + o.w + 3 && o.x < b.x + b.w + 3 && b.y < o.y + o.h + 2 && o.y < b.y + b.h + 2)) return false;
        ocupadas.push(b);
        return true;
      };
      // quem não cabe na posição original escolhe primeiro; os outros se acomodam depois
      const ordem = refs.map(r => ({ r, cabe: dentro(caixa(r.t, r.tx, r.ty)) })).sort((a, b) => a.cabe - b.cabe).map(o => o.r);
      ordem.forEach(r => {
        const opcoes = [[r.x, r.y, r.anc], [String(-Number(r.x)), r.y, r.anc === 'end' ? 'start' : 'end'], ['0', '22', 'middle'], ['0', '-10', 'middle']];
        if (!opcoes.some(p => { pos(r, ...p); return livre(r); })) r.g.style.display = 'none';
      });
    };
    const enquadrar = () => {
      const cel = innerWidth < 760;
      svgMapa.setAttribute('viewBox', cel ? VB_CEL.join(' ') : vbOriginal);
      ajustarRefs(cel ? VB_CEL : null);
    };
    enquadrar();
    addEventListener('resize', enquadrar);
    document.fonts?.ready.then(enquadrar);
    if (temIO && SHOT === null && !reduz) new IntersectionObserver(([en], o) => { if (en.isIntersecting) { fig.classList.add('in'); o.disconnect(); } }, { threshold: .3 }).observe(fig);
    else fig.classList.add('in');
    const mostrar = (x, y, foto, txt) => {
      const f = fig.getBoundingClientRect();
      cartao.style.left = (x - f.left) + 'px';
      cartao.style.top = (y - f.top) + 'px';
      cartao.classList.toggle('so-texto', !foto);
      if (foto && cimg.getAttribute('src') !== foto) cimg.src = foto;
      ctxt.textContent = txt;
      cartao.hidden = false;
    };
    const esconder = () => { cartao.hidden = true; };
    $$('.marco-mapa.m-ob', fig).forEach(m => {
      const abrir = () => { const b = $('.ponto', m).getBoundingClientRect(); mostrar(b.left + b.width / 2, b.top, m.dataset.foto, m.dataset.rot); };
      m.addEventListener('pointerenter', abrir);
      m.addEventListener('focus', abrir);
      m.addEventListener('pointerleave', esconder);
      m.addEventListener('blur', esconder);
    });
    if (fino) $$('.m[data-nome]', fig).forEach(p => {
      p.addEventListener('pointermove', e => mostrar(e.clientX, e.clientY - 6, null, p.dataset.nome));
      p.addEventListener('pointerleave', esconder);
    });
  })();

  /* ---------- Instagram: esteira de posts (arrastável no toque) ---------- */
  (() => {
    const fita = $('[data-insta]');
    if (!fita) return;
    const trilho = $('.insta-trilho', fita);
    if (!fino || reduz) { fita.classList.add('toque'); return; }
    const originais = Array.from(trilho.children);
    originais.forEach(li => {
      const c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      $$('a', c).forEach(a => a.tabIndex = -1);
      trilho.appendChild(c);
    });
    let w = 0, x = 0, vel = .5, alvo = .5;
    const medir = () => { w = trilho.children[originais.length].offsetLeft - trilho.children[0].offsetLeft; };
    medir();
    addEventListener('resize', medir);
    addEventListener('load', medir);
    fita.addEventListener('pointerenter', () => { alvo = 0; });
    fita.addEventListener('pointerleave', () => { alvo = .5; });
    fita.addEventListener('focusin', () => { alvo = 0; });
    const passo = v => {
      vel += (alvo + (alvo ? Math.min(5, Math.abs(v) * .3) : 0) - vel) * .06;
      x -= vel;
      if (w && x <= -w) x += w;
      trilho.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    };
    if (temIO) new IntersectionObserver(([en]) => ligar(passo, en.isIntersecting)).observe(fita);
    else ligar(passo, true);
  })();

  /* ---------- trena de rolagem (desktop) e barra de progresso ---------- */
  (() => {
    const trena = $('[data-trena]'), regua = $('[data-trena-regua]'), valor = $('[data-trena-valor]'), secaoEl = $('[data-trena-secao]');
    const barra = $('[data-progresso]');
    const NOMES = { inicio: 'Início', servicos: 'Serviços', materiais: 'Mostruário', obras: 'Obras', 'antes-e-depois': 'Antes e depois', simulador: 'Simulador', voz: 'Palavra da obra', 'como-funciona': 'Como funciona', 'quem-somos': 'Quem somos', atuacao: 'Onde atendemos', instagram: 'Instagram', contato: 'Contato', duvidas: 'Dúvidas' };
    const usa = () => trena && getComputedStyle(trena).display !== 'none';
    let secs = [], feitas = 0, raf = 0, tOculta = 0;
    const mapear = () => {
      secs = Object.keys(NOMES).map(id => { const el = document.getElementById(id); return el ? { id, top: el.getBoundingClientRect().top + scrollY } : null; })
        .filter(Boolean).sort((a, b) => a.top - b.top);
      if (!usa()) return;
      const H = document.documentElement.scrollHeight + innerHeight;
      regua.style.height = H + 'px';
      const n = Math.floor(H / 100);
      if (n > feitas) {
        const frag = document.createDocumentFragment();
        for (let i = feitas + 1; i <= n; i++) {
          const s = document.createElement('span');
          s.className = 'trena-n' + (i % 10 === 0 ? ' metro' : '');
          s.style.top = (i * 100) + 'px';
          s.textContent = i % 10 === 0 ? (i / 10) + 'm' : String((i % 10) * 10);
          frag.appendChild(s);
        }
        regua.appendChild(frag);
        feitas = n;
      }
    };
    const atualizar = () => {
      raf = 0;
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      barra?.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : '0');
      if (!usa()) return;
      regua.style.transform = `translate3d(0, ${-(y + 104).toFixed(0)}px, 0)`;
      const meio = y + innerHeight / 2;
      valor.textContent = (meio / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      let nome = 'Início';
      for (const s of secs) if (s.top <= meio) nome = NOMES[s.id];
      if (secaoEl.textContent !== nome) secaoEl.textContent = nome;
    };
    const mostrar = () => {
      if (!usa() || reduz) return;
      trena.classList.add('ativa');
      clearTimeout(tOculta);
      tOculta = setTimeout(() => trena.classList.remove('ativa'), 1500);
    };
    mapear(); atualizar();
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(atualizar); mostrar(); }, { passive: true });
    addEventListener('resize', () => { mapear(); atualizar(); });
    addEventListener('load', () => { mapear(); atualizar(); });
    if ('ResizeObserver' in window) { let t = 0; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(mapear, 300); }).observe(document.body); }
    if (fino) addEventListener('pointermove', e => { if (innerWidth - e.clientX < 64) mostrar(); }, { passive: true });
  })();

  /* ---------- faíscas de esmerilhadeira no clique ---------- */
  (() => {
    const cv = $('[data-faiscas]');
    if (!cv || reduz || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    let dpr = 1, parts = [], raf = 0;
    const tam = () => { dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); };
    tam();
    addEventListener('resize', tam);
    const CORES = ['255,236,170', '255,196,92', '255,150,48', '240,110,30'];
    const quadro = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      parts = parts.filter(p => p.vida > 0);
      for (const p of parts) {
        if (p.flash) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
          g.addColorStop(0, `rgba(255,228,170,${(p.vida * .75).toFixed(3)})`);
          g.addColorStop(1, 'rgba(255,180,90,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, 6.3); ctx.fill();
          p.vida -= p.dec; continue;
        }
        const ax = p.x, ay = p.y;
        p.vx *= .962; p.vy = p.vy * .962 + .34;
        p.x += p.vx; p.y += p.vy; p.vida -= p.dec;
        ctx.strokeStyle = `rgba(${p.cor},${Math.max(0, p.vida).toFixed(3)})`;
        ctx.lineWidth = p.w;
        ctx.beginPath(); ctx.moveTo(ax - p.vx * .9, ay - p.vy * .9); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      if (parts.length) raf = requestAnimationFrame(quadro);
      else { ctx.clearRect(0, 0, innerWidth, innerHeight); raf = 0; }
    };
    const soltar = (x, y) => {
      const n = 14 + Math.floor(Math.random() * 10);
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.6;
        const v = 3.5 + Math.random() * 8.5;
        parts.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, vida: 1, dec: .017 + Math.random() * .02, cor: CORES[i % CORES.length], w: 1 + Math.random() * 1.5 });
      }
      parts.push({ flash: true, x, y, vida: 1, dec: .11 });
      if (!raf) raf = requestAnimationFrame(quadro);
    };
    addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('input, textarea, select, .sim-range, .lb')) return;
      soltar(e.clientX, e.clientY);
    }, { passive: true });
  })();

  /* ---------- rótulos que se decifram ao aparecer ---------- */
  (() => {
    if (reduz || SHOT !== null || !temIO) return;
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#+/';
    const rots = $$('.rotulo').filter(el => !el.closest('.hero') && el.childElementCount === 0 && el.textContent.trim().length < 70);
    const embaralhar = el => {
      const fim = el.dataset.final;
      const total = Math.min(950, 300 + fim.length * 22), ini = Date.now();
      const iv = setInterval(() => {
        const p = (Date.now() - ini) / total;
        const n = Math.floor(p * fim.length);
        el.textContent = p >= 1 ? fim : Array.from(fim, (c, i) => (i < n || c === ' ' ? c : CH[Math.floor(Math.random() * CH.length)])).join('');
        if (p >= 1) clearInterval(iv);
      }, 34);
    };
    const io = new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting) { io.unobserve(en.target); embaralhar(en.target); } }), { threshold: .8 });
    rots.forEach(el => { el.dataset.final = el.textContent; el.setAttribute('aria-label', el.textContent); io.observe(el); });
  })();

  /* ---------- hero: profundidade ao sair ---------- */
  (() => {
    const sec = $('[data-hero]');
    if (!sec || reduz) return;
    const kb = $('.hero-kb', sec), conteudo = $('.hero-conteudo', sec), placa = $('.placa', sec);
    const linhas = $$('.hero-titulo .linha', sec);
    let raf = 0, ativo = true;
    const upd = () => {
      raf = 0;
      const p = clamp(scrollY / Math.max(1, sec.offsetHeight), 0, 1);
      kb.style.scale = (1 + p * .12).toFixed(4);
      if (linhas[0]) linhas[0].style.translate = `${(-p * 9).toFixed(2)}vw 0`;
      if (linhas[1]) linhas[1].style.translate = `${(p * 9).toFixed(2)}vw 0`;
      conteudo.style.opacity = (1 - p * .9).toFixed(3);
      placa.style.translate = `0 ${(-p * 70).toFixed(1)}px`;
      sec.style.setProperty('--sai', p.toFixed(3));
    };
    if (temIO) new IntersectionObserver(([en]) => { ativo = en.isIntersecting; }).observe(sec);
    addEventListener('scroll', () => { if (ativo && !raf) raf = requestAnimationFrame(upd); }, { passive: true });
  })();

  /* ---------- fitas de fotos entram deslizando ---------- */
  $$('.diario-trilho').forEach(t => Array.from(t.children).forEach((li, k) => li.style.setProperty('--k', Math.min(k, 7))));
  if (SHOT !== null || reduz || !temIO) $$('.diario-trilho').forEach(t => t.classList.add('in'));
  else {
    const ioFita = new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); ioFita.unobserve(en.target); } }), { threshold: .12 });
    $$('.diario-trilho').forEach(t => ioFita.observe(t));
  }

  /* ---------- libera a seção de orçamento da barra fixa no celular ---------- */
  (() => {
    const barra = $('.barra-app'), contato = $('#contato');
    if (!barra || !contato || !temIO) return;
    const observer = new IntersectionObserver(([en]) => {
      const ocultar = en.isIntersecting;
      if (ocultar && barra.contains(document.activeElement)) document.activeElement.blur();
      barra.classList.toggle('contato-visivel', ocultar);
      barra.inert = ocultar;
    }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
    observer.observe(contato);
  })();

  /* ---------- WhatsApp flutuante (desktop): some no hero e perto do contato ---------- */
  (() => {
    const b = $('.wa-flutua');
    if (!b || !temIO) return;
    const vis = new Map();
    const upd = () => b.classList.toggle('on', !vis.get('hero') && !vis.get('fim'));
    new IntersectionObserver(([en]) => { vis.set('hero', en.isIntersecting); upd(); }, { threshold: .15 }).observe($('[data-hero]'));
    const fins = new Map();
    const ioFim = new IntersectionObserver(ents => { ents.forEach(en => fins.set(en.target, en.isIntersecting)); vis.set('fim', [...fins.values()].some(Boolean)); upd(); });
    [$('#contato'), $('.rodape')].forEach(el => el && ioFim.observe(el));
  })();

  /* ---------- miudezas ---------- */
  $$('[data-ano]').forEach(s => { s.textContent = new Date().getFullYear(); });
  const relogio = $('[data-relogio]');
  if (relogio) {
    const hora = () => { try { relogio.textContent = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }); } catch (e) { relogio.textContent = ''; } };
    hora();
    setInterval(hora, 30000);
  }

  if (SHOT) {
    const irShot = () => {
      const alvo = document.getElementById(SHOT);
      const p = Number(qs.get('p') || 0);
      const pista = alvo?.querySelector('.ad-pista');
      const y = alvo ? alvo.getBoundingClientRect().top + scrollY + (pista ? p * (pista.offsetHeight - innerHeight) : 0) : 0;
      scrollTo({ top: y, behavior: 'instant' });
      topo.classList.remove('recolhido');
    };
    if (document.readyState === 'complete') irShot(); else addEventListener('load', irShot);
    document.fonts?.ready.then(irShot);
  }
})();
