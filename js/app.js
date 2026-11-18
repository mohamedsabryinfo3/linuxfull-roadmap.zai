// Linux -> SOC Learning Roadmap — app logic.
// Same design/interactions as the original project (tabs, progress ring,
// timeline, chips, search, audit lists), now driving the full Linux->SOC
// curriculum: 96 lessons / 16 phases, SOC tab (10 phases + gate + pillars),
// and the complete source audit with indexes.
var D = window.CURRICULUM;
var LS = D.lessons;

// ---- source colors (same palette idea as before) ------------------------
var SRC_COLORS = {
  'Ahmed Eid / TechShots': '#1c6dd0',
  'TananyAcademy – Linux Administration 2024': '#0f8a6b',
  'Abdallah Al-Nuaimy – Linux Course in CyberSecurity': '#7b3fc4',
  'Security Jordan – Linux for CyberSecurity Part 2': '#b0306a',
  'Security Jordan – Bash Scripting Full Course': '#b8860b',
  'Security Jordan – Linux for CyberSecurity Part 2 + OverTheWire': '#e8590c'
};
function srcColor(s){ return SRC_COLORS[s] || '#6b7a99'; }

var K = {'أساسي':'أساسي','استكمال مطلوب':'استكمال مطلوب','تطبيق عملي':'تطبيق عملي'};
var KC = {'أساسي':'m','استكمال مطلوب':'s','تطبيق عملي':'o'};
var PC = ['#6b7a99','#1c6dd0','#0f8a6b','#7b3fc4','#e8590c','#b8860b','#b0306a','#c0392b','#2c3e91','#12a150','#0e8fa6','#8d6e63','#5e35b1','#00838f','#b8860b','#0f8a6b'];

var PH = {};
LS.forEach(function(x){ if(!PH[x.phaseId]) PH[x.phaseId]=[]; PH[x.phaseId].push(x); });
var PIDS = Object.keys(PH);
var items = LS.map(function(x){ return {id:x.id, x:x, p:PIDS.indexOf(x.phaseId), c:x.source, t:x.title, k:x.kind}; });
function bySeq(a,b){ return ((a.x?a.x.seq:a.seq)||0)-((b.x?b.x.seq:b.seq)||0) }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]}) }
function fmtT(sec){ var h=Math.floor(sec/3600), m=Math.floor(sec%3600/60); return h? (h+' ساعة'+(m?' و'+m+' دقيقة':'')) : (m+' دقيقة'); }

var $=function(i){return document.getElementById(i)};
var S={}, NS={}, SS={}, GATE={linux:false,security:false};
var fk='all', fp='all', hd=false, q='';
try{S=JSON.parse(localStorage.getItem('linux-track-ccna')||'{}')}catch(e){}
try{if(S&&S.done){var d=S.done;S={};d.forEach(function(id){S[id]=1})}}catch(e){}
try{NS=JSON.parse(localStorage.getItem('linux-track-notes')||'{}')}catch(e){}
try{SS=JSON.parse(localStorage.getItem('linux-track-soc')||'{}')}catch(e){}
try{GATE=JSON.parse(localStorage.getItem('linux-track-gate')||'{"linux":false,"security":false}')}catch(e){}
function save(){
  try{
    localStorage.setItem('linux-track-ccna',JSON.stringify(S));
    localStorage.setItem('linux-track-notes',JSON.stringify(NS));
    localStorage.setItem('linux-track-soc',JSON.stringify(SS));
    localStorage.setItem('linux-track-gate',JSON.stringify(GATE));
  }catch(e){}
}

// ---- hero / stats --------------------------------------------------------
function stat(){
  var m=items, dn=m.filter(function(x){return S[x.id]}).length, pc=Math.round(dn/m.length*100), left=m.length-dn;
  $('ring').style.setProperty('--p',pc);$('pc').textContent=pc+'%';
  var nx=m.filter(function(x){return !S[x.id]}).sort(bySeq)[0];
  $('hl').textContent=nx?'التالي: '+nx.t:'اكتمل مسار Linux بالكامل. أكمل Security+ ثم انتقل إلى تبويب SOC.';
  $('hs').textContent=left?('متبقي '+left+' درسًا — استمر بالترتيب حتى النهاية.'):'اكتمل: '+dn+' من '+m.length+' درس منتهي (كل الدروس مطلوبة).';
  $('phCount').textContent=D.phases.length;
  $('wt').textContent=fmtT(D.meta.knownVideoSeconds||0);
  return nx;
}

