'use strict';

const VERSION = 'v1.0.3';

/* ===== Firebase (optional) v1.0.3 =====
   貼上你的 Firebase web app 設定（Project settings → Your apps → SDK setup and configuration）
   若不想啟用，將 ENABLE_FIREBASE 設為 false 即可。
*/
const ENABLE_FIREBASE = true;

// ✅ 請把下面 firebaseConfig 換成你的專案設定（這裡放的是「佔位」）
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

const FIRESTORE_COLLECTION = "angel_events";

let _fb = { inited:false, app:null, db:null };
async function firebaseInitOnce() {
  if (!ENABLE_FIREBASE) return null;
  if (_fb.inited) return _fb;
  // 若使用者尚未填 config，就不初始化
  if (!firebaseConfig || String(firebaseConfig.apiKey||"").startsWith("PASTE_")) return null;

  // 動態載入（只要有使用才會下載/連線）
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js");
  const { getFirestore, addDoc, serverTimestamp, collection } = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js");

  _fb.app = initializeApp(firebaseConfig);
  _fb.db = getFirestore(_fb.app);
  _fb.addDoc = addDoc;
  _fb.serverTimestamp = serverTimestamp;
  _fb.collection = collection;
  _fb.inited = true;
  return _fb;
}

async function firebaseSaveEvent(toolName, data) {
  const fb = await firebaseInitOnce();
  if (!fb || !fb.db) return false;

  try {
    await fb.addDoc(
      fb.collection(fb.db, FIRESTORE_COLLECTION),
      {
        tool: toolName,
        ...data,
        ts: fb.serverTimestamp()
      }
    );
    return true;
  } catch (e) {
    // 靜默失敗：不打擾使用者
    return false;
  }
}

// 若系統未提供 window.saveToCloud，就用 Firebase 版本頂上
if (typeof window.saveToCloud !== "function") {
  window.saveToCloud = async (toolName, data) => {
    return firebaseSaveEvent(toolName, data);
  };
}
const LS_KEY = 'angel_seasoning_state_v1';
const LS_ARCHIVE = 'angel_seasoning_archive_v1';
const LS_QUOTES = 'angel_seasoning_quotes_v1';
const LS_QUOTES_ON = 'angel_seasoning_quotes_on_v1';

const TOOL_NAME = '心靈調味師';
const CONCEPT_URL = 'https://angel0973180707.github.io/angel-happy-paw/';
const FORM_URL = 'https://forms.gle/rHL77QaLRnw3s4mC8';

// 🎬 預留｜影片欣賞連結（你之後把影片網址貼在這裡即可）
const VIDEO_URL = ''; // 例：'https://www.youtube.com/watch?v=xxxx'

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

