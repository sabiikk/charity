const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
/* indicative 24k price (AED/gram); other karats derive from it — editable by the visitor */
const BASE24=595.45,NISAB_G=85,RATE=.025;
const rtl=()=>document.documentElement.lang==='ar';
const fmt=v=>v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const price=$('#zk-price'),gold=$('#zk-gold'),goldR=$('#zk-gold-r'),wealth=$('#zk-wealth'),wealthR=$('#zk-wealth-r');
const num=el=>Math.max(0,parseFloat(el.value)||0);
const karat=()=>+($('input[name=karat]:checked').value);
const setPrice=()=>{price.value=(BASE24*karat()/24).toFixed(2)};
const render=()=>{
  const g=num(gold),w=num(wealth),p=num(price),gv=g*p,total=gv+w,z=total*RATE,nis=NISAB_G*BASE24;
  $('#zk-out').textContent=fmt(z);
  const cur=rtl()?'درهم ':'AED ';
  $('#zk-b-gold').textContent=cur+fmt(gv);$('#zk-b-wealth').textContent=cur+fmt(w);$('#zk-b-total').textContent=cur+fmt(total);
  const ok=total>=nis,box=$('#zk-nisab');box.classList.toggle('low',!ok);
  $('#zk-nisab-t').textContent=ok
    ?(rtl()?'بلغ مالك النصاب، فالزكاة واجبة عليك.':'Your wealth reaches the nisab — Zakat is due.')
    :(rtl()?`أقل من النصاب (≈ ${fmt(nis)} درهم). الزكاة غير واجبة، ويمكنك التصدق بما شئت.`:`Below the nisab (≈ AED ${fmt(nis)}). Zakat is not obligatory, but you can still give as Sadaqah.`);
  const pay=$('#zk-pay'),amt=Math.ceil(z);pay.href='Direct%20Donation.html?amount='+amt+'&zakat=1';pay.classList.toggle('off',z<=0);
};
const sync=(n,r,max)=>{r.addEventListener('input',()=>{n.value=r.value;render()});n.addEventListener('input',()=>{r.value=Math.min(max,num(n));render()})};
sync(gold,goldR,10000);sync(wealth,wealthR,1000000);
$$('input[name=karat]').forEach(k=>k.addEventListener('change',()=>{setPrice();render()}));
price.addEventListener('input',render);
setPrice();render();
/* language + mobile menu (same pattern as the other pages) */
$$('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
$('#language').addEventListener('click',e=>{const ar=document.documentElement.lang!=='ar';document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';$$('[data-ar]').forEach(x=>x.innerHTML=x.dataset[ar?'ar':'en']);e.target.textContent=ar?'English':'العربية';e.target.lang=ar?'en':'ar';render()});
const menu=$('.menu');menu.addEventListener('click',()=>{const o=$('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
