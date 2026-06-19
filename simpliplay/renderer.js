let mediaElement = document.getElementById("mediaPlayer");


function loadMedia(fileURL) {
  dialogOverlay.style.display = 'none';

  mediaElement.oncanplay = null;

  if (mediaElement) {
    mediaElement.src = fileURL;
    mediaElement.oncanplay = () => {
      if (autoplayCheckbox && autoplayCheckbox.checked) {
        mediaElement.play().catch(error => console.warn("Playback issue:", error));
      }
    };
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const dropArea = document.createElement('div');
  dropArea.style.position = 'fixed';
  dropArea.style.top = '0';
  dropArea.style.left = '0';
  dropArea.style.width = '100vw';
  dropArea.style.height = '100vh';
  dropArea.style.display = 'none'; // hidden by default
  dropArea.style.zIndex = '0';     // behind everything
  dropArea.style.opacity = '0';    // invisible
  document.body.appendChild(dropArea);
  
  let dragCounter = 0; // track drag events

  window.addEventListener('dragenter', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
          dragCounter++;
          e.preventDefault();
          e.stopPropagation();
      }
  });

  window.addEventListener('dragleave', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
          dragCounter--;
          if (dragCounter <= 0) dragCounter = 0;
          e.preventDefault();
          e.stopPropagation();
      }
  });

  window.addEventListener('dragover', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault(); // allow drop
          e.stopPropagation();
      }
  });


  let previousDropURL = null; //store last object url
  window.previousDropURL = previousDropURL

  window.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (!file) return;

      // cleanup hls and dash instance
      if (window.hls) {
          window.hls.destroy();
          window.hls = null;
      }
      if (window.dash) {
          window.dash.reset();
          window.dash = null;
      }

      // cleanup subtitles
      const tracks = mediaElement.getElementsByTagName('track');
      for (let i = tracks.length - 1; i >= 0; i--) {
          tracks[i].remove();
      }

      // cleanup stored old object url
      // in this case ones dropped into app window
      if (previousDropURL) {
          URL.revokeObjectURL(previousDropURL);
          window.previousDropURL = previousDropURL;
      }

      // cleanup old object url from file picker
      if (window.objectURL) {
          URL.revokeObjectURL(window.objectURL);
      }

      // make new object url for new file
      const fileURL = URL.createObjectURL(file);
      mediaElement.src = fileURL;

      mediaElement.load();
        // autoplay when needed
      if (autoplayCheckbox.checked) {
          mediaElement.play().catch(err => console.warn(err));
      }

      // store the new old object url
      previousDropURL = fileURL;

      // hide dialog
      if (dialogOverlay) dialogOverlay.style.display = 'none';
  });


});

// subtitles
function clearSubtitles() {
  const tracks = mediaElement.getElementsByTagName('track');
  for (let i = tracks.length - 1; i >= 0; i--) {
    tracks[i].remove();
  }
}

// check media url protocol
function isSafeURL(fileURL) {
  try {
    const url = new URL(fileURL);
    return url.protocol === "simpliplay:";
  } catch (error) {
    return false;
  }
}

// load addons
function loadAddon(fileURL) {
  // check for dupes
  if (document.querySelector(`script[data-addon="${fileURL}"]`)) return;

  const script = document.createElement('script');
  script.src = fileURL;
  script.type = 'text/javascript';
  script.async = false;
  script.setAttribute('data-addon', fileURL);

  document.head.appendChild(script);

  console.log(`addon loaded: ${fileURL}`)
  alert("Addon loaded successfully");
}

// remove script el to unload
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


// listen for ipc events
// for new media and cleanup accordingly
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
    console.warn("Blocked media URL:", fileURL);
  }
});

// listen for addon loads
window.electron.receive("load-addon", (fileURL) => {
  if (isSafeURL(fileURL)) {
    loadAddon(fileURL);
  } else {
    console.warn("Blocked unsafe script URL:", fileURL);
    alert("There was an issue loading your addon: URL scheme is incorrect");
  }
});

// unload addons
window.electron.receive("unload-addon", (fileURL) => {
    unloadAddon(fileURL);
});
