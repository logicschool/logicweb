const {esc}=require('./content');
const published=x=>x.status!=='draft';
function banner(b){const image=`<img src="${esc(b.image)}" alt="${esc(b.title||'')}" loading="lazy">`;return `<section class="section cms-banner-section" data-gallery-managed="banner" data-banner-id="${esc(b.id)}"><figure class="container">${b.url?`<a href="${esc(b.url)}">${image}</a>`:image}${b.caption?`<figcaption>${esc(b.caption)}</figcaption>`:''}</figure></section>`;}
function placement(p){return `<article class="result-poster-card" data-placement-id="${esc(p.id)}"><button class="result-poster-media" type="button" data-image-lightbox="${esc(p.image)}" aria-label="Enlarge ${esc(p.title||p.studentName||'placement poster')}"><img src="${esc(p.image)}" alt="${esc(p.title||p.studentName||'Placement poster')}" loading="lazy"></button><div class="result-poster-copy"><div><h3>${esc(p.title||p.studentName)}</h3><p>${esc([p.company,p.jobTitle].filter(Boolean).join(' · '))}</p><span>${esc([p.course,p.year].filter(Boolean).join(' · '))}</span></div></div></article>`;}
function apply($,cache,pathname){let page='',categoryId='';if(pathname==='/placements.html')page='placements';else if(pathname==='/results.html')page='results';else{const m=String(pathname).match(/^\/results\/([a-z0-9-]+)\.html$/);if(m){page='results';categoryId=m[1];}}
 if(!page)return;
 // Add the placement social link without replacing the user's saved page content.
 if(page==='placements'&&!$('#placement-instagram-link').length){
  $('.page-hero .container').first().append('<div class="actions"><a id="placement-instagram-link" class="btn btn-green" href="https://www.instagram.com/logic.talent_hunter?stkn=MnozOWJqZXI1NHVh" target="_blank" rel="noopener noreferrer">Follow Our Placements on Instagram ↗</a></div>');
 }
 const banners=(cache.banners||[]).filter(x=>published(x)&&x.page===page&&(x.categoryId||'')===categoryId).map(banner).join('');
 let gallery='';if(page==='placements'){const posters=(cache.placement_posters||[]).filter(published);if(posters.length)gallery=`<section class="section cms-placement-gallery" data-gallery-managed="placements"><div class="container"><div class="section-head"><div><span class="eyebrow">STUDENT SUCCESS</span><h2>Placement highlights</h2></div></div><div class="result-poster-grid">${posters.map(placement).join('')}</div></div></section>`;}
 const hero=$('main>.page-hero').first();if(hero.length)hero.after(banners+gallery);else $('main').prepend(banners+gallery);
}
module.exports={apply,published};
