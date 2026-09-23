const SITE_URL = 'https://collectionmaharanisaree-dotcom.github.io/maharani-saree-collection/';
const SUPABASE_URL = 'https://rqzaibfdwczpqfrswcvg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oPs57ONamrOxneH9jsxbvw__PzUetUG';
const WHATSAPP = '919097900814';
const STORAGE_BUCKET = 'product images';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80';

const FLASH_START_HOUR = 20;
const FLASH_DURATION_MINUTES = 60;
let offerTimer = null;
function formatCountdown(ms){const total=Math.max(0,Math.floor(ms/1000));const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;const pad=n=>String(n).padStart(2,'0');return pad(h)+':'+pad(m)+':'+pad(s);}
function getFlashWindow(){const now=new Date();const start=new Date(now);start.setHours(FLASH_START_HOUR,0,0,0);const end=new Date(start.getTime()+FLASH_DURATION_MINUTES*60000);if(now>=start&&now<end)return {active:true,start,end};const next=new Date(start);if(now>=end)next.setDate(next.getDate()+1);return {active:false,start:next,end:new Date(next.getTime()+FLASH_DURATION_MINUTES*60000)};}
function startOfferCountdown(){const tick=()=>{const custom=window.__MAHARANI_OFFER_END?new Date(window.__MAHARANI_OFFER_END):null;const now=Date.now();let activeEnd=custom&&!Number.isNaN(custom.getTime())?custom.getTime():null;let active=true;if(!activeEnd){const w=getFlashWindow();active=w.active;activeEnd=(active?w.end:w.start).getTime();}const left=Math.max(0,activeEnd-now),text=formatCountdown(left),a=$('offerCountdown'),b=$('offerCountdownLarge'),msg=$('offerMessage');if(a)a.textContent=text;if(b)b.textContent=text;if(msg)msg.textContent=active?'🔥 अभी LIVE — 1 घंटे की Online Dhamaka Sale':'⏰ अगली 1-Hour Online Sale शुरू होने में';};tick();if(offerTimer)clearInterval(offerTimer);offerTimer=setInterval(tick,1000);}
function initOfferNotification(){const bar=$('offerTicker'),close=$('offerNotifyClose');if(!bar)return;close.onclick=()=>{bar.classList.add('offer-hidden');setTimeout(()=>bar.remove(),250);};setTimeout(()=>{if(document.body.contains(bar))bar.classList.add('offer-pulse');},1200);startOfferCountdown();}

const fallbackProducts = [
  {id:1,name:'Saree',category:'Saree',price:867,mrp:1299,image:FALLBACK_IMAGE,images:[FALLBACK_IMAGE],description:'Beautiful saree collection for festive and everyday occasions.'},
  {id:2,name:'Lehnga',category:'Lehnga',price:1499,mrp:1999,image:'https://images.unsplash.com/photo-1597983073493-88cd35cf93d0?auto=format&fit=crop&w=700&q=80',images:[],description:'Stylish lehnga collection for weddings and special occasions.'},
  {id:3,name:'Suit',category:'Suit',price:999,mrp:1499,image:'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=700&q=80',images:[],description:'Elegant and comfortable suit collection.'},
  {id:4,name:'Kurti',category:'Kurti',price:599,mrp:899,image:'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=700&q=80',images:[],description:'Trendy kurti collection for everyday style.'},
  {id:5,name:'Palazo',category:'Palazo',price:699,mrp:999,image:'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=700&q=80',images:[],description:'Comfortable and stylish palazo collection.'}
];

let products = [], categories = [], supabaseClient = null, adminProducts = [], siteSettings = null, siteSettingsId = null;
let customAdminCategories = JSON.parse(localStorage.getItem('maharani-custom-categories') || '[]');

async function getSupabaseClient(){
  if(supabaseClient) return supabaseClient;
  await loadSupabaseClient();
  if(!supabaseClient) throw new Error('Supabase connection load नहीं हुआ। Page refresh करके फिर कोशिश करें।');
  return supabaseClient;
}

const money = n => '₹' + (Number(n)||0).toLocaleString('en-IN');
const $ = id => document.getElementById(id);
const toNumber = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const safeImage = v => typeof v === 'string' && v.trim() ? v.trim() : FALLBACK_IMAGE;

