(() => {
  const host = document.querySelector('#community');
  if (!host || document.querySelector('#media-highlights')) return;

  const archive = [
    { year: 2024, entries: [
      { type: 'Images', title: 'Zayed Humanitarian Day', ar: 'يوم زايد للعمل الإنساني', image: 'media-zayed.jpg', url: 'https://alihsan.ae/ar/media/media-center-detail/74' },
      { type: 'News', title: 'Al Ihsan recognised in Ajman’s summer programme', ar: 'تكريم الإحسان ضمن برنامج عجمان الصيفي', image: 'media-award.jpg', url: 'https://alihsan.ae/ar/media/media-center-detail/74' },
      { type: 'Community', title: 'Ramadan Aman: nine years of shared care', ar: 'رمضان أمان: تسعة أعوام من العطاء المشترك', image: 'food.jpg', url: 'https://alihsan.ae/ar/media/media-center-detail/74' }
    ] },
    { year: 2023, entries: [
      { type: 'Partnership', title: 'A collaboration with Hyundai', ar: 'تعاون مع هيونداي', image: 'media-food.jpg', url: 'https://alihsan.ae/ar/media/media-center-detail/58' },
      { type: 'Volunteering', title: 'Meeting the next generation of volunteers', ar: 'لقاء الجيل القادم من المتطوعين', image: 'volunteers.jpg', url: 'https://alihsan.ae/ar/media/media-center-detail/58' },
      { type: 'Community', title: 'Bridges of good for families in need', ar: 'جسور الخير للأسر المحتاجة', image: 'gaza.jpg', url: 'https://alihsan.ae/ar/media/media-center-detail/60' }
    ] },
    { year: 2022, entries: [
      { type: 'Recognition', title: 'A commitment to quality and care', ar: 'التزام بالجودة والرعاية', image: 'news.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Campaign', title: 'Summer support, made possible together', ar: 'دعم صيفي يصنعه تعاوننا', image: 'care.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Community', title: 'Essential care for more families', ar: 'رعاية أساسية لمزيد من الأسر', image: 'community.jpg', url: 'https://alihsan.ae/ar/media/media-center' }
    ] },
    { year: 2021, entries: [
      { type: 'Giving', title: '25,000 people reached through Adahi', ar: 'وصول الأضاحي إلى ٢٥ ألف مستفيد', image: 'food.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Video', title: 'Ramadan’s Meer: a season of generosity', ar: 'مير رمضان: موسم من العطاء', image: 'volunteers.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Community', title: 'Small acts with a lasting impact', ar: 'خطوات بسيطة وأثر يدوم', image: 'community.jpg', url: 'https://alihsan.ae/ar/media/media-center' }
    ] },
    { year: 2020, entries: [
      { type: 'Food support', title: 'More than 2,000 meals shared with families', ar: 'توزيع أكثر من ٢٠٠٠ وجبة على الأسر', image: 'food.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Partnership', title: 'Working together with Al Maktoum Foundation', ar: 'تعاون مع مؤسسة آل مكتوم الخيرية', image: 'media-community.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Community', title: 'Care that brings neighbours together', ar: 'رعاية تجمع أفراد المجتمع', image: 'care.jpg', url: 'https://alihsan.ae/ar/media/media-center' }
    ] },
    { year: 2019, entries: [
      { type: 'Education', title: 'School bags for a brighter start', ar: 'حقائب مدرسية لبداية أكثر إشراقاً', image: 'quran.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Campaign', title: 'Ramadan Aman, shared across the community', ar: 'رمضان أمان بمشاركة المجتمع', image: 'volunteers.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Community', title: 'A year of kindness in action', ar: 'عام من الإحسان والعمل', image: 'community.jpg', url: 'https://alihsan.ae/ar/media/media-center' }
    ] },
    { year: 2018, entries: [
      { type: 'Food support', title: 'Food baskets for 100 families', ar: 'سلال غذائية لمئة أسرة', image: 'food.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Video', title: 'Giving for families', ar: 'العطاء من أجل الأسر', image: 'volunteers.jpg', url: 'https://alihsan.ae/ar/media/media-center' },
      { type: 'Community', title: 'A community moved by compassion', ar: 'مجتمع يجمعه التعاطف', image: 'community.jpg', url: 'https://alihsan.ae/ar/media/media-center' }
    ] }
  ];

  const section = document.createElement('section');
  section.id = 'media-highlights';
  section.className = 'media-timeline section';
  section.dataset.galleryStyle = ({ '8765': 'green', '8766': 'gold', '8767': 'green', '8768': 'teal' })[location.port] || 'green';
  section.style.scrollMarginTop = '96px';
  section.setAttribute('aria-labelledby', 'media-timeline-title');
  section.innerHTML = `<div class="timeline-top"><div><div class="eyebrow" data-ar="من أرشيف الإحسان">FROM THE AL IHSAN ARCHIVE</div><h2 id="media-timeline-title"><span data-ar="المركز">Media</span> <em data-ar="الإعلامي">Centre</em></h2></div><a class="timeline-explore" href="${location.port === '8767' || location.port === '8768' ? 'media.html' : 'https://alihsan.ae/ar/media/media-center'}" ${location.port === '8767' || location.port === '8768' ? '' : 'target="_blank" rel="noopener"'}><span data-ar="استكشف الكل">Explore all</span> ↗</a></div><div class="timeline-stage"><div class="timeline-cards" aria-live="polite"></div><div class="timeline-year-readout"><span data-ar="مختارات من عام">HIGHLIGHTS FROM</span> <strong></strong></div></div><div class="year-rail" role="group" aria-label="Choose an archive year"><div class="year-rail-line"></div><div class="year-buttons">${archive.map((item, i) => `<button type="button" data-year-index="${i}" aria-pressed="${i === 0}" aria-label="${item.year}"><span>${item.year}</span><i></i></button>`).join('')}</div><button type="button" class="year-next" aria-label="Next year">→</button></div>`;
  host.before(section);

  const cards = section.querySelector('.timeline-cards');
  const yearLabel = section.querySelector('.timeline-year-readout strong');
  const yearButtons = [...section.querySelectorAll('[data-year-index]')];
  let selected = 0;
  const isArabic = () => document.documentElement.lang === 'ar';
  const render = (index) => {
    selected = (index + archive.length) % archive.length;
    const batch = archive[selected];
    yearLabel.textContent = batch.year;
    section.style.setProperty('--year-progress', `${selected / (archive.length - 1) * 100}%`);
    section.querySelector('.year-rail').setAttribute('aria-label', isArabic() ? 'اختر سنة الأرشيف' : 'Choose an archive year');
    section.querySelector('.year-next').setAttribute('aria-label', isArabic() ? 'السنة التالية' : 'Next year');
    yearButtons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === selected));
      button.classList.toggle('is-active', i === selected);
    });
    cards.classList.remove('is-entering');
    cards.innerHTML = batch.entries.map((entry, i) => `<a class="timeline-card timeline-card-${i + 1}" href="${entry.url}" target="_blank" rel="noopener" style="--card-order:${i}" aria-label="${isArabic() ? entry.ar : entry.title} · ${batch.year}"><div class="timeline-image"><img src="assets/${entry.image}" alt="${isArabic() ? entry.ar : entry.title}" loading="lazy"><span class="timeline-type" data-type-en="${entry.type}">${isArabic() ? ({Images:'الصور',News:'الأخبار',Community:'المجتمع',Partnership:'شراكة',Volunteering:'التطوع',Recognition:'تكريم',Campaign:'مبادرة',Giving:'العطاء',Video:'فيديو', 'Food support':'الدعم الغذائي',Education:'التعليم'}[entry.type] || entry.type) : entry.type}</span><span class="timeline-open" aria-hidden="true">↗</span></div><div class="timeline-card-copy"><small>${batch.year} · ${isArabic() ? 'من الأرشيف' : 'FROM THE ARCHIVE'}</small><h3>${isArabic() ? entry.ar : entry.title}</h3></div></a>`).join('');
    requestAnimationFrame(() => cards.classList.add('is-entering'));
  };
  yearButtons.forEach(button => button.addEventListener('click', () => render(Number(button.dataset.yearIndex))));
  section.querySelector('.year-next').addEventListener('click', () => render((selected + 1) % archive.length));
  document.querySelector('#language')?.addEventListener('click', () => render(selected));
  render(0);
  if (location.hash === '#media-highlights') requestAnimationFrame(() => section.scrollIntoView({ block: 'start' }));
})();