function safeJsonParse(str, fallback){ try{ return JSON.parse(str); }catch(e){ return fallback; } }
function nowISO(){
  const d=new Date(); const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function toast(msg){
  const el=$('#toast'); if(!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),1600);
}
function vibrate(pattern){ try{ navigator.vibrate?.(pattern); }catch(e){} }
function copyText(text){
  if(!text) return;
  const fallback=()=>{
    const ta=document.createElement('textarea');
    ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try{ document.execCommand('copy'); toast('已複製'); }catch(e){ toast('複製失敗'); }
    document.body.removeChild(ta);
  };
  navigator.clipboard?.writeText ? navigator.clipboard.writeText(text).then(()=>toast('已複製')).catch(fallback) : fallback();
}
function stripQuotes(s){ return String(s||'').replace(/^「|」$/g,'').replaceAll('「','').replaceAll('」','').trim(); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function cloudPing(data){
  try{
    if(typeof window.saveToCloud==='function') window.saveToCloud(TOOL_NAME, data);
  }catch(e){}
}

const DEFAULT_QUOTES=[
  '任何時候停下來，都可以。只要舒服，就很好。',
  '先把心站穩，再決定要不要說。',
  '你不用立刻變好，你只要慢下來。',
  '不硬碰硬，也可以把關係帶回來。',
  '你不是退讓，你是在帶路。'
];

const FLAVOR_LINES={
  '酸':['我現在有點委屈，我先承認一下。','我心裡酸酸的，我先停一下。','我有點心酸，先讓我把心站穩。'],
  '甜':['我感覺有一點安心，想先靠近一點。','我現在比較甜，我想用更溫柔的方式說。','我想把這份好感覺留住，慢慢說就好。'],
  '苦':['我有點壓力，我先慢一點再回來。','我心裡苦苦的，先不要逼自己解釋。','我有點沉重，我先站穩一下。'],
  '辣':['我現在火有點大，我先按暫停。','我有點生氣，我先不急著處理。','我覺得被頂到，我先慢下來。'],
  '鹹':['我有點無力，我先停一下。','我有點挫折，先不要逼自己撐住。','我心裡澀澀的，我先照顧我自己。']
};

const SUGGEST_LINES={
  '酸':['這不是麻煩，這是他在展現生命力。','我先不把它當成針對，我先把心站穩。','我在意的是連結，不是輸贏。'],
  '甜':['我想靠近你一點，我們慢慢說。','我願意先聽你一小段，再說我的。','我想把這份好好說出來。'],
  '苦':['我現在有點滿杯，我先整理一下再回來。','我們先把事情說清楚，不急著分對錯。','我需要一點點時間，讓我穩一下。'],
  '辣':['我感覺你剛剛很用力，是不是心裡不太舒服？','我先把聲音放低，我想聽你到底卡在哪裡。','我不想用力傷人，我先停 30 秒。'],
  '鹹':['我有點無力，我想先把我自己站好。','我先不硬撐，我們先把一步做小就好。','我想要的是一起走，不是我一個人扛。'],
  '_default':['我先停一下，等我穩了再回來。','我先把聲音放低，讓我們好好說。','我不急著贏，我想要關係回來。']
};

const state={ step:1, flavor:'', powerDone:false, t1_react:'', t2_pause:'', t3_say:'', t4_thanks:'' };

function loadState(){
  const s=safeJsonParse(localStorage.getItem(LS_KEY), null);
  if(s && typeof s==='object') Object.assign(state, s);
}
function saveState(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

function setStep(n){
  state.step=Math.min(4, Math.max(1, n));
  saveState();
  renderSteps();
}
function renderSteps(){
  const step=state.step;
  $$('#main .step').forEach(sec=>sec.hidden=(Number(sec.dataset.step)!==step));
  $('#stepPill').textContent = `${step}/4`;
  $('#bar').style.width = `${(step-1)/3*100}%`;
}

function setFlavor(flavor){
  state.flavor=flavor; saveState();
  $$('.flavor').forEach(b=>b.classList.toggle('active', b.dataset.flavor===flavor));
  $('#pickedFlavor').textContent = flavor ? `已選：${flavor}` : '尚未選擇';
  const line=pick(FLAVOR_LINES[flavor]||SUGGEST_LINES._default);
  $('#flavorLine').textContent = `「${line}」`;

  // ☁ 埋點：點選味覺卡片（狀態轉換）
  cloudPing({ flavor, status:'已選味道', at: nowISO() });
}

function setInputsFromState(){
  $('#t1_react').value=state.t1_react||'';
  $('#t2_pause').value=state.t2_pause||'';
  $('#t3_say').value=state.t3_say||'';
  $('#t4_thanks').value=state.t4_thanks||'';
}
function bindInputSync(){
  const bind=(id,key)=>{
    const el=$(id);
    el.addEventListener('input', ()=>{ state[key]=el.value; saveState(); });
  };
  bind('#t1_react','t1_react');
  bind('#t2_pause','t2_pause');
  bind('#t3_say','t3_say');
  bind('#t4_thanks','t4_thanks');
}

function applySliderVisual(pct){
  const stage=$('#sliderStage');
  stage.style.setProperty('--px', `${pct}%`);
  stage.style.setProperty('--a', (pct/100*0.55).toFixed(2));
  const remain=Math.max(0, Math.round(30-(pct/100)*30));
  $('#countText').textContent = String(remain);
}

function lockPowerDone(){
  state.powerDone=true; saveState();
  const slider=$('#powerSlider');
  slider.value=100;
  slider.disabled=true; // ✅ 拉到底鎖定不可回彈
  $('#powerState').textContent='斷電完成';
  $('#powerState').classList.add('ok');
  $('#powerDone').hidden=false;
  vibrate([50,30,50]);
  toast('斷電完成');

  // ☁ 埋點：滑桿拉到底並鎖定（狀態轉換）
  cloudPing({
    flavor: state.flavor || '',
    status:'斷電完成',
    note:(state.t2_pause||'').trim(),
    at: nowISO()
  });
}

function initSlider(){
  const slider=$('#powerSlider');
  applySliderVisual(Number(slider.value));

  if(state.powerDone){
    lockPowerDone();
    return;
  }

  let lastTick=0;
  slider.addEventListener('input', ()=>{
    const v=Number(slider.value);
    applySliderVisual(v);
    const tick=Math.floor(v/10);
    if(tick!==lastTick){ lastTick=tick; vibrate(10); }
  });
  slider.addEventListener('change', ()=>{
    const v=Number(slider.value);
    if(v>=100) lockPowerDone();
  });
}

function suggestLine(){
  const key=state.flavor||'_default';
  const line=pick(SUGGEST_LINES[key]||SUGGEST_LINES._default);
  $('#suggestLine').textContent = `「${line}」`;
  if(!state.t3_say){
    state.t3_say=line;
    $('#t3_say').value=line;
    saveState();
  }
  return line;
}

function loadArchive(){ return safeJsonParse(localStorage.getItem(LS_ARCHIVE), []); }
function saveArchive(list){ localStorage.setItem(LS_ARCHIVE, JSON.stringify(list)); }

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function renderArchive(){
  const list=loadArchive();
  const box=$('#archiveList');
  box.innerHTML='';
  if(!list.length){
    box.innerHTML='<div class="muted tiny">目前還沒有存檔。你需要時再存就好。</div>';
    return;
  }
  list.slice().reverse().forEach(item=>{
    const div=document.createElement('div');
    div.className='archiveItem';
    div.innerHTML=`
      <div class="meta">${item.at}｜味道：${item.flavor||'未選'}｜狀態：${item.status}</div>
      <div class="txt">${escapeHtml(item.note||'')}</div>
      <div class="row gap">
        <button class="btn ghost" type="button" data-copy="${encodeURIComponent(item.note||'')}">複製</button>
      </div>
    `;
    box.appendChild(div);
  });
  box.querySelectorAll('button[data-copy]').forEach(b=>b.addEventListener('click', ()=>copyText(decodeURIComponent(b.dataset.copy))));
}

function handleSave(){
  const note=(state.t4_thanks||'').trim();
  if(!note){
    $('#saveResult').textContent='你可以先不寫。想寫的時候再回來也可以。';
    toast('可以先不寫');
    return;
  }
  const item={ at: nowISO(), flavor: state.flavor||'', status:'甜美存檔', note };
  const list=loadArchive(); list.push(item); saveArchive(list);

  // ☁ 埋點：按下存檔（狀態轉換）
  cloudPing({ flavor: item.flavor, status:'甜美存檔', note, at: item.at });

  $('#saveResult').textContent='已存好。下次需要時，你可以回來拿。';
  toast('已存檔');
  renderArchive();
}

function initNavButtons(){
  $$('button[data-action]').forEach(btn=>btn.addEventListener('click', ()=>{
    const act=btn.dataset.action;
    if(act==='next') setStep(state.step+1);
    if(act==='prev') setStep(state.step-1);
    if(act==='exit') toast('你可以先停在這裡。');

    if(act==='restart'){
      Object.assign(state, { step:1, flavor:'', powerDone:false, t1_react:'', t2_pause:'', t3_say:'', t4_thanks:'' });
      saveState();
      const s=$('#powerSlider'); s.disabled=false; s.value=0;
      $('#powerState').textContent='尚未斷電';
      $('#powerState').classList.remove('ok');
      $('#powerDone').hidden=true;
      applySliderVisual(0);
      setInputsFromState();
      $$('.flavor').forEach(b=>b.classList.remove('active'));
      $('#pickedFlavor').textContent='尚未選擇';
      $('#flavorLine').textContent='「我現在有點…（先承認一下就好）」';
      $('#suggestLine').textContent='（你可以按「給我一句」）';
      $('#saveResult').textContent='';
      renderSteps();
      toast('已重來一次');
    }

    document.querySelector('main').scrollIntoView({behavior:'smooth', block:'start'});
  }));
}

function initFlavorButtons(){ $$('.flavor').forEach(b=>b.addEventListener('click', ()=>setFlavor(b.dataset.flavor))); }

function initCopyButtons(){
  $('#btnCopyFlavorLine').addEventListener('click', ()=>copyText(stripQuotes($('#flavorLine').textContent)));
  $('#btnCopyPauseLine').addEventListener('click', ()=>copyText(stripQuotes($('#pauseLine').textContent)));
  $('#btnCopySuggestLine').addEventListener('click', ()=>copyText(stripQuotes($('#suggestLine').textContent)));
  $('#btnCopyCloseLine').addEventListener('click', ()=>copyText(stripQuotes($('#closeLine').textContent)));
  $('#btnCopyQuote').addEventListener('click', ()=>copyText(stripQuotes($('#quoteText').textContent)));
  $('#btnCopyFeedbackLink').addEventListener('click', ()=>copyText(FORM_URL));
}

function initSuggestButton(){ $('#btnSuggestLine').addEventListener('click', ()=>{ suggestLine(); toast('給你一句'); }); }
function initSaveButton(){ $('#btnSave').addEventListener('click', handleSave); }
function initScrollTop(){ $('#btnScrollTop').addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'})); }

function initVideoButton(){
  $('#btnVideo').addEventListener('click', ()=>{
    if(VIDEO_URL && VIDEO_URL.trim()) window.open(VIDEO_URL.trim(), '_blank', 'noopener');
    else toast('這裡預留給之後想陪你的一段影片。');
  });
}

function initQuotes(){
  const toggle=$('#quotesToggle');
  const body=$('#quotesBody');

  toggle.checked = localStorage.getItem(LS_QUOTES_ON)==='1';
  body.hidden = !toggle.checked;

  toggle.addEventListener('change', ()=>{
    localStorage.setItem(LS_QUOTES_ON, toggle.checked ? '1' : '0');
    body.hidden = !toggle.checked;
    toast(toggle.checked ? '已開啟金句' : '已關閉金句');
  });

  let quotes = safeJsonParse(localStorage.getItem(LS_QUOTES), null);
  if(!Array.isArray(quotes) || !quotes.length) quotes = DEFAULT_QUOTES.slice();

  const save=()=>localStorage.setItem(LS_QUOTES, JSON.stringify(quotes));

  const render=()=>{
    const list=$('#quotesList'); list.innerHTML='';
    quotes.forEach((q, idx)=>{
      const chip=document.createElement('div');
      chip.className='chip';
      chip.innerHTML=`<span title="${escapeHtml(q)}">${escapeHtml(q)}</span><button type="button" aria-label="刪除">✕</button>`;
      chip.querySelector('button').addEventListener('click', ()=>{
        quotes.splice(idx,1);
        if(!quotes.length) quotes=DEFAULT_QUOTES.slice();
        save(); render();
        toast('已刪除');
      });
      list.appendChild(chip);
    });
  };

  const setQuote=(t)=>$('#quoteText').textContent = `「${stripQuotes(t)}」`;
  setQuote(quotes[0]); render();

  $('#btnNextQuote').addEventListener('click', ()=>setQuote(pick(quotes)));
  $('#btnAddQuote').addEventListener('click', ()=>{
    const inp=$('#quoteInput');
    const val=(inp.value||'').trim();
    if(!val) return toast('先輸入一句');
    quotes.push(val); inp.value='';
    save(); render(); toast('已新增');
  });
}

let deferredPrompt=null;
function initInstall(){
  const btn=$('#btnInstall');
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt=e;
    btn.hidden=false;
  });
  btn.addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    try{ await deferredPrompt.userChoice; }catch(e){}
    deferredPrompt=null; btn.hidden=true;
  });
}

function initServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

function resetAll(){
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_ARCHIVE);
  toast('已重設');
  setTimeout(()=>location.reload(), 300);
}
function initReset(){
  $('#btnReset').addEventListener('click', ()=>{
    if(confirm('要重設此工具嗎？\n（甜美存檔也會一起清空）')) resetAll();
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadState();
  initServiceWorker();
  initInstall();

  setInputsFromState();
  bindInputSync();

  initNavButtons();
  initFlavorButtons();
  initCopyButtons();
  initSuggestButton();
  initSaveButton();
  initScrollTop();
  initVideoButton();
  initQuotes();
  initSlider();
  initReset();

  renderArchive();
  if(state.flavor) setFlavor(state.flavor);
  renderSteps();
});
