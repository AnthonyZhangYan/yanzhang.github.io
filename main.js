// Basic profile (kept inline)
const PROFILE={
  name:'Yan Zhang (张岩)',
  title:'Ph.D. Student @ Florida State University',
  affil:'Department of Computer Science',
  email:'yz18b@fsu.edu',
  scholar:'https://scholar.google.com/citations?user=nAh7B5EAAAAJ&hl=en',
  github:'https://github.com/AnthonyZhangYan',
  linkedin:'https://www.linkedin.com/in/yourid',
  interests:['Machine Learning','AI for Science','Bayesian Optimization','Large Language Models']
};

const MY_NAMES=['Yan Zhang','Y. Zhang','Y Zhang'];
const byId=id=>document.getElementById(id);
function highlightAuthors(s=''){
  return MY_NAMES.reduce((h,n)=>h.replace(new RegExp('\\b'+n.replace('.','\\.')+'\\b','g'),`<span class="me">${n}</span>`),s);
}
function linkClass(name,url){
  const n=(name||'').toLowerCase(),u=(url||'').toLowerCase();
  if(n.includes('pdf')) return 'pdf-link';
  if(n.includes('doi')||u.includes('doi.org')) return 'doi-link';
  if(n.includes('arxiv')||u.includes('arxiv.org')) return 'arxiv-link';
  return '';
}

// mount profile
byId('name').textContent=PROFILE.name;
byId('title').textContent=PROFILE.title;
byId('affil').textContent=PROFILE.affil;
const email = byId('email'); email.href = 'mailto:' + PROFILE.email; email.querySelector('.label').textContent = PROFILE.email;
byId('scholar').href=PROFILE.scholar; byId('github').href=PROFILE.github; byId('linkedin').href=PROFILE.linkedin;
document.querySelector('.chips').innerHTML=PROFILE.interests.map(t=>`<span class="chip">${t}</span>`).join('');
document.getElementById('year').textContent=new Date().getFullYear();

// ---- Publications: dynamic fetch + sort ----
let publications = [];
const mount = document.getElementById('pubs');
const selSort = document.getElementById('sort-by');

function normalizeYear(y){
  const n = parseInt(y,10);
  return Number.isFinite(n) ? n : -Infinity;
}

function sortPublications(list, mode){
  const arr = list.slice();
  switch(mode){
    case 'year_asc':
      arr.sort((a,b)=>normalizeYear(a.year)-normalizeYear(b.year)); break;
    case 'venue_az':
      arr.sort((a,b)=>String(a.venue||'').localeCompare(String(b.venue||''))); break;
    case 'venue_za':
      arr.sort((a,b)=>String(b.venue||'').localeCompare(String(a.venue||''))); break;
    case 'year_desc':
    default:
      arr.sort((a,b)=>normalizeYear(b.year)-normalizeYear(a.year));
  }
  return arr;
}

function renderPubs(list){
  mount.innerHTML = list.map(p=>{
    const links=(p.links||[]).map(l=>{
      const safe=(l.url||'').replace(/\s/g,'%20');
      const cls=linkClass(l.name,l.url);
      return `<a class="${cls}" href="${safe}" target="_blank" rel="noopener noreferrer">${l.name}</a>`;
    }).join('');
    const authors = p.moreAuthors
      ? `<details><summary>${highlightAuthors(p.authors)} <span aria-label="more">…</span></summary><div>${highlightAuthors(p.moreAuthors)}</div></details>`
      : highlightAuthors(p.authors);
    return `<div class="pub">
      <div class="title">${p.title}</div>
      <div class="venue">${[p.year,p.venue].filter(Boolean).join(' — ')}</div>
      <div class="authors">${authors}</div>
      <div class="links">${links}</div>
    </div>`;
  }).join('');
}

