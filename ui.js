// ── trans custom UI ──────────────────────────────────────────────────────────
// Bottom dock + mode grid. Drives the engine's `state` and calls window.__engine
// for side-effects. Tweakpane stays alive (hidden) as the side-effect registry,
// so this layer can't break handler wiring. Schema-driven from the known params.

(function () {
  const boot = () => {
    if (!window.__engine || !window.__engine.state) return setTimeout(boot, 60);
    init(window.__engine);
  };
  boot();

  // param spec: key -> [label, min, max, step] | {t:'check'} | {t:'color'} | {t:'select',opts}
  const P = {
    // reveal / movement / advanced (transition modes)
    originAmount:['from within',0,1,.01], spread:['edge softness',0,1,.01],
    turbulence:['turbulence',0,1,.01], flow:['flow',0,1,.01], undulate:['undulate',0,1,.01], animate:['animate',0,1,.01],
    originX:['origin x',0,1,.01], originY:['origin y',0,1,.01], maskScale:['mask scale',.3,4,.05],
    maskShift:['mask shift',-.5,.5,.005], organic:['organic',0,1,.01], edges:['edges',-1,1,.01], seed:['seed',0,999,1],
    curve:{t:'select',label:'timing',opts:{'linear':0,'ease-in-out':1,'ease-in':2,'ease-out':3}},
    // start points / paint
    originFromImage:{t:'check',label:'origin from image A'}, pointStagger:['stagger',0,1,.01],
    pointRandom:['stagger random',0,1,.01], paintBrush:['paint brush',.02,.4,.01],
    // direction / source
    driftAngle:['direction',0,1,.01], driftAmount:['amount',0,1,.01],
    sunX:['sun / source x',0,1,.01], sunY:['sun / source y',0,1,.01], streakMove:['movement dir',0,1,.01],
    // ambient
    ambCount:['count / density',0,1,.01], ambSize:['size / scale',0,1,.01], ambSoft:['softness',0,1,.01],
    ambSpeed:['speed',0,1,.01], ambDetail:['detail / fidelity',0,1,.01],
    ambRole:{t:'select',label:'role (with A+B)',opts:{'dissolve A\u2192B':0,'standalone field':1}},
    // vignette
    vignAmount:['amount',0,1,.01], vignFeather:['feather',0,1,.01], vignAnimate:['animate (pulse)',0,1,.01], vignTexture:['edge texture',0,1,.01], vignShape:['shape (ellipse↔rect)',0,1,.01],
    // mode-specific
    rimWidth:['rim width',0,.4,.005], rimDark:['rim dark',0,1,.01],
    paperAngle:['fiber angle',0,1,.005], paperAniso:['anisotropy',1,10,.1], paperGranulation:['granulation',0,1,.01],
    paperGrowth:['fiber growth',0,1,.01], paperFollow:['follow B strokes',0,1,.01], paperPatches:['local patches',0,1,.01],
    bloomCount:['count',1,24,1], bloomRate:['growth rate',.1,2,.01], bloomRim:['rim dark',0,1,.01], bloomImageBias:['follow B lights',0,1,.01],
    diffStrength:['strength',0,1,.01], diffRadius:['radius',0,1,.01],
    sedBands:['bands',1,16,1], sedSoftness:['softness',0,1,.01],
    saltDensity:['grain',0,1,.01], saltContrast:['contrast',0,1,.01], saltBias:['bias amount',0,1,.01],
    irisUniform:{t:'check',label:'uniform circle'}, irisFocusX:['focus x',0,1,.005], irisFocusY:['focus y',0,1,.005], irisJitter:['jitter',0,1,.01],
    bleedFinger:['finger',0,1,.01], bleedAmount:['amount',0,1,.01], bleedHalo:['wet halo',0,1,.01],
    runGravity:['gravity',0,1,.01], runDrip:['drip',0,1,.01],
    advecVisc:['viscosity',0,1,.01], advecRate:['mixing rate',0,1,.01], advecSteps:['steps / frame',1,8,1],
    advecGravAngle:['flow angle',0,1,.005], advecGravity:['gravity',0,1,.01], advecGravStreak:['streak',0,1,.01], advecGravLateral:['lateral spread',0,1,.01], advecGravBias:['shadow ↔ flow',0,1,.01],
    advecCurlStr:['eddy strength',0,1,.01], advecCurlScale:['eddy scale',.5,8,.1],
    advecBrushFollow:['follow strokes',0,1,.01],
    advecSeedCount:['seed count',1,16,1], advecSeedRadius:['reach',.1,1,.01],
    weEdgeScale:['edge scale',1,16,.1], weEdgeWobble:['edge wobble',0,1,.01], weTendrilCount:['tendril count',0,32,1],
    weTendrilReach:['tendril reach',.02,1,.01], weTendrilWidth:['tendril width',.02,1,.01], weTendrilStrength:['tendril strength',0,1,.01],
    weDetailBias:['detail bias (A)',0,1,.01], weBDetailBias:['detail bias (B)',0,1,.01], weBLumaBias:['B luma bias',-1,1,.01],
    weReverse:{t:'check',label:'reverse (center→out)'}, weDryRing:['dry-ring dark',0,1,.01], weBleed:['anticipatory bleed',0,1,.01],
    strokeScale:['stroke scale',.5,20,.1], strokeAniso:['anisotropy',1,12,.1],
    glazeBands:['washes',2,8,1], glazeSoftness:['softness',0,1,.01], glazeWarm:['warm dry-shift',0,1,.01],
    edgeFirstInk:['ink',0,1,.01], edgeFirstFade:['sketch fades at t=',.05,.9,.01], edgeFirstScale:['mask scale',1,10,.1],
    flowAmount:['flow amount',0,1,.01],
    dabsCount:['dab count',1,128,1], dabsReach:['reach',.05,1,.01], dabsWobble:['edge wobble',0,1,.01],
    densityGravity:['gravity bias',0,1,.01], densitySmear:['wet smear',0,1,.01],
    moldSeedCount:['seed count',1,16,1], moldTendrilsPerSeed:['tendrils / seed',1,8,1], moldReach:['reach',.05,1,.01], moldWidth:['tendril width',.05,1,.01], moldWobble:['wobble',0,1,.01],
    formStrokeCount:['stroke count',1,64,1], formStrokeSize:['stroke size',.01,.2,.005], formStrokeWobble:['edge wobble',0,1,.01],
    bloomLightBias:['light bias (B)',0,1,.01], bloomWobble:['bloom wobble',0,1,.01], bloomPaperShow:['paper-show pop',0,1,.01],
    stageBands:['stages',2,8,1], stageOverlap:['stage overlap',0,1,.01],
    migrationStrength:['strength',0,1,.01], migrationTurb:['turbulence',0,1,.01],
    burnEdgeWobble:['front irregularity',0,1,.01], burnCharIntensity:['char depth',0,1,.01], burnCharWidth:['char band width',.01,.5,.005],
    burnCharPersistence:['char persistence',0,1,.01], burnBrowning:['browning halo',0,1,.01], burnBrowningWidth:['browning width',.01,.3,.005],
    burnAshSpatter:['ash spatter',0,1,.01], burnGlowIntensity:['glow',0,1.5,.01], burnGlowWidth:['glow width',.05,1,.01],
    burnEmberTrail:['ember trail',0,1,.01], burnGlowColor:{t:'color',label:'glow color'}, burnGlowFromB:['glow ← B color',0,1,.01],
    burnSeedCount:['extra ignition spots',0,16,1], burnBIgnite:['ignite from B',0,1,.01], burnColorBleed:['color bleed (A→B)',0,1,.01],
    videoMaskInvert:{t:'check',label:'invert (dark first)'}, videoMaskFeather:['feather',0,1,.01], videoBrightness:['brightness',-1,1,.01], videoContrast:['contrast',0,3,.01], videoSaturate:['saturate',0,3,.01],
    lightIntensity:['light intensity',0,2.5,.01], lightSpread:['spread',0,1,.01], lightPeakT:['peak at (t)',.2,.8,.01], lightFlashWidth:['flash width',.03,.4,.01], lightColor:{t:'color',label:'light color'},
    auroraDensity:['curtain density',0,1,.01], auroraHeight:['ray height',0,1,.01], auroraSpeed:['speed',0,1,.01], auroraWave:['wave through',0,1,.01], auroraDark:['darkness',0,1,.01],
    gdIntensity:['intensity',0,1,.01], gdBeams:['beam count / thinness',0,1,.01], gdCloud:['break through cloud',0,1,.01], gdPulse:['pulse (in & out)',0,1,.01],
    texFit:{t:'select',label:'fit',opts:{'contain':1,'cover':2,'stretch':0}}, texAmount:['dissolve along texture',0,1,.01], texBg:['bg tint (image mode)',0,1,.01],
  };

  // modes grouped for the grid
  const MODES = [
    ['Reveal',[[0,'smooth'],[1,'pigment rim'],[7,'iris'],[15,'wet edge']]],
    ['Watercolor',[[2,'paper grain'],[3,'backrun blooms'],[4,'wet diffusion'],[5,'tonal sediment'],[6,'salt'],[8,'wet bleed'],[9,'pigment run'],[24,'cauliflower'],[25,'wet-stage'],[26,'migration']]],
    ['Painterly',[[22,'mold tendrils']]],
    ['Light & burn',[[27,'paper scorch'],[30,'light bloom']]],
    ['Ambient (loop)',[[33,'bokeh'],[34,'water ripples'],[35,'sun glare'],[36,'light streaks'],[38,'aurora'],[39,'godrays'],[40,'clouds'],[41,'caustics'],[42,'embers'],[43,'mist'],[44,'rain'],[45,'snow'],[46,'marble'],[47,'ink blooms']]],
    ['Special',[[28,'video mask'],[32,'texture-source'],[31,'particles'],[37,'paint']]],
    ['Archive',[[10,'adv wet'],[11,'adv gravity'],[12,'adv curl'],[13,'adv brush'],[14,'adv seed'],[16,'stroke-follow'],[17,'tonal wash'],[18,'edge underdraw'],[19,'painterly flow'],[20,'color dabs'],[21,'density grav'],[23,'formation']]],
  ];
  const MODE_NAME = {}; MODES.forEach(g=>g[1].forEach(([id,n])=>MODE_NAME[id]=n));

  // mode -> its own param keys
  const MK = {
    1:['rimWidth','rimDark'], 2:['paperAngle','paperAniso','paperGranulation','paperGrowth','paperFollow','paperPatches'],
    3:['bloomCount','bloomRate','bloomRim','bloomImageBias'], 4:['diffStrength','diffRadius'],
    5:['sedBands','sedSoftness'], 6:['saltDensity','saltContrast','saltBias'],
    7:['irisUniform','irisFocusX','irisFocusY','irisJitter'], 8:['bleedFinger','bleedAmount','bleedHalo'],
    9:['runGravity','runDrip'], 10:['advecVisc','advecRate','advecSteps'],
    11:['advecGravAngle','advecGravity','advecGravStreak','advecGravLateral','advecGravBias'],
    12:['advecCurlStr','advecCurlScale'], 13:['advecBrushFollow'], 14:['advecSeedCount','advecSeedRadius'],
    15:['weEdgeScale','weEdgeWobble','weTendrilCount','weTendrilReach','weTendrilWidth','weTendrilStrength','weDetailBias','weBDetailBias','weBLumaBias','weReverse','weDryRing','weBleed'],
    16:['strokeScale','strokeAniso'], 17:['glazeBands','glazeSoftness','glazeWarm'],
    18:['edgeFirstInk','edgeFirstFade','edgeFirstScale'], 19:['flowAmount'],
    20:['dabsCount','dabsReach','dabsWobble'], 21:['densityGravity','densitySmear'],
    22:['moldSeedCount','moldTendrilsPerSeed','moldReach','moldWidth','moldWobble'],
    23:['formStrokeCount','formStrokeSize','formStrokeWobble'], 24:['bloomLightBias','bloomWobble','bloomPaperShow'],
    25:['stageBands','stageOverlap'], 26:['migrationStrength','migrationTurb'],
    27:['burnEdgeWobble','burnCharIntensity','burnCharWidth','burnCharPersistence','burnBrowning','burnBrowningWidth','burnAshSpatter','burnGlowIntensity','burnGlowWidth','burnEmberTrail','burnGlowColor','burnGlowFromB','burnSeedCount','burnBIgnite','burnColorBleed'],
    28:['videoMaskInvert','videoMaskFeather','videoBrightness','videoContrast','videoSaturate'],
    30:['lightIntensity','lightSpread','lightPeakT','lightFlashWidth','lightColor'],
    32:['texFit','texAmount','texBg'],
    33:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'], 34:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
    35:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'], 36:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
    38:['auroraDensity','auroraHeight','auroraSpeed','auroraWave','auroraDark'],
    39:['gdIntensity','gdBeams','gdCloud','gdPulse'],
    41:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
    42:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
    43:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
    44:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
    45:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
    46:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
    47:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
    40:['ambCount','ambSize','ambSoft','ambSpeed','ambDetail'],
  };

  // relevance of the global groups per mode
  const isAmb = m => [33,34,35,36,38,39,40,41,42,43,44,45,46,47].includes(m);
  const isTrans = m => m<=32 && m!==31;            // reveal/movement/advanced apply
  const REL = {
    reveal: m=>isTrans(m), movement: m=>isTrans(m), advanced: m=>isTrans(m),
    points: m=>(m<=32&&m!==31)||m===34, dir: m=>[33,35,36,39,40,41,42,43,44,45,46,47].includes(m), vign: ()=>true,
  };

  function init(E){
    const st=E.state;

    // ── left rail: mode grid (thumbnail tiles) ──
    const left=document.createElement('div'); left.id='ui-left';
    const zoom=document.createElement('div'); zoom.id='thumbzoom'; document.body.appendChild(zoom);
    function showZoom(url,name,el){ const r=el.getBoundingClientRect();
      zoom.innerHTML=`<img src="${url}"><div class="zl">${name}</div>`;
      zoom.style.top=Math.min(window.innerHeight-230, Math.max(8, r.top-30))+'px';
      zoom.style.left=(r.right+8)+'px'; zoom.classList.add('on'); }
    function hideZoom(){ zoom.classList.remove('on'); }
    MODES.forEach(([gname,items])=>{
      const g=document.createElement('div'); g.className='mgroup'+(gname==='Archive'?' mgroup-archive':''); g.innerHTML=`<h4>${gname}</h4>`;
      items.forEach(([id,name])=>{
        const c=document.createElement('button'); c.className='chip'; c.dataset.mode=id;
        const url=`thumbs/m${String(id).padStart(2,'0')}.png`;
        c.innerHTML=`<span class="nm">${name}</span>`;
        c.style.backgroundImage=`url(${url})`;
        c.onclick=()=>{E.setMode(id);selectMode(id);};
        c.onmouseenter=()=>showZoom(url,name,c); c.onmouseleave=hideZoom;
        g.appendChild(c);
      });
      left.appendChild(g);
    });
    document.body.appendChild(left);

    // ── right rail: params ──
    const right=document.createElement('div'); right.id='ui-right';
    right.innerHTML=`<div class="modehead"></div><div id="params"></div>`;
    document.body.appendChild(right);
    const headEl=right.querySelector('.modehead'), paramsEl=right.querySelector('#params');

    // ── bottom bar ──
    const bar=document.createElement('div'); bar.id='ui-bottom';
    bar.innerHTML=`
      <button class="btn ghost" id="t-left" title="modes">◧</button>
      <div class="grp"><label>output</label><select id="ui-size"></select></div>
      <div class="grp" id="ui-wh" style="display:none"><input type="number" id="ui-w"><span style="color:var(--ui-mut)">×</span><input type="number" id="ui-h"></div>
      <div class="sep"></div>
      <div class="grp"><label>dur</label><input type="number" id="ui-dur" min="0.5" max="45" step="0.5" style="width:52px"><span style="color:var(--ui-mut)">s</span></div>
      <div class="sep"></div>
      <div class="grp"><button class="btn" id="ui-play">▶ play</button><button class="btn" id="ui-restart" title="restart from 0">⟳ restart</button><button class="btn" id="ui-loop">loop</button></div>
      <div class="grp" id="scrub-grp"><input type="range" id="ui-scrub" min="0" max="1" step="0.001" value="0" title="scrub the transition (progress)"><span class="val" id="ui-scrub-val">0.00</span></div>
      <div class="sep"></div>
      <div class="grp"><span id="recwrap"><button class="btn rec" id="ui-rec">● record</button><span id="recbar"></span></span></div>
      <div class="sep"></div>
      <div class="grp"><button class="btn" id="ui-sources">sources</button><label class="barchk" title="use the A/B images (off = pure matte)"><input type="checkbox" id="ui-usesrc">use</label><button class="btn" id="ui-presets">presets</button><button class="btn" id="ui-folder">folder</button></div>
      <div class="sep"></div>
      <div class="grp"><label>display</label><select id="ui-disp"></select></div>
      <div class="grp"><label>invert</label><input type="checkbox" id="ui-inv"></div>
      <div class="grp"><button class="btn" id="ui-preview" title="show B/W matte or the colour result on A/B">preview: matte</button></div>
      <button class="btn ghost" id="t-right" title="settings" style="margin-left:auto">◨</button>`;
    document.body.appendChild(bar);

    // rail toggles
    bar.querySelector('#t-left').onclick=()=>document.body.classList.toggle('no-left');
    bar.querySelector('#t-right').onclick=()=>document.body.classList.toggle('no-right');

    // ── popovers (sources / presets / folder) ──
    const pop=document.createElement('div'); pop.id='ui-pop'; document.body.appendChild(pop);
    let popOpen=null;
    function closePop(){ pop.classList.remove('on'); popOpen=null; }
    function openPop(name, anchorBtn, build){
      if(popOpen===name){ closePop(); return; }
      pop.innerHTML=''; build(pop); pop.classList.add('on'); popOpen=name;
      const r=anchorBtn.getBoundingClientRect();
      pop.style.left=Math.max(8, Math.min(window.innerWidth-pop.offsetWidth-8, r.left))+'px';
      pop.style.bottom=(window.innerHeight-r.top+8)+'px';
    }
    document.addEventListener('click',(e)=>{ if(popOpen && !pop.contains(e.target) && !e.target.closest('#ui-sources,#ui-presets,#ui-folder')) closePop(); });

    // SOURCES: relocate the live #side DOM (slot bar + library) into a dedicated
    // host once at init — keeps all of main.js's existing listeners intact.
    const srcHost=document.createElement('div'); srcHost.id='src-host';
    srcHost.innerHTML='<div class="pop-title">SOURCE IMAGES</div>';
    // 'use sources' toggle now lives in the bottom bar (next to the sources button)
    ['slot-bar','library-section'].forEach(id=>{ const el=document.getElementById(id); if(el) srcHost.appendChild(el); });
    { const u=bar.querySelector('#ui-usesrc'); if(u){ u.checked=E.useSources; u.onchange=()=>{ E.setUseSources(u.checked); }; } }
    bar.querySelector('#ui-sources').onclick=()=>{ openPop('sources', bar.querySelector('#ui-sources'), (host)=>{ host.appendChild(srcHost); }); };

    // PRESETS
    bar.querySelector('#ui-presets').onclick=()=>openPop('presets', bar.querySelector('#ui-presets'), (host)=>{
      host.innerHTML='<div class="pop-title">PRESETS</div>';
      const sel=document.createElement('select'); sel.style.width='100%';
      const def=document.createElement('option'); def.value=''; def.textContent='— load preset —'; sel.appendChild(def);
      E.presetOptions().forEach(o=>{const op=document.createElement('option');op.value=o.id;op.textContent=o.label;sel.appendChild(op);});
      sel.onchange=()=>{ if(sel.value){ E.applyPreset(sel.value); } };
      host.appendChild(sel);
      const row=document.createElement('div'); row.className='pop-row';
      const nm=document.createElement('input'); nm.type='text'; nm.placeholder='name'; nm.style.flex='1';
      const sv=document.createElement('button'); sv.className='btn sm'; sv.textContent='save';
      sv.onclick=()=>{ if(E.savePreset(nm.value)){ nm.value=''; bar.querySelector('#ui-presets').click(); bar.querySelector('#ui-presets').click(); } };
      row.appendChild(nm); row.appendChild(sv); host.appendChild(row);
      const del=document.createElement('button'); del.className='btn sm'; del.textContent='delete selected (user)';
      del.style.marginTop='6px'; del.onclick=()=>{ if(E.deletePreset(sel.value)){ bar.querySelector('#ui-presets').click(); bar.querySelector('#ui-presets').click(); } };
      host.appendChild(del);
    });

    // OUTPUT FOLDER
    function refreshFolderBtn(){ const b=bar.querySelector('#ui-folder'); b.textContent='folder: '+(E.folderName||'default'); }
    bar.querySelector('#ui-folder').onclick=()=>openPop('folder', bar.querySelector('#ui-folder'), (host)=>{
      host.innerHTML='<div class="pop-title">OUTPUT FOLDER</div>';
      const cur=document.createElement('div'); cur.className='pop-row'; cur.style.color='var(--ui-mut)'; cur.textContent=E.folderName||'browser default'; host.appendChild(cur);
      if(!E.hasFolderAPI){ const w=document.createElement('div'); w.className='pop-row'; w.textContent='not supported in this browser'; host.appendChild(w); return; }
      const row=document.createElement('div'); row.className='pop-row';
      const pick=document.createElement('button'); pick.className='btn sm'; pick.textContent='📁 pick folder';
      pick.onclick=async()=>{ const n=await E.pickFolder(); if(n){ cur.textContent=n; refreshFolderBtn(); } };
      const usd=document.createElement('button'); usd.className='btn sm'; usd.textContent='use default';
      usd.onclick=async()=>{ await E.clearFolder(); cur.textContent='browser default'; refreshFolderBtn(); };
      row.appendChild(pick); row.appendChild(usd); host.appendChild(row);
    });
    refreshFolderBtn();
    // full-canvas toggle: hide both rails for a big preview (also via Tab)
    const tFull=document.createElement('button'); tFull.className='btn ghost'; tFull.id='t-full'; tFull.textContent='⤢';
    tFull.title='full canvas (Tab)'; bar.insertBefore(tFull, bar.querySelector('#t-right'));
    const toggleFull=()=>{const on=!document.body.classList.contains('no-left'); document.body.classList.toggle('no-left',on); document.body.classList.toggle('no-right',on);};
    tFull.onclick=toggleFull;
    window.addEventListener('keydown',e=>{ if(e.key==='Tab' && e.target.tagName!=='INPUT' && e.target.tagName!=='SELECT'){ e.preventDefault(); toggleFull(); }});

    // ── output size ──
    const SIZES=[['ELVERKET ALL · 8000×4373',[8000,4373]],['ELVERKET Panorama · 8000×3411',[8000,3411]],
      ['ELVERKET Floor · 8160×2719',[8160,2719]],['ELVERKET Long wall · 8160×1920',[8160,1920]],
      ['ELVERKET Short wall · 2719×1920',[2719,1920]],['8K · 7680×4320',[7680,4320]],['6K · 5760×3240',[5760,3240]],
      ['4K · 3840×2160',[3840,2160]],['1440p · 2560×1440',[2560,1440]],['1080p · 1920×1080',[1920,1080]],
      ['720p · 1280×720',[1280,720]],['Square · 1080×1080',[1080,1080]],['Vertical · 1080×1920',[1080,1920]],['custom…','custom']];
    const selSize=bar.querySelector('#ui-size');
    SIZES.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s[0];selSize.appendChild(o);});
    const whBox=bar.querySelector('#ui-wh'), wIn=bar.querySelector('#ui-w'), hIn=bar.querySelector('#ui-h');
    function syncSizeUI(){
      const idx=SIZES.findIndex(s=>Array.isArray(s[1])&&s[1][0]===st.outW&&s[1][1]===st.outH);
      selSize.value=idx>=0?idx:(SIZES.length-1); whBox.style.display=idx>=0?'none':'flex'; wIn.value=st.outW; hIn.value=st.outH;
    }
    selSize.onchange=()=>{const s=SIZES[+selSize.value]; if(s[1]==='custom'){whBox.style.display='flex';return;} E.setSize(s[1][0],s[1][1]); syncSizeUI();};
    wIn.onchange=hIn.onchange=()=>{E.setSize(+wIn.value,+hIn.value); selSize.value=SIZES.length-1;};

    // ── display preview ──
    const selDisp=bar.querySelector('#ui-disp');
    [['Auto (≤1440p)','1440'],['720p','720'],['1080p','1080'],['4K','3840'],['Full','full']].forEach(([l,v])=>{
      const o=document.createElement('option');o.value=v;o.textContent=l;selDisp.appendChild(o);});
    selDisp.value=st.previewScale||'1440'; selDisp.onchange=()=>E.setPreview(selDisp.value);

    // ── duration / invert ──
    const durIn=bar.querySelector('#ui-dur'); durIn.value=st.duration;
    durIn.onchange=()=>{st.duration=Math.max(.5,Math.min(45,+durIn.value));E.save();};
    const inv=bar.querySelector('#ui-inv'); inv.checked=!!st.matteInvert; inv.onchange=()=>{st.matteInvert=inv.checked;};
    const prev=bar.querySelector('#ui-preview');
    const syncPrev=()=>{ const on=E.matteOutput!==false; prev.textContent='preview: '+(on?'matte':'colour'); prev.classList.toggle('on',!on); };
    prev.onclick=()=>{ E.setMatte(E.matteOutput===false); syncPrev(); };
    syncPrev();

    // ── transport ──
    const bPlay=bar.querySelector('#ui-play'), bLoop=bar.querySelector('#ui-loop');
    bPlay.onclick=()=>{E.togglePlay();refreshTransport();};
    bar.querySelector('#ui-restart').onclick=()=>{E.restartPlayback();refreshTransport();};
    bLoop.onclick=()=>{E.toggleLoop();refreshTransport();};
    const scrub=bar.querySelector('#ui-scrub'), scrubVal=bar.querySelector('#ui-scrub-val');
    let scrubbing=false;
    scrub.addEventListener('input',()=>{ scrubbing=true; E.scrub(+scrub.value); scrubVal.textContent=(+scrub.value).toFixed(2); });
    scrub.addEventListener('change',()=>{ scrubbing=false; });
    function refreshTransport(){ bPlay.textContent=E.playing?'❚❚ pause':'▶ play'; bPlay.classList.toggle('on',E.playing); bLoop.classList.toggle('on',E.loop);
      if(!scrubbing){ const t=E.state.t||0; scrub.value=t; scrubVal.textContent=t.toFixed(2); } }
    setInterval(refreshTransport,300); refreshTransport();

    // ── record + progress ──
    const bRec=bar.querySelector('#ui-rec'), recbar=bar.querySelector('#recbar');
    bRec.onclick=()=>E.startRecording();
    setInterval(()=>{
      const ov=document.getElementById('rec-progress'); const on=ov&&getComputedStyle(ov).display!=='none';
      bRec.classList.toggle('busy',!!on);
      if(on){const f=ov.querySelector('.rec-fill'); recbar.style.width=f.style.width;
        recbar.className=''; if(/2ec27a/.test(f.style.background))recbar.classList.add('done');}
      else recbar.style.width='0%';
    },120);

    // ── params builder ──
    function widget(key){
      const spec=P[key]; if(!spec) return null;
      const row=document.createElement('div'); row.className='row';
      if(spec.t==='check'){ row.classList.add('check');
        row.innerHTML=`<label><input type="checkbox"> ${spec.label}</label>`;
        const cb=row.querySelector('input'); cb.checked=!!st[key]; cb.onchange=()=>{st[key]=cb.checked;}; return row;
      }
      if(spec.t==='color'){
        row.innerHTML=`<span class="lab">${spec.label}</span><input type="color">`;
        const ci=row.querySelector('input'); ci.value=st[key]||'#ffffff'; ci.oninput=()=>{st[key]=ci.value;}; return row;
      }
      if(spec.t==='select'){
        row.innerHTML=`<span class="lab">${spec.label}</span><select></select>`;
        const se=row.querySelector('select');
        Object.entries(spec.opts).forEach(([l,v])=>{const o=document.createElement('option');o.value=v;o.textContent=l;se.appendChild(o);});
        se.value=st[key]; se.onchange=()=>{st[key]=isNaN(+se.value)?se.value:+se.value;}; return row;
      }
      const [label,mn,mx,stp]=spec; const dec=(stp+'').includes('.')?(stp+'').split('.')[1].length:0;
      row.innerHTML=`<span class="lab">${label}</span><input type="range" min="${mn}" max="${mx}" step="${stp}"><span class="val"></span>`;
      const r=row.querySelector('input'), v=row.querySelector('.val');
      r.value=st[key]; v.textContent=(+st[key]).toFixed(dec);
      r.oninput=()=>{st[key]=+r.value; v.textContent=(+r.value).toFixed(dec);}; return row;
    }
    function section(title,keys,dim){
      const s=document.createElement('div'); s.className='psec'+(dim?' dim':''); s.innerHTML=`<h4>${title}</h4>`;
      keys.forEach(k=>{const w=widget(k); if(w)s.appendChild(w);}); return s;
    }
    function buildParams(m){
      paramsEl.innerHTML='';
      {
        const fb=document.createElement('div'); fb.className='ptsbar'; fb.style.margin='0 0 10px';
        const rs=document.createElement('button'); rs.className='btn sm'; rs.textContent='↺ reset mode';
        rs.onclick=()=>{ E.resetMode(m); buildParams(m); };
        const rnd=document.createElement('button'); rnd.className='btn sm'; rnd.textContent='🎲 randomize';
        rnd.onclick=()=>{ E.randomizeMode(m); buildParams(m); };
        fb.appendChild(rs); fb.appendChild(rnd); paramsEl.appendChild(fb);
      }
      const _amb = (m>=33 && m<=47 && m!==37);
      if(_amb) paramsEl.appendChild(section('Ambient role',['ambRole'],false));
      if(MK[m]) paramsEl.appendChild(section('this mode',MK[m],false));
      paramsEl.appendChild(section('Reveal',['originAmount','spread'],!REL.reveal(m)));
      paramsEl.appendChild(section('Movement',['turbulence','flow','undulate','animate'],!REL.movement(m)));
      paramsEl.appendChild(section('Direction / source',['driftAngle','driftAmount','sunX','sunY','streakMove'],!REL.dir(m)));
      {
        const ptsRelevant = (m<=32 && m!==31) || m===34;   // transition modes + ripples
        const isPaint = (m===37);
        const curSrc = isPaint ? 'paint' : (E.originSource ? E.originSource() : 'auto');
        const showPaint = isPaint || (ptsRelevant && curSrc==='paint');
        const startKeys = showPaint ? ['paintBrush'] : (curSrc==='points' ? ['pointStagger','pointRandom'] : ['originFromImage']);
        const sec = section('Start points / paint', startKeys, !(ptsRelevant || isPaint));
        if (ptsRelevant || isPaint) {
          if (!isPaint) {
            const selWrap=document.createElement('div'); selWrap.className='ptsbar';
            const lbl=document.createElement('span'); lbl.className='hint'; lbl.textContent='start:';
            const sel=document.createElement('select'); sel.className='mini';
            [['auto','auto (centre / from A)'],['points','points'],['paint','paint a region']].forEach(([v,t])=>{
              const o=document.createElement('option'); o.value=v; o.textContent=t; if(v===curSrc)o.selected=true; sel.appendChild(o);
            });
            sel.onchange=()=>{ E.setOriginSource(sel.value); buildParams(m); };
            selWrap.appendChild(lbl); selWrap.appendChild(sel); sec.appendChild(selWrap);
          }
          const pb=document.createElement('div'); pb.className='ptsbar';
          if (showPaint) {
            if (!isPaint) {
              const bd=document.createElement('span'); bd.className='hint'; bd.textContent='over:';
              const cur=(E.paintBackdrop?E.paintBackdrop():'A');
              const ba=document.createElement('button'); ba.className='btn sm'; ba.textContent='A'; ba.classList.toggle('on',cur==='A');
              const bb=document.createElement('button'); bb.className='btn sm'; bb.textContent='B'; bb.classList.toggle('on',cur==='B');
              ba.onclick=()=>{ E.setPaintBackdrop('A'); ba.classList.add('on'); bb.classList.remove('on'); };
              bb.onclick=()=>{ E.setPaintBackdrop('B'); bb.classList.add('on'); ba.classList.remove('on'); };
              pb.appendChild(bd); pb.appendChild(ba); pb.appendChild(bb);
            }
            const clr=document.createElement('button'); clr.className='btn sm'; clr.textContent='clear';
            clr.onclick=()=>{ E.clearPaint(); };
            pb.appendChild(clr);
            const hint=document.createElement('span'); hint.className='hint'; hint.textContent='drag on the canvas to paint where it starts';
            pb.appendChild(hint);
          } else if (curSrc==='points') {
            const place=document.createElement('button'); place.className='btn sm';
            const sync=()=>{ const on=E.state.placePoints; place.textContent=on?'✓ click canvas — done':'✛ place points'; place.classList.toggle('on',on); };
            place.onclick=()=>{ E.setPlacePoints(!E.state.placePoints); sync(); };
            const clr=document.createElement('button'); clr.className='btn sm'; clr.textContent='clear';
            clr.onclick=()=>{ E.clearPoints(); };
            pb.appendChild(place); pb.appendChild(clr); sync();
          }
          sec.appendChild(pb);
        }
        paramsEl.appendChild(sec);
      }
      paramsEl.appendChild(section('Advanced',['originX','originY','maskScale','curve','seed','maskShift','organic','edges'],!REL.advanced(m)));
      paramsEl.appendChild(section('Vignette (global)',['vignAmount','vignShape','vignFeather','vignTexture','vignAnimate'],false));
    }
    function selectMode(id){
      left.querySelectorAll('.chip').forEach(c=>c.classList.toggle('sel',+c.dataset.mode===id));
      headEl.textContent=MODE_NAME[id]||('mode '+id); buildParams(id);
    }

    syncSizeUI(); selectMode(st.mode);
    setInterval(syncSizeUI, 1500);
  }
})();
