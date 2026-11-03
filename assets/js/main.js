(() => {
const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const DCOL = [1,2,3,4,5,6,7].map(i => `var(--d${i})`);
const DHEX = () => [1,2,3,4,5,6,7].map(i => css(`--d${i}`));

/* ---------- mobile nav ---------- */
const nav = $('#nav'), mb = $('#menuBtn');
mb.addEventListener('click', () => { const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });
nav.addEventListener('click', e => { if (e.target.tagName === 'A') { nav.classList.remove('open'); mb.setAttribute('aria-expanded', false); } });

/* ---------- hero rotating question ---------- */
const QS = ['for which tissue?','under which load?','when which part fails?','with whom in control?','compared with what?','measured how?','for which procedure?'];
let qi = 0; const qEl = $('#heroQ');
if (!reduce) setInterval(() => {
  qEl.classList.add('out');
  setTimeout(() => { qi = (qi + 1) % QS.length; qEl.textContent = QS[qi]; qEl.classList.remove('out'); }, 350);
}, 2600);

/* ---------- hero field: seven-colour constellation ---------- */
const cv = $('#field'), cx = cv.getContext('2d');
let pts = [], W = 0, H = 0;
function sizeField() {
  const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr,0,0,dpr,0,0);
  const n = Math.round(Math.min(90, W * H / 14000)), cols = DHEX();
  pts = Array.from({length: n}, (_, i) => ({ x: Math.random()*W, y: Math.random()*H, vx: (Math.random()-.5)*.25, vy: (Math.random()-.5)*.25, c: cols[i % 7], r: 1.2 + Math.random()*2 }));
}
function drawField() {
  cx.clearRect(0,0,W,H);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    for (let j = i+1; j < pts.length; j++) {
      const b = pts[j], dx = a.x-b.x, dy = a.y-b.y, d = Math.hypot(dx,dy);
      if (d < 120) { cx.strokeStyle = `rgba(255,255,255,${(1-d/120)*.12})`; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(a.x,a.y); cx.lineTo(b.x,b.y); cx.stroke(); }
    }
  }
  pts.forEach(p => { cx.fillStyle = p.c; cx.globalAlpha = .75; cx.beginPath(); cx.arc(p.x,p.y,p.r,0,7); cx.fill(); });
  cx.globalAlpha = 1;
  // fade toward the text side
  const g = cx.createLinearGradient(0,0,W,0); g.addColorStop(0,'rgba(11,21,48,.92)'); g.addColorStop(.55,'rgba(11,21,48,.55)'); g.addColorStop(1,'rgba(11,21,48,0)');
  cx.fillStyle = g; cx.fillRect(0,0,W,H);
}
function tick() {
  pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x<0||p.x>W) p.vx*=-1; if (p.y<0||p.y>H) p.vy*=-1; });
  drawField(); if (!reduce && !document.hidden) requestAnimationFrame(tick);
}
sizeField(); drawField(); if (!reduce) requestAnimationFrame(tick);
addEventListener('resize', () => { sizeField(); drawField(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) requestAnimationFrame(tick); });

