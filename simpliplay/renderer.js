function loadMedia(fileURL) {
  dialogOverlay.style.display = 'none';
  const mediaElement = document.getElementById("mediaPlayer");

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
    loadMedia(fileURL);
  } else {
    console.warn("Blocked unsafe media URL:", fileURL);
  }
});
