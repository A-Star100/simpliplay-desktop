// Listen for media file path from main process
window.electron.receive("play-media", (filePath) => {
  loadMedia(filePath);
});

// Function to load and play media file
function loadMedia(filePath) {
  dialogOverlay.style.display = 'none';
  const mediaElement = document.getElementById("mediaPlayer");
  if (mediaElement) {
    mediaElement.src = `file://${filePath}`; // ✅ Convert file path to a valid URL
    if (autoplayCheckbox && autoplayCheckbox.checked) {
      mediaElement.play();
    }
  }
}

