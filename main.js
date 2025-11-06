// Basic profile (kept inline)
const PROFILE={
  name:'Yan Zhang',
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
