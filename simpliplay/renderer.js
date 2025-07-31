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

// Load addon script dynamically
function loadAddon(fileURL) {
  // Avoid duplicate scripts
  if (document.querySelector(`script[data-addon="${fileURL}"]`)) return;

  const script = document.createElement('script');
  script.src = fileURL;
  script.type = 'text/javascript';
  script.async = false; // optional, depends on your needs
  script.setAttribute('data-addon', fileURL);

  document.head.appendChild(script);

  console.log(`addon loaded: ${fileURL}`)
  alert("Addon loaded successfully");
}

// Unload addon script by removing the <script> tag
function unloadAddon(fileURL) {
  const script = document.querySelector(`script[data-addon="${fileURL}"]`);
  if (script) {
    script.remove();
    console.log(`addon unloaded: ${fileURL}`)
    alert("Addon unloaded successfully");
  } else {
    console.warn(`No addon script found for: ${fileURL}`);
  }
}


// ✅ Listen for events from main process securely
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

// Listen for load-addon message
window.electron.receive("load-addon", (fileURL) => {
  if (isSafeURL(fileURL)) {
    loadAddon(fileURL);
  } else {
    console.warn("Blocked unsafe script URL:", fileURL);
    alert("There was an issue loading your addon: it may be unsafe");
  }
});

// Listen for unload-addon message
window.electron.receive("unload-addon", (fileURL) => {
    unloadAddon(fileURL);
});

