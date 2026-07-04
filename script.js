const hero = document.querySelector(".hero");
const video = document.querySelector("#heroVideo");

let duration = 0;
let isPointerDown = false;
let rafId = 0;
let pendingClientX = null;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function seekFromClientX(clientX) {
  if (!duration || Number.isNaN(duration)) return;

  const rect = hero.getBoundingClientRect();
  const progressFromLeft = clamp((clientX - rect.left) / rect.width, 0, 1);
  const nextTime = clamp(progressFromLeft * duration, 0, duration - 0.015);

  if (Math.abs(video.currentTime - nextTime) > 0.015) {
    if (typeof video.fastSeek === "function") {
      video.fastSeek(nextTime);
    } else {
      video.currentTime = nextTime;
    }
  }
}

function scheduleSeek(clientX) {
  pendingClientX = clientX;
  if (rafId) return;

  rafId = window.requestAnimationFrame(() => {
    rafId = 0;
    seekFromClientX(pendingClientX);
  });
}

function syncDuration() {
  duration = video.duration || 0;
}

video.addEventListener("loadedmetadata", syncDuration);
video.addEventListener("durationchange", syncDuration);

video.addEventListener("loadeddata", () => {
  video.pause();
  video.currentTime = 0;
});

hero.addEventListener("pointerdown", (event) => {
  isPointerDown = true;
  hero.classList.add("is-scrubbing");
  hero.setPointerCapture?.(event.pointerId);
  video.pause();
  scheduleSeek(event.clientX);
});

hero.addEventListener("pointermove", (event) => {
  if (event.pointerType === "mouse" || isPointerDown) {
    scheduleSeek(event.clientX);
  }
});

hero.addEventListener("mousedown", (event) => {
  isPointerDown = true;
  hero.classList.add("is-scrubbing");
  video.pause();
  scheduleSeek(event.clientX);
});

hero.addEventListener("mousemove", (event) => {
  scheduleSeek(event.clientX);
});

hero.addEventListener(
  "touchstart",
  (event) => {
    isPointerDown = true;
    hero.classList.add("is-scrubbing");
    video.pause();
    scheduleSeek(event.touches[0].clientX);
  },
  { passive: true }
);

hero.addEventListener(
  "touchmove",
  (event) => {
    if (event.touches.length) {
      scheduleSeek(event.touches[0].clientX);
    }
  },
  { passive: true }
);

function stopScrubbing(event) {
  isPointerDown = false;
  hero.classList.remove("is-scrubbing");
  if (event?.pointerId !== undefined) {
    hero.releasePointerCapture?.(event.pointerId);
  }
}

hero.addEventListener("pointerup", stopScrubbing);
hero.addEventListener("pointercancel", stopScrubbing);
hero.addEventListener("lostpointercapture", stopScrubbing);
hero.addEventListener("mouseup", stopScrubbing);
hero.addEventListener("mouseleave", stopScrubbing);
hero.addEventListener("touchend", stopScrubbing);
hero.addEventListener("touchcancel", stopScrubbing);

window.addEventListener("beforeunload", () => {
  if (rafId) {
    window.cancelAnimationFrame(rafId);
  }
});
