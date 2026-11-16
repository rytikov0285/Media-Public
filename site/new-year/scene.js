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

  makeSnow();
  setScene("intro");
})();