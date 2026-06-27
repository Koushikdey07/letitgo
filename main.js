const faders = document.querySelectorAll('.fade-in');
const bgImages = document.querySelectorAll('.bg-fade-in');

const appearOptions = {
  threshold: 0.3
};

const appearOnScroll = new IntersectionObserver(function(
  entries,
  observer
) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, appearOptions);

faders.forEach(fader => {
  appearOnScroll.observe(fader);
});

bgImages.forEach(bgImage => {
  appearOnScroll.observe(bgImage);
});

// DYNAMIC GALLERY
let memoryImages = [];

// Fetch images dynamically from manifest
fetch('memories/manifest.json')
  .then(response => response.json())
  .then(images => {
    memoryImages = images;
    initializeGallery();
  })
  .catch(error => {
    console.error('Error loading manifest:', error);
    // Fallback: empty state handling
  });

function getRandomImage() {
  if (memoryImages.length === 0) return '';
  return memoryImages[Math.floor(Math.random() * memoryImages.length)];
}

function getRandomInterval() {
  return Math.floor(Math.random() * 1000) + 4000; // 4-5 seconds
}

function initializeGallery() {
  // helper to start and stop rotation based on visibility
  const rotationTimers = new Map();

  function startRotating(el) {
    if (rotationTimers.has(el)) return; // already running
    function rotateImage() {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
      const swap = () => {
        el.src = getRandomImage();
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
        const nextInterval = getRandomInterval();
        const timer = setTimeout(rotateImage, nextInterval);
        rotationTimers.set(el, timer);
      };
      const timer = setTimeout(swap, 1000);
      rotationTimers.set(el, timer);
    }
    // initial delay
    const initialTimer = setTimeout(rotateImage, getRandomInterval());
    rotationTimers.set(el, initialTimer);
  }

  function stopRotating(el) {
    const timer = rotationTimers.get(el);
    if (timer) clearTimeout(timer);
    rotationTimers.delete(el);
  }

  // observer to pause rotation when offscreen
  const galleryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const img = entry.target;
      if (entry.isIntersecting) {
        startRotating(img);
      } else {
        stopRotating(img);
      }
    });
  }, { threshold: 0.1 });

  // Initialize images and observer
  for (let i = 1; i <= 12; i++) {
    const imgElement = document.getElementById(`gallery-img-${i}`);
    if (!imgElement) continue;

    imgElement.src = getRandomImage();
    imgElement.style.opacity = '1';
    imgElement.style.transitionDuration = '1s';
    imgElement.style.transform = 'scale(1)';

    galleryObserver.observe(imgElement);
  }
}

function initializeUsGallery() {
  const track = document.getElementById('us-gallery-track');
  if (!track) return;
  const totalImages = 225;
  let rowHtml = '';
  for (let i = 1; i <= totalImages; i += 1) {
    rowHtml += `
      <div class="us-gallery-item">
        <img src="us/Image_${i}.jpg" alt="Us ${i}" loading="lazy" />
      </div>
    `;
  }
  track.innerHTML = rowHtml + rowHtml;
}

if (document.readyState !== 'loading') {
  initializeUsGallery();
} else {
  document.addEventListener('DOMContentLoaded', initializeUsGallery);
}