// ---- filters / list rendering -------------------------------------------
function visTest(x){
  return (fk=='all'||x.k==fk)&&(fp=='all'||x.x.phaseId==fp)&&!(hd&&S[x.id])
  &&(!q||[x.t,x.x.instructor,x.x.course,x.x.lessonNo,x.x.reason,x.x.task,x.x.phaseTitle].join(' ').toLowerCase().indexOf(q)>-1);
}
function render(){
  var h='';
  PIDS.forEach(function(pid,pi){
    var its=PH[pid].slice().sort(bySeq);
    var dn=its.filter(function(x){return S[x.id]}).length;
    var vis=its.filter(function(x){return visTest({id:x.id,x:x,p:pi,c:x.source,t:x.title,k:x.kind})});
    if(!vis.length)return;
    var p=D.phases[pi];
    h+='<div class="phase" style="--pc:'+PC[pi%PC.length]+'">'
      +'<div class="ph"><h2>'+(pi+1)+'. '+esc(p.title)+'</h2><span>'+esc(p.subtitle)+' · '+dn+'/'+its.length+'</span></div>'
      +'<div class="pgoal"><b>هدف المرحلة:</b> '+esc(p.goal)+'<br><b>المخرج المطلوب:</b> '+esc(p.deliverable)+' <i class="pt">· '+esc(p.time)+'</i></div>'
      +'<div class="bar"><i style="width:'+dn/its.length*100+'%"></i></div><ol class="stops">';
    vis.forEach(function(x){
      var det='تفاصيل الدرس والمطلوب مني ▾';
      h+='<li class="stop '+KC[x.kind]+(S[x.id]?' done':'')+'" id="s'+esc(x.id)+'">'
        +'<button class="dot" data-id="'+esc(x.id)+'" aria-pressed="'+!!S[x.id]+'" aria-label="تم">'+(S[x.id]?'✓':'')+'</button>'
        +'<div class="row"><a class="nm" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a>'
        +'<span class="tag" style="background:'+srcColor(x.source)+'">'+esc(x.kind)+'</span>'
        +'<span class="k"><bdi>#'+esc(String(x.seq).padStart(3,'0'))+'</bdi> · '+esc(x.instructor)+' · <bdi>'+esc(x.duration)+'</bdi> · <bdi>'+esc(x.lessonNo)+'</bdi></span>'
        +'<details class="ldet"><summary>'+det+'</summary><div class="lgrid">'
        +'<div><b>لماذا في هذا الموضع؟</b>'+esc(x.reason)+'</div>'
        +'<div><b>التطبيق المطلوب</b>'+esc(x.task)+'</div>'
        +'<div class="wide"><b>عن المحاضر:</b> '+esc(x.instructorNote)+'<br><b>المصدر:</b> '+esc(x.source)+' · '+esc(x.chapter)+'</div>'
        +'</div><textarea class="pnote" data-note="'+esc(x.id)+'" placeholder="اكتب ملاحظاتك الشخصية: أوامر، أخطاء، نتائج التطبيق...">'+esc(NS[x.id]||'')+'</textarea></details>'
        +'</div></li>';
    });
    h+='</ol></div>';
  });
  $('phases').innerHTML=h||'<p class="k">لا توجد نتائج مطابقة. غيّر البحث أو الفلاتر.</p>';
  stat();
  bindLessonEvents();
}

function bindLessonEvents(){
  var notes=document.querySelectorAll('[data-note]');
  for(var i=0;i<notes.length;i++){
    notes[i].oninput=(function(el){return function(){NS[el.getAttribute('data-note')]=el.value;save()}})(notes[i]);
  }
}

function chips(el,list,cur,cb){el.innerHTML=list.map(function(a){return '<button class="chip" data-v="'+esc(a[0])+'" aria-pressed="'+(cur==a[0])+'">'+esc(a[1])+'</button>'}).join('');
  el.onclick=function(e){var b=e.target.closest('.chip');if(!b)return;cb(b.dataset.v);chips(el,list,b.dataset.v,cb);render()}}
