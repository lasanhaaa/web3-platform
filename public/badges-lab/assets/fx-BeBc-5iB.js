import{A as e,N as t,S as n,_ as r,b as i,c as a,m as o,v as s}from"./model-KlMUOKbj.js";var c=new i(1,1,1),l=(e,t)=>new i(e).lerp(c,t),u=(e,t)=>{let n=e.getHexString();return`rgba(${parseInt(n.slice(0,2),16)},${parseInt(n.slice(2,4),16)},${parseInt(n.slice(4,6),16)},${t})`},d=new Map;function f(e){if(d.has(e))return d.get(e);let t=new i(e),n=l(e,.7),r={sparks:[16777215,l(e,.8).getHex(),l(e,.5).getHex(),l(e,.2).getHex(),t.getHex()],core:o([[0,`rgba(255,255,255,1)`],[.12,u(n,.9)],[.35,u(t,.38)],[1,u(t,0)]]),wave:o([[0,`rgba(0,0,0,0)`],[.66,`rgba(0,0,0,0)`],[.74,u(t,.55)],[.79,`rgba(255,255,255,0.95)`],[.84,u(t,.35)],[1,`rgba(0,0,0,0)`]]),flare:o([[0,`rgba(255,255,255,1)`],[.18,u(n,.7)],[.5,u(t,.18)],[1,u(t,0)]])};return d.set(e,r),r}var p=()=>a(256,(e,t)=>{let n=t/2,r=e.createRadialGradient(n,n,0,n,n,n*.3);r.addColorStop(0,`rgba(255,255,255,1)`),r.addColorStop(1,`rgba(255,255,255,0)`),e.fillStyle=r,e.fillRect(0,0,t,t);let i=(t,n,r,i,a)=>{let o=e.createLinearGradient(t,n,r,i);o.addColorStop(0,`rgba(255,255,255,0)`),o.addColorStop(.5,`rgba(255,255,255,1)`),o.addColorStop(1,`rgba(255,255,255,0)`),e.fillStyle=o,e.fillRect(...a)};i(0,0,t,0,[0,n-2,t,4]),i(0,0,0,t,[n-2,0,4,t])},{srgb:!0}),m=`
  varying vec3 vColor;
  varying float vAlpha;
  varying float vStar;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float glow = exp(-d * d * 30.0);
    float star = pow(max(0.0, 1.0 - abs(uv.x * uv.y) * 110.0), 5.0) * smoothstep(0.5, 0.05, d);
    float a = (glow + star * vStar * 0.9) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`,h=`
  attribute vec3 aDir;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uSize;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vStar;

  // Fade out before the canvas edge so nothing is ever visibly clipped.
  float edgeFade(vec4 clip) {
    vec2 ndc = abs(clip.xy / clip.w);
    return 1.0 - smoothstep(0.78, 0.98, max(ndc.x, ndc.y));
  }
`,g=`${h}
  void main() {
    float t = uTime;
    float y = mod(position.y + 1.6 + t * mix(0.07, 0.18, aSeed), 3.2) - 1.6;
    vec3 pos = vec3(position.x + sin(t * 0.6 + aSeed * 30.0) * 0.06, y, position.z);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float edge = smoothstep(-1.6, -1.0, y) * (1.0 - smoothstep(1.0, 1.6, y));
    float twinkle = pow(0.5 + 0.5 * sin(t * (1.5 + 3.0 * aSeed) + aSeed * 50.0), 3.0);
    vAlpha = uOpacity * edge * (0.15 + 0.85 * twinkle);
    vAlpha *= edgeFade(gl_Position);
    vColor = aColor;
    vStar = step(0.9, aSeed) * twinkle;
    gl_PointSize = aSize * uSize / -mv.z;
  }
`;function _(a,o,c){let l=new s;for(let[e,t]of Object.entries({position:3,aDir:3,aColor:3,aSeed:1,aSize:1}))l.setAttribute(e,new r(new Float32Array(a*t),t));let u=l.attributes;for(let e=0;e<a;e++){let t=c(e);u.position.setXYZ(e,...t.pos),t.dir&&u.aDir.setXYZ(e,...t.dir),u.aSeed.setX(e,Math.random()),u.aSize.setX(e,t.size)}let d=new e(l,new t({uniforms:{uTime:{value:0},uSize:{value:800},uOpacity:{value:0}},vertexShader:o,fragmentShader:m,transparent:!0,depthWrite:!1,blending:2}));return d.frustumCulled=!1,d.visible=!1,d.paint=(e,t,r=11)=>{let o=new i;for(let i=0;i<a;i++){let a=i%r===0?t:e[Math.random()*e.length|0];o.setHex(a,n),u.aColor.setXYZ(i,o.r,o.g,o.b)}u.aColor.needsUpdate=!0},d}export{f as a,_ as i,h as n,p as r,g as t};