function parseImages(value, primary='') {
  let arr = [];
  if (Array.isArray(value)) arr = value;
  else if (typeof value === 'string' && value.trim()) {
    try { const parsed = JSON.parse(value); arr = Array.isArray(parsed) ? parsed : value.split(','); }
    catch { arr = value.split(','); }
  }
  const all = [primary, ...arr].map(v => typeof v === 'string' ? v.trim() : '').filter(Boolean);
  return [...new Set(all)];
}
function normalizeProduct(row) {
  const image = safeImage(row.Image ?? row.image);
  return {
    id: row.id, name: row.Name ?? row.name ?? 'Product', category: row.Category ?? row.category ?? 'Other',
    price: toNumber(row.Price ?? row.price), mrp: toNumber(row.Mrp ?? row.mrp), image,
    images: parseImages(row.images ?? row.Images, image), description: row.Description ?? row.description ?? ''
  };
}
function rebuildCategories() {
  const labels = {Saree:'Sarees',Lehnga:'Lehngas',Suit:'Suits',Kurti:'Kurtis',Palazo:'Palazo'};
  categories = [...new Set(products.map(p=>p.category).filter(Boolean))].map(name => ({
    name,label:labels[name]||name,image:products.find(p=>p.category===name)?.image||FALLBACK_IMAGE
  }));
}
function showSupabaseError(message) {
  const old=$('supabase-diagnostic-error'); if(old) old.remove();
  const box=document.createElement('pre'); box.id='supabase-diagnostic-error'; box.textContent='Supabase product loading error:\\n\\n'+message;
  box.style.cssText='position:fixed;z-index:2147483647;top:0;left:0;right:0;margin:0;padding:16px;background:#8b0000;color:#fff;font:14px/1.45 monospace;white-space:pre-wrap;overflow:auto;max-height:50vh;box-sizing:border-box';
  document.body.prepend(box);
}
async function loadProducts() {
  const requestUrl = SUPABASE_URL + '/functions/v1/bright-task';
  try {
    const response = await fetch(requestUrl,{method:'GET',cache:'no-store'});
    const body = await response.text();
    if(!response.ok) throw new Error(response.status+' '+response.statusText+'\\n'+body);
    const data = JSON.parse(body);
    if(!Array.isArray(data)) throw new Error('Invalid products response');
    siteSettings = data.find(row => (row.Name ?? row.name) === '__SITE_SETTINGS__') || null;
    siteSettingsId = siteSettings?.id || null;
    products = data.filter(row => (row.Name ?? row.name) !== '__SITE_SETTINGS__').map(normalizeProduct);
    applySiteSettings();
  } catch(error) {
    console.error(error);
    products = [];
    showSupabaseError(String(error?.message || error));
  }
}
function applyText(id,value){const el=$(id);if(el&&value!=null)el.textContent=value;}
function applySiteSettings(){
  if(!siteSettings)return;
  let cfg={}; try{cfg=JSON.parse(siteSettings.Description||'{}')}catch(e){cfg={};}
  const set=(id,key)=>{if(cfg[key]!==undefined)applyText(id,cfg[key]);};
  set('heroEyebrow','heroEyebrow');set('heroTitle','heroTitle');set('heroText','heroText');set('heroNoteTitle','heroNoteTitle');set('heroNoteText','heroNoteText');set('offerEyebrow','offerEyebrow');set('offerTitle','offerTitle');set('offerIntro','offerIntro');set('dhamakaTitle','dhamakaTitle');set('dhamakaText','dhamakaText');set('contactEyebrow','contactEyebrow');set('contactTitle','contactTitle');set('contactText','contactText');set('contactAddress','address');set('contactProprietor','proprietor');set('contactGst','gst');
  const img=$('shopBannerImage'); if(img&&siteSettings.Image){img.src=siteSettings.Image;img.classList.add('shop-banner-image');}
  if(cfg.logoImage){document.querySelectorAll('.brand-logo').forEach(x=>x.src=cfg.logoImage);}
  const phone=cfg.phone||'9097900814';const ph=$('contactPhone');if(ph){ph.textContent=phone;ph.href='tel:'+phone.replace(/[^0-9+]/g,'');}
  const title=cfg.announcement||'🔥 1-HOUR ONLINE DHAMAKA SALE • Website Shopping पर Special Offer • Derni Bazar, Saran';const ann=document.querySelector('.announcement');if(ann)ann.textContent=title;
  const ticker=$('offerTicker');if(ticker&&cfg.offerTitle){const strong=ticker.querySelector('strong');if(strong)strong.textContent=cfg.offerTitle;}
  if(cfg.offerEnd){window.__MAHARANI_OFFER_END=cfg.offerEnd;startOfferCountdown();}else{window.__MAHARANI_OFFER_END=null;startOfferCountdown();}
}
function cfgExistingLogo(){return getSettingsConfig().logoImage||'';}
function getSettingsConfig(){let cfg={};try{cfg=JSON.parse(siteSettings?.Description||'{}')}catch(e){}return cfg;}
function injectSiteSettings(){
  const box=$('siteSettings');if(!box)return;
  const cfg=getSettingsConfig();
  box.innerHTML='<div class="admin-settings-card"><h3>🔥 Dhamaka Offer + Homepage Control</h3><p class="admin-settings-note">Yahan se jo badlenge, wahi customer page par dikhega. Baar-baar coding ki zarurat nahi.</p><div class="admin-settings-grid"><label>Bold offer / top banner<input id="setAnnouncement" value="'+(cfg.announcement||'🔥 DHAMAKA OFFER • ₹1,999+ SHOPPING = GIFT CHANCE')+'"></label><label>Offer end (date/time)<input id="setOfferEnd" type="datetime-local" value="'+toLocalDateTime(cfg.offerEnd||OFFER_END)+'"></label><label class="admin-settings-wide">Hero heading<input id="setHeroTitle" value="'+(cfg.heroTitle||'Style that feels like you.')+'"></label><label>Hero small line<input id="setHeroEyebrow" value="'+(cfg.heroEyebrow||'THE EVERYDAY EDIT · EST. IN Derni Bazar')+'"></label><label>Hero description<input id="setHeroText" value="'+(cfg.heroText||'Discover thoughtfully chosen festive and everyday fashion for every mood, moment and celebration.')+'"></label><label>Banner note title<input id="setHeroNoteTitle" value="'+(cfg.heroNoteTitle||'Maharani Saree Collection')+'"></label><label>Banner note text<input id="setHeroNoteText" value="'+(cfg.heroNoteText||'Derni Bazar • Saran')+'"></label><label>Offer heading<input id="setOfferTitle" value="'+(cfg.offerTitle||'Celebrate more, gift more.')+'"></label><label>Offer intro<input id="setOfferIntro" value="'+(cfg.offerIntro||'Make your shopping even more special with our in-store offers.')+'"></label><label>Dhamaka heading<input id="setDhamakaTitle" value="'+(cfg.dhamakaTitle||'🔥 DHAMAKA OFFER')+'"></label><label>Dhamaka text<input id="setDhamakaText" value="'+(cfg.dhamakaText||'आज का Dhamaka Offer देखें और समय खत्म होने से पहले shopping करें.')+'"></label></div></div><div class="admin-settings-card"><h3>🏪 Shop information</h3><div class="admin-settings-grid"><label>Phone / WhatsApp<input id="setPhone" value="'+(cfg.phone||'9097900814')+'"></label><label>Proprietor<input id="setProprietor" value="'+(cfg.proprietor||'Lakshman Bhagat')+'"></label><label class="admin-settings-wide">Address<input id="setAddress" value="'+(cfg.address||'Derni Bazar, Saran, Bihar — 841222')+'"></label><label>GST<input id="setGst" value="'+(cfg.gst||'10BZYPB5853J1Z3')+'"></label></div></div><div class="admin-settings-card"><h3>🖼️ Shop Banner / Owner Photo + Logo</h3><p class="admin-settings-note">Customer page ke right side ka current fashion photo hata kar yahan apna shop banner ya apna photo upload karein. Aap jab chahein replace kar sakte hain.</p><input id="setBannerFile" type="file" accept="image/*"><label>Logo / Shop logo<input id="setLogoFile" type="file" accept="image/*"></label><div id="settingsImagePreview" class="settings-image-preview">'+(siteSettings?.Image?'<img src="'+siteSettings.Image+'" alt="Current shop banner">':'')+'</div><div class="settings-actions"><button class="button button-dark" type="button" id="saveSiteSettingsBtn">Save ALL site settings</button><button class="button button-outline" type="button" id="refreshSiteSettingsBtn">Reload</button></div><p class="admin-msg" id="siteSettingsMsg"></p></div>';
  $('setBannerFile').onchange=()=>{const f=$('setBannerFile').files[0];if(f){const u=URL.createObjectURL(f);$('settingsImagePreview').innerHTML='<img src="'+u+'" alt="New banner preview">';}};
  $('saveSiteSettingsBtn').onclick=saveSiteSettings;$('refreshSiteSettingsBtn').onclick=()=>{injectSiteSettings();};
}
function toLocalDateTime(v){const d=new Date(v);if(Number.isNaN(d.getTime()))return '';const pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());}
async function saveSiteSettings(){
 const msg=$('siteSettingsMsg');msg.textContent='Saving ALL settings…';
 try{const cfg={logoImage:cfgExistingLogo(),announcement:$('setAnnouncement').value.trim(),offerEnd:$('setOfferEnd').value?new Date($('setOfferEnd').value).toISOString():'',heroTitle:$('setHeroTitle').value.trim(),heroEyebrow:$('setHeroEyebrow').value.trim(),heroText:$('setHeroText').value.trim(),heroNoteTitle:$('setHeroNoteTitle').value.trim(),heroNoteText:$('setHeroNoteText').value.trim(),offerTitle:$('setOfferTitle').value.trim(),offerIntro:$('setOfferIntro').value.trim(),dhamakaTitle:$('setDhamakaTitle').value.trim(),dhamakaText:$('setDhamakaText').value.trim(),phone:$('setPhone').value.trim(),proprietor:$('setProprietor').value.trim(),address:$('setAddress').value.trim(),gst:$('setGst').value.trim()};let image=siteSettings?.Image||'';const file=$('setBannerFile').files[0];if(file){const urls=await uploadAdminPhotos([file]);image=urls[0];}const logoFile=$('setLogoFile').files[0];if(logoFile){const logoUrls=await uploadAdminPhotos([logoFile]);cfg.logoImage=logoUrls[0];}const payload={Name:'__SITE_SETTINGS__',Category:'__CONFIG__',Price:0,Mrp:0,Image:image,images:JSON.stringify(image?[image]:[]),Description:JSON.stringify(cfg)};const client=await getSupabaseClient();let result;if(siteSettingsId)result=await client.from('Products').update(payload).eq('id',siteSettingsId).select().single();else result=await client.from('Products').insert(payload).select().single();if(result.error)throw result.error;siteSettings=result.data;siteSettingsId=result.data.id;applySiteSettings();msg.textContent='ALL site settings saved ✓';toast('Website updated successfully');}catch(e){msg.textContent='Save failed: '+(e.message||e);}}
