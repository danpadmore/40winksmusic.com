// Global variables for audio management
let currentSound = null;
let currentTrackElement = null;
let isPlaying = false;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Add click listener to floating player for seeking
  const floatingPlayer = document.getElementById("floatingPlayer");
  floatingPlayer.addEventListener("click", handleFloatingPlayerClick);

  // Add event listeners to all play buttons
  const playButtons = document.querySelectorAll(".play-btn");
  playButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      playTrack(this);
    });
  });

  // Add event listener to main play button
  const mainPlayBtn = document.getElementById("mainPlayBtn");
  if (mainPlayBtn) {
    mainPlayBtn.addEventListener("click", function (event) {
      event.preventDefault();
      handleMainPlayButton();
    });
  }

  // Add event listener to toggle button
  const toggleBtn = document.getElementById("toggleBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function (event) {
      event.preventDefault();
      togglePlayback();
    });
  }
});

// Handle clicks on the floating player for seeking
function handleFloatingPlayerClick(event) {
  // Don't seek if clicking on the play/pause button
  if (
    event.target.id === "toggleBtn" ||
    event.target.classList.contains("player-btn")
  ) {
    return;
  }

  // Don't seek if no track is loaded
  if (!currentSound) {
    return;
  }

  // Calculate seek position based on click position
  const playerRect = event.currentTarget.getBoundingClientRect();
  const clickX = event.clientX - playerRect.left;
  const playerWidth = playerRect.width;
  const seekPercentage = clickX / playerWidth;

  // Get duration and calculate new position
  const duration = currentSound.duration();
  const newPosition = duration * seekPercentage;

  // Seek to new position
  if (duration > 0) {
    currentSound.seek(newPosition);
  }
}

// Play/pause track functionality
function playTrack(button) {
  const trackItem = button.closest(".track-item");
  const src = trackItem.dataset.src;
  const title = trackItem.dataset.title;

  // If clicking the same track that's currently playing, toggle playback
  if (currentTrackElement === trackItem && currentSound) {
    togglePlayback();
    return;
  }

  // Stop current track if playing and immediately clear its UI state
  if (currentSound) {
    currentSound.stop();
    clearActiveTrack(); // Synchronous cleanup
  }

  // Set the new track element and show loading state
  currentTrackElement = trackItem;
  setLoadingTrack(trackItem, title);

  // Create new sound instance
  currentSound = new Howl({
    src: [src],
    html5: true,
    onload: function () {
      // Only proceed to play if this is still the current track
      if (currentTrackElement === trackItem) {
        currentSound.play();
      }
    },
    onplay: function () {
      // Ensure this is the correct track before updating UI
      if (currentTrackElement === trackItem) {
        isPlaying = true;
        trackItem.classList.remove("loading");
        trackItem.classList.add("current", "playing");
        updateFloatingPlayer(title);
        showFloatingPlayer();
      }
    },
    onpause: function () {
      isPlaying = false;
      if (currentTrackElement) {
        currentTrackElement.classList.remove("playing");
      }
    },
    onstop: function () {
      // This event now only handles manual stops or end of playlist
      isPlaying = false;
      // hideFloatingPlayer();
      // clearActiveTrack();
    },
    onend: function () {
      playNextTrack();
    },
    onloaderror: function (id, err) {
      console.error("Failed to load audio:", src, err);
      // Only clear up if this error belongs to the current track
      if (currentTrackElement === trackItem) {
        clearActiveTrack();
        hideFloatingPlayer();
        currentSound = null;
      }
    },
  });
}

// Toggle play/pause
function togglePlayback() {
  if (!currentSound) return;

  if (isPlaying) {
    currentSound.pause();
  } else {
    currentSound.play();
  }
}

// Handle main play button in intro section
function handleMainPlayButton() {
  // If no track is currently loaded, play the first track
  if (!currentSound || !currentTrackElement) {
    const firstTrack = document.querySelector(".track-item");
    if (firstTrack) {
      const firstPlayButton = firstTrack.querySelector(".play-btn");
      playTrack(firstPlayButton);
    }
  } else {
    // If a track is loaded, toggle playback
    togglePlayback();
  }
}

// Play next track
function playNextTrack() {
  if (!currentTrackElement) return;

  const nextTrack = currentTrackElement.nextElementSibling;
  if (nextTrack && nextTrack.classList.contains("track-item")) {
    const playButton = nextTrack.querySelector(".play-btn");
    playTrack(playButton);
  } else {
    // End of playlist - stop playback
    if (currentSound) {
      currentSound.stop();
    }
  }
}

// Update floating player info
function updateFloatingPlayer(title) {
  const floatingPlayer = document.getElementById("floatingPlayer");
  const trackTitle = floatingPlayer.querySelector(".current-track");
  trackTitle.textContent = title;
  updateTimeDisplay();
}

// Set loading track state
function setLoadingTrack(trackElement, title) {
  // Clear any previous active track
  clearActiveTrack();

  // Set new track as current and loading
  trackElement.classList.add("current", "loading");
  currentTrackElement = trackElement;

  // Update floating player to show loading
  const floatingPlayer = document.getElementById("floatingPlayer");
  const trackTitle = floatingPlayer.querySelector(".current-track");
  trackTitle.textContent = title;

  // Show loading message in time display
  const timeDisplay = document.querySelector(".current-time");
  timeDisplay.textContent = "Loading...";

  // Show floating player
  showFloatingPlayer();
}

// Clear active track styling
function clearActiveTrack() {
  const activeTrack = document.querySelector(".track-item.current");
  if (activeTrack) {
    activeTrack.classList.remove("current", "playing", "loading");
  }
}

// Show floating player
function showFloatingPlayer() {
  const player = document.getElementById("floatingPlayer");
  player.style.display = "flex";

  // Add bottom padding to main content to prevent overlap
  document.querySelector("main").style.paddingBottom = "100px";
}

// Hide floating player
function hideFloatingPlayer() {
  const player = document.getElementById("floatingPlayer");
  player.style.display = "none";

  // Reset progress bar
  const progressBackground = document.getElementById("progressBackground");
  progressBackground.style.width = "0%";

  // Remove bottom padding from main content
  document.querySelector("main").style.paddingBottom = "2rem";
}

// Update time display in floating player
function updateTimeDisplay() {
  if (!currentSound) return;

  const timeDisplay = document.querySelector(".current-time");
  const progressBackground = document.getElementById("progressBackground");

  const updateTime = () => {
    if (!currentSound || !isPlaying) return;

    const seek = currentSound.seek();
    const duration = currentSound.duration();

    const currentTime = formatTime(seek);
    const totalTime = formatTime(duration);

    timeDisplay.textContent = `${currentTime} / ${totalTime}`;

    // Update progress bar
    if (duration > 0) {
      const progress = (seek / duration) * 100;
      progressBackground.style.width = `${progress}%`;
    }

    if (isPlaying) {
      requestAnimationFrame(updateTime);
    }
  };

  updateTime();
}

// Format time in MM:SS format
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Clean up on page unload
window.addEventListener("beforeunload", function () {
  if (currentSound) {
    currentSound.stop();
  }
});
