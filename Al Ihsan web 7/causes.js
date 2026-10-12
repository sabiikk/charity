(()=>{
const host=document.querySelector('#category-host');if(!host)return;
const chev=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="'+d+'"/></svg>';
const enhance=()=>{
  const grid=host.querySelector('.cause-grid');if(!grid||grid.dataset.enh)return;grid.dataset.enh='1';
  grid.querySelectorAll('.cause-card').forEach(c=>{
    const ic=c.querySelector('.cause-icon');if(!ic)return;
    const blob=document.createElement('span');blob.className='cause-blob';
    blob.innerHTML='<i class="cause-leaf l"></i><i class="cause-leaf r"></i>';
    c.insertBefore(blob,ic);blob.appendChild(ic);
    const go=document.createElement('span');go.className='cause-go';go.setAttribute('aria-hidden','true');go.innerHTML='<i>→</i><b></b>';c.appendChild(go);
  });
  const wrap=document.createElement('div');wrap.className='cause-wrap';
  grid.parentNode.insertBefore(wrap,grid);wrap.appendChild(grid);
  const mk=(cls,label,d)=>{const b=document.createElement('button');b.type='button';b.className='cause-nav '+cls;b.setAttribute('aria-label',label);b.innerHTML=chev(d);wrap.appendChild(b);return b};
  const prev=mk('prev','Previous','m15 5-7 7 7 7'),next=mk('next','Next','m9 5 7 7-7 7');
  const rtl=()=>document.documentElement.dir==='rtl';
  const step=()=>{const c=grid.querySelector('.cause-card');return(c?c.getBoundingClientRect().width:260)+26};
  const upd=()=>{const max=grid.scrollWidth-grid.clientWidth,x=Math.abs(grid.scrollLeft);const s=x<6,e=x>max-6;prev.disabled=rtl()?e:s;next.disabled=rtl()?s:e};
  prev.addEventListener('click',()=>grid.scrollBy({left:(rtl()?1:-1)*step()*2}));
  next.addEventListener('click',()=>grid.scrollBy({left:(rtl()?-1:1)*step()*2}));
  grid.addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);setTimeout(upd,60);upd();
};
enhance();
new MutationObserver(enhance).observe(host,{childList:true});
})();
