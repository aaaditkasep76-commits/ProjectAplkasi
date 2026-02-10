/* app.js - Shared logic for data, makanan, kamar, cart, orders, admin, pdf */

/* ---------- Config / Data (ganti gambar atau nama di sini) ---------- */
const MENUS = [
  { id:'m01', name:'Nasi Goreng Spesial', price:25000, img:'https://i.ibb.co/4TF2Jfs/nasgor.jpg' },
  { id:'m02', name:'Sate Ayam Madura', price:28000, img:'https://i.ibb.co/YjJxj9X/sate.jpg' },
  { id:'m03', name:'Bakso Malang', price:20000, img:'https://i.ibb.co/zN8QSc5/bakso.jpg' },
  { id:'m04', name:'Mie Ayam Bakso', price:22000, img:'https://i.ibb.co/ckcRpqN/mieayam.jpg' },
  { id:'m05', name:'Rendang Padang', price:35000, img:'https://i.ibb.co/nz4DZnY/rendang.jpg' },
  { id:'m06', name:'Gado-Gado', price:18000, img:'https://i.ibb.co/7KZQ2xz/gado.jpg' },
  { id:'m07', name:'Ayam Penyet', price:23000, img:'https://i.ibb.co/3vYJqPb/penyet.jpg' },
  { id:'m08', name:'Pempek Palembang', price:22000, img:'https://i.ibb.co/vxM1Ktd/pempek.jpg' },
  { id:'m09', name:'Ikan Bakar Jimbaran', price:36000, img:'https://i.ibb.co/fvX3Jrj/ikanbakar.jpg' },
  { id:'m10', name:'Soto Lamongan', price:24000, img:'https://i.ibb.co/8YMyh2n/soto.jpg' }
];

const ROOMS = [
  { id:'r01', name:'Kamar Standar', price:250000, img:'https://i.ibb.co/GJvRjpm/room1.jpg' },
  { id:'r02', name:'Kamar Deluxe', price:400000, img:'https://i.ibb.co/0V1tPR7/room2.jpg' },
  { id:'r03', name:'Kamar Suite', price:600000, img:'https://i.ibb.co/vJDZDy4/room3.jpg' },
  { id:'r04', name:'Kamar Executive', price:850000, img:'https://i.ibb.co/8B6FzjP/room4.jpg' },
  { id:'r05', name:'Kamar Family', price:950000, img:'https://i.ibb.co/VjJMQMy/room5.jpg' },
  { id:'r06', name:'Kamar Premium', price:1200000, img:'https://i.ibb.co/4JFh6TH/room6.jpg' }
];

/* ---------- Storage keys ---------- */
const CUSTOMER_KEY = 'app_customer_v1';
const CART_KEY = 'app_cart_v1';
const ORDERS_KEY = 'app_orders_v1';
const TICKET_SEQ_KEY = 'app_ticket_seq_v1';

/* ---------- Helpers ---------- */
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }
function formatIDR(n){ return 'Rp ' + Number(n).toLocaleString('id-ID'); }

/* ---------- Customer (data.html) ---------- */
function saveCustomerFromForm(){
  const name = (document.getElementById('cust_name')||{}).value || '';
  const phone = (document.getElementById('cust_phone')||{}).value || '';
  const note = (document.getElementById('cust_note')||{}).value || '';
  if(!name || !phone){ alert('Nama dan Nomor HP wajib diisi.'); return false; }
  const customer = { name, phone, note, savedAt: new Date().toISOString() };
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  alert('Data pelanggan disimpan.');
  return true;
}
function loadCustomerToForm(){
  const c = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null');
  if(!c) return;
  if(document.getElementById('cust_name')) document.getElementById('cust_name').value = c.name;
  if(document.getElementById('cust_phone')) document.getElementById('cust_phone').value = c.phone;
  if(document.getElementById('cust_note')) document.getElementById('cust_note').value = c.note;
}

/* ---------- Cart operations ---------- */
function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function clearCart(){ localStorage.removeItem(CART_KEY); renderCartSummary(); }

