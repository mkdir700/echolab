export const VIDEO_FORMATS = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/mkv',
  'video/webm',
  'video/ogg'
]

export const VIDEO_EXTENSIONS = /\.(mp4|avi|mov|mkv|webm|ogg)$/i

export const SUBTITLE_EXTENSIONS = '.json,.srt,.vtt'

export const KEYBOARD_SHORTCUTS = {
  SPACE: 'Space',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  KEY_R: 'KeyR',
  KEY_H: 'KeyH',
  KEY_M: 'KeyM'
} as const

export const PLAYBACK_RATES = {
  MIN: 0.5,
  MAX: 2,
  STEP: 0.1,
  DEFAULT: 1
}

export const VOLUME_SETTINGS = {
  MIN: 0,
  MAX: 1,
  STEP: 0.05,
  DEFAULT: 1,
  KEYBOARD_STEP: 0.1
}

export const SEEK_STEP = 5 // seconds

export const SIDEBAR_SETTINGS = {
  MIN_WIDTH: 280,
  DEFAULT_WIDTH: 380,
  MAX_WIDTH_RATIO: 0.6
}

export const THROTTLE_DELAYS = {
  SCROLL: 50,
  RESIZE: 16 // 60fps
}

export const AUTO_SCROLL_SETTINGS = {
  TIMEOUT: 5000, // 5 seconds
  COMPLETION_DELAY: 500,
  MIN_SCROLL_THRESHOLD: 8,
  NEAR_START_ITEMS: 3,
  NEAR_END_ITEMS: 3,
  VERTICAL_OFFSET_RATIO: 0.1
}

export const MEDIA_ERROR_MESSAGES = {
  [MediaError.MEDIA_ERR_ABORTED]: '视频播放被中止',
  [MediaError.MEDIA_ERR_NETWORK]: '网络错误，无法加载视频',
  [MediaError.MEDIA_ERR_DECODE]: '视频解码失败，可能是编解码器不支持',
  [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: '不支持的视频格式或源'
} as const
