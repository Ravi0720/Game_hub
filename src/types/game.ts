export interface Game {
  id: string
  title: string
  description: string
  emoji: string
  rating: number
  players: string
  tags: string[]
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: 'Action' | 'Puzzle' | 'Strategy' | 'Arcade' | 'Word' | 'Memory'
}

export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  level: number
  lives: number
  timeLeft?: number
}

export interface GameConfig {
  width: number
  height: number
  fps: number
  sounds: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}