/* add item: type = 'food' or 'room', item = object from MENUS/ROOMS, qty */
function addToCart(type, item, qty){
  qty = Math.max(1, parseInt(qty) || 1);
  const cart = getCart();
  const key = `${type}_${item.id}`;
  const found = cart.find(x=>x.key===key);
  if(found){
    found.qty += qty;
    found.subtotal = found.qty * found.price;
  } else {
    cart.push({
      key, type, id:item.id, name:item.name, price:item.price, img:item.img, qty, subtotal:item.price*qty
    });
  }
  saveCart(cart);
  renderCartSummary();
}

/* update qty by index in cart */
function updateCartQty(index, newQty){
  const cart = getCart();
  if(!cart[index]) return;
  cart[index].qty = Math.max(1, parseInt(newQty)||1);
  cart[index].subtotal = cart[index].qty * cart[index].price;
  saveCart(cart);
  renderCartSummary();
}
function removeCartIndex(index){
  const cart = getCart();
  cart.splice(index,1);
  saveCart(cart);
  renderCartSummary();
}

/* ---------- Render menu lists (makanan.html / kamar.html) ---------- */
function renderMenuList(list, containerId, type){
  const root = document.getElementById(containerId);
  if(!root) return;
  root.innerHTML = '';
  list.forEach(item=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div class="card-body">
        <div class="title">${item.name}</div>
        <div class="muted">${type==='food'?'Makanan Nusantara':'Tipe Kamar'}</div>
        <div class="price">${formatIDR(item.price)}${type==='room'?' / malam':''}</div>
      </div>
    `;
    card.addEventListener('click', ()=> openPopup(type, item));
    root.appendChild(card);
  });
}

/* ---------- Popup logic (shared) ---------- */
let popupState = null; // {type, item}
function openPopup(type, item){
  popupState = { type, item };
  const pop = document.getElementById('popup');
  if(!pop) return;
  document.getElementById('popupImg').src = item.img || '';
  document.getElementById('popupName').textContent = item.name || item.nama;
  document.getElementById('popupPrice').textContent = (type==='food'? 'Harga: ':'Harga / malam: ') + formatIDR(item.price || item.harga);
  document.getElementById('popupQty').value = 1;
  pop.classList.add('show');
}
function closePopup(){ const pop = document.getElementById('popup'); if(pop) pop.classList.remove('show'); popupState=null; }

/* ---------- Render cart summary (shared across pages) ---------- */
function renderCartSummary(){
  // find the summary container on the current page (ids used in pages)
  const possibleListIds = ['cart_list','rincianMakanan','rincianKamar','rincian'];
  let container = null;
  for(const id of possibleListIds){ const el = document.getElementById(id); if(el){ container = el; break; } }
  if(!container) return;
  const cart = getCart();
  container.innerHTML = '';
  let total = 0;
  if(cart.length===0){
    container.innerHTML = '<div class="muted">Keranjang kosong.</div>';
  } else {
    cart.forEach((it,idx)=>{
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${it.img}" alt="${it.name}">
        <div class="meta">
          <b>${it.name}</b>
          <div class="muted">${it.type==='room'?'Kamar / malam':'Makanan / porsi'}</div>
          <div style="font-size:13px">Unit: ${formatIDR(it.price)}</div>
        </div>
        <div style="text-align:right">
          <div class="cart-controls">
            <input type="number" value="${it.qty}" min="1" data-idx="${idx}" class="cart-qty" />
            <button class="btn secondary" data-remove="${idx}">Hapus</button>
          </div>
          <div style="margin-top:6px"><b>${formatIDR(it.subtotal)}</b></div>
        </div>
      `;
      container.appendChild(div);
      total += it.subtotal;
    });
  }

  // total element id variations
  const totalEls = ['totalMakanan','totalKamar','total'];
  for(const id of totalEls){ const e = document.getElementById(id); if(e) e.textContent = 'Total: ' + formatIDR(total); }

  // attach events for qty and remove
  $all('.cart-qty').forEach(el=>{
    el.onchange = (ev)=> updateCartQty(Number(ev.target.dataset.idx), Number(ev.target.value));
  });
  $all('[data-remove]').forEach(btn=> btn.onclick = (e)=> { removeCartIndex(Number(e.target.dataset.remove)); });
}

