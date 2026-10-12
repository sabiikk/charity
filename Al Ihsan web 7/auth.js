/* Login / Create account popup — one dialog with two tabs, shared by every page */
(()=>{
const ar=()=>document.documentElement.lang==='ar';
const t=(e,a)=>ar()?a:e;
const L=(en,a)=>`<span data-en="${en}" data-ar="${a}">${en}</span>`;
const field=(name,en,a,type='text',auto='off')=>`<label class="au2-f"><span class="au2-l" data-en="${en}" data-ar="${a}">${en}</span><input name="${name}" type="${type}" autocomplete="${auto}" required></label>`;
/* UAE PASS fingerprint mark (assets/uaepass-mark.png) */
const UAEPASS_MARK='<img class="au2-uae-mark" src="assets/uaepass-mark.png" alt="" width="26" height="27">';
const html=`<dialog id="login-modal" class="au2" aria-labelledby="au2-title">
<button class="au2-x" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
<figure class="au2-media"><img src="assets/community.jpg" alt="" aria-hidden="true"><figcaption><img class="au2-logo" src="assets/logo.svg" alt=""><p data-en="Donation, sponsorship and giving — all in one place." data-ar="التبرع والكفالة والعطاء — كلها في مكان واحد.">Donation, sponsorship and giving — all in one place.</p></figcaption></figure>
<div class="au2-body"><div class="au2-in">
<div class="au2-tabs" role="tablist"><span class="au2-thumb" aria-hidden="true"></span><button type="button" role="tab" data-tab="login" aria-selected="true">${L('Log in','تسجيل الدخول')}</button><button type="button" role="tab" data-tab="signup" aria-selected="false">${L('Create account','إنشاء حساب')}</button></div>
<form class="au2-pane" data-pane="login" novalidate>
<h2 id="au2-title" data-en="Welcome back" data-ar="مرحباً بعودتك">Welcome back</h2>
${field('mobile','Mobile number','رقم الهاتف','tel','tel')}
<p class="au2-err" role="alert" hidden></p>
<button class="au2-btn" type="submit">${L('Get OTP','الحصول على رمز التحقق')}</button>
<div class="au2-or">${L('or','أو')}</div>
<button class="au2-uae" type="button">${UAEPASS_MARK}<span>${L('Sign in with UAE PASS','تسجيل الدخول بالهوية الرقمية')}</span></button>
<p class="au2-ok" role="status" hidden></p>
</form>
<form class="au2-pane" data-pane="signup" novalidate hidden>
<h2 data-en="Create your account" data-ar="أنشئ حسابك">Create your account</h2>
${field('fullname','Full name','الاسم الكامل','text','name')}
${field('mobile','Mobile number','رقم الهاتف','tel','tel')}
${field('pw','Password','كلمة المرور','password','new-password')}
<p class="au2-err" role="alert" hidden></p>
<button class="au2-btn" type="submit">${L('Create account','إنشاء حساب')}</button>
<div class="au2-or">${L('or','أو')}</div>
<button class="au2-uae" type="button">${UAEPASS_MARK}<span>${L('Sign in with UAE PASS','تسجيل الدخول بالهوية الرقمية')}</span></button>
<p class="au2-ok" role="status" hidden></p>
</form>
</div></div></dialog>`;
/* replace any older login / sign-up dialogs (the home page ships its own) */
document.querySelectorAll('#login-modal,#signup-modal').forEach(d=>d.remove());
document.body.insertAdjacentHTML('beforeend',html);
const dlg=document.querySelector('#login-modal');
const tabs=[...dlg.querySelectorAll('[data-tab]')],panes=[...dlg.querySelectorAll('[data-pane]')];
const show=name=>{tabs.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===name)));panes.forEach(p=>p.hidden=p.dataset.pane!==name);dlg.dataset.tab=name;
  panes.forEach(p=>{p.querySelector('.au2-err').hidden=true;p.querySelectorAll('.au2-f').forEach(x=>x.classList.remove('bad'))})};
const open=(name='login')=>{show(name);if(!dlg.open)dlg.showModal()};
window.IhsanAuth={open};
tabs.forEach(b=>b.addEventListener('click',()=>show(b.dataset.tab)));
dlg.querySelector('.au2-x').addEventListener('click',()=>dlg.close());
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
/* header login button: swap for a clean copy so older handlers no longer fire */
const tg=document.querySelector('#login-toggle');
if(tg){const c=tg.cloneNode(true);tg.replaceWith(c);c.addEventListener('click',()=>open('login'))}
document.addEventListener('click',e=>{const s=e.target.closest('[data-signup],[data-open-signup]');if(s){e.preventDefault();open('signup')}});
/* validation (design preview: nothing is sent) */
const ok=(form,msg)=>{const o=form.querySelector('.au2-ok');o.textContent=msg;o.hidden=false;setTimeout(()=>{o.hidden=true;form.reset();dlg.close()},1800)};
const req=(form,names,extra)=>{const el=form.elements,err=form.querySelector('.au2-err');form.querySelectorAll('.au2-f').forEach(x=>x.classList.remove('bad'));
  const bad=names.filter(k=>!el[k].value.trim());bad.forEach(k=>el[k].closest('.au2-f').classList.add('bad'));
  const m=bad.length?t('Please fill in the required fields.','يرجى تعبئة الحقول المطلوبة.'):(extra&&extra(el))||'';
  err.textContent=m;err.hidden=!m;return!m};
const [lf,sf]=panes;
[lf,sf].forEach(f=>{f.mobile.setAttribute('inputmode','tel');f.mobile.setAttribute('maxlength','13')});
lf.addEventListener('submit',e=>{e.preventDefault();if(req(lf,['mobile'],el=>{const n=el.mobile.value.replace(/[\s-]/g,'');
  if(!/^05\d{8}$/.test(n)){el.mobile.closest('.au2-f').classList.add('bad');return t('Please enter a valid UAE mobile number (05X XXX XXXX).','يرجى إدخال رقم هاتف إماراتي صحيح (05X XXX XXXX).')}}))
  ok(lf,t('Design preview · no OTP was sent to ','نموذج تصميم · لم يتم إرسال رمز التحقق إلى ')+lf.mobile.value.replace(/[\s-]/g,''))});
sf.addEventListener('submit',e=>{e.preventDefault();if(req(sf,['fullname','mobile','pw'],el=>{
  if(!/^05\d{8}$/.test(el.mobile.value.replace(/[\s-]/g,''))){el.mobile.closest('.au2-f').classList.add('bad');return t('Please enter a valid UAE mobile number (05X XXX XXXX).','يرجى إدخال رقم هاتف إماراتي صحيح (05X XXX XXXX).')}
  if(el.pw.value.length<8){el.pw.closest('.au2-f').classList.add('bad');return t('Password must be at least 8 characters.','يجب ألا تقل كلمة المرور عن 8 أحرف.')}}))
  ok(sf,t('Design preview · accounts are not created here.','نموذج تصميم · لا يتم إنشاء حسابات هنا.'))});
dlg.querySelectorAll('.au2-uae').forEach(b=>b.addEventListener('click',()=>{const o=b.closest('form').querySelector('.au2-ok');o.textContent=t('Design preview · UAE PASS is not connected here.','نموذج تصميم · الدخول عبر الهوية الرقمية غير مفعّل هنا.');o.hidden=false;setTimeout(()=>o.hidden=true,2500)}));
/* language */
const lang=()=>dlg.querySelectorAll('[data-en]').forEach(x=>x.textContent=x.dataset[ar()?'ar':'en']);
new MutationObserver(lang).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});lang();
})();