// ONE-TIME FIREWORKS / SPARKLES WHEN GALLERY FIRST APPEARS
(() => {
  const section = document.getElementById('gallery-section');
  const canvas = document.getElementById('fireworks-canvas');
  if (!section || !canvas) return;

  let isPlaying = false;
  const opts = { threshold: 0.35 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isPlaying) {
        isPlaying = true;
        // play animation and allow replay when finished
        playFireworks(canvas, 1500).finally(() => { isPlaying = false; });
      }
    });
  }, opts);
  observer.observe(section);

  function playFireworks(canvasEl, duration = 1500) {
    return new Promise((resolve) => {
      const ctx = canvasEl.getContext('2d');
      let w = canvasEl.width = canvasEl.clientWidth;
      let h = canvasEl.height = canvasEl.clientHeight;
      let particles = [];
      let start = null;
      canvasEl.style.opacity = '1';

      function resize() {
        w = canvasEl.width = canvasEl.clientWidth;
        h = canvasEl.height = canvasEl.clientHeight;
      }
      window.addEventListener('resize', resize);

      // spawn a large amount from both left and right edges, moving inward
      function spawnMassFromSides(totalPerSide = 150) {
        for (let i = 0; i < totalPerSide; i++) {
          setTimeout(() => {
            const side = Math.random() < 0.5 ? 'left' : 'right';
            const y = Math.random() * h;
            const x = side === 'left' ? -8 : w + 8;
            // angle roughly toward center with slight vertical variance
            const base = side === 'left' ? (0) : Math.PI;
            const angle = base + (Math.random() - 0.5) * 0.6;
            const speed = 2 + Math.random() * 5;
            const hue = 260 + Math.random() * 80;
            particles.push({
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - (Math.random() * 1.5),
              life: 40 + Math.random() * 60,
              hue,
              size: 1 + Math.random() * 3
            });
          }, i * 6);
        }
      }

      // start the mass spawn and a slightly smaller follow-up wave
      spawnMassFromSides(220);
      setTimeout(() => spawnMassFromSides(80), 280);

      function step(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        ctx.clearRect(0, 0, w, h);

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.vy += 0.04; // light gravity
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 1;
          const alpha = Math.max(p.life / 80, 0);
          // soft circular glow
          ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          if (p.life <= 0 || p.x < -50 || p.x > w + 50 || p.y > h + 80) particles.splice(i, 1);
        }

        if (elapsed < duration || particles.length > 0) {
          requestAnimationFrame(step);
        } else {
          // fade out canvas
          canvasEl.style.opacity = '0';
          window.removeEventListener('resize', resize);
          ctx.clearRect(0, 0, w, h);
          resolve();
        }
      }

      requestAnimationFrame(step);
    });
  }
})();

