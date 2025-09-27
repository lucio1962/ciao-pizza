// Utilities
const € = n => new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR' }).format(n);
const el = sel => document.querySelector(sel);
const url = new URL(location.href);
const tavolo = url.searchParams.get('tavolo');

// Config
const C = window.APP_CONFIG;

// State
let MENU = [];
let CART = [];

function saveCart(){
  const key = tavolo ? `cart_t${tavolo}` : 'cart_asporto';
  localStorage.setItem(key, JSON.stringify(CART));
}
function loadCart(){
  const key = tavolo ? `cart_t${tavolo}` : 'cart_asporto';
  CART = JSON.parse(localStorage.getItem(key) || '[]');
}
function calcTotal(){
  return CART.reduce((s, it)=> s + it.price * it.qty, 0);
}
function renderTotal(){
  el('#total').textContent = €(calcTotal());
}

function renderBusiness(){
  el('#bizName').textContent = `${C.BUSINESS_NAME} • ${C.CITY}`;
  el('#bizMeta').textContent = `${C.ADDRESS} • Tel. ${C.PHONE_CALL || 'n/d'}`;
  const hours = C.OPENING_HOURS.map(o=> `${o.day}: ${o.hours}`).join(' • ');
  el('#hours').textContent = hours;
  if (tavolo){
    el('#tableInfo').textContent = `Modalità al tavolo. Tavolo ${tavolo}. Il personale riceverà il tuo ordine.`;
  } else {
    el('#tableInfo').textContent = `Modalità asporto. Puoi anche prenotare per orario.`;
  }
  const sample = `${location.origin}${location.pathname}?tavolo=12`;
  el('#qrSample').textContent = sample;
  drawQR(sample);
}

function drawQR(text){
  const ctx = el('#qrcanvas').getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,96,96); ctx.fillStyle='#000';
  for (let y=0;y<96;y+=4){
    for (let x=0;x<96;x+=4){
      const v = (x*y + text.length*17) % 7;
      if (v<3) ctx.fillRect(x,y,4,4);
    }
  }
}

// Render menu
function buildCategoryOptions(cats){
  const s = el('#category');
  s.innerHTML = '<option value="all">Tutte le categorie</option>' +
    cats.map(c=> `<option>${c.name}</option>`).join('');
}
function renderMenu(filterText='', filterCat='all'){
  const host = el('#menu');
  host.innerHTML = '';
  const t = filterText.toLowerCase();
  const categories = MENU.categories;
  for (const cat of categories){
    for (const item of cat.items){
      const matchText = !t || item.name.toLowerCase().includes(t) || (item.desc||'').toLowerCase().includes(t);
      const matchCat = filterCat==='all' || filterCat===cat.name;
      if (!(matchText && matchCat)) continue;
      const card = document.createElement('div');
      card.className='card';
      card.innerHTML = `
        <div class="row"><h3>${item.name}</h3><div class="small">${€(item.price)}</div></div>
        <p>${item.desc||''}</p>
        <div class="row">
          <input class="input" placeholder="Note per ${item.name}" data-note="${item.id}">
          <button class="button" data-add="${item.id}">Aggiungi</button>
        </div>
      `;
      host.appendChild(card);
    }
  }
}

function bindFilters(){
  el('#search').addEventListener('input', ()=>{
    renderMenu(el('#search').value, el('#category').value);
  });
  el('#category').addEventListener('change', ()=>{
    renderMenu(el('#search').value, el('#category').value);
  });
  el('#reset').addEventListener('click', ()=>{
    el('#search').value=''; el('#category').value='all'; renderMenu();
  });
}

function onMenuClick(e){
  const addId = e.target.getAttribute('data-add');
  if (!addId) return;
  for (const cat of MENU.categories){
    const item = cat.items.find(x=> x.id===addId);
    if (item){
      const noteInput = document.querySelector(`input[data-note="${item.id}"]`);
      const note = noteInput?.value || '';
      const existing = CART.find(x=> x.id===item.id);
      if (existing){ existing.qty+=1; if (note) existing.note = note; }
      else CART.push({ id:item.id, name:item.name, price:item.price, qty:1, note });
      saveCart(); renderCart();
    }
  }
}

