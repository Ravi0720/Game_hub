import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GameScore {
  gameId: string
  score: number
  timestamp: number
  playerName?: string
}

export interface GameStats {
  gamesPlayed: number
  totalScore: number
  highScores: Record<string, number>
  achievements: string[]
}

interface GameState {
  scores: GameScore[]
  stats: GameStats
  addScore: (score: GameScore) => void
  getHighScore: (gameId: string) => number
  updateStats: (gameId: string, score: number) => void
  clearScores: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      scores: [],
      stats: {
        gamesPlayed: 0,
        totalScore: 0,
        highScores: {},
        achievements: [],
      },
      addScore: (score) =>
        set((state) => ({
          scores: [...state.scores, score].slice(-100), // Keep last 100 scores
        })),
      getHighScore: (gameId) => {
        const { stats } = get()
        return stats.highScores[gameId] || 0
      },
      updateStats: (gameId, score) =>
        set((state) => ({
          stats: {
            ...state.stats,
            gamesPlayed: state.stats.gamesPlayed + 1,
            totalScore: state.stats.totalScore + score,
            highScores: {
              ...state.stats.highScores,
              [gameId]: Math.max(state.stats.highScores[gameId] || 0, score),
            },
          },
        })),
      clearScores: () =>
        set({
          scores: [],
          stats: {
            gamesPlayed: 0,
            totalScore: 0,
            highScores: {},
            achievements: [],
          },
        }),
    }),
    {
      name: 'game-storage',
    }
  )
)