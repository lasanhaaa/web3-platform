import{E as e,F as t,N as n,P as r,b as i,f as a,j as o,w as s,x as c,y as l,z as u}from"./model-KlMUOKbj.js";var d={width:2.7,height:1.702,radius:.11},f=.02,p=.008,m=.018600000000000002,h=1e3,g=630,_=1.6,v=_,y=72,b=`#343a42`,x=`#6d737c`,S=`#8a9099`,C=`#c9cdd3`,w=`Geist, "Helvetica Neue", Arial, sans-serif`,T=`"Geist Mono", ui-monospace, Menlo, monospace`;function E(e,t,n){let i=new r,a=-e/2,o=-t/2;return i.moveTo(a+n,o),i.lineTo(a+e-n,o),i.absarc(a+e-n,o+n,n,-Math.PI/2,0,!1),i.lineTo(a+e,o+t-n),i.absarc(a+e-n,o+t-n,n,0,Math.PI/2,!1),i.lineTo(a+n,o+t),i.absarc(a+n,o+t-n,n,Math.PI/2,Math.PI,!1),i.lineTo(a,o+n),i.absarc(a+n,o+n,n,Math.PI,Math.PI*1.5,!1),i}function D(){let e=new t(E(d.width,d.height,d.radius),16),n=e.attributes.position,r=e.attributes.uv;for(let e=0;e<n.count;e++)r.setXY(e,n.getX(e)/d.width+.5,n.getY(e)/d.height+.5);return e}var O={"cert-strategien":e=>{k(e,[[-.338,.201],[-.212,.118],[-.251,.061],[-.16,-.06],[-.037,.057],[-.089,.105],[-.02,.201],[-.072,.254],[0,.323],[.072,.254],[.02,.201],[.089,.105],[.037,.057],[.16,-.06],[.251,.061],[.212,.118],[.338,.201],[.246,-.19],[-.246,-.19]]),e.fillRect(-.24,-.26,.48,.045),k(e,[[-.12,-.276],[.12,-.276],[0,-.31]])},"cert-perppilot":e=>{[[[-.45,.286],[-.012,.1],[-.009,-.31],[-.075,.027],[-.405,.167]],[[-.39,.118],[-.0835,0],[-.068,-.081],[-.355,.029]],[[-.32,-.021],[-.0633,-.105],[-.0512,-.1665],[-.29,-.089]]].forEach(t=>{k(e,t),k(e,t.map(([e,t])=>[-e,t]))})},"cert-grundlagen":e=>{e.fillRect(-.2,.2,.4,.07),e.fillRect(-.15,.14,.3,.04);for(let t=0;t<4;t++)e.fillRect(-.13+t*.07,-.2,.05,.32);e.fillRect(-.17,-.25,.34,.04),e.fillRect(-.22,-.31,.44,.05)}};function k(e,t){e.beginPath(),t.forEach(([t,n],r)=>r?e.lineTo(t,n):e.moveTo(t,n)),e.closePath(),e.fill()}var A=e=>e*v;function j(e,t,n,r,i=0){e.font=`${t} ${A(n)}px ${r}`,e.letterSpacing=`${A(n*i)}px`}function M(e,t,n,r,{weight:i=400,size:a=16,family:o=w,tracking:s=0,color:c=b,align:l=`left`}={}){j(e,i,a,o,s),e.fillStyle=c,e.textAlign=l,e.textBaseline=`alphabetic`,e.fillText(t,A(n),A(r))}function N(e,t,n,r,i,a=1){e.fillStyle=i,e.fillRect(A(t),A(r)-A(a)/2,A(n-t),A(a))}function P(e,t,n,r,i,{ring:a,fill:o}){e.save(),e.translate(A(t),A(n)),e.strokeStyle=a,e.lineWidth=A(1.2),e.beginPath(),e.arc(0,0,A(r),0,Math.PI*2),e.stroke(),e.beginPath(),e.arc(0,0,A(r-7),0,Math.PI*2),e.stroke(),e.scale(A(r*1.18),-A(r*1.18)),e.fillStyle=o,O[i]?.(e),e.restore()}function F(e,t,n){let r=n?{ink:`rgb(40,0,0)`,soft:`rgb(40,0,0)`,label:`rgb(40,0,0)`,rule:`rgb(40,0,0)`,accent:`rgb(90,0,0)`}:{ink:b,soft:x,label:S,rule:C,accent:t.accent};M(e,`Web3 Universe`,y,94,{weight:600,size:21,color:r.ink,tracking:-.005}),j(e,600,21,w,-.005),M(e,`Academy`,y+e.measureText(`Web3 Universe `).width/v,94,{weight:400,size:21,color:r.soft}),n&&(e.fillStyle=`rgb(255,255,0)`,e.beginPath(),e.arc(A(864),A(128),A(66),0,Math.PI*2),e.fill()),P(e,864,128,64,t.symbol,n?{ring:`rgb(255,255,0)`,fill:`rgb(255,255,255)`}:{ring:`#9aa0a8`,fill:`#9ea4ac`}),M(e,`CERTIFICATE OF COMPLETION`,y,318,{weight:500,size:14.5,family:T,tracking:.2,color:r.label}),M(e,t.path,69,396,{weight:600,size:74,color:r.ink,tracking:-.025}),M(e,t.modules.map(e=>e.title).join(`  ·  `),y,440,{weight:400,size:t.modules.length>3?15.5:18.5,color:r.soft}),N(e,y,928,502,r.accent,1.6),[[`HOLDER`,t.holder,T,`left`,y],[`ISSUED`,t.issued,w,`left`,400],[`CERTIFICATE`,`No. ${t.number}`,w,`right`,928]].forEach(([t,n,i,a,o])=>{M(e,t,o,548,{weight:500,size:11.5,family:T,tracking:.18,color:r.label,align:a}),M(e,n,o,578,{weight:500,size:18,family:i,color:r.ink,align:a})})}function I(e,t,n){let r=n?{ink:`rgb(40,0,0)`,soft:`rgb(40,0,0)`,label:`rgb(40,0,0)`,rule:`rgb(60,0,0)`}:{ink:b,soft:x,label:S,rule:C};M(e,`Web3 Universe Academy`,y,92,{weight:500,size:17,color:r.soft}),M(e,`No. ${t.number}`,928,92,{weight:500,size:15,family:T,color:r.label,align:`right`}),M(e,`MODULES COMPLETED`,y,172,{weight:500,size:12.5,family:T,tracking:.2,color:r.label});let i=Math.min(70,292/t.modules.length);t.modules.forEach((t,n)=>{let a=236+n*i;N(e,y,928,a-44,r.rule,1),M(e,String(n+1).padStart(2,`0`),y,a,{weight:500,size:15,family:T,color:r.label}),M(e,t.title,130,a,{weight:500,size:27,color:r.ink,tracking:-.01}),M(e,t.level,928,a,{weight:500,size:13,family:T,tracking:.12,color:r.label,align:`right`})}),N(e,y,928,236+t.modules.length*i-44,r.rule,1),M(e,`Verified on-chain`,y,548,{weight:500,size:17,color:r.ink}),M(e,t.tx,y,578,{weight:400,size:14.5,family:T,color:r.soft}),n&&(e.fillStyle=`rgb(255,255,0)`,e.beginPath(),e.arc(A(888),A(530),A(42),0,Math.PI*2),e.fill()),P(e,888,530,40,t.symbol,n?{ring:`rgb(255,255,0)`,fill:`rgb(255,255,255)`}:{ring:`#9aa0a8`,fill:`#9ea4ac`})}function L(e,t,n,r=_){v=n?1:r;let i=document.createElement(`canvas`);i.width=Math.round(h*v),i.height=Math.round(g*v);let a=i.getContext(`2d`);if(n)a.fillStyle=`rgb(255,0,0)`,a.fillRect(0,0,i.width,i.height);else{let e=a.createLinearGradient(0,0,0,i.height);e.addColorStop(0,`#e6e9ed`),e.addColorStop(1,`#d4d8de`),a.fillStyle=e,a.fillRect(0,0,i.width,i.height);for(let e=0;e<2600;e++){let e=Math.random()*i.height;a.fillStyle=`rgba(${Math.random()<.5?`255,255,255`:`150,156,166`},${.05+Math.random()*.06})`,a.fillRect(Math.random()*i.width-200,e,200+Math.random()*900,1)}}e(a,t,n);let s=new l(i);return s.anisotropy=8,n||(s.colorSpace=o),s}var R=`
  varying vec2 vUv;
  varying vec3 vViewPos;
  varying vec3 vViewNormal;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`,z=`
  uniform vec3 uTint;
  uniform float uStrength;
  uniform float uTime;
  uniform vec3 uLight;
  uniform sampler2D uMask;
  varying vec2 vUv;
  varying vec3 vViewPos;
  varying vec3 vViewNormal;

  vec3 spectrum(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec3 N = normalize(vViewNormal);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(-vViewPos);
    vec3 L = normalize(uLight - vViewPos);
    vec3 H = normalize(L + V);
    float ndh = max(dot(N, H), 0.0);
    float sheen = pow(ndh, 64.0);
    float glare = pow(ndh, 400.0);

    vec3 R = reflect(-V, N);
    vec4 mask = texture2D(uMask, vUv);
    // The seal's emblem sits half a turn round the spectrum from its ground, as in a real hologram.
    float phase = (vUv.x * 1.3 + vUv.y * 0.8) + R.x * 2.4 + R.y * 1.7 + mask.b * 0.5;
    vec3 rainbow = mix(spectrum(phase), uTint, 0.6);

    float lines = 0.82 + 0.18 * sin((vUv.x * 1.586 + vUv.y) * 520.0 + R.x * 40.0);
    vec2 cell = floor(vUv * vec2(420.0, 265.0));
    float h = hash(cell);
    float glitter = step(0.995, h) * pow(max(sin(h * 60.0 + R.x * 30.0 + R.y * 21.0 + uTime * 0.6), 0.0), 8.0);

    float foil = mask.r;
    float seal = mask.g;
    // A film over the metal: 0.5 leaves it untouched; above lightens, below
    // deepens (blended as 2 × film × metal), so the colour reads without
    // washing the card out.
    float amount = (foil * (0.04 + 0.5 * sheen) + seal * (0.24 + 0.4 * sheen) + mask.b * 0.14) * uStrength;
    vec3 film = 0.5 + (rainbow * lines - 0.5) * amount;
    film += glitter * foil * (0.06 + 0.7 * sheen) + glare * 0.22 * foil * uStrength;
    gl_FragColor = vec4(film, 1.0);
  }
`;function B(t,{anisotropy:r=8,resolution:o=_}={}){let l=t.card,h=new c,g=[],v=e=>(g.push(e),e),y=v(new e({color:14278115,metalness:1,roughness:.2,clearcoat:.8,clearcoatRoughness:.1})),b=new s(v(a(E(d.width-2*p,d.height-2*p,d.radius-p),{depth:f,bevelThickness:p,bevelSize:p,bevelSegments:4,curveSegments:12})),y);h.add(b);let x=v(D()),S=new i(t.accent),C=new u(-2,2.4,-6.43),w=[{draw:F,z:m,rotY:0,strength:1},{draw:I,z:-.018600000000000002,rotY:Math.PI,strength:.55}].map(({draw:t,z:i,rotY:a,strength:c})=>{let u=new e({map:v(L(t,l,!1,o)),metalness:.35,roughness:.5,clearcoat:.3,clearcoatRoughness:.3,polygonOffset:!0,polygonOffsetFactor:-1});u.map.anisotropy=r,v(u);let d=v(new n({vertexShader:R,fragmentShader:z,uniforms:{uTint:{value:S},uStrength:{value:c},uTime:{value:0},uLight:{value:C},uMask:{value:v(L(t,l,!0))}},transparent:!0,blending:5,blendEquation:100,blendSrc:208,blendDst:202,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2}));return[new s(x,u),new s(x,d)].forEach(e=>{e.position.z=i,e.rotation.y=a,h.add(e)}),{draw:t,art:u,foil:d}}),T=!1;document.fonts&&document.fonts.status!==`loaded`&&document.fonts.ready.then(()=>{T||w.forEach(({draw:e,art:t,foil:n})=>{t.map.dispose(),t.map=L(e,l,!1,o),t.map.anisotropy=r,n.uniforms.uMask.value.dispose(),n.uniforms.uMask.value=L(e,l,!0),t.needsUpdate=!0})});let O=0,k=(e,t)=>{t&&(O+=e),w.forEach(({foil:e})=>e.uniforms.uTime.value=O)};function A(){T=!0,w.forEach(({art:e,foil:t})=>{e.map.dispose(),t.uniforms.uMask.value.dispose()}),g.forEach(e=>e.dispose?.())}return{group:h,update:k,dispose:A}}var V=e=>`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${e}</svg>`,H={pentagon:V(`<path d="M8 2.5l5.7 4.15-2.17 6.7H4.47L2.3 6.65z"/>`),circle:V(`<circle cx="8" cy="8" r="5.6"/>`),hexagon:V(`<path d="M8 2.2l5.2 3v5.6L8 13.8l-5.2-3V5.2z"/>`),star:V(`<path d="M8 1.6l2.2 2.6 3.35-.6-1.15 3.2L13.55 10l-3.35.8L8 14.4l-2.2-3.6L2.45 10l1.15-3.2-1.15-3.2 3.35.6z"/>`),octagon:V(`<path d="M5.7 2.4h4.6l3.3 3.3v4.6l-3.3 3.3H5.7l-3.3-3.3V5.7z"/>`),star8:V(`<path d="M8 1.6l1.6 2.5 2.9-.6-.6 2.9L14.4 8l-2.5 1.6.6 2.9-2.9-.6L8 14.4l-1.6-2.5-2.9.6.6-2.9L1.6 8l2.5-1.6-.6-2.9 2.9.6z"/>`),coin:V(`<circle cx="8" cy="8" r="6" fill="#ffd27a" stroke="none"/><circle cx="8" cy="8" r="3.9" stroke="#a87a2c" stroke-width="1"/>`),card:V(`<rect x="1.6" y="3.6" width="12.8" height="8.8" rx="1.6"/><circle cx="11.2" cy="6.6" r="1.2"/><path d="M4 9.8h5" stroke-linecap="round"/>`)},U=V(`<path d="M2.8 8a5.2 5.2 0 1 0 1.5-3.7" stroke-linecap="round"/><path d="M2.4 2.4v2.8h2.8" stroke-linecap="round"/>`),W=V(`<rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1.2"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1.2"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1.2"/><rect x="9" y="9" width="4.5" height="4.5" rx="1.2"/>`);export{B as i,U as n,H as r,W as t};