/* ---------- Ticket generator ---------- */
function genTicket(){
  let seq = Number(localStorage.getItem(TICKET_SEQ_KEY) || 0);
  seq += 1;
  localStorage.setItem(TICKET_SEQ_KEY, String(seq));
  return 'A' + String(seq).padStart(3,'0');
}

/* ---------- Checkout / Save order ---------- */
function checkoutSaveOrder(){
  const customer = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null');
  if(!customer || !customer.name || !customer.phone){
    alert('Isi data pelanggan dahulu di halaman Data Diri (name & phone).');
    return;
  }
  const cart = getCart();
  if(!cart || cart.length===0){ alert('Keranjang kosong. Tambahkan item.'); return; }
  const ticket = genTicket();
  const order = {
    id: Date.now(),
    ticket,
    customer,
    createdAt: new Date().toISOString(),
    items: cart.map(i=>({ type:i.type, id:i.id, name:i.name, price:i.price, qty:i.qty, subtotal:i.subtotal })),
    total: cart.reduce((s,i)=>s+i.subtotal,0)
  };
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  // clear cart
  clearCart();
  alert('Checkout sukses. Tiket antrian: ' + ticket);
}

/* ---------- Admin: render orders & print ---------- */
function renderAdminOrders(){
  const root = document.getElementById('ordersRoot');
  if(!root) return;
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  root.innerHTML = '';
  if(orders.length===0){ root.innerHTML = '<div class="muted">Belum ada pesanan.</div>'; return; }
  orders.slice().reverse().forEach(o=>{
    const el = document.createElement('div');
    el.className = 'order-card';
    let html = `<div style="display:flex;justify-content:space-between"><div><b>Ticket:</b> ${o.ticket}<br><b>Nama:</b> ${o.customer.name} (${o.customer.phone})</div><div><b>Total:</b> ${formatIDR(o.total)}<br><small class="muted">${new Date(o.createdAt).toLocaleString()}</small></div></div><div style="margin-top:8px">`;
    o.items.forEach(it=>{
      html += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px dashed rgba(0,0,0,0.04)"><div><b>${it.name}</b><div class="muted">${it.type}</div></div><div>Qty: ${it.qty}<br>${formatIDR(it.subtotal)}</div></div>`;
    });
    html += `</div><div style="text-align:right;margin-top:8px"><button class="btn" data-print="${o.id}">Cetak</button></div>`;
    el.innerHTML = html;
    root.appendChild(el);
  });

  // print handlers
  $all('[data-print]').forEach(btn=>{
    btn.onclick = (e)=>{
      const id = Number(e.target.dataset.print);
      printOrderPDF(id);
    };
  });
}

async function printOrderPDF(orderId){
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  const order = orders.find(o=>o.id === orderId);
  if(!order) return alert('Order tidak ditemukan');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  let y = 40;
  doc.setFontSize(14);
  doc.text('STRUK PEMESANAN - Nusantara', 40, y); y+=18;
  doc.setFontSize(10);
  doc.text(`Ticket: ${order.ticket}`, 40, y); y+=14;
  doc.text(`Nama: ${order.customer.name}`, 40, y); y+=14;
  doc.text(`HP: ${order.customer.phone}`, 40, y); y+=16;
  order.items.forEach(it=>{
    doc.text(`${it.name} x${it.qty}`, 40, y);
    doc.text(`${formatIDR(it.subtotal)}`, 420, y);
    y += 14;
    if(y > 760){ doc.addPage(); y = 40; }
  });
  y += 8;
  doc.setFontSize(12);
  doc.text('-------------------------------', 40, y); y+=14;
  doc.text(`TOTAL: ${formatIDR(order.total)}`, 40, y);
  doc.save(`Struk_${order.ticket}.pdf`);
}

