// Listen for media file path from main process
window.electron.receive("play-media", (filePath) => {
  loadMedia(filePath);
});

function loadMedia(filePath) {
  dialogOverlay.style.display = 'none';
  const mediaElement = document.getElementById("mediaPlayer");
  if (mediaElement) {
    // Encode special characters in the file path
    const encodedFilePath = encodeURI(`file://${filePath}`);

    mediaElement.src = encodedFilePath; // ✅ Use encoded file path
    if (autoplayCheckbox && autoplayCheckbox.checked) {
      mediaElement.play();
    }
  }
}


