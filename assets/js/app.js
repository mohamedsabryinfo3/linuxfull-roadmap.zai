/* منطق الموقع: التقدم، الفلاتر، التصدير/الاستيراد — يقرأ البيانات من window.ROADMAP_DATA */
const D = window.ROADMAP_DATA;
/* ===== DATA (embedded — static site, no backend) ===== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ===== STATE (same storage keys as the previous version → progress migrates automatically) ===== */
const LKEY='linuxSocFinal.linux.done.v1', NKEY='linuxSocFinal.linux.notes.v1', SKEY='linuxSocFinal.soc.done.v1', GKEY='linuxSocFinal.gate.v1', PKEY='linuxSocFinal.linux.pts.v1';
const lsGet=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let done=new Set(lsGet(LKEY,[]));
let notes=lsGet(NKEY,{})||{};
let socDone=new Set(lsGet(SKEY,[]));
let gate=Object.assign({linux:false,security:false,lab:false}, lsGet(GKEY,{})||{});
let ptsDone=lsGet(PKEY,{})||{};
const openPhases=new Set(['p01']), openLessons=new Set(), openAccs=new Set();
let fSearch='', fKind='all', fHide=false, fSrc='all';

const PH=D.phases, LS=D.lessons, SP=D.socPhases, EX=D.sourceExtras;
const byPhase={}; LS.forEach(l=>(byPhase[l.phaseId]??=[]).push(l));
const SOC_TOTAL = SP.reduce((a,s)=>a+s.tasks.length,0);
const BADGE={'أساسي':['b-basic','أساسي'],'إضافة مكملة':['b-comp','إضافة مكملة'],'تطبيق عملي':['b-prac','تطبيق عملي']};

/* ===== duration helpers ===== */
const durSec=s=>{const m=/^(\d{1,3}):([0-5]\d)(?::([0-5]\d))?$/.exec(String(s||'').trim());if(!m)return 0;return m[3]!==undefined?(+m[1])*3600+(+m[2])*60+(+m[3]):(+m[1])*60+(+m[2])};
const fmtDur=s=>{const h=Math.floor(s/3600),m=Math.round((s%3600)/60);return (h?h+' س ':'')+(m?m+' د':'')};
const durShort=l=>l.mediaType==='lab'?'⟲ لاب عملي':(durSec(l.duration)?l.duration:'⏱ غير محددة');
const phaseTime=p=>{const t=(byPhase[p.id]||[]).reduce((a,l)=>a+durSec(l.duration),0);return t?`⏱ ≈ ${fmtDur(t)} مشاهدة`:`⏱ ${p.time}`};

