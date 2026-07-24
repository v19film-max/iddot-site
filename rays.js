/* iddot — SideRays 배경 (React Bits, ogl 기반을 바닐라로 이식)
   React Bits 원본의 광원 위치와 레이 계산을 그대로 사용한다. */
(function () {
  'use strict';

  var mount = document.getElementById('raysBg');
  if (!mount) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
  }

  var CONFIG = {
    speed: 2.5,
    rayColor1: '#e9e6df',
    rayColor2: '#96c8ff',
    intensity: 0.55,
    spread: 2,
    tilt: 0,
    saturation: 0.85,
    blend: 0.75,
    falloff: 1.6,
    opacity: 0.34
  };

  var VERT = [
    'attribute vec2 position;',
    'void main() {',
    '  gl_Position = vec4(position, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform float iTime;',
    'uniform vec2 iResolution;',
    'uniform float iSpeed;',
    'uniform vec3 iRayColor1;',
    'uniform vec3 iRayColor2;',
    'uniform float iIntensity;',
    'uniform float iSpread;',
    'uniform float iFlipX;',
    'uniform float iFlipY;',
    'uniform float iTilt;',
    'uniform float iSaturation;',
    'uniform float iBlend;',
    'uniform float iFalloff;',
    'uniform float iOpacity;',
    '',
    'float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {',
    '  vec2 sourceToCoord = coord - raySource;',
    '  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);',
    '  return clamp(',
    '    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +',
    '    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),',
    '    0.0, 1.0) *',
    '    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);',
    '}',
    '',
    'void main() {',
    '  vec2 fragCoord = gl_FragCoord.xy;',
    '  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;',
    '  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;',
    '  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);',
    '  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);',
    '',
    '  float tiltRad = iTilt * 3.14159265 / 180.0;',
    '  float cs = cos(tiltRad);',
    '  float sn = sin(tiltRad);',
    '  vec2 rel = coord - rayPos;',
    '  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;',
    '',
    '  float halfSpread = iSpread * 0.275;',
    '  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));',
    '  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));',
    '',
    '  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);',
    '  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);',
    '',
    '  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;',
    '',
    '  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;',
    '  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);',
    '  color.rgb *= brightness;',
    '',
    '  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));',
    '  color.rgb = mix(vec3(gray), color.rgb, iSaturation);',
    '',
    '  color.a = max(color.r, max(color.g, color.b)) * iOpacity;',
    '  gl_FragColor = color;',
    '}'
  ].join('\n');

  import('https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm')
    .then(function (ogl) {
      var Renderer = ogl.Renderer, Program = ogl.Program, Mesh = ogl.Mesh, Triangle = ogl.Triangle;
      var renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio || 1, 1.25) });
      var gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.canvas.style.cssText = 'width:100%;height:100%;display:block;';
      mount.replaceChildren(gl.canvas);

      var uniforms = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },
        iSpeed: { value: CONFIG.speed },
        iRayColor1: { value: hexToRgb(CONFIG.rayColor1) },
        iRayColor2: { value: hexToRgb(CONFIG.rayColor2) },
        iIntensity: { value: CONFIG.intensity },
        iSpread: { value: CONFIG.spread },
        iFlipX: { value: 0 },
        iFlipY: { value: 0 },
        iTilt: { value: CONFIG.tilt },
        iSaturation: { value: CONFIG.saturation },
        iBlend: { value: CONFIG.blend },
        iFalloff: { value: CONFIG.falloff },
        iOpacity: { value: CONFIG.opacity }
      };

      var geometry = new Triangle(gl);
      var program = new Program(gl, { vertex: VERT, fragment: FRAG, uniforms: uniforms });
      var mesh = new Mesh(gl, { geometry: geometry, program: program });

      function resize() {
        var w = mount.clientWidth, h = mount.clientHeight;
        renderer.setSize(w, h);
        uniforms.iResolution.value = [gl.canvas.width, gl.canvas.height];
      }
      window.addEventListener('resize', resize);
      resize();

      var raf;
      var lastFrame = 0;
      var running = true;
      function loop(t) {
        raf = requestAnimationFrame(loop);
        if (!running || t - lastFrame < 32) return;
        lastFrame = t;
        uniforms.iTime.value = t * 0.001;
        renderer.render({ scene: mesh });
      }
      raf = requestAnimationFrame(loop);

      document.addEventListener('visibilitychange', function () {
        running = !document.hidden;
      });
    })
    .catch(function (e) {
      console.warn('[rays] ogl 로드 실패, 정적 안전망을 사용합니다:', e);
    });
})();
