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
const CLUSTRMAPS_SITE = 'https://clustrmaps.com/site/1c8ez';
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
  return Number.isFinite(n) ? n : -Infinity; // ensure unparsable go to end
}

function sortPublications(list, mode){
  const arr = list.slice();
  switch(mode){
    case 'year_asc':
      arr.sort((a,b)=>normalizeYear(a.year)-normalizeYear(b.year));
      break;
    case 'venue_az':
      arr.sort((a,b)=>String(a.venue||'').localeCompare(String(b.venue||'')));
      break;
    case 'venue_za':
      arr.sort((a,b)=>String(b.venue||'').localeCompare(String(a.venue||'')));
      break;
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
// ---- News: split "YYYY-MM: message" into [date pill][message] ----
(function formatNews(){
  const ul = document.getElementById('news-list');
  if (!ul) return;
  ul.querySelectorAll('li').forEach(li=>{
    const raw = li.textContent.trim();
    const parts = raw.split(/[:：]\s*/); // 支持 : 和 ：
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
  const script = document.getElementById('clstr_globe');
  const srcHolder = document.querySelector('#clstr_globe + div');
  const host = document.getElementById('globe-host');            // 我们可控的展示位置
  if (!host) return;

  // 把 ClustrMaps 生成的 <canvas> 搬到 #globe-host，并清理内联尺寸
  function moveCanvasIfReady() {
    const host = document.getElementById('globe-host');
    if (!host) return false;
  
    // 1) 优先：第三方脚本插入的兄弟容器 / 你的备选容器
    const holder =
      document.querySelector('#clstr_globe + div') ||
      document.getElementById('clustrmaps-globe');
  
    // 2) 在 holder 里找 canvas；找不到就只在 Visitors 区域兜底找
    let cvs =
      (holder && holder.querySelector && holder.querySelector('canvas')) || null;
  
    if (!cvs) {
      const all = document.querySelectorAll('#visitors canvas');
      for (const c of all) {
        if (!host.contains(c)) { cvs = c; break; }
      }
    }
    if (!cvs) return false;
  
    // 记录原父元素，等会把它隐藏（避免保留那只“巨型地球”）
    const originalRoot = cvs.parentElement;
  
    // 交给 CSS 控制尺寸
    cvs.removeAttribute('width');
    cvs.removeAttribute('height');
    cvs.style.width  = '100%';
    cvs.style.height = '100%';
    cvs.style.maxWidth  = '100%';
    cvs.style.maxHeight = '100%';
  
    // 只保留我们这只小画布
    host.innerHTML = '';
    host.appendChild(cvs);

    // 覆盖 ClustrMaps 默认点击：直接去自己的站点统计页
    cvs.style.cursor = 'pointer';
    cvs.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation?.();
      window.open('https://clustrmaps.com/site/1c8ez', '_blank', 'noopener');
    }, { capture: true });

    if (originalRoot && originalRoot !== host) originalRoot.style.display = 'none';
  
    // 保险：Visitors 区域里，凡是不在 #globe-host 里的多余画布一律隐藏
    document.querySelectorAll('#visitors canvas').forEach(x => {
      if (!host.contains(x)) x.style.display = 'none';
    });
  
    return true;
  }

  // 1) 页面上可能已经生成
  if (moveCanvasIfReady(srcHolder)) return;

  // 2) 若未生成，监听 DOM 变化（库异步插入时触发）
  const mo = new MutationObserver(() => {
    const holder = document.querySelector('#clstr_globe + div');
    if (moveCanvasIfReady(holder)) mo.disconnect();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // 3) 兜底：有些版本会插到父节点里，额外监听全局
  const mo2 = new MutationObserver(() => {
    const holder = document.querySelector('#clstr_globe + div');
    if (moveCanvasIfReady(holder)) mo2.disconnect();
  });
  mo2.observe(document.body, { childList: true, subtree: true });
})();
