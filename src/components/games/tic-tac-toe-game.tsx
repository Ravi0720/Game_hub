'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Trophy, Users, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/game-store'
import toast from 'react-hot-toast'

type Player = 'X' | 'O' | null
type GameMode = 'human' | 'ai'

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
]

export function TicTacToeGame() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [gameMode, setGameMode] = useState<GameMode>('human')
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Player | 'draw'>(null)
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 })

  const { addScore, updateStats, getHighScore } = useGameStore()
  const highScore = getHighScore('tic-tac-toe')

  const checkWinner = useCallback((board: Player[]): Player | 'draw' | null => {
    // Check for winner
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    
    // Check for draw
    if (board.every(cell => cell !== null)) {
      return 'draw'
    }
    
    return null
  }, [])

  const minimax = useCallback((board: Player[], depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(board)
    
    if (result === 'O') return 10 - depth
    if (result === 'X') return depth - 10
    if (result === 'draw') return 0

    if (isMaximizing) {
      let bestScore = -Infinity
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O'
          const score = minimax(board, depth + 1, false)
          board[i] = null
          bestScore = Math.max(score, bestScore)
        }
      }
      return bestScore
    } else {
      let bestScore = Infinity
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X'
          const score = minimax(board, depth + 1, true)
          board[i] = null
          bestScore = Math.min(score, bestScore)
        }
      }
      return bestScore
    }
  }, [checkWinner])

  const getBestMove = useCallback((board: Player[]): number => {
    let bestScore = -Infinity
    let bestMove = -1

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O'
        const score = minimax(board, 0, false)
        board[i] = null
        if (score > bestScore) {
          bestScore = score
          bestMove = i
        }
      }
    }

    return bestMove
  }, [minimax])

  const makeMove = useCallback((index: number) => {
    if (board[index] || gameOver) return

    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    const result = checkWinner(newBoard)
    if (result) {
      setGameOver(true)
      setWinner(result)
      
      const newScores = { ...scores }
      if (result === 'draw') {
        newScores.draws++
        toast.success("It's a draw!")
      } else {
        newScores[result]++
        toast.success(`${result} wins!`)
        
        const points = result === 'X' ? 10 : 5
        addScore({ gameId: 'tic-tac-toe', score: points, timestamp: Date.now() })
        updateStats('tic-tac-toe', points)
      }
      setScores(newScores)
    } else {
      const nextPlayer = currentPlayer === 'X' ? 'O' : 'X'
      setCurrentPlayer(nextPlayer)
      
      // AI move
      if (gameMode === 'ai' && nextPlayer === 'O') {
        setTimeout(() => {
          const aiMove = getBestMove(newBoard)
          if (aiMove !== -1) {
            const aiBoard = [...newBoard]
            aiBoard[aiMove] = 'O'
            setBoard(aiBoard)
            
            const aiResult = checkWinner(aiBoard)
            if (aiResult) {
              setGameOver(true)
              setWinner(aiResult)
              
              const newScores = { ...scores }
              if (aiResult === 'draw') {
                newScores.draws++
                toast.success("It's a draw!")
              } else {
                newScores[aiResult]++
                toast.success(`${aiResult} wins!`)
                
                const points = aiResult === 'X' ? 10 : 5
                addScore({ gameId: 'tic-tac-toe', score: points, timestamp: Date.now() })
                updateStats('tic-tac-toe', points)
              }
              setScores(newScores)
            } else {
              setCurrentPlayer('X')
            }
          }
        }, 500)
      }
    }
  }, [board, currentPlayer, gameOver, gameMode, scores, checkWinner, getBestMove, addScore, updateStats])

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setGameOver(false)
    setWinner(null)
  }, [])

  const resetScores = useCallback(() => {
    setScores({ X: 0, O: 0, draws: 0 })
  }, [])

  return (
    <div className="flex flex-col items-center space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{scores.X}</div>
            <div className="text-sm text-muted-foreground">Player X</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">{scores.draws}</div>
            <div className="text-sm text-muted-foreground">Draws</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{scores.O}</div>
            <div className="text-sm text-muted-foreground">
              {gameMode === 'ai' ? 'AI' : 'Player O'}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center space-x-4 mb-4">
        <Button
          onClick={() => setGameMode('human')}
          variant={gameMode === 'human' ? 'default' : 'outline'}
          size="sm"
        >
          <Users className="h-4 w-4 mr-2" />
          2 Players
        </Button>
        <Button
          onClick={() => setGameMode('ai')}
          variant={gameMode === 'ai' ? 'default' : 'outline'}
          size="sm"
        >
          <Cpu className="h-4 w-4 mr-2" />
          vs AI
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="grid grid-cols-3 gap-2 p-4 bg-background/50 rounded-xl border-2 border-primary/20">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => makeMove(index)}
              className="w-20 h-20 bg-background border-2 border-border rounded-lg flex items-center justify-center text-3xl font-bold transition-colors hover:bg-accent disabled:cursor-not-allowed"
              disabled={cell !== null || gameOver}
            >
              {cell && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cell === 'X' ? 'text-blue-500' : 'text-red-500'}
                >
                  {cell}
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>

        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center"
          >
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-2">
                {winner === 'draw' ? "It's a Draw!" : `${winner} Wins!`}
              </h3>
              <Button onClick={resetGame} className="bg-primary hover:bg-primary/90">
                <RotateCcw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="flex items-center space-x-4">
        <Button onClick={resetGame} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          New Game
        </Button>
        
        <Button onClick={resetScores} variant="outline" size="sm">
          Reset Scores
        </Button>
      </div>

      {!gameOver && (
        <div className="text-center">
          <p className="text-lg font-medium">
            Current Player: <span className={currentPlayer === 'X' ? 'text-blue-500' : 'text-red-500'}>{currentPlayer}</span>
          </p>
          {gameMode === 'ai' && currentPlayer === 'O' && (
            <p className="text-sm text-muted-foreground">AI is thinking...</p>
          )}
        </div>
      )}
    </div>
  )
}