/* --- LOVE GALLERY + HEART SPARKLES --- */
(function(){
  const TOTAL = 80;
  const loveImages = Array.from({length: TOTAL}, (_,i) => `love/Image_${i+1}.jpg`);

  function buildQuotes(n){
    const starts = [
      "A quiet smile I still remember",
      "That laugh that lit the room",
      "A small hand in mine",
      "The way your hair fell that day",
      "A soft morning we shared",
      "Tiny chaos and warm coffee",
      "A secret joke between us",
      "The warmth of your shoulder",
      "A whispered 'stay' that mattered",
      "A song we kept humming",
      "Starlit promises we hardly spoke",
      "The map of freckles on your skin",
      "The smell of rain on your jacket",
      "A late-night conversation that lasted hours",
      "The quiet courage you showed once"
    ];
    const ends = [
      "— a tender recall",
      "— a simple moment",
      "— tucked like a note",
      "— a small treasure",
      "— folded in time",
      "— quiet and bright",
      "— held in a smile",
      "— a soft echo",
      "— one gentle thread",
      "— a warm blink"
    ];
    const out = [];
    for (let i=0;i<n;i++){
      const a = starts[i % starts.length];
      const b = ends[i % ends.length];
      // no numbers appended — keep quotes clean
      out.push(`${a} ${b}`);
    }
    return out;
  }

  const loveQuotes = buildQuotes(TOTAL);

  // Modal elements
  const giftBtn = document.getElementById('gift-box');
  const heartCanvas = document.getElementById('heart-canvas');
  const loveModal = document.getElementById('love-modal');
  const loveBackdrop = document.getElementById('love-modal-backdrop');
  const loveMain = document.getElementById('love-main-image');
  const loveCaption = document.getElementById('love-caption');
  const loveThumbs = document.getElementById('love-thumbs');
  const lovePrev = document.getElementById('love-prev');
  const loveNext = document.getElementById('love-next');
  const loveClose = document.getElementById('love-close');
  const loveCounter = document.getElementById('love-counter');
  const letterButton = document.getElementById('letter-button');
  const letterOverlay = document.getElementById('letter-overlay');
  const letterClose = document.getElementById('letter-close');
  const letterBackdrop = document.getElementById('letter-overlay-backdrop');

  let currentIndex = 0;

  function createThumbs(){
    if (!loveThumbs) return; // thumbs rail intentionally may be hidden/removed
    loveThumbs.innerHTML = '';
    loveImages.forEach((src, i)=>{
      const img = document.createElement('img');
      img.src = src;
      img.dataset.index = i;
      img.alt = `photo ${i+1}`;
      img.addEventListener('click', () => showImageAt(i));
      loveThumbs.appendChild(img);
    });
  }

  function updateThumbs(active){
    if (!loveThumbs) return;
    const imgs = loveThumbs.querySelectorAll('img');
    imgs.forEach((el, idx)=>{
      el.classList.toggle('active', idx === active);
    });
  }

  function showImageAt(i){
    if (i < 0) i = loveImages.length - 1;
    if (i >= loveImages.length) i = 0;
    currentIndex = i;
    loveMain.style.opacity = '0';
    setTimeout(()=>{
      loveMain.src = loveImages[currentIndex];
      // split the quote around the em-dash so the first part can be highlighted
      const q = (loveQuotes[currentIndex] || '').split('—');
      if (q.length >= 2) {
        const left = q[0].trim();
        const right = '—' + q.slice(1).join('—').trim();
        loveCaption.innerHTML = `<span class="quote-highlight">${left}</span> <span class="text-slate-300 ml-2">${right}</span>`;
      } else {
        loveCaption.textContent = loveQuotes[currentIndex] || '';
      }
      loveCounter.textContent = `${currentIndex+1} / ${loveImages.length}`;
      updateThumbs(currentIndex);
      loveMain.style.opacity = '1';
    }, 160);
  }

  function openModal(startIndex=0){
    createThumbs();
    showImageAt(startIndex);
    loveModal.classList.remove('hidden');
    loveModal.classList.add('show');
    loveModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    // focus first close for keyboard users
    if (loveClose && typeof loveClose.focus === 'function') loveClose.focus();
  }

  function closeModal(){
    loveModal.classList.add('hidden');
    loveModal.classList.remove('show');
    loveModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  function openLetter(){
    if (!letterOverlay) return;
    letterOverlay.classList.remove('hidden');
    letterOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeLetter(){
    if (!letterOverlay) return;
    letterOverlay.classList.add('hidden');
    letterOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  lovePrev.addEventListener('click', ()=> showImageAt(currentIndex - 1));
  loveNext.addEventListener('click', ()=> showImageAt(currentIndex + 1));
  loveClose.addEventListener('click', closeModal);
  loveBackdrop.addEventListener('click', closeModal);
  if (letterButton) letterButton.addEventListener('click', openLetter);
  if (letterClose) letterClose.addEventListener('click', closeLetter);
  if (letterBackdrop) letterBackdrop.addEventListener('click', closeLetter);

  document.addEventListener('keydown', (e)=>{
    if (loveModal.classList.contains('show')){
      if (e.key === 'ArrowLeft') showImageAt(currentIndex - 1);
      if (e.key === 'ArrowRight') showImageAt(currentIndex + 1);
      if (e.key === 'Escape') closeModal();
    }
  });

  

  // Heart-shaped sparkle animation
  function playHeartSparkles(duration = 900){
    return new Promise(resolve => {
      const canvas = heartCanvas;
      if (!canvas) return resolve();
      const ctx = canvas.getContext('2d');
      let w = canvas.width = canvas.clientWidth;
      let h = canvas.height = canvas.clientHeight;
      canvas.style.opacity = '1';
      const particles = [];
      const start = performance.now();

      function resize(){ w = canvas.width = canvas.clientWidth; h = canvas.height = canvas.clientHeight; }
      window.addEventListener('resize', resize);

      function spawnHeart(x,y,scale, hue){
        particles.push({x,y,scale, hue, life: 40 + Math.random()*60, vx:(Math.random()-0.5)*2, vy: -2 - Math.random()*2, rot: Math.random()*Math.PI});
      }

      const bounds = canvas.getBoundingClientRect();
      const isDesktop = window.matchMedia('(min-width: 900px)').matches;
      const cornerPoints = [
        {x: bounds.left + 20, y: bounds.top + 20},
        {x: bounds.right - 20, y: bounds.top + 20},
        {x: bounds.left + 20, y: bounds.bottom - 20},
        {x: bounds.right - 20, y: bounds.bottom - 20}
      ];
      const centerPoint = {x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2};

      if (isDesktop) {
        cornerPoints.forEach((corner, cornerIndex) => {
          for (let i = 0; i < 16; i++) {
            setTimeout(() => {
              const jitterX = (Math.random() - 0.5) * 80;
              const jitterY = (Math.random() - 0.5) * 80;
              const x = corner.x + jitterX;
              const y = corner.y + jitterY;
              const size = 0.6 + Math.random() * 1.1;
              spawnHeart(x - bounds.left, y - bounds.top, size, 320 + Math.random() * 50);
            }, cornerIndex * 120 + i * 18);
          }
        });
      } else {
        for (let i=0;i<28;i++){
          setTimeout(()=>{
            const x = centerPoint.x + (Math.random()-0.5)*bounds.width*0.6;
            const y = centerPoint.y + (Math.random()-0.5)*bounds.height*0.2;
            spawnHeart(x - bounds.left, y - bounds.top, 0.6 + Math.random()*0.9, 330 + Math.random()*40);
          }, i*18);
        }
      }

      function drawHeart(ctx, x, y, size, hue, alpha, rot){
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(rot || 0);
        ctx.scale(size,size);
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.bezierCurveTo(12, -28, 40, -12, 0, 28);
        ctx.bezierCurveTo(-40, -12, -12, -28, 0, -12);
        ctx.closePath();
        ctx.fillStyle = `hsla(${hue},85%,60%,${alpha})`;
        ctx.fill();
        ctx.restore();
      }

      function step(ts){
        const t = ts - start;
        ctx.clearRect(0,0,w,h);
        for (let i = particles.length-1; i>=0; i--){
          const p = particles[i];
          p.vy += 0.03;
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 1;
          const alpha = Math.max(p.life / 100, 0);
          drawHeart(ctx, p.x, p.y, p.scale*0.6, p.hue, alpha, p.rot);
          p.rot += 0.02;
          if (p.life <= 0 || p.y > h + 40) particles.splice(i,1);
        }

        if (t < duration || particles.length > 0) requestAnimationFrame(step);
        else {
          canvas.style.opacity = '0';
          window.removeEventListener('resize', resize);
          ctx.clearRect(0,0,w,h);
          resolve();
        }
      }

      requestAnimationFrame(step);
    });
  }

  // wire gift click to play animation while opening modal immediately
  if (giftBtn){
    // start with a gentle shake to draw attention
    giftBtn.classList.add('shaking');
    giftBtn.addEventListener('click', ()=>{
      // stop shake and subtle float when activated
      giftBtn.classList.remove('shaking');
      giftBtn.style.animation = 'none';
      giftBtn.disabled = true;
      if (heartCanvas) heartCanvas.style.zIndex = '55';
      openModal(0);
      playHeartSparkles(900).catch(e => console.error(e));
      setTimeout(()=> { giftBtn.disabled = false; }, 600);
    });
  }

  // no-op: music feature removed

})();