/* ---------- evidence map ---------- */
const DIMS = [
  ['Physical interaction','Forces, pressures and energy exchanged with tissue at the contact.','peak and sustained contact pressure, contact area, impact energy'],
  ['Mechanical design','Structure, materials and mechanisms that generate or limit loads, including softness and compliance.','effective stiffness at the contact, force-limiting mechanisms, workspace limits'],
  ['Sensing','What the system can measure about itself and its surroundings.','force and shape sensing accuracy, latency, drift, coverage of the contact'],
  ['Control','How commands become motion, and how limits are enforced.','force or impedance limits, stability in contact, response to unexpected load'],
  ['Autonomy','How decisions are divided between the robot and the clinician.','level of autonomy per task step, override behavior, verification on unseen cases'],
  ['Human operation','How the clinician perceives, commands and supervises the system.','feedback quality, workload, error rates, learning curve'],
  ['Failure behavior','What the system does when a component, sensor or controller fails.','safe-state definition, time to reach it, recoverability and retraction']
];
const LV = ['Not addressed','Asserted','Modelled','Bench / phantom','Ex vivo / cadaver','In vivo / clinical'];
const LVtxt = ['','assertion','modelling','bench and phantom experiments','ex-vivo or cadaver experiments','in-vivo or clinical evidence'];
const PRESETS = {
  tele:{lv:[3,3,1,4,0,5,3],sys:'A teleoperated laparoscopic robot',haz:'unintended motion',cond:'during instrument exchange and suturing tasks'},
  soft:{lv:[3,1,0,2,0,1,0],sys:'A pneumatic soft continuum endoscope',haz:'excessive contact pressure on the lumen wall',cond:'in a straight colon segment at insertion speeds up to 10 mm/s'},
  mag:{lv:[4,2,2,3,1,1,1],sys:'A magnetically steered capsule',haz:'tissue perforation',cond:'in an insufflated stomach with fixed external magnet distance'},
  auto:{lv:[3,2,3,3,3,1,0],sys:'An autonomous needle-insertion robot',haz:'positioning error near critical anatomy',cond:'in static soft-tissue phantoms with pre-operative imaging'}
};
let levels = [0,0,0,0,0,0,0];
const tb = $('#matrix tbody');
DIMS.forEach((d, i) => {
  const tr = document.createElement('tr'); tr.style.setProperty('--c', DCOL[i]);
  tr.innerHTML = `<th scope="row"><button type="button" data-dim="${i}"><i></i>${d[0]}</button></th>` +
    LV.map((l, j) => `<td><button type="button" class="cell" data-d="${i}" data-l="${j}" aria-label="${d[0]}: ${l}"></button></td>`).join('');
  tb.appendChild(tr);
});
tb.addEventListener('click', e => {
  const c = e.target.closest('.cell'); const h = e.target.closest('[data-dim]');
  if (c) { levels[+c.dataset.d] = +c.dataset.l; clearPresets(); showDim(+c.dataset.d); render(); }
  else if (h) showDim(+h.dataset.dim);
});
function showDim(i) {
  const n = $('#dimNote'), d = DIMS[i];
  n.style.setProperty('--nc', DCOL[i]);
  n.innerHTML = `<b>${d[0]}.</b> ${d[1]} Typical measures: ${d[2]}. Current rating: <b>${LV[levels[i]]}</b>.`;
}
function clearPresets(){ document.querySelectorAll('.presets .pill').forEach(p => p.setAttribute('aria-pressed','false')); }
document.querySelectorAll('.presets .pill').forEach(p => p.addEventListener('click', () => {
  const k = p.dataset.preset;
  if (k === 'clear') { levels = [0,0,0,0,0,0,0]; clearPresets(); }
  else { const P = PRESETS[k]; levels = P.lv.slice(); $('#cSys').value = P.sys; $('#cHaz').value = P.haz; $('#cCond').value = P.cond;
    clearPresets(); p.setAttribute('aria-pressed','true'); }
  render();
}));
['#cSys','#cHaz','#cCond'].forEach(s => $(s).addEventListener('input', render));

