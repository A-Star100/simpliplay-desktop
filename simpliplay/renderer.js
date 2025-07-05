let mediaElement = document.getElementById("mediaPlayer");


function loadMedia(fileURL) {
  dialogOverlay.style.display = 'none';

  mediaElement.oncanplay = null;

  if (mediaElement) {
    mediaElement.src = fileURL; // ✅ Safe, properly encoded URL
    mediaElement.oncanplay = () => {
      if (autoplayCheckbox && autoplayCheckbox.checked) {
        mediaElement.play().catch(error => console.warn("Playback issue:", error));
      }
    };
  }
}

// Handle submit subtitle URL
function clearSubtitles() {
  const tracks = mediaElement.getElementsByTagName('track');
  for (let i = tracks.length - 1; i >= 0; i--) {
    tracks[i].remove();
  }
}

// Validate media URL
function isSafeURL(fileURL) {
  try {
    const url = new URL(fileURL);
    return url.protocol === "file:";
  } catch (error) {
    return false;
  }
}


// ✅ Listen for "play-media" event from main process securely
window.electron.receive("play-media", (fileURL) => {
  if (isSafeURL(fileURL)) {
    clearSubtitles()
    if (window.hls) {
      window.hls.destroy()
      window.hls = null
    }
    if (window.dash) {
      window.dash.reset()
      window.dash = null
    }
    loadMedia(fileURL);
  } else {
    console.warn("Blocked unsafe media URL:", fileURL);
  }
});
