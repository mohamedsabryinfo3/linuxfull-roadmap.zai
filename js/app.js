const CH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
const CK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const pad=n=>String(n).padStart(3,'0');
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let done=new Set(store.get('lpic1_done',[]));
let taskDone=new Set(store.get('lpic1_tasks',[]));
const tl=document.getElementById('timeline');
tl.innerHTML=LESSONS.map(L=>{
  const meta=`#${pad(L.n)} • محمد الطناني • ${L.dur} • ${L.date}`;
  const pts=L.points.map(p=>`<li>${p}</li>`).join('');
  const tks=L.tasks.map((t,i)=>`<label class="task"><input type="checkbox" data-key="${L.n}-${i}"${taskDone.has(L.n+'-'+i)?' checked':''}><span class="tbox">${CK}</span><span class="ttxt">${t}</span></label>`).join('');
  return `<article class="lesson${done.has(L.n)?' done':''}" data-n="${L.n}">
  <div class="tl-col"><button class="dot" type="button" aria-label="تسجيل الدرس ${L.n} كمكتمل" title="تسجيل كمكتمل">${CK}</button></div>
  <div class="card">
    <div class="row">
      <div class="info">
        <div class="title-row"><span class="badge">أساسي</span><h3 dir="auto">${L.title}</h3></div>
        <button class="details-btn" type="button" aria-expanded="false" aria-controls="details-${L.n}">تفاصيل الدرس والمطلوب مني ${CH}</button>
      </div>
      <div class="meta" dir="rtl">${meta}</div>
    </div>
    <div class="lesson-details" id="details-${L.n}"><div class="ld-inner"><div class="ld-body">
      <h4>وصف الدرس</h4><p>${L.desc}</p>
      <h4>أهم النقاط</h4><ul>${pts}</ul>
      <h4>المطلوب مني</h4><div class="tasks">${tks}</div>
    </div></div></div>
  </div>
</article>`;}).join('');
function updateProgress(){
  const total=LESSONS.length,d=done.size,pct=Math.round(d/total*100);
  document.getElementById('progressFill').style.width=pct+'%';
  document.getElementById('progressText').textContent=`${d} من ${total} (${pct}%)`;
}
updateProgress();
tl.addEventListener('click',e=>{
  const dot=e.target.closest('.dot');
  if(dot){
    const row=dot.closest('.lesson'),n=Number(row.dataset.n);
    if(done.has(n))done.delete(n);else done.add(n);
    row.classList.toggle('done',done.has(n));
    store.set('lpic1_done',[...done]);updateProgress();return;
  }
  const btn=e.target.closest('.details-btn');
  if(btn){
    const row=btn.closest('.lesson'),open=row.classList.toggle('open');
    btn.setAttribute('aria-expanded',open?'true':'false');
  }
});
tl.addEventListener('change',e=>{
  if(e.target.matches('.task input')){
    const k=e.target.dataset.key;
    if(e.target.checked)taskDone.add(k);else taskDone.delete(k);
    store.set('lpic1_tasks',[...taskDone]);
  }
});
const themeBtn=document.getElementById('themeBtn'),themeLabel=document.getElementById('themeLabel');
function applyTheme(t){
  document.documentElement.dataset.theme=t;
  themeLabel.textContent=t==='dark'?'الوضع النهاري':'الوضع الليلي';
  themeBtn.setAttribute('aria-pressed',t==='light'?'true':'false');
}
applyTheme(document.documentElement.dataset.theme==='light'?'light':'dark');
themeBtn.addEventListener('click',()=>{
  const t=document.documentElement.dataset.theme==='dark'?'light':'dark';
  try{localStorage.setItem('lpic1_theme',t)}catch(e){}
  applyTheme(t);
});