async function loadPubs(){
  try{
    const res = await fetch('publications.json',{cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    publications = await res.json();
    renderPubs(sortPublications(publications, selSort.value || 'year_desc'));
  }catch(err){
    mount.innerHTML = `<div class="pub"><div class="title">Failed to load publications</div><div class="venue" style="color:#dc2626">Error: ${String(err)}</div></div>`;
  }
}

selSort.addEventListener('change', ()=>{
  renderPubs(sortPublications(publications, selSort.value));
});
loadPubs();

// ---- News formatting ----
(function formatNews(){
  const ul = document.getElementById('news-list');
  if (!ul) return;
  ul.querySelectorAll('li').forEach(li=>{
    const raw = li.textContent.trim();
    const parts = raw.split(/[:：]\s*/);
    if (parts.length >= 2) {
      const date = parts[0];
      let msg  = parts.slice(1).join(': ');
      msg = msg
        .replace(/PML4SC/gi, '<a href="https://pml4sc.github.io/" target="_blank" rel="noopener"><b>PML4SC</b></a>')
        .replace(/Dr\.?\s+Shibo\s+Li/gi, '<a href="https://imshibo.com/" target="_blank" rel="noopener"><b>Dr. Shibo Li</b></a>');
      li.innerHTML = `<span class="pill">${date}</span><span class="msg">${msg}</span>`;
    }
  });
})();

// --- Mount & Resize ClustrMaps Globe (robust) ---
(function mountClustrGlobe(){
  const host = document.getElementById('globe-host');
  if (!host) return;

  // 1) 从 <script id="clstr_globe"> 的 src 提取 token（兜底使用）
  function getClustrToken(){
    const scriptEl =
      document.getElementById('clstr_globe') ||
      document.querySelector('script[src*="clustrmaps.com/globe.js"]');
    try{
      if (!scriptEl) return '';
      const u = new URL(scriptEl.src, window.location.href);
      return u.searchParams.get('d') || '';
    }catch{ return ''; }
  }

  // 2) 优先在 ClustrMaps 注入的容器里查找真实统计页 <a href="https://clustrmaps.com/site/xxxxx">
  function findStatsURL(holder){
    const candidates = [
      holder && holder.querySelector && holder.querySelector('a[href*="clustrmaps.com/site/"]'),
      document.querySelector('#visitors a[href*="clustrmaps.com/site/"]'),
      document.querySelector('a[href*="clustrmaps.com/site/"]'),
    ].filter(Boolean);
    if (candidates.length) return candidates[0].href;

    const t = getClustrToken();
    return t
      ? `https://clustrmaps.com/visits/map?d=${encodeURIComponent(t)}`
      : 'https://clustrmaps.com';
  }

  function moveCanvasIfReady() {
    const holder =
      document.querySelector('#clstr_globe + div') ||
      document.getElementById('clustrmaps-globe');

    let cvs = (holder && holder.querySelector && holder.querySelector('canvas')) || null;
    if (!cvs) {
      const all = document.querySelectorAll('#visitors canvas');
      for (const c of all) { if (!host.contains(c)) { cvs = c; break; } }
    }
    if (!cvs) return false;

    const originalRoot = cvs.parentElement;

    // 交给 CSS 控制尺寸
    cvs.removeAttribute('width');
    cvs.removeAttribute('height');
    cvs.style.width  = '100%';
    cvs.style.height = '100%';
    cvs.style.maxWidth  = '100%';
    cvs.style.maxHeight = '100%';

    host.innerHTML = '';
    host.appendChild(cvs);

    // 计算你的统计页链接（优先 /site/xxxx）
    const CLM_TARGET = findStatsURL(holder);

    // 覆盖第三方点击：直达个人统计页
    cvs.style.cursor = 'pointer';
    cvs.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      window.open(CLM_TARGET, '_blank', 'noopener');
    }, { capture: true });

    if (originalRoot && originalRoot !== host) originalRoot.style.display = 'none';
    document.querySelectorAll('#visitors canvas').forEach(x => {
      if (!host.contains(x)) x.style.display = 'none';
    });
    return true;
  }

  if (moveCanvasIfReady()) return;

  const mo = new MutationObserver(() => {
    if (moveCanvasIfReady()) mo.disconnect();
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