chips($('fk'),[['all','كل التصنيفات'],['أساسي','أساسي'],['استكمال مطلوب','استكمال مطلوب'],['تطبيق عملي','تطبيق عملي']],'all',function(v){fk=v});
chips($('fp'),[['all','كل المراحل']].concat(D.phases.map(function(p){return [p.id,(p.id.replace('p','')+'. '+p.title)]})),'all',function(v){fp=v});
$('q').oninput=function(e){q=e.target.value.toLowerCase();render()};
$('hd').onclick=function(e){hd=!hd;e.target.setAttribute('aria-pressed',hd);render()};
$('rs').onclick=function(){if(confirm('تصفير تقدم Linux فقط؟ لن يتغير تبويب SOC.')){S={};NS={};save();render()}};
$('phases').onclick=function(e){
  var det=e.target.closest('summary'); if(det&&det.parentNode.classList.contains('ldet'))return;
  var b=e.target.closest('.dot');if(!b)return;var id=b.dataset.id;if(S[id])delete S[id];else S[id]=1;save();render();
  var p=D.phases[0];return p;
};

$('next').onclick=function(){
  fk='all';fp='all';q='';hd=false;
  chips($('fk'),[['all','كل التصنيفات'],['أساسي','أساسي'],['استكمال مطلوب','استكمال مطلوب'],['تطبيق عملي','تطبيق عملي']],'all',function(v){fk=v});
  chips($('fp'),[['all','كل المراحل']].concat(D.phases.map(function(p){return [p.id,(p.id.replace('p','')+'. '+p.title)]})),'all',function(v){fp=v});
  $('q').value='';
  render();var nx=stat();if(!nx)return;go('path');
  var el=$('s'+nx.id);if(!el)return;
  el.scrollIntoView({block:'center',behavior:'smooth'});
  el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
};

// ---- tabs ----------------------------------------------------------------
var T=[['path','مسار Linux'],['soc','مسار SOC L1 → L2'],['audit','مراجعة المصادر']];
function go(t){T.forEach(function(x){$('v-'+x[0]).classList.toggle('hide',x[0]!=t)});[].forEach.call($('tabs').children,function(b){b.setAttribute('aria-selected',b.dataset.t==t)})}
$('tabs').innerHTML=T.map(function(x){return '<button role="tab" data-t="'+x[0]+'">'+x[1]+'</button>'}).join('');
$('tabs').onclick=function(e){var b=e.target.closest('button');if(b){go(b.dataset.t);window.scrollTo(0,0)}};

// ---- SOC tab -------------------------------------------------------------
function renderSoc(){
  $('gateL').checked=!!GATE.linux;$('gateS').checked=!!GATE.security;
  var ready=GATE.linux&&GATE.security;
  $('gateState').textContent=ready?'جاهز للبدء':'لم يحن البدء بعد';
  $('gateState').className='gstate'+(ready?' ready':'');

  var pil=D.sourceExtras.socPillars.map(function(p,i){
    return '<div class="pillar"><b>0'+(i+1)+' · '+esc(p.name)+'</b><p>'+esc(p.description)+'</p></div>';
  }).join('');
  $('pillars').innerHTML=pil;

  var h='';
  D.socPhases.forEach(function(p,i){
    var ts=p.tasks||[];
    h+='<div class="socphase"><div class="sph"><h3>'+String(i).padStart(2,'0')+' · '+esc(p.title)+'</h3><span class="badge">'+esc(p.status)+'</span></div>'
      +'<p class="k">'+esc(p.goal)+'</p><div class="tasks">';
    ts.forEach(function(t,j){
      var tid=p.id+'-'+j;
      h+='<div class="task '+(SS[tid]?'done':'')+'"><input type="checkbox" data-soc="'+esc(tid)+'" '+(SS[tid]?'checked':'')+' aria-label="'+esc(t.title)+'">'
        +'<div class="tb"><div class="k">'+esc(t.source||'')+(t.lessonNo?' · '+esc(t.lessonNo):'')+(t.duration?' · '+esc(t.duration):'')+'</div>'
        +'<b>'+esc(t.title)+'</b><p>'+esc(t.note||'')+'</p></div>'
        +(t.url?'<a href="'+esc(t.url)+'" target="_blank" rel="noopener">فتح المصدر ↗</a>':'')
        +'</div>';
    });
    h+='</div></div>';
  });
  $('socStages').innerHTML=h;
  $('socNote2').innerHTML='<b>قاعدة مهمة للمستقبل:</b> ابدأ بـWazuh لبناء معمل محلي، ثم اختر التعمق في Microsoft Sentinel/KQL أو Splunk/SPL بحسب بيئة العمل. لا تحاول إتقان خمس منصات SIEM في وقت واحد. <a href="https://attack.mitre.org/" target="_blank" rel="noopener">MITRE ATT&CK ↗</a>';
}
$('gateL').onchange=function(e){GATE.linux=e.target.checked;save();renderSoc()};
$('gateS').onchange=function(e){GATE.security=e.target.checked;save();renderSoc()};
$('socStages').addEventListener('change',function(e){
  var c=e.target.closest('[data-soc]');if(!c)return;
  if(c.checked)SS[c.getAttribute('data-soc')]=1;else delete SS[c.getAttribute('data-soc')];
  save();c.closest('.task').classList.toggle('done',c.checked);
});

