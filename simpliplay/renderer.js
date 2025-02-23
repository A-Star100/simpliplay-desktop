// Listen for media file URL from main process
window.electron.receive("play-media", (fileURL) => {
  loadMedia(fileURL);
});

function loadMedia(fileURL) {
  dialogOverlay.style.display = 'none';
  const mediaElement = document.getElementById("mediaPlayer");

  if (mediaElement) {
    mediaElement.src = fileURL; // ✅ Safe, properly encoded URL
    if (autoplayCheckbox && autoplayCheckbox.checked) {
      mediaElement.play();
    }
  }
}