function radar() {
  const svg = $('#radar'), C = 180, R = 125, n = 7, cols = DHEX();
  const ang = i => -Math.PI/2 + i * 2*Math.PI/n;
  const P = (i, r) => [C + Math.cos(ang(i))*r, C + Math.sin(ang(i))*r];
  let s = '';
  for (let k = 1; k <= 5; k++) s += `<polygon points="${[...Array(n)].map((_,i)=>P(i,R*k/5).join(',')).join(' ')}" fill="none" stroke="rgba(255,255,255,${k===3?.28:.12})" stroke-width="1" ${k===3?'stroke-dasharray="4 4"':''}/>`;
  for (let i = 0; i < n; i++) { const [x,y] = P(i,R); s += `<line x1="${C}" y1="${C}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.12)"/>`; }
  const poly = levels.map((l,i) => P(i, Math.max(l,0.15)*R/5).join(',')).join(' ');
  s += `<polygon points="${poly}" fill="rgba(255,176,32,.22)" stroke="#FFB020" stroke-width="2" stroke-linejoin="round" style="transition:all .3s"/>`;
  levels.forEach((l,i) => { const [x,y] = P(i, Math.max(l,0.15)*R/5); s += `<circle cx="${x}" cy="${y}" r="${l?6:4}" fill="${l?cols[i]:'#0B1530'}" stroke="${cols[i]}" stroke-width="2"/>`; });
  DIMS.forEach((d,i) => { const [x,y] = P(i, R+26); const a = Math.cos(ang(i));
    s += `<text x="${x}" y="${y+4}" text-anchor="${a>.3?'start':a<-.3?'end':'middle'}" font-family="IBM Plex Mono, monospace" font-size="11" fill="${cols[i]}">D${i+1}</text>`; });
  s += `<text x="${C}" y="${C - R*3/5 - 6}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" fill="rgba(255,255,255,.5)">bench threshold</text>`;
  svg.innerHTML = s;
}
const esc = t => t.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function render() {
  document.querySelectorAll('.cell').forEach(c => {
    const d = +c.dataset.d, l = +c.dataset.l, on = l > 0 && l <= levels[d];
    c.classList.toggle('lit', on); c.style.setProperty('--c', DCOL[d]); c.style.setProperty('--a', (25 + l*15) + '%');
    c.classList.toggle('sel', l === levels[d]); c.setAttribute('aria-pressed', l === levels[d]);
  });
  const exp = levels.filter(l => l >= 3).length, weak = levels.filter(l => l === 1 || l === 2).length, miss = levels.filter(l => l === 0).length;
  $('#stCovered').textContent = exp; $('#stAsserted').textContent = weak; $('#stMissing').textContent = miss;
  radar();

  const sys = esc($('#cSys').value.trim() || 'The system'), haz = esc($('#cHaz').value), cond = esc($('#cCond').value.trim());
  const strong = levels.map((l,i)=>[l,i]).filter(([l]) => l >= 3);
  const best = Math.max(...levels);
  let t;
  if (!strong.length) {
    t = `<mark>${sys}</mark> is not yet supported by experimental evidence against <mark>${haz}</mark>. ${best ? `Its argument currently rests on ${LVtxt[best]}.` : 'No dimension has been rated.'}`;
  } else {
    const names = strong.map(([,i]) => DIMS[i][0].toLowerCase());
    const list = names.length > 1 ? names.slice(0,-1).join(', ') + ' and ' + names.at(-1) : names[0];
    t = `<mark>${sys}</mark> reduces the risk of <mark>${haz}</mark>${cond ? ` <mark>${cond}</mark>` : ''}, as supported by ${LVtxt[best]} addressing ${list}.`;
    const absent = levels.map((l,i)=>[l,i]).filter(([l]) => l === 0).map(([,i]) => DIMS[i][0].toLowerCase());
    if (absent.length) t += ` The claim does not cover ${absent.length > 1 ? absent.slice(0,-1).join(', ') + ' or ' + absent.at(-1) : absent[0]}.`;
  }
  $('#claimTxt').innerHTML = t;

  const g = [];
  levels.forEach((l,i) => {
    if (l === 0) g.push([i, `${DIMS[i][0]}: not addressed.`]);
    else if (l < 3) g.push([i, `${DIMS[i][0]}: ${l === 1 ? 'asserted' : 'modelled'} but not tested.`]);
  });
  if (!cond) g.unshift([0, 'No operating conditions: the claim has no stated scope.']);
  if (levels[6] === 0 && strong.length) g.push([6, 'Without failure testing the claim covers nominal operation only.']);
  $('#gaps').innerHTML = g.slice(0,5).map(([i,s]) => `<li style="--c:${DCOL[i]}">${s}</li>`).join('') || '<li>Every dimension has experimental evidence. State the thresholds used.</li>';
}
render(); showDim(0);

