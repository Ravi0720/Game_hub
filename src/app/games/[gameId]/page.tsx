'use client'

import { useParams } from 'next/navigation'
import { games } from '../data/games'
import { GameLayout } from '../components/game-layout'
import { SnakeGame } from '../components/games/snake-game'
import { TicTacToeGame } from '../components/games/tic-tac-toe-game'
import { Game2048 } from '../components/games/2048-game'
import { MemoryGame } from '../components/games/memory-game'
import { ChessGame } from '../components/games/chess-game'
import { PongGame } from '../components/games/pong-game'
import { GuessNumberGame } from '../components/games/guess-number-game'
import { RockPaperScissorsGame } from '../components/games/rock-paper-scissors-game'
import { DinoJumpGame } from '../components/games/dino-jump-game'
import { WhackAMoleGame } from '../components/games/whack-a-mole-game'
import { TypingSpeedGame } from '../components/games/typing-speed-game'
import { WordScrambleGame } from '../components/games/word-scramble-game'
import { BubbleShooterGame } from '../components/games/bubble-shooter-game'
import { SpaceDodgerGame } from '../components/games/space-dodger-game'
import { TowerStackGame } from '../components/games/tower-stack-game'
import { MemoryMatrixGame } from '../components/games/memory-matrix-game'
import { ReflexGame } from '../components/games/reflex-game'
import { LudoGame } from '../components/games/ludo-game'

const gameComponents: Record<string, React.ComponentType> = {
  'snake': SnakeGame,
  'tic-tac-toe': TicTacToeGame,
  '2048': Game2048,
  'memory-game': MemoryGame,
  'chess': ChessGame,
  'pong': PongGame,
  'guess-number': GuessNumberGame,
  'rock-paper-scissors': RockPaperScissorsGame,
  'dino-jump': DinoJumpGame,
  'whack-a-mole': WhackAMoleGame,
  'typing-speed': TypingSpeedGame,
  'word-scramble': WordScrambleGame,
  'bubble-shooter': BubbleShooterGame,
  'space-dodger': SpaceDodgerGame,
  'tower-stack': TowerStackGame,
  'memory-matrix': MemoryMatrixGame,
  'reflex-game': ReflexGame,
  'ludo': LudoGame,
}

export default function GamePage() {
  const params = useParams()
  const gameId = params.gameId as string

  const game = games.find(g => g.id === gameId)
  const GameComponent = gameComponents[gameId]

  if (!game || !GameComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
          <p className="text-muted-foreground">The game you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <GameLayout game={game}>
      <GameComponent />
    </GameLayout>
  )
}