/* ===== HERO TRACK MAP ===== */
function buildMap(){
  const mk=(g,x,y,cls)=>{const c=document.createElementNS(NS,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',5.5);c.setAttribute('class',cls);g.appendChild(c)};
  for(let i=0;i<16;i++) mk($('#mapGreen'),700-i*41,62,'map-st map-st-green');
  for(let i=0;i<10;i++) mk($('#mapCyan'),92+i*60.4,184,'map-st map-st-cyan');
}
function updateMap(){
  const gc=Math.round(done.size/LS.length*16);
  $$('#mapGreen circle').forEach((c,i)=>c.classList.toggle('done',i<gc));
  const cc=Math.round(socDone.size/Math.max(1,SOC_TOTAL)*10);
  $$('#mapCyan circle').forEach((c,i)=>c.classList.toggle('done',i<cc));
  const ready=gate.linux&&gate.security;
  $('#mapGate').setAttribute('fill',ready?'#ffb648':'#0c1017');
}

/* ===== LINUX STATIONS ===== */
function renderPhases(){
  $('#phaseList').innerHTML = PH.map((p,pi)=>{
    const list=byPhase[p.id]||[];
    return `<article class="station" data-phase="${p.id}">
      <div class="node"><div class="node-in">
        <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18.5" fill="none" stroke="#1e2530" stroke-width="3"/><circle class="pr" cx="22" cy="22" r="18.5" fill="none" stroke="#3ce88a" stroke-width="3" stroke-linecap="round" stroke-dasharray="116.24" stroke-dashoffset="116.24" style="transition:stroke-dashoffset .4s"/></svg>
        <span class="node-num mono">${String(pi+1).padStart(2,'0')}</span>
      </div></div>
      <div class="st-card" data-card="${p.id}">
        <header class="st-head" data-toggle="${p.id}">
          <div class="st-title"><h3>${esc(p.title)}</h3><span class="st-sub">${esc(p.subtitle)}</span></div>
          <div class="st-meta">
            <span class="chip" title="${esc(p.time)}">${esc(phaseTime(p))}</span>
            <span class="chip done-chip" data-chip="${p.id}">0/${list.length}</span>
            <button class="st-toggle" tabindex="-1">الدروس <i>▾</i></button>
          </div>
        </header>
        <div class="st-goals">
          <div><b>🎯 الهدف من المرحلة</b><p>${esc(p.goal)}</p></div>
          <div><b>📦 المطلوب تسليمه</b><p>${esc(p.deliverable)}</p></div>
        </div>
        <div class="lessons" data-lessons="${p.id}"></div>
      </div>
    </article>`;
  }).join('');
  PH.forEach(p=>renderLessons(p.id));
}
function lessonChk(l){return [...(l.qs||[]), l.task]}
function lessonRow(l){
  const open=openLessons.has(l.id);
  const [bc,bl]=BADGE[l.kind]||['b-type',l.kind];
  const dur=durShort(l);
  const chk=lessonChk(l);
  const pd=ptsDone[l.id]||[];
  const pc=chk.reduce((a,_,i)=>a+(pd[i]?1:0),0);
  const ao=openAccs.has(l.id);
  return `<div class="lesson ${done.has(l.id)?'is-done':''} ${open?'open':''}" id="${l.id}">
    <div class="ls-row">
      <label class="ck" title="تعليم كمنتهي"><input type="checkbox" data-check="${l.id}" ${done.has(l.id)?'checked':''}><span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span></label>
      <button class="ls-main" data-open="${l.id}">
        <span class="ls-num mono">${l.seq}#</span>
        <span class="ls-tline">
          <span class="ls-title" dir="auto">${esc(l.title)}</span>
          <span class="ls-inst">👨‍🏫 ${esc(l.instructor)}</span>
        </span>
        <span class="badge ${bc}">${esc(bl)}</span>
        ${pc>0?`<span class="ls-fchip mono" title="نقاط الفهم المعلّمة في هذا الدرس">فهم ${pc}/${chk.length}</span>`:''}
        <span class="ls-dur mono">${esc(dur)}</span>
      </button>
      <span class="ls-chev">▾</span>
    </div>
    <div class="ls-acc ${ao?'open':''}">
      <button class="ls-acc-t" data-acc="${l.id}">تفاصيل <i>▾</i></button>
      <div class="ls-acc-b">
        <div class="ls-sec"><b>وصف الدرس</b><p>${esc(l.reason)}</p></div>
        <div class="ls-sec"><b>أهم النقاط</b><ul>${(l.pts||[]).map(p=>`<li>${esc(p)}</li>`).join('')}</ul></div>
        <div class="ls-sec"><b>المطلوب متي — علّم على ما أتممت فهمه وتطبيقه</b>
          <div class="chk-list">${chk.map((c,i)=>`<label class="chk-item ${pd[i]?'on':''}"><input type="checkbox" data-pts="${l.id}:${i}" ${pd[i]?'checked':''}><span class="chk-dot"></span><span class="chk-txt">${esc(c)}</span></label>`).join('')}</div>
        </div>
      </div>
    </div>
    <div class="ls-detail">
      <div class="d-meta"><b>عن المحاضر:</b> ${esc(l.instructorNote||l.instructor)}<br><b>الكورس:</b> ${esc(l.course)} · <b>الموضع:</b> ${esc(l.lessonNo)}${l.chapter?` · <b>${esc(l.chapter)}</b>`:''}${l.sourceGroup?`<br><b>المجموعة:</b> ${esc(l.sourceGroup)}`:''}</div>
      <textarea class="p-note" data-note="${l.id}" placeholder="اكتب ملاحظاتك الشخصية: أوامر، أخطاء، نتائج التطبيق...">${esc(notes[l.id]||'')}</textarea>
      <div class="ls-actions">
        <a class="btn-mini" href="${esc(l.url)}" target="_blank" rel="noopener">${l.mediaType==='lab'?'فتح معمل Bandit ↗':'فتح المقطع المحدد ↗'}</a>
        ${l.helpUrl?`<a class="btn-mini help" href="${esc(l.helpUrl)}" target="_blank" rel="noopener">فيديو الشرح عند الحاجة ↗</a>`:''}
      </div>
    </div>
  </div>`;
}
function lessonMatch(l){
  if(fHide&&done.has(l.id))return false;
  if(fKind!=='all'&&l.kind!==fKind)return false;
  if(fSearch){const q=fSearch.toLowerCase();const hay=(l.title+' '+l.course+' '+l.instructor+' '+(l.lessonNo||'')+' '+(l.reason||'')+' '+(l.pts||[]).join(' ')+' '+(l.qs||[]).join(' ')+' '+(l.task||'')).toLowerCase();if(!hay.includes(q))return false}
  return true;
}
function renderLessons(pid){
  const cont=document.querySelector(`[data-lessons="${pid}"]`);
  if(!cont)return;
  const list=(byPhase[pid]||[]).filter(lessonMatch);
  cont.innerHTML=list.map(lessonRow).join('')||'<div style="padding:14px 20px;color:var(--dim);font-size:13px">لا توجد دروس مطابقة للفلتر الحالي.</div>';
  const st=document.querySelector(`.station[data-phase="${pid}"]`);
  if(st)st.classList.toggle('hide',list.length===0&&!!(fSearch||fKind!=='all'||fHide));
}

/* ===== NEXT LESSON CARD ===== */
function renderNext(){
  const el=$('#nextCard');
  const nxt=LS.find(l=>!done.has(l.id));
  if(!nxt){el.innerHTML=`<span class="nc-tag">✦ COMPLETED</span><div class="nc-title">أكملت الـ${LS.length} وحدة كلها — انتقل إلى Security+ ثم افتح قسم SOC.<small>أنهيت مسار Linux بالكامل 🎉</small></div><a class="btn-next" href="#soc">عرض خطة SOC ←</a>`;return}
  const ph=PH.find(p=>p.id===nxt.phaseId);
  el.innerHTML=`<span class="nc-tag">✦ الخطوة التالية — ${esc(ph.title)}</span><div class="nc-title" dir="auto">${nxt.seq}# · ${esc(nxt.title)}<small>${esc(nxt.duration)} · ${esc(nxt.instructor)}</small></div><button class="btn-next" data-goto="${nxt.id}">افتح الدرس ←</button>`;
}

/* ===== PROGRESS ===== */
function updateProgress(){
  const n=done.size, pct=n/LS.length*100;
  $('#linuxBar').style.width=pct+'%';
  $('#linuxPct').textContent=Math.round(pct)+'%';
  $('#linuxCount').textContent=`${n}/${LS.length} درس`;
  $('#linuxRemain').textContent=n===LS.length?'المسار مكتمل ✦':`المتبقي ${LS.length-n} درس`;
  $('#ringArc').style.strokeDashoffset=String(103.7*(1-pct/100));
  $('#ringPct').textContent=Math.round(pct)+'%';
  $('#ringCount').textContent=`${n}/${LS.length} درس`;
  $('#savedCount').textContent=`${n} وحدة مكتملة`;
  PH.forEach(p=>{
    const list=byPhase[p.id]||[];const d=list.filter(l=>done.has(l.id)).length;const frac=list.length?d/list.length:0;
    const chip=document.querySelector(`[data-chip="${p.id}"]`);
    if(chip){chip.textContent=`${d}/${list.length}`;chip.classList.toggle('complete',d===list.length&&list.length>0)}
    const arc=document.querySelector(`.station[data-phase="${p.id}"] .pr`);
    if(arc)arc.style.strokeDashoffset=String(116.24*(1-frac));
    const st=document.querySelector(`.station[data-phase="${p.id}"]`);
    if(st)st.classList.toggle('done',d===list.length&&list.length>0);
  });
  renderNext();
  updateMap();
}

/* ===== SOC ===== */
function renderGate(){
  const s00=SP[0];
  const gk=['linux','security','lab'];
  $('#gateChecks').innerHTML=s00.tasks.map((t,i)=>`
    <label class="gcheck ${gate[gk[i]]?'checked':''}">
      <input type="checkbox" data-gate="${gk[i]}" ${gate[gk[i]]?'checked':''}>
      <span><span class="g-t">${esc(t.title)}</span><span class="g-n">${esc(t.note)}</span></span>
    </label>`).join('');
  const ready=gate.linux&&gate.security;
  const st=$('#gateStatus');
  st.textContent=ready?'✦ جاهز للبدء':'لم يحن البدء بعد';
  st.classList.toggle('chip-ready',ready);
  st.classList.toggle('chip-cyan',ready);
}
function renderSocTasks(sid){
  const s=SP.find(x=>x.id===sid);const cont=document.querySelector(`[data-slessons="${sid}"]`);
  if(!cont)return;
  cont.innerHTML=s.tasks.map((t,i)=>{
    const id=`${sid}:${i}`,d=socDone.has(id);
    return `<div class="lesson ${d?'is-done':''}" id="soc-${sid}-${i}">
      <div class="ls-row">
        <label class="ck"><input type="checkbox" data-scheck="${id}" ${d?'checked':''}><span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span></label>
        <div class="ls-main" style="cursor:default">
          <span class="ls-title" dir="auto">${esc(t.title)}</span>
          ${t.type?`<span class="badge b-type">${esc(t.type)}</span>`:''}
          ${t.duration?`<span class="ls-dur mono">${esc(t.duration)}</span>`:''}
        </div>
        ${t.url?`<a class="btn-mini" style="padding:6px 12px;font-size:11.5px" href="${esc(t.url)}" target="_blank" rel="noopener">فتح ↗</a>`:''}
      </div>
      ${t.note||t.source||t.lessonNo?`<div style="padding:0 18px 14px"><div class="d-meta" style="margin-top:0">${t.source?`<b>المصدر:</b> ${esc(t.source)}${t.lessonNo?` · ${esc(t.lessonNo)}`:''}<br>`:''}${t.note?esc(t.note):''}</div></div>`:''}
    </div>`;
  }).join('');
}
function renderSoc(){
  $('#socList').innerHTML=SP.slice(1).map((p,i)=>`
    <article class="station" data-soc="${p.id}">
      <div class="node"><div class="node-in">
        <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18.5" fill="none" stroke="#1e2530" stroke-width="3"/><circle class="pr" cx="22" cy="22" r="18.5" fill="none" stroke="#41c7ff" stroke-width="3" stroke-linecap="round" stroke-dasharray="116.24" stroke-dashoffset="116.24" style="transition:stroke-dashoffset .4s"/></svg>
        <span class="node-num mono">${String(i+1).padStart(2,'0')}</span>
      </div></div>
      <div class="st-card" data-scard="${p.id}">
        <header class="st-head" data-stoggle="${p.id}">
          <div class="st-title"><h3>${esc(p.title)}</h3><span class="st-sub">${esc(p.goal)}</span></div>
          <div class="st-meta"><span class="chip">${p.tasks.length} عنصر</span><button class="st-toggle" tabindex="-1">التفاصيل <i>▾</i></button></div>
        </header>
        <div class="st-pillars">${(p.pillars||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
        <div class="lessons" data-slessons="${p.id}"></div>
      </div>
    </article>`).join('');
  SP.slice(1).forEach(p=>renderSocTasks(p.id));
}
function updateSocProgress(){
  SP.slice(1).forEach(p=>{
    const d=p.tasks.filter((_,i)=>socDone.has(`${p.id}:${i}`)).length,frac=p.tasks.length?d/p.tasks.length:0;
    const arc=document.querySelector(`.station[data-soc="${p.id}"] .pr`);
    if(arc)arc.style.strokeDashoffset=String(116.24*(1-frac));
    const st=document.querySelector(`.station[data-soc="${p.id}"]`);
    if(st)st.classList.toggle('done',d===p.tasks.length&&p.tasks.length>0);
  });
}

/* ===== PILLARS ===== */
function renderPillars(){
  $('#pillarsGrid').innerHTML=(EX.socPillars||[]).map((p,i)=>`
    <div class="pillar"><div class="p-num">PILLAR ${String(i+1).padStart(2,'0')}</div><h4>${esc(p.name)}</h4><p>${esc(p.description)}</p></div>`).join('');
}

/* ===== SOURCES ===== */
const srcClass=s=>{
  if(s.includes('مؤجل'))return['sb-later','later'];
  if(s.includes('غير مدمج')||s.includes('مستبعد'))return['sb-skip','skip'];
  if(s.includes('مدمج'))return[s.includes('بالكامل')?'sb-used':'sb-partial','used'];
  return['sb-skip','skip'];
};
function renderSources(){
  const list=D.sources.filter(s=>fSrc==='all'||srcClass(s.status)[1]===fSrc);
  $('#srcGrid').innerHTML=list.map(s=>{
    const[bc]=srcClass(s.status);
    return `<article class="src-card">
      <span class="src-badge ${bc}">${esc(s.status)}</span>
      <h3>${esc(s.name)}</h3>
      <div class="s-inst">المحاضر: ${esc(s.instructor)}</div>
      ${s.used?`<div class="s-block used-b"><b>ما دخل المنهج:</b> ${esc(s.used)}</div>`:''}
      ${s.notUsed?`<div class="s-block skip-b"><b>ما لم يُستخدم:</b> ${esc(s.notUsed)}</div>`:''}
      ${s.reason?`<div class="s-block why-b"><b>سبب القرار:</b> ${esc(s.reason)}</div>`:''}
      <a class="s-link" href="${esc(s.url)}" target="_blank" rel="noopener">فتح المصدر الأصلي ↗</a>
    </article>`;
  }).join('')||'<div style="color:var(--dim);padding:20px">لا توجد مصادر مطابقة.</div>';
}
function renderIndexes(){
  const item=(t,x)=>`<div class="idx-item">${t?`<span class="t">${esc(t)}</span>`:''}<span class="x">${x}</span></div>`;
  $('#idxBody').innerHTML=`
  <div class="idx-block"><h4>مصطفى عبدالسلام — قائمة Linux Practical Guide الكاملة <span>9 VIDEOS · MERGED</span></h4><div class="idx-list">${EX.mostafaLessons.map(x=>item(`#${x[0]} · ${x[2]}`,`<b>${esc(x[1])}</b>`)).join('')}</div><a class="idx-link" href="https://www.youtube.com/playlist?list=PLLlr6jKKdyK2XmYvNZhqwUDEnZOlQAWS-" target="_blank" rel="noopener">فتح قائمة Linux Practical Guide ↗</a></div>
  <div class="idx-block"><h4>عبدالله النعيمي — القائمة الكاملة <span>28 VIDEOS · REVIEWED</span></h4><div class="idx-list">${EX.abdallahAll.map(x=>item(`#${x[0]} · ${x[2]}`,`<b>${esc(x[1])}</b>`)).join('')}</div></div>
  <div class="idx-block"><h4>Security Jordan — مراجعة فصول Linux Part 1 كاملة <span>27 CHAPTERS · DECIDED</span></h4><div class="idx-list">${EX.jordanPart1Chapters.map(x=>item(x[0],`<b>${esc(x[1])}</b> — ${esc(x[2])}`)).join('')}</div><a class="idx-link" href="https://www.youtube.com/watch?v=JBGnzEtimmg" target="_blank" rel="noopener">فتح Part 1 ↗</a></div>
  <div class="idx-block"><h4>Security Jordan — مراجعة فصول Linux Part 2 كاملة <span>11 CHAPTERS · DECIDED</span></h4><div class="idx-list">${EX.jordanPart2Chapters.map(x=>item(x[0],`<b>${esc(x[1])}</b> — ${esc(x[2])}`)).join('')}</div><a class="idx-link" href="https://www.youtube.com/watch?v=qjqiPF0QBJ0" target="_blank" rel="noopener">فتح Part 2 ↗</a></div>
  <div class="idx-block"><h4>Security Jordan — قرارات فصول كورس Bash الكامل <span>17 CHAPTERS · DECIDED</span></h4><div class="idx-list">${(EX.bashFullChapters||[]).map(x=>item(x[0],`<b>${esc(x[1])}</b> — ${esc(x[2])}`)).join('')}</div><a class="idx-link" href="https://www.youtube.com/watch?v=M5-MCMrC0sI" target="_blank" rel="noopener">فتح كورس Bash الكامل ↗</a></div>
  <div class="idx-block"><h4>Security Jordan — قائمة تشغيل Bash: العنصر الموثق الوحيد <span>1 ITEM · VERIFIED</span></h4><div class="idx-list">${EX.bashPlaylistKnown.map(x=>item(`#${esc(x.no)}`,`<b>${esc(x.title)}</b> — ${esc(x.decision)} <a href="${esc(x.url)}" target="_blank" rel="noopener">فتح الفيديو ↗</a>`)).join('')}</div></div>
  <div class="idx-block"><h4>Security Jordan — فيديوهات SOC <span>3 VIDEOS · SCHEDULED</span></h4><div class="idx-list">${EX.socJordanVideos.map(x=>item(`Video ${x.no} · ${x.duration}`,`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`)).join('')}</div></div>`;
}

/* ===== EXPORT / IMPORT / RESET ===== */
function saveAll(){lsSet(LKEY,[...done]);lsSet(NKEY,notes);lsSet(SKEY,[...socDone]);lsSet(GKEY,gate);lsSet(PKEY,ptsDone)}
function exportData(){
  const payload={product:'Linux to SOC Learning Roadmap',version:6,exportedAt:new Date().toISOString(),linuxDone:[...done],linuxNotes:notes,linuxPts:ptsDone,socDone:[...socDone],gate};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='linux-to-soc-progress.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('تم تصدير التقدم والملاحظات ✓');
}
function importData(file){
  if(!file)return;const r=new FileReader();
  r.onload=()=>{try{
    const p=JSON.parse(r.result);
    const ids=new Set(LS.map(x=>x.id));
    let incoming=new Set(p.linuxDone||p.done||[]);
    const bashParts=['LIN074','LIN075','LIN076'];
    if(bashParts.some(id=>incoming.has(id))){const allDone=bashParts.every(id=>incoming.has(id));bashParts.slice(1).forEach(id=>incoming.delete(id));if(!allDone)incoming.delete('LIN074')}
    incoming.delete('LIN045');
    done=new Set([...incoming].filter(x=>ids.has(x)));
    notes=p.linuxNotes||{};
    if(notes.LIN045)delete notes.LIN045;
    const oldNotes=bashParts.map(id=>notes[id]).filter(Boolean);
    if(oldNotes.length){notes.LIN074=oldNotes.map((v,i)=>`ملاحظة مقطع ${i+1}: ${v}`).join('\n\n');bashParts.slice(1).forEach(id=>delete notes[id])}
    socDone=new Set(p.socDone||[]);
    gate=Object.assign({linux:false,security:false,lab:false},p.gate||{});
    ptsDone={};Object.entries(p.linuxPts||{}).forEach(([k,v])=>{if(ids.has(k))ptsDone[k]=v});
    saveAll();renderLessonsAll();renderGate();renderSoc();updateProgress();updateSocProgress();
    toast('تم استيراد التقدم بنجاح ✓');
  }catch(e){toast('ملف التقدم غير صالح ✗')}};
  r.readAsText(file);
}
function renderLessonsAll(){PH.forEach(p=>renderLessons(p.id))}
function updateFchip(id){
  const l=LS.find(x=>x.id===id);if(!l)return;
  const chk=lessonChk(l);const pd=ptsDone[id]||[];
  const pc=chk.reduce((a,_,i)=>a+(pd[i]?1:0),0);
  const row=document.getElementById(id);if(!row)return;
  let chip=row.querySelector('.ls-fchip');
  if(pc>0){
    if(!chip){chip=document.createElement('span');chip.className='ls-fchip mono';chip.title='نقاط الفهم المعلّمة في هذا الدرس';const dur=row.querySelector('.ls-dur');if(dur)dur.parentNode.insertBefore(chip,dur)}
    chip.textContent=`فهم ${pc}/${chk.length}`;
  } else if(chip) chip.remove();
}

/* ===== TOAST ===== */
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2400)}

/* ===== EVENTS ===== */
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.check){
    const id=t.dataset.check;
    t.checked?done.add(id):done.delete(id);
    const row=document.getElementById(id);if(row)row.classList.toggle('is-done',t.checked);
    saveAll();updateProgress();
    if(fHide)renderLessonsAll();
  } else if(t.dataset.scheck){
    const id=t.dataset.scheck;
    t.checked?socDone.add(id):socDone.delete(id);
    const row=document.getElementById(`soc-${id.replace(':','-')}`);if(row)row.classList.toggle('is-done',t.checked);
    saveAll();updateSocProgress();updateMap();
  } else if(t.dataset.pts){
    const [pid,idx]=t.dataset.pts.split(':');
    const arr=ptsDone[pid]||(ptsDone[pid]=[]);
    arr[+idx]=t.checked;
    t.closest('.chk-item').classList.toggle('on',t.checked);
    saveAll();updateFchip(pid);
  } else if(t.dataset.gate){
    gate[t.dataset.gate]=t.checked;
    t.closest('.gcheck').classList.toggle('checked',t.checked);
    saveAll();renderGate();updateMap();
  } else if(t.id==='importFile'){
    importData(t.files[0]);t.value='';
  }
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.note!==undefined){notes[t.dataset.note]=t.value;saveAll()}
  else if(t.id==='searchInput'){fSearch=t.value.trim();renderLessonsAll()}
});
document.addEventListener('click',e=>{
  const tg=e.target.closest('[data-toggle]');
  if(tg){const id=tg.dataset.toggle;openPhases.has(id)?openPhases.delete(id):openPhases.add(id);const c=document.querySelector(`[data-card="${id}"]`);if(c)c.classList.toggle('open',openPhases.has(id));return}
  const sg=e.target.closest('[data-stoggle]');
  if(sg){const id=sg.dataset.stoggle;const c=document.querySelector(`[data-scard="${id}"]`);if(c)c.classList.toggle('open');return}
  const lo=e.target.closest('[data-open]');
  if(lo){const id=lo.dataset.open;if(openLessons.has(id))openLessons.delete(id);else openLessons.add(id);const r=document.getElementById(id);if(r)r.classList.toggle('open',openLessons.has(id));return}
  const ac=e.target.closest('[data-acc]');
  if(ac){const id=ac.dataset.acc;if(openAccs.has(id))openAccs.delete(id);else openAccs.add(id);const w=ac.closest('.ls-acc');if(w)w.classList.toggle('open',openAccs.has(id));return}
  const go=e.target.closest('[data-goto]');
  if(go){const id=go.dataset.goto;const l=LS.find(x=>x.id===id);
    openPhases.add(l.phaseId);document.querySelector(`[data-card="${l.phaseId}"]`)?.classList.add('open');
    openLessons.add(id);
    renderLessons(l.phaseId);
    setTimeout(()=>{const r=document.getElementById(id);if(r){r.scrollIntoView({behavior:'smooth',block:'center'})}},60);
    return}
  const mb=e.target.closest('#menuBtn');
  if(mb){const m=$('#menuPop');m.classList.toggle('open');mb.setAttribute('aria-expanded',m.classList.contains('open'));return}
  if(!e.target.closest('#menuPop'))$('#menuPop').classList.remove('open');
  const kb=e.target.closest('#kindSeg button');
  if(kb){$$('#kindSeg button').forEach(b=>b.classList.toggle('on',b===kb));fKind=kb.dataset.kind;renderLessonsAll();return}
  const sb=e.target.closest('#srcSeg button');
  if(sb){$$('#srcSeg button').forEach(b=>b.classList.toggle('on',b===sb));fSrc=sb.dataset.src;renderSources();return}
});
$('#hideDoneBtn').addEventListener('click',()=>{fHide=!fHide;$('#hideDoneBtn').classList.toggle('on',fHide);renderLessonsAll()});
$('#resetLinuxBtn').addEventListener('click',()=>{if(confirm('تصفير تقدم Linux والملاحظات فقط؟ لن يتغير قسم SOC.')){done.clear();notes={};saveAll();renderLessonsAll();updateProgress();toast('تم تصفير تقدم Linux')}});
$('#exportBtn').addEventListener('click',exportData);
$('#importBtn').addEventListener('click',()=>$('#importFile').click());
$('#resetBtn').addEventListener('click',()=>{if(confirm('هل تريد تصفير تقدم Linux وSOC والملاحظات وبوابة الانتقال بالكامل؟')){done.clear();notes={};socDone.clear();gate={linux:false,security:false,lab:false};saveAll();renderLessonsAll();renderGate();renderSoc();updateProgress();updateSocProgress();toast('تم تصفير كل التقدم')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#menuPop').classList.remove('open')});

/* ===== SCROLL SPY / REVEAL / COUNTERS ===== */
function initObservers(){
  const spy=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting)$$('.tabs a').forEach(a=>a.classList.toggle('on',a.dataset.tab===en.target.dataset.spy))})},{rootMargin:'-25% 0px -65% 0px'});
  ['linux','soc','sources'].forEach(id=>{const el=document.getElementById(id);el.dataset.spy=id;spy.observe(el)});
  const ro=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');ro.unobserve(en.target)}}),{threshold:.1});
  $$('.reveal').forEach(el=>ro.observe(el));
  const co=new IntersectionObserver(es=>es.forEach(en=>{
    if(!en.isIntersecting)return;
    en.target.querySelectorAll('.stat-val').forEach(el=>{
      const t=+el.dataset.count,t0=performance.now();
      const step=n=>{const p=Math.min(1,(n-t0)/900);el.textContent=Math.round(t*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step)};
      requestAnimationFrame(step);
    });
    $('#distBasic').style.width=(D.meta.basicCount/LS.length*100)+'%';
    $('#distComp').style.width=(D.meta.complementaryCount/LS.length*100)+'%';
    $('#distPrac').style.width=(D.meta.practicalCount/LS.length*100)+'%';
    co.unobserve(en.target);
  }),{threshold:.3});
  co.observe($('#statGrid'));
}

/* ===== INIT ===== */
buildMap();
renderPhases();
renderGate();
renderSoc();
renderPillars();
renderSources();
renderIndexes();
updateProgress();
updateSocProgress();
document.querySelector('[data-card="p01"]')?.classList.add('open');
$('#countExpl').textContent=D.meta.countExplanation;
$('#countRule').textContent=D.meta.rule;
$('#footDate').textContent=D.meta.updated;
initObservers();