/* ---------- copy helpers ---------- */
function copy(text, btn) {
  const lbl = btn.textContent, done = () => { btn.textContent = 'Copied'; setTimeout(() => btn.textContent = lbl, 1500); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
}
$('#copyClaim').addEventListener('click', e => copy($('#claimTxt').textContent, e.currentTarget));
$('#copyMail').addEventListener('click', e => copy('mostafa.a.atalla@gmail.com', e.currentTarget));

/* ---------- terminology lenses ---------- */
const LENSES = [['Surgical robotics','var(--d5)'],['Soft robotics','var(--d3)'],['Benchmarking','var(--d4)'],['Clinical practice','var(--d1)'],['Industry','var(--d6)']];
const TERMS = {
  'Safety':[
    'Does the system avoid harming tissue at the forces and speeds the task actually requires?',
    'Does the structure limit the load it can transmit, and over what range of deformation?',
    'Which metric, measured under which protocol, would let two systems be compared?',
    'Are outcomes and complications at least as good as with current instruments?',
    'Which hazards appear in the risk analysis, and which test shows each one is controlled?'],
  'Compliance':[
    'How far does the instrument deflect under task loads, and what does that cost in accuracy?',
    'Where does the effective stiffness at the contact come from: material, geometry or actuation?',
    'Is compliance reported at the contact point, in the loading direction, over the relevant force range?',
    'Does the instrument yield before the tissue does?',
    'Is compliance consistent across units, sterilization cycles and service life?'],
  'Robustness':[
    'Does performance hold under anatomical variation, tissue motion and uncertain tool–tissue contact?',
    'Does behavior survive fabrication variability and material ageing?',
    'Which disturbances are in the test protocol, and which are assumed absent?',
    'Does it work across patients, or only in the best case?',
    'Does it hold across production units, users and sites?'],
  'Backdrivability':[
    'Can external load move the joints, and how much force does that take?',
    'Is the body intrinsically backdrivable, or only once actuation is released?',
    'How is backdrive force measured, and in which configuration?',
    'Can I withdraw the instrument by hand if something goes wrong?',
    'Is backdrivability preserved under power loss and brake engagement?'],
  'Safe failure':[
    'Which state does the robot enter when a sensor, actuator or controller fails, and how fast?',
    'Does loss of pressure or tendon tension leave the device passive, or locked in a deformed shape?',
    'Are failure modes injected and tested, or only listed?',
    'Can the procedure be completed, or safely aborted, after the failure?',
    'Is every failure mode in the FMEA linked to a verification test?'],
  'Autonomy':[
    'Which decisions does the robot take, and which remain with the surgeon?',
    'Can embodied mechanical responses count as autonomy, and how are they verified?',
    'How is autonomous behavior evaluated on cases it was not tuned on?',
    'Who is accountable when an autonomous action goes wrong?',
    'How is the scope of autonomy specified, validated and constrained?']
};
const tabs = $('#termTabs'), lens = $('#lenses'), keys = Object.keys(TERMS);
keys.forEach((k, i) => { const b = document.createElement('button'); b.type='button'; b.className='tab'; b.role='tab'; b.textContent=k; b.addEventListener('click', () => showTerm(i)); tabs.appendChild(b); });
function showTerm(i) {
  [...tabs.children].forEach((b,j) => b.setAttribute('aria-selected', i===j));
  lens.innerHTML = TERMS[keys[i]].map((q,j) => `<div class="lens" style="--c:${LENSES[j][1]}"><b>${LENSES[j][0]}</b><p>${q}</p></div>`).join('');
}
showTerm(0);

/* ---------- timeline progress (term: Nov 2026 – Nov 2028) ---------- */
const t0 = new Date('2026-11-01'), t1 = new Date('2028-11-01');
const f = Math.min(1, Math.max(0, (Date.now() - t0) / (t1 - t0)));
const pct = Math.max(2, f * 100);
$('#tlFill').style.width = pct + '%'; $('#tlNow').style.left = pct + '%';
$('#tlNow').textContent = f >= 1 ? 'Term complete' : 'Now';

/* ---------- team ---------- */
const TEAM = [
  ['Dr. Mostafa A. Atalla','Delft University of Technology','Corresponding Founding Co-Chair','<b>Leads</b> overall coordination, liaison with the host TC and RAS, the expert interview series and communication.','atalla',4],
  ['Dr. Di Wu','University of Southern Denmark','Co-Chair','<b>Leads</b> workshop planning and the scientific programme.','wu',0],
  ['Dr. Julie Legrand','Eindhoven University of Technology','Co-Chair','<b>Leads</b> the community survey and its synthesis.','legrand',2],
  ['Dr. Linda Paternò','Scuola Superiore Sant’Anna','Co-Chair','<b>Leads</b> publication activity, including the journal special collection.','paterno',3],
  ['Dr. Tim Horeman','Delft University of Technology','Co-Chair','<b>Leads</b> industry engagement and translation, bringing MedTech development and testing perspectives.','horeman',1],
  ['Prof. Dr. Arianna Menciassi','Scuola Superiore Sant’Anna','Founding Senior Advisor','Scientific advice, strategic guidance and connection to senior academic, clinical and industrial experts.','menciassi',5]
];
$('#team').innerHTML = TEAM.map(p => {
  const ini = p[0].replace(/^(Prof\. )?Dr\. /,'').split(' ').filter(w => /^[A-Z]/.test(w) && w.length > 2).map(w => w[0]).join('').slice(0,2);
  return `<article class="person"><div class="photo" style="--c:${DCOL[p[5]]}"><span class="ini" aria-hidden="true">${ini}</span>
    <img src="assets/img/team/${p[4]}.jpg" alt="${p[0]}" loading="lazy" onerror="this.remove()"></div>
    <div class="person-b"><span class="role">${p[2]}</span><h3>${p[0]}</h3><span class="aff">${p[1]}</span><p class="lead-tag">${p[3]}</p></div></article>`;
}).join('');
})();