function renderCart(){
  const host = el('#cartItems');
  host.innerHTML='';
  for (const it of CART){
    const row = document.createElement('div');
    row.className='item';
    row.innerHTML = `
      <div>
        <div><strong>${it.name}</strong> <span class="small">${€(it.price)}</span></div>
        <div class="small">${it.note ? 'Note: '+it.note : ''}</div>
      </div>
      <div class="qty">
        <button data-dec="${it.id}">-</button>
        <div>${it.qty}</div>
        <button data-inc="${it.id}">+</button>
        <button data-del="${it.id}" title="Rimuovi">x</button>
      </div>
    `;
    host.appendChild(row);
  }
  renderTotal();
  el('#checkoutHint').textContent = checkoutHint();
}

function onCartClick(e){
  const id = e.target.getAttribute('data-inc') || e.target.getAttribute('data-dec') || e.target.getAttribute('data-del');
  if (!id) return;
  const inc = e.target.hasAttribute('data-inc');
  const dec = e.target.hasAttribute('data-dec');
  const del = e.target.hasAttribute('data-del');
  const idx = CART.findIndex(x=> x.id===id);
  if (idx<0) return;
  if (inc) CART[idx].qty += 1;
  if (dec) CART[idx].qty = Math.max(1, CART[idx].qty-1);
  if (del) CART.splice(idx,1);
  saveCart(); renderCart();
}

function checkoutHint(){
  const w = C.WHATSAPP_NUMBER ? `WhatsApp` : null;
  const e = C.ORDER_EMAIL ? `email` : null;
  const p = C.PRINTER_WEBHOOK_URL ? `stampa cucina` : null;
  const options = [w,e,p].filter(Boolean).join(' / ');
  return options ? `Metodi disponibili: ${options}` : `Imposta WHATSAPP_NUMBER o ORDER_EMAIL in config.js`;
}

function composeOrderText(){
  const mode = tavolo ? `AL TAVOLO (T${tavolo})` : `ASPORTO`;
  const lines = [];
  lines.push(`Ordine ${C.BUSINESS_NAME} • ${mode}`);
  lines.push('');
  CART.forEach(it=>{
    const note = it.note ? ` • ${it.note}` : '';
    lines.push(`${it.qty}x ${it.name} (${€(it.price)})${note}`);
  });
  const total = €(calcTotal());
  lines.push(''); lines.push(`Totale: ${total}`);
  const note = el('#orderNote').value.trim();
  if (note){ lines.push(''); lines.push(`Note cliente: ${note}`); }
  lines.push(''); lines.push(`Indirizzo: ${C.ADDRESS}`);
  return lines.join('\n');
}

function sendViaWhatsApp(text){
  const num = (C.WHATSAPP_NUMBER||'').replace(/\D/g,'');
  if (!num){ alert('Configura WHATSAPP_NUMBER in config.js'); return; }
  const link = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(link, '_blank');
}

function sendViaEmail(text){
  if (!C.ORDER_EMAIL){ alert('Configura ORDER_EMAIL in config.js'); return; }
  const subject = `Ordine ${C.BUSINESS_NAME}${tavolo? ' Tavolo '+tavolo:''}`;
  const link = `mailto:${encodeURIComponent(C.ORDER_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  window.location.href = link;
}

async function sendToPrinter(text){
  if (!C.PRINTER_WEBHOOK_URL){ alert('Configura PRINTER_WEBHOOK_URL in config.js'); return; }
  try{
    const res = await fetch(C.PRINTER_WEBHOOK_URL, {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ text, source:'menu-qr', table: tavolo || null })
    });
    if (!res.ok) throw new Error('HTTP '+res.status);
    alert('Inviato alla cucina');
  }catch(err){
    alert('Errore invio alla cucina: '+err.message);
  }
}

function bindCheckout(){
  el('#checkout').addEventListener('click', ()=>{
    if (CART.length===0){ alert('Carrello vuoto'); return; }
    const text = composeOrderText();
    if (C.PRINTER_WEBHOOK_URL) { sendToPrinter(text); return; }
    if (C.WHATSAPP_NUMBER) { sendViaWhatsApp(text); return; }
    if (C.ORDER_EMAIL) { sendViaEmail(text); return; }
    alert('Nessun metodo configurato. Vedi config.js');
  });
  el('#clearCart').addEventListener('click', ()=>{
    CART = []; saveCart(); renderCart();
  });
  el('#menu').addEventListener('click', onMenuClick);
  el('#cartItems').addEventListener('click', onCartClick);
}

async function init(){
  renderBusiness();
  const res = await fetch('./menu.json'); MENU = await res.json();
  buildCategoryOptions(MENU.categories);
  bindFilters();
  loadCart();
  renderMenu();
  renderCart();
}
init();