// ---- sources audit tab ---------------------------------------------------
function idxBlock(title, rows, link){
  return '<div class="iblk"><h4>'+esc(title)+'</h4><div class="ilist">'+rows+'</div>'+(link||'')+'</div>';
}
function renderAudit(){
  var future=D.socPhases.reduce(function(a,p){return a+(p.tasks||[]).length},0);
  $('auditStats').innerHTML=
     '<div class="ast"><b>'+D.lessons.length+'</b><small>درس Linux نشط مطلوب</small></div>'
    +'<div class="ast"><b>'+D.phases.length+'</b><small>مراحل Linux</small></div>'
    +'<div class="ast"><b>'+D.sources.length+'</b><small>مصادر من قوائمك</small></div>'
    +'<div class="ast"><b>'+future+'</b><small>عنصر محفوظ في مرجع SOC</small></div>';

  var h='';
  D.sources.forEach(function(s){
    var cls=s.status.indexOf('مدمج بالكامل')>-1?'a':(s.status.indexOf('مدمج')>-1?'p':(s.status.indexOf('مؤجل')>-1?'l':'x'));
    h+='<div class="lv '+cls+'"><b>'+esc(s.status)+'</b><span dir="auto"><b class="snm">'+esc(s.name)+'</b> — المحاضر: '+esc(s.instructor)
      +'<br><b>المستخدم:</b> '+esc(s.used)
      +'<br><b>غير المستخدم:</b> '+esc(s.notUsed)
      +'<br><b>سبب القرار:</b> '+esc(s.reason)
      +'<br><a href="'+esc(s.url)+'" target="_blank" rel="noopener">فتح المصدر الأصلي ↗</a></span></div>';
  });
  $('srcCards').innerHTML=h;

  var ex=D.sourceExtras;
  $('srcDetails').innerHTML=
     idxBlock('Ahmed Eid – Chapters', ex.ahmedChapters.map(function(x){return '<div><span>'+esc(x.time)+'</span>'+esc(x.title)+' — '+esc(x.decision)+'</div>'}).join(''))
    +idxBlock('Mostafa Abdelsalam – 9 Videos', ex.mostafaLessons.map(function(x){return '<div><span>#'+esc(x[0])+' · '+esc(x[2])+'</span>'+esc(x[1])+'</div>'}).join(''))
    +idxBlock('Abdullah Al-Nuaimy – Full 28 Video List', ex.abdallahAll.map(function(x){return '<div><span>#'+esc(x[0])+' · '+esc(x[2])+'</span>'+esc(x[1])+'</div>'}).join(''))
    +idxBlock('Security Jordan – Linux Part 1: full chapter review', ex.jordanPart1Chapters.map(function(x){return '<div><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b> — '+esc(x[2])+'</div>'}).join(''), '<a href="https://www.youtube.com/watch?v=JBGnzEtimmg" target="_blank" rel="noopener">فتح Part 1 ↗</a>')
    +idxBlock('Security Jordan – Linux Part 2: full chapter review', ex.jordanPart2Chapters.map(function(x){return '<div><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b> — '+esc(x[2])+'</div>'}).join(''), '<a href="https://www.youtube.com/watch?v=qjqiPF0QBJ0" target="_blank" rel="noopener">فتح Part 2 ↗</a>')
    +idxBlock('Security Jordan – Bash playlist: only verified user-shared item', ex.bashPlaylistKnown.map(function(x){return '<div><span>#'+esc(x.no)+'</span><b>'+esc(x.title)+'</b> — '+esc(x.decision)+' <a href="'+esc(x.url)+'" target="_blank" rel="noopener">فتح الفيديو ↗</a></div>'}).join(''))
    +idxBlock('Security Jordan – SOC Videos', ex.socJordanVideos.map(function(x){return '<div><span>Video '+esc(x.no)+' · '+esc(x.duration)+'</span><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a></div>'}).join(''));
}

// ---- init ----------------------------------------------------------------
go('path');render();renderSoc();renderAudit();
