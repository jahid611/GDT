// Create a shorter notification sound in base64
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18AAAAAAA=="

export const playNotificationSound = () => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND)

    // Only play if the browser allows it
    const playPromise = audio.play()

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Playback prevented:", error)
      })
    }
  } catch (error) {
    console.log("Audio playback error:", error)
  }
}

