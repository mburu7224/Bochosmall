// Intro page interactivity: dark mode and stats counter
(function(){
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  // Initialize theme from localStorage
  const saved = localStorage.getItem('rmh-theme');
  if(saved==='dark') root.setAttribute('data-theme','dark');

  themeToggle && themeToggle.addEventListener('click',()=>{
    const current = root.getAttribute('data-theme');
    const next = current==='dark' ? 'light' : 'dark';
    if(next==='dark') root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme');
    localStorage.setItem('rmh-theme', next);
  });

  // Stats counter
  const counters = Array.from(document.querySelectorAll('.num'));
  function animateCounters(){
    counters.forEach(el=>{
      const target = Number(el.getAttribute('data-target')||0);
      let current=0;
      const step = Math.max(1, Math.floor(target/80));
      const t = setInterval(()=>{
        current+=step;
        if(current>=target){
          el.textContent=target;
          clearInterval(t);
        } else el.textContent=current;
      },12);
    });
  }
  // Trigger when visible
  function onScroll(){
    const stats = document.querySelector('.stats-section');
    if(!stats) return;
    const rect = stats.getBoundingClientRect();
    if(rect.top < window.innerHeight - 100){
      animateCounters();
      window.removeEventListener('scroll', onScroll);
    }
  }
  window.addEventListener('scroll', onScroll);
  // In case it's already visible
  setTimeout(onScroll,200);

  // Learn more smooth scroll
  const learn = document.getElementById('learnMoreBtn');
  learn && learn.addEventListener('click',()=>{
    document.getElementById('features').scrollIntoView({behavior:'smooth'});
  });
})();
