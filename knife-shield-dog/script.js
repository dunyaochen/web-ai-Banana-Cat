(() => {
  const scrubArea = document.querySelector("[data-scrub-area]");
  const video = document.querySelector("[data-scrub-video]");
  const progress = document.querySelector("[data-scrub-progress]");
  const status = document.querySelector("[data-video-status]");
  const customCursor = document.querySelector("[data-custom-cursor]");

  if (!scrubArea || !video || !progress) return;

  let targetTime = 0;
  let pointerDown = false;

  const renderProgress = (ratio) => {
    progress.style.transform = `scaleX(${ratio})`;
  };

  const seekToTarget = () => {
    const currentDuration = video.duration;
    if (!Number.isFinite(currentDuration) || currentDuration <= 0) return;

    const safeTarget = Math.min(targetTime, Math.max(0, currentDuration - 0.04));
    if (Math.abs(video.currentTime - safeTarget) < 0.012) return;
    video.currentTime = safeTarget;
  };

  const scrubFromPointer = (event) => {
    const ratio = Math.min(1, Math.max(0, event.clientX / window.innerWidth));
    const currentDuration = Number.isFinite(video.duration) ? video.duration : 0;

    targetTime = ratio * currentDuration;
    renderProgress(ratio);
    seekToTarget();
  };

  const initializeVideo = () => {
    video.pause();
    targetTime = 0;
    video.currentTime = 0;
    renderProgress(0);
    if (status) status.textContent = "Video ready. Move horizontally to scrub.";
  };

  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    initializeVideo();
  } else {
    video.addEventListener("loadedmetadata", initializeVideo, { once: true });
  }

  video.addEventListener("error", () => {
    if (status) status.textContent = "The background video could not be loaded.";
  });

  scrubArea.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") scrubFromPointer(event);
  });

  scrubArea.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    scrubArea.setPointerCapture?.(event.pointerId);
    scrubFromPointer(event);
  });

  scrubArea.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse" || pointerDown) scrubFromPointer(event);
  });

  const releasePointer = (event) => {
    pointerDown = false;
    if (scrubArea.hasPointerCapture?.(event.pointerId)) {
      scrubArea.releasePointerCapture(event.pointerId);
    }
  };

  scrubArea.addEventListener("pointerup", releasePointer);
  scrubArea.addEventListener("pointercancel", releasePointer);

  if (customCursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.documentElement.classList.add("has-custom-cursor");

    scrubArea.addEventListener("pointermove", (event) => {
      customCursor.style.opacity = "1";
      customCursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -93%)`;
    });

    scrubArea.addEventListener("pointerleave", () => {
      customCursor.style.opacity = "0";
    });
  }
})();