/* ---------- workshops album ---------- */
(() => {
const CO = ['M. A. Atalla','D. Wu','J. Legrand','L. Paternò','T. Horeman','A. Menciassi'];
const ART = {
  a:'radial-gradient(circle at 78% 22%,#FFB020 0 18%,transparent 18.5%),repeating-radial-gradient(circle at 78% 22%,transparent 0 22px,rgba(255,255,255,.14) 22px 24px),linear-gradient(135deg,#0B1530,#2440D6)',
  b:'repeating-linear-gradient(45deg,rgba(255,255,255,.12) 0 2px,transparent 2px 18px),linear-gradient(160deg,#0F7A55,#16AFC2)',
  c:'radial-gradient(circle at 20% 80%,#E8508F 0 30%,transparent 30.5%),radial-gradient(circle at 85% 15%,#9A68FF 0 22%,transparent 22.5%),linear-gradient(135deg,#2A1650,#4C6BFF)',
  d:'conic-gradient(from 210deg at 70% 35%,#FF6B4A,#FFB020,#FF6B4A 50%,#B8321A 50%,#B8321A)',
  e:'repeating-radial-gradient(ellipse at 50% 120%,rgba(255,255,255,.16) 0 3px,transparent 3px 26px),linear-gradient(180deg,#9A68FF,#E8508F)',
  f:'linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px) 0 0/28px 28px,linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px) 0 0/28px 28px,linear-gradient(135deg,#16AFC2,#2FBF71)'
};
const WS = [
  {feature:1,badge:'Origin of this WG',venue:'ICRA',year:2026,city:'Vienna · 5 June',art:'a',
   title:'Soft ≠ Safe? Rethinking Softness in Medical Robotics',
   org:['M. A. Atalla','S. Sharma','T. Morimoto','T. Nanayakkara','R. J. Webster III','A. Menciassi'],url:'https://sites.google.com/view/rethinkingsoftness/home'},
  {venue:'Hamlyn',year:2026,city:'London',art:'b',
   title:'Smart by Structure: Designing Surgical Devices for Equity and Sustainability',
   org:['B. Calmé','L. Mocellin','M. A. Atalla','Q. Boehler','C. Bergeles','T. Horeman','A. Menciassi'],
   url:''},
  {venue:'Hamlyn',year:2026,city:'London',art:'c',
   title:'Soft Robotic Systems for Diagnostics and Therapy in Minimally Invasive and Endoluminal Interventions',
   org:['N. N. Dei','A. B. Dawood','D. Osman','M. A. Atalla','K. Althoefer'],url:''},
  {venue:'Hamlyn',year:2025,city:'London',art:'e',
   title:'From Research to Clinical Practice: Bridging the Gap in Robotic Colonoscopy',
   org:['M. Finocchiaro','M. A. Atalla','Y. Ge','L. Paternò','J. Kinross','M. Abayazid','T. Nanayakkara'],url:'https://sites.google.com/view/roboticcolonoscopywshsmr25/home'},
  {venue:'RoboSoft',year:2025,city:'Lausanne',art:'d',
   title:'Soft Robotics Mimicking the Human Body for Medical Applications',
   org:['L. Lorenzon','M. A. Atalla','M. Maselli','M. Singh','L. Paternò','K. Suzumori'],url:'https://sites.google.com/view/softrobotics-in-medicine/home'},
  {venue:'Hamlyn',year:2024,city:'London',art:'f',
   title:'Bio-inspired Medical Robotics: From Evolution to Revolution in Healthcare',
   org:['M. A. Atalla','D. Wu','L. Fichera','A. Sakes'],url:''}
];
const rail = document.getElementById('wsRail');
const host = u => { try { return new URL(u).hostname.replace(/^www\./,'') + new URL(u).pathname.replace(/\/home\/?$/,'').replace(/\/$/,''); } catch(e){ return 'workshop page'; } };
const slug = w => (w.venue + w.year + w.title.split(' ')[0]).toLowerCase().replace(/[^a-z0-9]/g,'');
rail.innerHTML = WS.map(w => `
  <article class="album${w.feature?' feature':''}" data-y="${w.year}">
    <div class="cover" style="--art:${ART[w.art]}">
      <div class="cv-top"><span>${w.city} · ${w.year}</span>${w.badge?`<span class="cv-badge">${w.badge}</span>`:''}</div>
      <a class="shot" ${w.url?`href="${w.url}" target="_blank" rel="noopener"`:'tabindex="-1" aria-hidden="true"'}>
        <span class="shot-bar"><i></i><i></i><i></i><em>${w.url?host(w.url):'workshop page'}</em></span>
        <span class="shot-body">
          <span class="mock"><b>${w.venue} ${w.year} Workshop</b><strong>${w.title}</strong><span class="mock-lines"><i></i><i></i><i></i></span><span class="mock-org">${w.org.slice(0,4).join(' · ')}</span></span>
          <img alt="" loading="lazy" data-local="assets/img/workshops/${slug(w)}.jpg" data-remote="${w.url?'https://s.wordpress.com/mshots/v1/'+encodeURIComponent(w.url)+'?w=1000&h=750':''}">
        </span>
      </a>
      <div class="cv-venue">${w.venue}<small>${w.venue==='Hamlyn'?'Symposium on Medical Robotics':w.venue==='ICRA'?'IEEE Intl. Conf. on Robotics & Automation':'IEEE Intl. Conf. on Soft Robotics'}</small></div>
    </div>
    <div class="album-meta">
      <h3>${w.title}</h3>
      <p class="org">${w.org.map(n => CO.includes(n)?`<b>${n}</b>`:n).join(', ')}</p>
      ${w.url?`<a class="lnk" href="${w.url}" target="_blank" rel="noopener">Workshop page ↗</a>`:''}
    </div>
  </article>`).join('');

/* screenshots: local file first, then a live capture of the workshop site, else the mock page stays */
rail.querySelectorAll('.shot img').forEach(img => {
  const ok = () => { if (img.naturalWidth >= 500) img.classList.add('on'); else retry(); };
  let tries = 0;
  const retry = () => { const r = img.dataset.remote; if (!r || tries > 2) return; tries++; setTimeout(() => { img.src = r + '&t=' + tries; }, tries === 1 ? 0 : 7000); };
  img.addEventListener('load', ok);
  img.addEventListener('error', () => { if (img.src.includes('assets/img/workshops/')) retry(); });
  img.src = img.dataset.local;
});
const prev = document.getElementById('wsPrev'), next = document.getElementById('wsNext');
const step = () => (rail.querySelector('.album:not([hidden])')?.getBoundingClientRect().width || 300) + 22;
prev.addEventListener('click', () => rail.scrollBy({left:-step()}));
next.addEventListener('click', () => rail.scrollBy({left:step()}));
const upd = () => { prev.disabled = rail.scrollLeft < 8; next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8; };
rail.addEventListener('scroll', upd, {passive:true}); addEventListener('resize', upd); upd();
rail.addEventListener('keydown', e => { if (e.key==='ArrowRight'){e.preventDefault();next.click()} if (e.key==='ArrowLeft'){e.preventDefault();prev.click()} });
document.querySelectorAll('#wsFilter .pill').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#wsFilter .pill').forEach(x => x.setAttribute('aria-pressed', x===b));
  const y = b.dataset.y;
  rail.querySelectorAll('.album').forEach(a => a.hidden = !(y==='all' || a.dataset.y===y));
  rail.scrollTo({left:0}); setTimeout(upd, 350);
}));
})();
