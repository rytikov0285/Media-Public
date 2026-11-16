(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const photoInput = $("photoInput");
  const audioInput = $("audioInput");
  const heroineImage = $("heroineImage");
  const heroinePlaceholder = $("heroinePlaceholder");
  const songAudio = $("songAudio");
  const playButton = $("playButton");
  const stopButton = $("stopButton");
  const toast = $("toast");
  const sceneCopy = {
    intro: ["Волшебная ночь начинается", "Свет загорается, и героиня выходит на сцену"],
    verse: ["Зимняя сказка оживает", "Мягкий свет, искрящийся снег и тёплая улыбка"],
    chorus: ["С Новым годом!", "Праздник наполняет сцену сиянием и движением"],
    finale: ["Пусть сбудутся мечты!", "Звёзды сияют, а новогоднее чудо остаётся с нами"]
  };
  let photoUrl = null;
  let audioUrl = null;
  let audioContext = null;
  let analyser = null;
  let sourceNode = null;
  let animationFrame = 0;
  let toastTimer = 0;
  let motionIntensity = 0.65;
  let motionEnabled = true;
  let smoothedLevel = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const rig = { image:null, imageUrl:null, points:[], masks:{}, layers:{}, joints:{}, activePart:"head", scale:1, offsetX:0, offsetY:0, poseTest:false };

  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function setScene(name) {
    if (!sceneCopy[name]) return;
    stage.dataset.scene = name;
    $("sceneTitle").textContent = sceneCopy[name][0];
    $("sceneSubtitle").textContent = sceneCopy[name][1];
    document.querySelectorAll(".scene-button").forEach((button) => {
      const active = button.dataset.scene === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    stage.dataset.motion = motionEnabled && !reducedMotion.matches ? "on" : "off";
  }

  document.querySelectorAll(".scene-button").forEach((button) => {
    button.addEventListener("click", () => setScene(button.dataset.scene));
  });

  function makeSnow() {
    const layer = $("snowLayer");
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 52; i += 1) {
      const flake = document.createElement("i");
      flake.className = "snowflake";
      flake.style.setProperty("--x", (Math.random() * 100).toFixed(2) + "%");
      flake.style.setProperty("--size", (2 + Math.random() * 4).toFixed(1) + "px");
      flake.style.setProperty("--opacity", (0.25 + Math.random() * 0.7).toFixed(2));
      flake.style.setProperty("--duration", (5 + Math.random() * 9).toFixed(2) + "s");
      flake.style.setProperty("--delay", (-Math.random() * 12).toFixed(2) + "s");
      fragment.appendChild(flake);
    }
    layer.appendChild(fragment);
  }

  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      notify("Выберите изображение JPG, PNG или WebP.");
      photoInput.value = "";
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      notify("Размер фотографии не должен превышать 12 МБ.");
      photoInput.value = "";
      return;
    }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(file);
    heroineImage.onload = () => {
      heroineImage.hidden = false;
      heroinePlaceholder.hidden = true;
      $("photoStatus").textContent = file.name + " · " + Math.round(file.size / 1024) + " КБ";
      notify("Фотография героини добавлена в сцену.");
    };
    heroineImage.onerror = () => notify("Не удалось открыть выбранное изображение.");
    heroineImage.src = photoUrl;
  });

  audioInput.addEventListener("change", () => {
    const file = audioInput.files && audioInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      notify("Выберите аудиофайл.");
      audioInput.value = "";
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      notify("Размер аудиофайла не должен превышать 80 МБ.");
      audioInput.value = "";
      return;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(file);
    songAudio.src = audioUrl;
    songAudio.load();
    $("audioStatus").textContent = file.name + " · " + Math.round(file.size / 1024) + " КБ";
    $("playState").textContent = "Аудио загружено";
    playButton.disabled = false;
    stopButton.disabled = false;
    notify("Аудиозапись готова к воспроизведению.");
  });

  function connectAnalyser() {
    if (analyser || !window.AudioContext && !window.webkitAudioContext) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    sourceNode = audioContext.createMediaElementSource(songAudio);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  function animateAudio() {
    if (!analyser) return;
    const values = new Uint8Array(analyser.frequencyBinCount);
    const bars = $("audioPulse").querySelectorAll("i");
    const tick = () => {
      if (songAudio.paused) {
        bars.forEach((bar, index) => { bar.style.height = (18 + (index % 3) * 5) + "%"; });
        animationFrame = 0;
        return;
      }
      analyser.getByteFrequencyData(values);
      let total = 0;
      for (let index = 0; index < values.length; index += 1) total += values[index];
      const level = values.length ? total / values.length / 255 : 0;
      smoothedLevel += (level - smoothedLevel) * 0.16;
      stage.style.setProperty("--music-motion", String(Math.min(1, smoothedLevel * 2.2)));
      stage.style.setProperty("--music-tempo", (3.4 - Math.min(1, smoothedLevel * 2.2) * 1.1).toFixed(2) + "s");
      bars.forEach((bar, index) => {
        const value = values[index * 2] || 0;
        bar.style.height = Math.max(12, Math.min(100, value * .85)) + "%";
      });
      animationFrame = requestAnimationFrame(tick);
    };
    if (!animationFrame) animationFrame = requestAnimationFrame(tick);
  }

  playButton.addEventListener("click", async () => {
    if (!songAudio.paused) {
      songAudio.pause();
      playButton.textContent = "▶ Продолжить";
      $("playState").textContent = "Пауза";
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      return;
    }
    try {
      connectAnalyser();
      if (audioContext && audioContext.state === "suspended") await audioContext.resume();
      await songAudio.play();
      playButton.textContent = "Ⅱ Пауза";
      $("playState").textContent = "Идёт воспроизведение";
      animateAudio();
    } catch (error) {
      notify("Не удалось воспроизвести аудио. Проверьте формат файла.");
    }
  });

  stopButton.addEventListener("click", () => {
    songAudio.pause();
    songAudio.currentTime = 0;
    playButton.textContent = "▶ Воспроизвести";
    $("playState").textContent = "Воспроизведение остановлено";
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  });

  songAudio.addEventListener("ended", () => {
    playButton.textContent = "▶ Воспроизвести";
    $("playState").textContent = "Песня завершена";
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  });

  $("volumeInput").addEventListener("input", (event) => {
    songAudio.volume = Number(event.target.value);
    $("volumeValue").textContent = Math.round(songAudio.volume * 100) + "%";
  });
  songAudio.volume = 0.8;

  const motionEnabledInput = $("motionEnabled");
  const motionIntensityInput = $("motionIntensity");
  function applyMotionSettings() {
    stage.dataset.motion = motionEnabled && !reducedMotion.matches ? "on" : "off";
    stage.style.setProperty("--motion-intensity", String(motionIntensity));
    $("motionIntensityValue").textContent = Math.round(motionIntensity * 100) + "%";
    if (!motionEnabled || reducedMotion.matches) {
      stage.style.setProperty("--music-motion", "0");
    }
  }
  motionEnabledInput.addEventListener("change", () => {
    motionEnabled = motionEnabledInput.checked;
    applyMotionSettings();
  });
  motionIntensityInput.addEventListener("input", () => {
    motionIntensity = Number(motionIntensityInput.value);
    applyMotionSettings();
  });
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", applyMotionSettings);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(applyMotionSettings);
  }
  applyMotionSettings();

  window.addEventListener("beforeunload", () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (audioContext) audioContext.close();
  });

  function initRigEditor() {
    const canvas = $("rigCanvas"), ctx = canvas.getContext("2d");
    const preview = $("rigPreview"), pctx = preview.getContext("2d");
    const fileInput = $("rigPhotoInput"), partSelect = $("rigPart"), modeSelect = $("rigMode"), jointSelect = $("rigJoint");
    const closeBtn = $("rigClosePolygon"), undoBtn = $("rigUndo"), clearBtn = $("rigClear");
    const buildBtn = $("rigBuildLayers"), exportBtn = $("rigExport"), poseBtn = $("rigPose");
    const applyBtn = $("rigApplyDeform"), resetBtn = $("rigResetDeform");
    const status = $("rigStatus"), empty = $("rigEmpty");
    const palette = {head:"#f4c66a",torso:"#73c9ff",leftUpperArm:"#f28b82",leftForearm:"#c3a6ff",leftHand:"#f9a8d4",rightUpperArm:"#81c995",rightForearm:"#f6ad55",rightHand:"#9caeff"};
    const say = (message) => { status.textContent = message; };
    let deformation = null;
    const fit = (target) => {
      if (!rig.image) return;
      const scale = Math.min(target.width / rig.image.width, target.height / rig.image.height);
      return {scale, x:(target.width-rig.image.width*scale)/2, y:(target.height-rig.image.height*scale)/2};
    };
    const sourcePoint = (x,y,view) => ({x:(x-view.x)/view.scale,y:(y-view.y)/view.scale});
    const viewPoint = (p,view) => ({x:view.x+p.x*view.scale,y:view.y+p.y*view.scale});
    function drawEditor() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (!rig.image) return;
      const view=fit(canvas);
      ctx.fillStyle="#091526";ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(rig.image,view.x,view.y,rig.image.width*view.scale,rig.image.height*view.scale);
      Object.entries(rig.masks).forEach(([name,poly])=>{
        if(poly.length<3)return;
        ctx.beginPath();poly.forEach((p,i)=>{const q=viewPoint(p,view);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});
        ctx.closePath();ctx.fillStyle=(palette[name]||"#fff")+"35";ctx.strokeStyle=palette[name]||"#fff";ctx.lineWidth=2;ctx.fill();ctx.stroke();
      });
      if(rig.points.length){
        ctx.beginPath();rig.points.forEach((p,i)=>{const q=viewPoint(p,view);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});
        ctx.strokeStyle=palette[rig.activePart]||"#fff";ctx.lineWidth=2;ctx.stroke();
        rig.points.forEach(p=>{const q=viewPoint(p,view);ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.strokeStyle=palette[rig.activePart]||"#fff";ctx.stroke()});
      }
      Object.entries(rig.joints).filter(([name])=>!name.endsWith("Solved")).forEach(([name,p])=>{
        const q=viewPoint(p,view);ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fillStyle="#ffe08a";ctx.fill();ctx.strokeStyle="#17263c";ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle="#fff";ctx.font="12px sans-serif";ctx.fillText(name,q.x+9,q.y-8);
      });
    }
    function drawPreview() {
      pctx.clearRect(0,0,preview.width,preview.height);
      if(!rig.image)return;
      const view=fit(preview);
      pctx.fillStyle="#091526";pctx.fillRect(0,0,preview.width,preview.height);
      pctx.save();pctx.setTransform(view.scale,0,0,view.scale,view.x,view.y);
      const drawLayer=(name)=>{const layer=rig.layers[name];if(layer)pctx.drawImage(layer,0,0);};
      const rotateAround=(point,angle)=>{pctx.translate(point.x,point.y);pctx.rotate(angle);pctx.translate(-point.x,-point.y);};
      const staticOrder=["torso","neck","head"];
      staticOrder.forEach(drawLayer);
      ["left","right"].forEach(side=>{
        const shoulder=rig.joints[side+"Shoulder"], elbow=rig.joints[side+"Elbow"], wrist=rig.joints[side+"Wrist"];
        const solved=deformation&&deformation[side];
        const upperAngle=solved?solved.upperAngle:0;
        const foreAngle=solved?solved.foreAngle:0;
        const handAngle=solved?solved.handAngle:0;
        if(shoulder){
          pctx.save();rotateAround(shoulder,upperAngle);drawLayer(side+"UpperArm");
          if(elbow){
            pctx.save();rotateAround(elbow,foreAngle);drawLayer(side+"Forearm");
            if(wrist){pctx.save();rotateAround(wrist,handAngle);drawLayer(side+"Hand");pctx.restore();}
            pctx.restore();
          }
          pctx.restore();
        } else {
          drawLayer(side+"UpperArm");drawLayer(side+"Forearm");drawLayer(side+"Hand");
        }
      });
      Object.keys(rig.layers).filter(name=>!staticOrder.includes(name)&&!/(left|right)(UpperArm|Forearm|Hand)/.test(name)).forEach(drawLayer);
      pctx.restore();
    }
    function draw(){drawEditor();drawPreview();}
    function solveTwoBone(a,target,l1,l2,bend){
      const dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy);
      if(!(l1>0&&l2>0&&d>0))return null;
      const min=Math.abs(l1-l2)+1e-4,max=l1+l2-1e-4,dist=Math.max(min,Math.min(max,d));
      const along=(l1*l1-l2*l2+dist*dist)/(2*dist);
      const height=Math.sqrt(Math.max(0,l1*l1-along*along));
      const resolvedTarget={x:a.x+dx/dist*dist,y:a.y+dy/dist*dist};
      return {elbow:{x:a.x+dx/dist*along-bend*dy/dist*height,y:a.y+dy/dist*along+bend*dx/dist*height},target:resolvedTarget};
    }
    function makeDeformation(){
      const next={};
      for(const side of ["left","right"]){
        const shoulder=rig.joints[side+"Shoulder"],elbow=rig.joints[side+"Elbow"],wrist=rig.joints[side+"Wrist"];
        if(!shoulder||!elbow||!wrist)throw new Error("Не расставлены все суставы руки: "+side);
        const l1=Math.hypot(elbow.x-shoulder.x,elbow.y-shoulder.y);
        const l2=Math.hypot(wrist.x-elbow.x,wrist.y-elbow.y);
        if(l1<1||l2<1)throw new Error("Нулевая длина сегмента руки: "+side);
        const direction=side==="left"?-1:1;
        const reach=Math.max(12,(l1+l2)*0.18);
        const target={x:wrist.x+direction*reach,y:wrist.y-reach*0.65};
        const solution=solveTwoBone(shoulder,target,l1,l2,side==="left"?1:-1);
        if(!solution)throw new Error("IK не смог решить цепочку: "+side);
        const solved=solution.elbow,resolvedTarget=solution.target;
        const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
        const upperAngle=angle(shoulder,solved)-angle(shoulder,elbow);
        const foreAngle=angle(solved,resolvedTarget)-angle(elbow,wrist);
        next[side]={target:resolvedTarget,elbow:solved,upperAngle,foreAngle,handAngle:foreAngle};
      }
      return next;
    }
    function drawBones(){
      ["left","right"].forEach(side=>{
        const a=rig.joints[side+"Shoulder"],b=deformation?.[side]?.elbow||rig.joints[side+"Elbow"],c=deformation?.[side]?.target||rig.joints[side+"Wrist"];
        if(!a||!b||!c)return;
        const view=fit(canvas),p=viewPoint(a,view),q=viewPoint(b,view),r=viewPoint(c,view);
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);
        ctx.strokeStyle=side==="left"?"#ff9b91":"#8ee0ad";ctx.lineWidth=4;ctx.stroke();
      });
    }
    const baseDrawEditor=drawEditor;
    function refresh(){draw();if(deformation)drawBones();}
    fileInput.addEventListener("change",()=>{
      const file=fileInput.files&&fileInput.files[0];if(!file)return;
      if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>12*1024*1024){say("Нужен JPG, PNG или WebP до 12 МБ.");fileInput.value="";return;}
      if(rig.imageUrl)URL.revokeObjectURL(rig.imageUrl);
      rig.imageUrl=URL.createObjectURL(file);const img=new Image();
      img.onload=()=>{rig.image=img;rig.points=[];rig.masks={};rig.layers={};rig.joints={};deformation=null;empty.hidden=true;
        [closeBtn,undoBtn,clearBtn,buildBtn].forEach(b=>b.disabled=false);exportBtn.disabled=false;poseBtn.disabled=true;applyBtn.disabled=true;resetBtn.disabled=true;
        draw();say("Фото загружено локально: "+img.naturalWidth+"×"+img.naturalHeight+". Обведите сегменты.");};
      img.onerror=()=>say("Не удалось прочитать изображение.");img.src=rig.imageUrl;
    });
    partSelect.addEventListener("change",()=>{rig.activePart=partSelect.value;rig.points=[];draw();say("Активный сегмент: "+partSelect.options[partSelect.selectedIndex].text);});
    canvas.addEventListener("click",e=>{
      if(!rig.image)return;const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*canvas.width/rect.width,y=(e.clientY-rect.top)*canvas.height/rect.height;
      const point=sourcePoint(x,y,fit(canvas));
      if(modeSelect.value==="joint"){rig.joints[jointSelect.value]=point;deformation=null;applyBtn.disabled=false;resetBtn.disabled=true;draw();say("Сустав "+jointSelect.options[jointSelect.selectedIndex].text+" установлен.");return;}
      rig.points.push(point);undoBtn.disabled=false;closeBtn.disabled=rig.points.length<3;draw();
    });
    undoBtn.addEventListener("click",()=>{rig.points.pop();undoBtn.disabled=!rig.points.length;closeBtn.disabled=rig.points.length<3;draw();});
    clearBtn.addEventListener("click",()=>{delete rig.masks[rig.activePart];delete rig.layers[rig.activePart];rig.points=[];deformation=null;draw();say("Маска сегмента очищена.");});
    closeBtn.addEventListener("click",()=>{if(rig.points.length<3)return;rig.masks[rig.activePart]=rig.points.map(p=>({...p}));rig.points=[];undoBtn.disabled=true;closeBtn.disabled=true;draw();say("Маска "+rig.activePart+" сохранена.");});
    buildBtn.addEventListener("click",()=>{
      if(!rig.image)return;rig.layers={};
      Object.entries(rig.masks).forEach(([name,poly])=>{
        if(poly.length<3)return;
        const layer=document.createElement("canvas");layer.width=rig.image.naturalWidth;layer.height=rig.image.naturalHeight;
        const lc=layer.getContext("2d");lc.save();lc.beginPath();poly.forEach((p,i)=>i?lc.lineTo(p.x,p.y):lc.moveTo(p.x,p.y));lc.closePath();lc.clip();lc.drawImage(rig.image,0,0);lc.restore();rig.layers[name]=layer;
      });
      const count=Object.keys(rig.layers).length;poseBtn.disabled=count<3;applyBtn.disabled=count===0;draw();
      say("Создано "+count+" RGBA-слоёв. Для деформации нужны маски верхней руки, предплечья и кисти с обеих сторон.");
    });
    poseBtn.addEventListener("click",()=>{
      try{deformation=makeDeformation();rig.joints.leftElbowSolved=deformation.left.elbow;rig.joints.rightElbowSolved=deformation.right.elbow;draw();drawBones();say("IK рассчитан. Это проверка геометрии; нажмите «Применить деформацию спрайтов» для рендеринга RGBA-слоёв.");}
      catch(error){say(error.message);}
    });
    applyBtn.addEventListener("click",()=>{
      const required=["leftUpperArm","leftForearm","leftHand","rightUpperArm","rightForearm","rightHand"];
      const missing=required.filter(name=>!rig.layers[name]);
      if(missing.length){say("Не хватает RGBA-слоёв: "+missing.join(", ")+". Сначала создайте соответствующие маски.");return;}
      try{deformation=makeDeformation();draw();drawBones();resetBtn.disabled=false;say("Деформация применена: 6 сегментов рук отрисованы с вращением вокруг суставов. Скрытые пиксели не восстанавливаются.");}
      catch(error){say(error.message);}
    });
    resetBtn.addEventListener("click",()=>{deformation=null;delete rig.joints.leftElbowSolved;delete rig.joints.rightElbowSolved;draw();resetBtn.disabled=true;say("Деформация сброшена; RGBA-слои показаны в исходной позе.");});
    exportBtn.addEventListener("click",()=>{
      const data={schema:"media-public.heroine-rig.v2",image:{width:rig.image?.naturalWidth||0,height:rig.image?.naturalHeight||0},masks:rig.masks,joints:rig.joints,parts:Object.keys(rig.layers),deformation:deformation?Object.fromEntries(Object.entries(deformation).map(([side,v])=>[side,{target:v.target,elbow:v.elbow,upperAngle:v.upperAngle,foreAngle:v.foreAngle,handAngle:v.handAngle}])):null,engine:"piecewise-rigid-canvas-2d",note:"Source pixels remain local; hidden anatomy is not reconstructed."};
      const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="heroine-rig-project.json";a.click();URL.revokeObjectURL(url);say("Метаданные рига v2 экспортированы; изображение не включено.");
    });
    draw();
  }

  initRigEditor();
  makeSnow();
  setScene("intro");
})();