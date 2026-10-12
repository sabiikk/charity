(()=>{
const h=document.querySelector('body>header');if(!h)return;
const root=document.documentElement;
const size=()=>root.style.setProperty('--hh',Math.round(h.getBoundingClientRect().height)+'px');
let ticking=false;
/* green header once scrolled: swap to the white-text logo (preloaded so the swap is instant) */
const logo=h.querySelector('img.logo'),logoSrc=logo&&logo.getAttribute('src'),logoW=logoSrc&&logoSrc.replace(/logo\.svg$/,'logo-white.svg');
if(logoW&&logoW!==logoSrc)new Image().src=logoW;
const onScroll=()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const s=scrollY>40;if(s!==h.classList.contains('is-scrolled')){h.classList.toggle('is-scrolled',s);if(logoW&&logoW!==logoSrc)logo.src=s?logoW:logoSrc}ticking=false})};
addEventListener('scroll',onScroll,{passive:true});
/* keep --hh in sync while the header animates between its two heights */
h.addEventListener('transitionend',e=>{if(e.propertyName==='height')size()});
addEventListener('resize',size);addEventListener('load',size);
size();onScroll();
})();