/* print all orders */
async function printAllOrdersPDF(){
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  if(!orders.length) return alert('Belum ada pesanan.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  let y = 40;
  doc.setFontSize(14);
  doc.text('DAFTAR PESANAN - Nusantara', 40, y); y+=22;
  doc.setFontSize(11);
  for(const o of orders.slice().reverse()){
    doc.text(`Ticket: ${o.ticket}    Nama: ${o.customer.name}`, 40, y); y+=14;
    for(const it of o.items){
      doc.text(`${it.name} x${it.qty}`, 48, y);
      doc.text(`${formatIDR(it.subtotal)}`, 430, y);
      y += 12;
      if(y > 760){ doc.addPage(); y = 40; }
    }
    doc.text(`TOTAL: ${formatIDR(o.total)}`, 40, y); y+=18;
    doc.text('----------------------------------------', 40, y); y+=14;
    if(y > 760){ doc.addPage(); y = 40; }
  }
  doc.save(`DaftarPesanan_${Date.now()}.pdf`);
}

/* ---------- Initialization on DOM ready ---------- */
document.addEventListener('DOMContentLoaded', ()=>{

  /* If data.html present */
  if(document.getElementById('cust_form')){
    loadCustomerToForm();
    document.getElementById('save_customer').onclick = ()=>{
      if(saveCustomerFromForm()) window.location.href = 'makanan.html';
    };
  }

  /* If makanan.html present */
  if(document.getElementById('menuMakanan')){
    renderMenuList(MENUS, 'menuMakanan', 'food');
    // popup controls
    document.getElementById('popup_close').onclick = closePopup;
    document.getElementById('popup_cancel').onclick = closePopup;
    document.getElementById('popup_add').onclick = ()=>{
      if(!popupState) return;
      const qty = Number(document.getElementById('popupQty').value) || 1;
      // item structure in MENUS: {id, name, price, img}
      addToCart('food', { id: popupState.item.id, name: popupState.item.name, price: popupState.item.price, img: popupState.item.img }, qty);
      closePopup();
    };
    // clear cart button (if exists)
    const clearBtn = document.getElementById('clearCartFood'); if(clearBtn) clearBtn.onclick = ()=>{ if(confirm('Kosongkan keranjang?')){ clearCart(); } };
    // send to checkout
    const sendBtn = document.getElementById('kirimPesanan'); if(sendBtn) sendBtn.onclick = checkoutSaveOrder;
  }

  /* If kamar.html present */
  if(document.getElementById('menuKamar')){
    renderMenuList(ROOMS, 'menuKamar', 'room');
    // popup controls (same popup)
    document.getElementById('popup_close').onclick = closePopup;
    document.getElementById('popup_cancel').onclick = closePopup;
    document.getElementById('popup_add').onclick = ()=>{
      if(!popupState) return;
      const qty = Number(document.getElementById('popupQty').value) || 1;
      addToCart('room', { id: popupState.item.id, name: popupState.item.name, price: popupState.item.price, img: popupState.item.img }, qty);
      closePopup();
    };
    const clearBtn = document.getElementById('clearCartRoom'); if(clearBtn) clearBtn.onclick = ()=>{ if(confirm('Kosongkan keranjang?')) clearCart(); };
    const sendBtn = document.getElementById('kirimPesananKamar'); if(sendBtn) sendBtn.onclick = checkoutSaveOrder;
  }

  /* If any page has cart summary placeholder, render it */
  renderCartSummary();

  /* If admin page present */
  if(document.getElementById('ordersRoot')){
    renderAdminOrders();
    const printAllBtn = document.getElementById('print-all'); if(printAllBtn) printAllBtn.onclick = printAllOrdersPDF;
    const clearAllBtn = document.getElementById('clear-all'); if(clearAllBtn) clearAllBtn.onclick = ()=>{
      if(!confirm('Hapus semua pesanan?')) return;
      localStorage.removeItem(ORDERS_KEY); renderAdminOrders();
    };
  }

});