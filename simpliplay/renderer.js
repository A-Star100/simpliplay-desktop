let mediaElement = document.getElementById("mediaPlayer");
let midiPlayerElement = document.getElementById("midiPlayer");
let midiVisualizerElement = document.getElementById("myVisualizer");

    mediaElement.style.display = 'flex';


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

function isMidi(fileURL) {
  try {
    const url = new URL(fileURL);
    return (url.toLowerCase().endsWith('.mid') || url.toLowerCase().endsWith('.midi'))
  } catch (error) {
    return false;
  }
}

// ✅ Listen for "play-media" event from main process securely
window.electron.receive("play-media", (fileURL) => {
  if (isSafeURL(fileURL)) {
    clearSubtitles()
    loadMedia(fileURL);
  } else {
    console.warn("Blocked unsafe media URL:", fileURL);
  }

  if (isMidi(fileURL)) {
    midiPlayerElement.src = fileURL;
    midiPlayerElement.style.display = 'flex';
    midiPlayerVisualizer.style.display = 'flex';
    mediaElement.style.display = 'none';
    mediaElement.pause();
    if (autoplayCheckbox && autoplayCheckbox.checked) {
        midiPlayerElement.play().catch(error => console.warn("Playback issue:", error));
    }
  } else {
    midiPlayerElement.style.display = 'none';
    midiPlayerVisualizer.style.display = 'none';
    mediaElement.style.display = 'flex';
  }
});
