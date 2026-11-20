import{n as e,t}from"./badges-DpOP_urh.js";import{n}from"./badges-certificates-D8IwN7On.js";var r=`./renders/`,i=`<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.8" rx="1.6"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"/></svg>`,a=`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4l2.9 2.9 6.1-6.6"/></svg>`,o=e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`);function s(e,t){let s=n(e),c=e.kind===`card`,l=c?t.name:e.completion?`Completion coin`:e.copy.title,u=new URL(`${r}${e.id}${s.state===`earned`?``:`-locked`}.png`,location.href).href,[d,f]=c?[800,504]:[320,320],p=s.state===`earned`?a:s.state===`locked`?i:``,m=e.completion&&!c?`255 190 85`:e.theme.glow;return`<li class="tile is-${s.state}${c?` tile--card`:``}" style="--c:${t.color};--glow:${m}">
    <div class="art" style="--mask:url('${u}')">
      <div class="art-inner">
        <img src="${u}" alt="" width="${d}" height="${f}" loading="lazy" decoding="async" />
        <span class="shine" aria-hidden="true"></span>
        ${c?`<span class="holo" aria-hidden="true"></span>`:``}
      </div>
    </div>
    <h3 class="tile-name">${c?`<span class="dot" aria-hidden="true"></span>`:``}${o(l)}</h3>
    <div class="meter">
      <span class="bar" role="progressbar" aria-label="${o(l)} progress" aria-valuemin="0" aria-valuemax="${s.total}" aria-valuenow="${s.done}">
        <span style="width:${s.done/s.total*100}%"></span>
      </span>
      <span class="count">${s.done}/${s.total}</span>
    </div>
    <p class="hint">${p}${o(s.hint)}</p>
  </li>`}function c({id:e,title:t,meta:n,color:r,items:i,cards:a=!1}){return`<section class="group" aria-labelledby="g-${e}">
    <header class="group-head">
      <h2 id="g-${e}">${r?`<span class="dot" style="--c:${r}" aria-hidden="true"></span>`:``}${o(t)}</h2>
      <p>${n}</p>
    </header>
    <ul class="tiles${a?` tiles--cards`:``}">${i}</ul>
  </section>`}var l=t=>e.find(e=>e.id===t),u=t.filter(e=>e.kind===`card`),d=u.filter(e=>n(e).state===`earned`).length,f=[c({id:`certificates`,title:`Certificates`,meta:`${d} of ${u.length} issued`,items:u.map(e=>s(e,l(e.routeId))).join(``),cards:!0}),...e.map(e=>{let r=t.filter(t=>t.routeId===e.id&&t.kind!==`card`),i=r.filter(e=>n(e).state===`earned`).length;return c({id:e.id,title:e.name,meta:`${i} of ${r.length} unlocked`,color:e.color,items:r.map(t=>s(t,e)).join(``)})})].join(``);document.querySelector(`.sections`).innerHTML=f;var p=window.matchMedia(`(hover: hover) and (pointer: fine)`).matches,m=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;p&&document.querySelectorAll(`.tile`).forEach(e=>{let t=e.querySelector(`.art`),n=0;e.addEventListener(`pointermove`,e=>{cancelAnimationFrame(n),n=requestAnimationFrame(()=>{let n=t.getBoundingClientRect(),r=Math.min(1,Math.max(0,(e.clientX-n.left)/n.width)),i=Math.min(1,Math.max(0,(e.clientY-n.top)/n.height));t.style.setProperty(`--mx`,`${(r*100).toFixed(1)}%`),t.style.setProperty(`--my`,`${(i*100).toFixed(1)}%`),m||(t.style.setProperty(`--ry`,`${((r-.5)*14).toFixed(2)}deg`),t.style.setProperty(`--rx`,`${((.5-i)*10).toFixed(2)}deg`))})}),e.addEventListener(`pointerleave`,()=>{cancelAnimationFrame(n),[`--mx`,`--my`,`--rx`,`--ry`].forEach(e=>t.style.removeProperty(e))})});