function renderCategoryFilter() {
  const select=$('categoryFilter'), selected=select.value||'All';
  select.innerHTML='<option value="All">All categories</option>'+categories.map(c=>'<option value="'+c.name+'">'+c.label+'</option>').join('');
  select.value=categories.some(c=>c.name===selected)?selected:'All';
}
function renderCategories() {
  $('categoryGrid').innerHTML=categories.map(c=>'<button class="category-card" data-category="'+c.name+'"><img src="'+c.image+'" alt="'+c.label+'" loading="lazy"><span>'+c.label+'</span><b>Explore →</b></button>').join('');
  document.querySelectorAll('.category-card').forEach(b=>b.onclick=()=>{$('categoryFilter').value=b.dataset.category;renderProducts();$('shop').scrollIntoView({behavior:'smooth'});});
}
function renderProducts() {
  const term=$('searchInput').value.trim().toLowerCase(), category=$('categoryFilter').value;
  const shown=products.filter(p=>(category==='All'||p.category===category)&&((p.name+' '+p.category).toLowerCase().includes(term)));
  $('productGrid').innerHTML=shown.map(p=>{
    const discount=p.mrp>0?Math.max(0,Math.round((1-p.price/p.mrp)*100)):0;
    return '<article class="product-card"><button class="product-image" data-detail="'+p.id+'" aria-label="View '+p.name+' details"><img src="'+p.image+'" alt="'+p.name+'" loading="lazy"><span class="discount">'+discount+'% off</span></button><div class="product-info"><p class="product-category">'+p.category+'</p><h3>'+p.name+'</h3><div class="price"><strong>'+money(p.price)+'</strong><del>'+money(p.mrp)+'</del></div><button class="button button-dark add-button" data-add="'+p.id+'">Add to bag</button></div></article>';
  }).join('');
  $('noResults').hidden=shown.length>0;
  document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addToCart(b.dataset.add));
  document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>showDetail(b.dataset.detail));
}
function findProduct(id){return products.find(p=>String(p.id)===String(id));}
let cart=JSON.parse(localStorage.getItem('maharani-cart')||'[]');
function saveCart(){localStorage.setItem('maharani-cart',JSON.stringify(cart));}
function addToCart(id){const item=cart.find(x=>String(x.id)===String(id));if(item)item.qty++;else cart.push({id,qty:1});saveCart();renderCart();openDrawer();toast('Added to your bag');}
function changeQty(id,delta){const item=cart.find(x=>String(x.id)===String(id));if(!item)return;item.qty+=Number(delta);if(item.qty<1)cart=cart.filter(x=>String(x.id)!==String(id));saveCart();renderCart();}
function cartTotal(){return cart.reduce((sum,x)=>sum+toNumber(findProduct(x.id)?.price)*toNumber(x.qty),0);}
function renderCart(){
  $('cartCount').textContent=cart.reduce((s,x)=>s+toNumber(x.qty),0);$('cartTotal').textContent=money(cartTotal());
  $('cartItems').innerHTML=cart.length?cart.map(x=>{const p=findProduct(x.id);if(!p)return '';return '<div class="cart-item"><img src="'+p.image+'" alt=""><div><strong>'+p.name+'</strong><small>'+money(p.price)+' · '+p.category+'</small><div class="quantity"><button data-change="'+p.id+'" data-delta="-1">−</button><span>'+toNumber(x.qty)+'</span><button data-change="'+p.id+'" data-delta="1">+</button><button class="remove" data-remove="'+p.id+'">Remove</button></div></div></div>';}).join(''):'<div class="empty-cart"><span>○</span><p>Your bag is waiting for something beautiful.</p><a href="#shop" id="emptyShop">Explore collection</a></div>';
  document.querySelectorAll('[data-change]').forEach(b=>b.onclick=()=>changeQty(b.dataset.change,b.dataset.delta));
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart=cart.filter(x=>String(x.id)!==String(b.dataset.remove));saveCart();renderCart();});
  const empty=$('emptyShop');if(empty)empty.onclick=closeDrawer;
}
function showDetail(id){
  const p=findProduct(id);if(!p)return;
  const imgs=p.images?.length?p.images:[p.image];
  $('productDetail').innerHTML='<div><div class="product-gallery"><img id="detailMainImage" src="'+imgs[0]+'" alt="'+p.name+'"><div class="product-thumbs">'+imgs.map((src,i)=>'<button class="product-thumb '+(i===0?'active':'')+'" data-gallery="'+i+'"><img src="'+src+'" alt="Photo '+(i+1)+'"></button>').join('')+'</div></div></div><div><p class="eyebrow">'+p.category+'</p><h2>'+p.name+'</h2><p>'+p.description+'</p><div class="price detail-price"><strong>'+money(p.price)+'</strong><del>'+money(p.mrp)+'</del></div><button class="button button-dark full" data-detail-add="'+p.id+'">Add to bag</button></div>';
  $('productDialog').showModal();
  document.querySelector('[data-detail-add]').onclick=()=>{addToCart(id);$('productDialog').close();};
  document.querySelectorAll('[data-gallery]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-gallery]').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('detailMainImage').src=imgs[Number(b.dataset.gallery)];});
}
function openDrawer(){$('cartDrawer').classList.add('open');$('drawerOverlay').classList.add('open');$('cartDrawer').setAttribute('aria-hidden','false');}
function closeDrawer(){$('cartDrawer').classList.remove('open');$('drawerOverlay').classList.remove('open');$('cartDrawer').setAttribute('aria-hidden','true');}
function openCheckout(){if(!cart.length)return toast('Add a product before checkout');$('checkoutItems').textContent=cart.reduce((s,x)=>s+toNumber(x.qty),0);$('checkoutTotal').textContent=money(cartTotal());$('checkoutDialog').showModal();}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2400);}
let lastInvoice=null;
function makeInvoiceNumber(){const d=new Date(),date=d.getFullYear().toString().slice(-2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');return 'MSC-'+date+'-'+String(Date.now()).slice(-5);}
function createInvoice(data){
  const items=cart.map(x=>{const p=findProduct(x.id);return p?{name:p.name,category:p.category,qty:toNumber(x.qty),price:p.price,total:p.price*toNumber(x.qty),image:p.image}:null;}).filter(Boolean);
  lastInvoice={number:makeInvoiceNumber(),date:new Date(),name:String(data.get('name')||''),mobile:String(data.get('mobile')||''),address:String(data.get('address')||''),pin:String(data.get('pin')||''),items,total:cartTotal(),subtotal:cartTotal(),discount:0,gst:getSettingsConfig().gst||'10BZYPB5853J1Z3'};
  renderInvoice();saveInvoiceDraft();saveOrderToHistory(lastInvoice); return lastInvoice;
}
function renderInvoice(){
  if(!lastInvoice)return;
  const x=lastInvoice;
  $('invoicePreview').innerHTML='<div class="invoice-paper" id="invoicePaper"><div class="invoice-head"><div><div class="invoice-brand">👑 Maharani Saree Collection</div><div class="invoice-sub">Derni Bazar, Saran, Bihar — 841222</div></div><div class="invoice-meta"><strong>RETAIL BILL</strong><span>Bill No. '+x.number+'</span><span>'+x.date.toLocaleString('en-IN')+'</span></div></div><div class="invoice-shop"><span>GST: '+x.gst+'</span><span>Mob: 9097900814</span></div><div class="invoice-customer"><strong>Customer Details</strong><div><span>Name: '+x.name+'</span><span>Mobile: '+x.mobile+'</span><span>PIN: '+x.pin+'</span></div><p>Address: '+x.address+'</p></div><table class="invoice-table"><thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>'+x.items.map(i=>'<tr><td>'+i.name+'<small>'+i.category+'</small></td><td>'+i.qty+'</td><td>'+money(i.price)+'</td><td>'+money(i.total)+'</td></tr>').join('')+'</tbody><tfoot><tr><th colspan="3">Subtotal</th><th>'+money(x.subtotal||x.total)+'</th></tr><tr><th colspan="3">Discount</th><th>- '+money(x.discount||0)+'</th></tr><tr><th colspan="3">Grand Total</th><th>'+money(x.total)+'</th></tr></tfoot></table><div class="invoice-note">धन्यवाद! कृपया सामान/उपलब्धता और अंतिम कीमत दुकान/WhatsApp पर कन्फर्म करें।</div><div class="invoice-footer">Maharani Saree Collection · आपकी पसंद, हमारी जिम्मेदारी!</div></div>';
}
function invoiceText(){
  if(!lastInvoice)return '';
  const x=lastInvoice;
  return '👑 Maharani Saree Collection\\n\\n🧾 Bill No: '+x.number+'\\nCustomer: '+x.name+'\\nMobile: '+x.mobile+'\\nAddress: '+x.address+'\\nPIN: '+x.pin+'\\n\\nItems:\\n'+x.items.map(i=>'• '+i.name+' × '+i.qty+' = '+money(i.total)).join('\\n')+'\\n\\n💰 Grand Total: '+money(x.total)+'\\n\\nGST: '+x.gst+'\\nThank you for shopping with Maharani Saree Collection!';
}
function printInvoice(){
  if(!lastInvoice)return;
  const paper=$('invoicePaper')?.outerHTML||'';
  const w=window.open('','_blank','width=800,height=900');
  if(!w){toast('Popup allow karke Print Bill dobara dabaiye');return;}
  w.document.write('<!doctype html><html><head><title>Maharani Bill '+lastInvoice.number+'</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;background:#eee;margin:0;padding:20px}.invoice-paper{max-width:760px;margin:auto;background:#fff;padding:28px;color:#211923}.invoice-head{display:flex;justify-content:space-between;border-bottom:2px solid #5d1738;padding-bottom:14px}.invoice-brand{font-size:24px;font-weight:800;color:#5d1738}.invoice-sub,.invoice-meta span,.invoice-customer,.invoice-note,.invoice-footer{font-size:12px;color:#555}.invoice-meta{text-align:right;display:grid;gap:4px}.invoice-meta strong{color:#5d1738}.invoice-shop{display:flex;justify-content:space-between;padding:10px 0;font-size:11px}.invoice-customer{border:1px solid #ddd;padding:12px;margin:10px 0}.invoice-customer div{display:flex;gap:25px;margin-top:8px}.invoice-customer p{margin:8px 0 0}.invoice-table{width:100%;border-collapse:collapse;font-size:12px}.invoice-table th,.invoice-table td{border-bottom:1px solid #ddd;padding:10px;text-align:left}.invoice-table th:nth-child(n+2),.invoice-table td:nth-child(n+2){text-align:right}.invoice-table small{display:block;color:#777}.invoice-note{margin-top:18px}.invoice-footer{text-align:center;margin-top:28px;border-top:1px solid #ddd;padding-top:12px}@media print{body{background:#fff;padding:0}.invoice-paper{max-width:none}}</style></head><body>'+paper+'<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}</script></body></html>');
  w.document.close();
}
async function shareInvoiceImage(){
  if(!lastInvoice)return;
  const paper=$('invoicePaper');if(!paper)return;
  if(!window.html2canvas){const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';s.onload=()=>shareInvoiceImage();s.onerror=()=>toast('Bill photo tool load नहीं हुआ');document.head.appendChild(s);return;}
  try{
    toast('Bill photo तैयार हो रहा है…');
    const canvas=await window.html2canvas(paper,{scale:2,backgroundColor:'#ffffff',useCORS:true});
    const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
    const file=new File([blob],'Maharani-Bill-'+lastInvoice.number+'.png',{type:'image/png'});
    if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:'Maharani Saree Collection Bill',text:'Bill '+lastInvoice.number,files:[file]});}
    else{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Bill photo download हो गई ✓');}
  }catch(e){if(e?.name!=='AbortError')toast('Bill photo share नहीं हो पाया');}
}
async function saveOrderToServer(inv){
  try{
    const client=await getSupabaseClient();
    const payload={bill_no:inv.number,customer_name:inv.name||'',mobile:inv.mobile||'',address:inv.address||'',pin:inv.pin||'',items:inv.items||[],subtotal:Number(inv.subtotal||0),discount:Number(inv.discount||0),total:Number(inv.total||0),status:'Pending',gst:inv.gst||'10BZYPB5853J1Z3'};
    // Public checkout is allowed to INSERT orders, but anon is intentionally not
    // allowed to SELECT all orders. Do not use upsert(...).select() here:
    // that would require a SELECT RLS policy and makes checkout fail on other devices.
    const {error}=await client.from('Orders').insert(payload);
    if(error)throw error;
    inv.serverError='';
    saveInvoiceDraft();
    return inv;
  }catch(e){
    console.error('Order save failed:',e);
    inv.serverError=String(e?.message||e);
    saveOrderToHistory(inv);
    return null;
  }
}
function saveOrderToHistory(inv){
  try{
    const key='maharani-orders';const list=JSON.parse(localStorage.getItem(key)||'[]');
    const clean={...inv,date:inv.date instanceof Date?inv.date.toISOString():inv.date};
    localStorage.setItem(key,JSON.stringify([clean,...list.filter(o=>o.number!==clean.number)].slice(0,100)));
  }catch(e){}
}
async function loadOrderHistory(){
  try{
    const client=await getSupabaseClient();
    const {data,error}=await client.from('Orders').select('*').order('created_at',{ascending:false}).limit(100);
    if(error)throw error;
    const list=(data||[]).map(o=>({id:o.id,number:o.bill_no,name:o.customer_name,mobile:o.mobile,address:o.address,pin:o.pin,items:Array.isArray(o.items)?o.items:[],subtotal:Number(o.subtotal||0),discount:Number(o.discount||0),total:Number(o.total||0),gst:o.gst||'10BZYPB5853J1Z3',status:o.status||'Pending',date:new Date(o.created_at)}));
    localStorage.setItem('maharani-orders',JSON.stringify(list.map(o=>({...o,date:o.date.toISOString()}))));
    window.__MAHARANI_ORDERS_ERROR='';
    return list;
  }catch(e){
    console.error('Orders load failed:',e);
    window.__MAHARANI_ORDERS_ERROR=String(e?.message||e);
    try{return JSON.parse(localStorage.getItem('maharani-orders')||'[]').map(o=>({...o,date:new Date(o.date)}));}catch(_){return [];}
  }
}
async function renderAdminOrders(){
  const box=$('ordersPanel');if(!box)return;
  box.hidden=false;
  box.innerHTML='<div class="admin-settings-card"><h3>🧾 Customer Orders / Bills</h3><p class="admin-muted">iPhone, Android और computer — सभी devices से orders लोड हो रहे हैं…</p></div>';
  const list=await loadOrderHistory();
  const serverError=window.__MAHARANI_ORDERS_ERROR||'';
  if(serverError){
    box.innerHTML='<div class="admin-settings-card"><h3>🧾 Customer Orders / Bills</h3><p class="admin-muted">Orders database से connect नहीं हो पाया।</p><p class="admin-error">Database message: '+serverError+'</p><p class="admin-help">Supabase में <b>orders-schema.sql</b> एक बार Run होने के बाद यही panel सभी devices के orders दिखाएगा।</p><button type="button" class="button button-dark" id="ordersRefreshBtn">↻ Refresh Orders</button></div>';
    const rb=$('ordersRefreshBtn');if(rb)rb.onclick=()=>renderAdminOrders();
    return;
  }
  if(!list.length){
    box.innerHTML='<div class="admin-settings-card"><h3>🧾 Customer Orders / Bills</h3><p class="admin-muted">अभी कोई online order नहीं आया है।</p><p class="admin-help">Order आने के बाद यह list iPhone, Android और computer सभी पर इसी जगह दिखेगी।</p><button type="button" class="button button-dark" id="ordersRefreshBtn">↻ Refresh Orders</button></div>';
    const rb=$('ordersRefreshBtn');if(rb)rb.onclick=()=>renderAdminOrders();
    return;
  }
  box.innerHTML='<div class="admin-settings-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><h3>🧾 Customer Orders / Bills</h3><p class="admin-muted">Total online orders: <b>'+list.length+'</b> · सभी devices पर same list</p></div><button type="button" class="button button-outline" id="ordersRefreshBtn">↻ Refresh</button></div>'+list.map((o,n)=>'<div class="admin-row"><div><strong>'+o.number+'</strong><small>👤 '+(o.name||'Customer')+' · 📞 '+(o.mobile||'-')+' · 💰 '+money(o.total)+'</small><small>📦 '+o.items.map(i=>i.name+' × '+i.qty).join(', ')+'</small><small>📌 Status: '+(o.status||'Pending')+' · '+new Date(o.date).toLocaleString('en-IN')+'</small></div><div class="admin-row-actions">'+(o.status==='Confirmed'?'<span class="admin-muted">✅ Confirmed</span>':'<button type="button" class="button button-dark" data-order-confirm="'+n+'">✅ Confirm Order</button>')+'<button type="button" class="button button-outline" data-order-view="'+n+'">Open</button><button type="button" class="button button-outline" data-order-print="'+n+'">🖨️ Print</button><button type="button" class="button button-danger" data-order-delete="'+n+'">🗑️ Delete</button></div></div>').join('')+'</div>';
  const refresh=$('ordersRefreshBtn');if(refresh)refresh.onclick=()=>renderAdminOrders();
  box.querySelectorAll('[data-order-confirm]').forEach(btn=>btn.onclick=async()=>{const o=list[Number(btn.dataset.orderConfirm)];if(!o)return;if(!confirm('इस order को Confirm करें?'))return;const {error}=await getSupabaseClient().then(client=>client.from('Orders').update({status:'Confirmed'}).eq('id',o.id));if(error){toast('Confirm failed: '+error.message);return;}toast('✅ Order Confirmed');renderAdminOrders();if(o.mobile){const msg='👑 MAHARANI SAREE COLLECTION\\n\\n✅ ORDER CONFIRMED\\n🧾 Order No: '+o.number+'\\n👤 Customer: '+o.name+'\\n💰 Total: '+money(o.total)+'\\n\\nAapka order confirm ho gaya hai. Dhanyavaad!';window.open('https://wa.me/'+String(o.mobile).replace(/\\D/g,'')+'?text='+encodeURIComponent(msg),'_blank','noopener');}});  box.querySelectorAll('[data-order-view]').forEach(btn=>btn.onclick=()=>{lastInvoice=list[Number(btn.dataset.orderView)];renderInvoice();openInvoice();});
  box.querySelectorAll('[data-order-print]').forEach(btn=>btn.onclick=()=>{lastInvoice=list[Number(btn.dataset.orderPrint)];renderInvoice();printInvoice();});
  box.querySelectorAll('[data-order-delete]').forEach(btn=>btn.onclick=async()=>{const o=list[Number(btn.dataset.orderDelete)];if(!o||!confirm('इस order/bill को delete करें?'))return;const {error}=await getSupabaseClient().then(client=>client.from('Orders').delete().eq('id',o.id));if(error){toast('Delete failed: '+error.message);return;}renderAdminOrders();toast('Order deleted ✓');});
}
function saveInvoiceDraft(){if(lastInvoice)localStorage.setItem('maharani-last-invoice',JSON.stringify(lastInvoice));}
function loadInvoiceDraft(){try{const x=JSON.parse(localStorage.getItem('maharani-last-invoice')||'null');if(x){x.date=new Date(x.date);lastInvoice=x;renderInvoice();}}catch(e){}}
function modifyInvoice(){
  if(!lastInvoice)return;
  const x=lastInvoice;
  const name=prompt('Customer name',x.name); if(name===null)return;
  const mobile=prompt('Mobile number',x.mobile); if(mobile===null)return;
  const address=prompt('Address',x.address); if(address===null)return;
  const pin=prompt('PIN code',x.pin); if(pin===null)return;
  x.name=name.trim();x.mobile=mobile.trim();x.address=address.trim();x.pin=pin.trim();
  const updated=[];
  for(const item of x.items){
    const qty=prompt('Quantity for '+item.name,item.qty); if(qty===null)return;
    const rate=prompt('Selling price for '+item.name,item.price); if(rate===null)return;
    const q=Math.max(1,toNumber(qty)), p=Math.max(0,toNumber(rate));
    updated.push({...item,qty:q,price:p,total:q*p});
  }
  x.items=updated;
  const discount=prompt('Discount amount (₹)',x.discount||0); if(discount===null)return;
  x.discount=Math.max(0,toNumber(discount));
  x.subtotal=x.items.reduce((sum,i)=>sum+Number(i.total||0),0);
  x.total=Math.max(0,x.subtotal-x.discount);
  saveInvoiceDraft();saveOrderToHistory(lastInvoice);if(x.id){getSupabaseClient().then(client=>client.from('Orders').update({customer_name:x.name,mobile:x.mobile,address:x.address,pin:x.pin,items:x.items,subtotal:x.subtotal,discount:x.discount,total:x.total}).eq('id',x.id));}else{saveOrderToServer(x);}renderInvoice();toast('Bill modified ✓');
}
function deleteInvoice(){
  if(!lastInvoice)return;
  if(confirm('इस Bill को delete करें?')){const id=lastInvoice.id;lastInvoice=null;localStorage.removeItem('maharani-last-invoice');$('invoicePreview').innerHTML='';$('invoiceDialog').close();if(id)getSupabaseClient().then(client=>client.from('Orders').delete().eq('id',id));toast('Bill deleted ✓');}
}
function openInvoice(){if(!lastInvoice)return;$('invoiceDialog').showModal();}


function loadSupabaseClient(){
  return new Promise((resolve,reject)=>{
    if(supabaseClient)return resolve(supabaseClient);
    const finish=()=>{
      try{
        const api=window.supabase;
        if(!api?.createClient)throw new Error('Supabase library load नहीं हुई');
        supabaseClient=api.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
        resolve(supabaseClient);
      }catch(e){reject(e);}
    };
    if(window.supabase?.createClient){finish();return;}
    const s=document.createElement('script');
    s.src='https://unpkg.com/@supabase/supabase-js@2';
    s.async=true;s.onload=finish;s.onerror=()=>reject(new Error('Supabase library load नहीं हो सकी'));
    document.head.appendChild(s);
  });
}
function injectAdmin(){
  if($('adminPanel'))return;
  const panel=document.createElement('section');panel.id='adminPanel';panel.className='admin-panel';panel.hidden=true;
  panel.innerHTML='<div class="admin-inner"><div class="admin-head"><div><p class="eyebrow">MAHARANI ADMIN</p><h2>Product Manager</h2><p class="admin-muted">Add, edit or delete products and upload multiple photos.</p></div><button class="admin-close" id="adminClose">×</button></div><div id="adminLogin"><div class="admin-box"><h3>Admin login</h3><label>Email<input id="adminEmail" type="email" autocomplete="username" placeholder="Admin email"></label><label>Password<input id="adminPassword" type="password" autocomplete="current-password" placeholder="Password"></label><button class="button button-dark" id="adminLoginBtn">Login</button><button class="button button-outline" type="button" id="adminForgotBtn">Forgot password?</button><p class="admin-msg" id="adminLoginMsg"></p></div></div><div id="adminApp" hidden><div id="siteSettings" class="admin-settings" hidden></div><div id="ordersPanel" class="admin-settings" hidden></div><div class="admin-toolbar"><button class="button button-dark" id="newProductBtn">+ Add product</button><button class="button button-outline" id="ordersBtn">🧾 Orders / Bills</button><button class="button button-outline" type="button" id="siteSettingsBtn">⚙ Site / Offer Settings</button><button class="button button-outline" id="adminLogoutBtn">Logout</button></div><form class="admin-box" id="productForm"><input type="hidden" id="adminId"><div class="admin-two"><label>Product name<input id="adminName" required placeholder="Saree"></label><label>Category<select id="adminCategory"><option>Saree</option><option>Lehnga</option><option>Suit</option><option>Kurti</option><option>Palazo</option><option>Leggings</option><option>Straight Pant</option><option>Kids</option><option>Jeans</option><option>Shorts</option><option>T-Shirt</option><option>Undergarments</option><option>Other</option><option value="__NEW_CATEGORY__">＋ New category...</option></select></label></div><div class="admin-two"><label>Selling price<input id="adminPrice" type="number" min="0" required placeholder="888"></label><label>MRP<input id="adminMrp" type="number" min="0" placeholder="1299"></label></div><label>Description<textarea id="adminDescription" rows="3" placeholder="Product details"></textarea><label>Photos <input id="adminPhotos" type="file" accept="image/*" multiple></label><p class="admin-help">You can select several photos for one product. The first photo becomes the main photo.</p><div id="adminPreview" class="admin-preview"></div><div class="admin-actions"><button class="button button-dark" type="submit" id="adminSaveBtn">Save product</button><button class="button button-outline" type="button" id="adminCancelBtn">Cancel</button></div><p class="admin-msg" id="adminFormMsg"></p></form><div class="admin-list" id="adminList"></div></div></div>';
  document.body.appendChild(panel);
  setupAdminCategorySelect();
  $('siteSettings').hidden=true;
  const ordersBtn=$('ordersBtn');if(ordersBtn)ordersBtn.onclick=()=>renderAdminOrders();
  const settingsBtn=$('siteSettingsBtn');
  if(settingsBtn) settingsBtn.onclick=()=>{$('siteSettings').hidden=!$('siteSettings').hidden;if(!$('siteSettings').hidden)injectSiteSettings();};
  $('ordersBtn').onclick=()=>renderAdminOrders();$('adminClose').onclick=closeAdmin;$('adminForgotBtn').onclick=adminForgotPassword;$('newProductBtn').onclick=()=>resetAdminForm();$('adminCancelBtn').onclick=()=>resetAdminForm();$('adminLoginBtn').onclick=adminLogin;$('adminLogoutBtn').onclick=adminLogout;$('productForm').onsubmit=saveAdminProduct;$('adminPhotos').onchange=previewAdminPhotos;
}
function openAdmin(){injectAdmin();$('adminPanel').hidden=false;document.body.classList.add('admin-open');loadSupabaseClient().then(refreshAdminSession).catch(e=>{$('adminLoginMsg').textContent='Could not load admin login: '+e.message;});}
function closeAdmin(){if($('adminPanel'))$('adminPanel').hidden=true;document.body.classList.remove('admin-open');history.replaceState(null,'',SITE_URL);}

function injectPasswordReset(){
  if($('passwordResetPanel'))return;
  const panel=document.createElement('section');panel.id='passwordResetPanel';panel.className='admin-panel';panel.innerHTML='<div class="admin-inner"><div class="admin-head"><div><p class="eyebrow">MAHARANI ADMIN</p><h2>Set new password</h2><p class="admin-muted">Choose a new password for your Admin account.</p></div></div><div class="admin-box"><label>New password<input id="resetPassword" type="password" autocomplete="new-password" minlength="6" placeholder="New password"></label><label>Confirm password<input id="resetPassword2" type="password" autocomplete="new-password" minlength="6" placeholder="Confirm password"></label><button class="button button-dark" id="resetPasswordBtn">Update password</button><p class="admin-msg" id="resetPasswordMsg"></p></div></div>';
  document.body.appendChild(panel);
  $('resetPasswordBtn').onclick=async()=>{
    const msg=$('resetPasswordMsg'),a=$('resetPassword').value,b=$('resetPassword2').value;
    if(a.length<6){msg.textContent='Password must be at least 6 characters.';return;}
    if(a!==b){msg.textContent='Passwords do not match.';return;}
    msg.textContent='Updating password…';
    const {error}=await (await getSupabaseClient()).auth.updateUser({password:a});
    if(error){msg.textContent=error.message;return;}
    msg.textContent='Password updated successfully ✓';
    setTimeout(()=>{panel.remove();location.hash='admin';},900);
  };
}
async function maybePasswordRecovery(){
  const recovery=/type=recovery/i.test(location.href)||/access_token=/i.test(location.hash)||/code=/i.test(location.search);
  if(!recovery)return false;
  const client=await getSupabaseClient();
  if(new URLSearchParams(location.search).get('code')){
    const {error}=await client.auth.exchangeCodeForSession(new URLSearchParams(location.search).get('code'));
    if(error)console.error(error);
  }
  let session=null;
  for(let i=0;i<20;i++){const {data}=await client.auth.getSession();session=data?.session||null;if(session)break;await new Promise(r=>setTimeout(r,300));}
  if(session){injectPasswordReset();$('passwordResetPanel').hidden=false;document.body.classList.add('admin-open');return true;}
  return false;
}
async function refreshAdminSession(){
  const client=await getSupabaseClient();
  const {data}=await client.auth.getSession();if(data.session)showAdminApp();else{$('adminLogin').hidden=false;$('adminApp').hidden=true;}
}
async function adminLogin(){
  const msg=$('adminLoginMsg'),email=$('adminEmail').value.trim(),password=$('adminPassword').value;
  if(!email||!password){msg.textContent='Email और password भरिए।';return;}
  msg.textContent='Connecting…';
  try{const client=await getSupabaseClient();msg.textContent='Logging in…';
    const result=await Promise.race([client.auth.signInWithPassword({email,password}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Login request timed out.')),15000))]);
    if(result.error){msg.textContent='Login failed: '+result.error.message;return;} msg.textContent='Login successful ✓';showAdminApp();
  }catch(error){msg.textContent='Login failed: '+(error.message||error);}
}
async function adminForgotPassword(){
  const msg=$('adminLoginMsg'),email=$('adminEmail').value.trim();
  if(!email){msg.textContent='पहले Admin email भरिए।';return;}
  msg.textContent='Reset link भेजा जा रहा है…';
  try{const client=await getSupabaseClient();const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:SITE_URL});if(error){msg.textContent='Reset failed: '+error.message;return;}msg.textContent='Reset link email पर भेज दिया गया ✓';}
  catch(error){msg.textContent='Reset failed: '+(error.message||error);}
}
async function adminLogout(){const client=await getSupabaseClient();await client.auth.signOut();$('adminLogin').hidden=false;$('adminApp').hidden=true;resetAdminForm();}
function showAdminApp(){$('adminLogin').hidden=true;$('adminApp').hidden=false;resetAdminForm();injectSiteSettings();refreshAdminList();}
function setupAdminCategorySelect(){
  const select=$('adminCategory');
  if(!select)return;
  const base=['Saree','Lehnga','Suit','Kurti','Palazo','Leggings','Straight Pant','Kids','Jeans','Shorts','T-Shirt','Undergarments','Other'];
  const saved=[...new Set(customAdminCategories.filter(Boolean))];
  select.innerHTML=base.concat(saved.filter(x=>!base.includes(x))).map(x=>'<option value="'+x+'">'+x+'</option>').join('')+'<option value="__NEW_CATEGORY__">＋ New category...</option>';
  select.onchange=()=>{
    if(select.value!=='__NEW_CATEGORY__')return;
    const name=prompt('New category ka naam likhiye:');
    const clean=(name||'').trim();
    if(!clean){select.value=base[0];return;}
    if(!customAdminCategories.includes(clean)){
      customAdminCategories.push(clean);
      localStorage.setItem('maharani-custom-categories',JSON.stringify(customAdminCategories));
    }
    setupAdminCategorySelect();
    select.value=clean;
  };
}
function resetAdminForm(){
  $('productForm').reset();setupAdminCategorySelect();$('adminId').value='';$('adminPreview').innerHTML='';$('adminFormMsg').textContent='';$('adminSaveBtn').textContent='Save product';
}
function previewAdminPhotos(){
  const box=$('adminPreview');box.innerHTML='';
  [...$('adminPhotos').files].forEach(file=>{const img=document.createElement('img');img.alt=file.name;img.src=URL.createObjectURL(file);box.appendChild(img);});
}
function storagePath(file){const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');return 'products/'+crypto.randomUUID()+'.'+(ext||'jpg');}
async function uploadAdminPhotos(files){
  const urls=[];
  for(const file of files){
    const path=storagePath(file);
    const {error}=await (await getSupabaseClient()).storage.from(STORAGE_BUCKET).upload(path,file,{upsert:false,contentType:file.type||'image/jpeg'});
    if(error)throw error;
    const {data}=(await getSupabaseClient()).storage.from(STORAGE_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}
async function saveAdminProduct(e){
  e.preventDefault();const msg=$('adminFormMsg'),save=$('adminSaveBtn');save.disabled=true;msg.textContent='Saving…';
  try{
    const id=$('adminId').value,name=$('adminName').value.trim(),category=$('adminCategory').value,price=toNumber($('adminPrice').value),mrp=toNumber($('adminMrp').value),description=$('adminDescription').value.trim(),files=[...$('adminPhotos').files];
    let existing=null;
    if(id) existing=adminProducts.find(p=>String(p.id)===String(id));
    let image=existing?.image||'', images=existing?.images||[];
    if(files.length){const uploaded=await uploadAdminPhotos(files);images=[...images,...uploaded];image=images[0];}
    if(!image)image=FALLBACK_IMAGE;
    const payload={Name:name,Category:category,Price:price,Mrp:mrp,Image:image,images:JSON.stringify(images),Description:description};
    let result;
    const client=await getSupabaseClient();
    if(id) result=await client.from('Products').update(payload).eq('id',id).select().single();
    else result=await client.from('Products').insert(payload).select().single();
    if(result.error)throw result.error;
    msg.textContent='Product saved successfully ✓';await refreshAdminList();await loadProducts();rebuildCategories();renderCategoryFilter();renderCategories();renderProducts();setTimeout(resetAdminForm,600);
  }catch(error){console.error(error);msg.textContent='Save failed: '+(error.message||error);}
  finally{save.disabled=false;}
}
async function refreshAdminList(){
  const client=await getSupabaseClient();
  const {data,error}=await client.from('Products').select('*').order('id',{ascending:false});
  if(error){$('adminList').innerHTML='<div class="admin-box admin-error">'+error.message+'</div>';return;}
  adminProducts=data.map(normalizeProduct);
  $('adminList').innerHTML=adminProducts.map(p=>'<div class="admin-row"><img src="'+p.image+'" alt=""><div><strong>'+p.name+'</strong><small>'+p.category+' · '+money(p.price)+'</small></div><div class="admin-row-actions"><button type="button" class="button button-outline" data-edit="'+p.id+'">Edit</button><button type="button" class="button button-danger" data-delete="'+p.id+'">Delete</button></div></div>').join('');
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();editAdminProduct(b.dataset.edit);});
  document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteAdminProduct(b.dataset.delete));
}
function editAdminProduct(id){
  const p=adminProducts.find(x=>String(x.id)===String(id));
  if(!p)return;
  const select=$('adminCategory');
  if(![...select.options].some(o=>o.value===p.category)){
    const opt=document.createElement('option');opt.value=p.category;opt.textContent=p.category;select.insertBefore(opt,select.lastElementChild);
  }
  $('adminId').value=p.id;
  $('adminName').value=p.name;
  select.value=p.category;
  $('adminPrice').value=p.price;
  $('adminMrp').value=p.mrp;
  $('adminDescription').value=p.description||'';
  $('adminPreview').innerHTML=(p.images||[]).map(src=>'<img src="'+src+'" alt="">').join('');
  $('adminFormMsg').textContent='Existing photos kept. Select new photos to add more.';
  $('adminSaveBtn').textContent='Update product';
  $('productForm').scrollIntoView({behavior:'smooth',block:'start'});
}
async function deleteAdminProduct(id){
  if(!confirm('Delete this product?'))return;
  const client=await getSupabaseClient();
  const {error}=await client.from('Products').delete().eq('id',id);if(error){toast('Delete failed: '+error.message);return;}
  await refreshAdminList();await loadProducts();rebuildCategories();renderCategoryFilter();renderCategories();renderProducts();toast('Product deleted');
}
function maybeAdminHash(){if(location.hash.toLowerCase()==='#admin'){openAdmin();}}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('a[href="#admin"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openAdmin();}));
});
async function init(){
  const isRecovery=await maybePasswordRecovery();
  if(isRecovery)return;
  initOfferNotification();
  await loadProducts();rebuildCategories();renderCategoryFilter();$('qrImage').src='https://api.qrserver.com/v1/create-qr-code/?size=360x360&data='+encodeURIComponent(SITE_URL);$('siteUrl').textContent=SITE_URL;renderCategories();renderProducts();renderCart();
  $('searchInput').oninput=renderProducts;$('categoryFilter').onchange=renderProducts;$('cartOpen').onclick=openDrawer;$('cartClose').onclick=closeDrawer;$('drawerOverlay').onclick=closeDrawer;$('checkoutOpen').onclick=openCheckout;$('dialogClose').onclick=()=>$('productDialog').close();$('checkoutClose').onclick=()=>$('checkoutDialog').close();$('invoiceClose').onclick=()=>$('invoiceDialog').close();$('invoicePrint').onclick=printInvoice;$('invoiceShare').onclick=shareInvoiceImage;$('invoiceModify').onclick=modifyInvoice;$('invoiceDelete').onclick=deleteInvoice;$('invoiceWhatsapp').onclick=()=>{if(lastInvoice)window.open('https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent(invoiceText()),'_blank','noopener');};
  $('orderForm').onsubmit=async e=>{e.preventDefault();const data=new FormData(e.target);const inv=createInvoice(data);const saved=await saveOrderToServer(inv);if(!saved){toast('❌ Order database में save नहीं हुआ: '+(inv.serverError||'unknown error'));return;}lastInvoice=saved;saveOrderToHistory(saved);const message='👑 MAHARANI SAREE COLLECTION\\n\\n🛒 NEW ORDER\\n🧾 Order No: '+inv.number+'\\n\\n1️⃣ नाम: '+inv.name+'\\n2️⃣ मोबाइल: '+inv.mobile+'\\n3️⃣ पता: '+inv.address+'\\n4️⃣ PIN: '+inv.pin+'\\n\\n5️⃣ सामान: '+inv.items.map(i=>i.name+' ('+i.category+')').join(', ')+'\\n6️⃣ Qty: '+inv.items.reduce((s,i)=>s+Number(i.qty||0),0)+'\\n7️⃣ रेट: '+inv.items.map(i=>money(i.price)).join(', ')+'\\n8️⃣ कुल: '+money(inv.total);$('checkoutDialog').close();cart=[];saveCart();renderCart();toast('✅ Order database में save हो गया');window.open('https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent(message),'_blank','noopener');};
  window.addEventListener('hashchange',maybeAdminHash);maybeAdminHash();
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();if($('productDialog').open)$('productDialog').close();if($('checkoutDialog').open)$('checkoutDialog').close();}});
}
init()