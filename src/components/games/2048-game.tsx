'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Trophy, Undo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/game-store'
import toast from 'react-hot-toast'

type Board = number[][]
type Direction = 'up' | 'down' | 'left' | 'right'

const GRID_SIZE = 4
const INITIAL_BOARD: Board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))

const TILE_COLORS: Record<number, string> = {
  2: 'bg-gray-100 text-gray-800',
  4: 'bg-gray-200 text-gray-800',
  8: 'bg-orange-200 text-white',
  16: 'bg-orange-300 text-white',
  32: 'bg-orange-400 text-white',
  64: 'bg-orange-500 text-white',
  128: 'bg-yellow-300 text-white',
  256: 'bg-yellow-400 text-white',
  512: 'bg-yellow-500 text-white',
  1024: 'bg-yellow-600 text-white',
  2048: 'bg-yellow-700 text-white',
}

export function Game2048() {
  const [board, setBoard] = useState<Board>(INITIAL_BOARD)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [previousState, setPreviousState] = useState<{ board: Board; score: number } | null>(null)

  const { addScore, updateStats, getHighScore } = useGameStore()
  const highScore = getHighScore('2048')

  const addRandomTile = useCallback((board: Board): Board => {
    const emptyCells: [number, number][] = []
    
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (board[i][j] === 0) {
          emptyCells.push([i, j])
        }
      }
    }

    if (emptyCells.length === 0) return board

    const newBoard = board.map(row => [...row])
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const [row, col] = randomCell
    newBoard[row][col] = Math.random() < 0.9 ? 2 : 4

    return newBoard
  }, [])

  const initializeGame = useCallback(() => {
    let newBoard = INITIAL_BOARD.map(row => [...row])
    newBoard = addRandomTile(newBoard)
    newBoard = addRandomTile(newBoard)
    setBoard(newBoard)
    setScore(0)
    setGameOver(false)
    setWon(false)
    setPreviousState(null)
  }, [addRandomTile])

  const slideArray = useCallback((arr: number[]): { newArr: number[]; scoreIncrease: number } => {
    const filtered = arr.filter(val => val !== 0)
    const missing = GRID_SIZE - filtered.length
    const zeros = Array(missing).fill(0)
    let newArr = [...filtered, ...zeros]
    let scoreIncrease = 0

    for (let i = 0; i < GRID_SIZE - 1; i++) {
      if (newArr[i] !== 0 && newArr[i] === newArr[i + 1]) {
        newArr[i] *= 2
        newArr[i + 1] = 0
        scoreIncrease += newArr[i]
      }
    }

    const filteredAgain = newArr.filter(val => val !== 0)
    const missingAgain = GRID_SIZE - filteredAgain.length
    const zerosAgain = Array(missingAgain).fill(0)
    newArr = [...filteredAgain, ...zerosAgain]

    return { newArr, scoreIncrease }
  }, [])

  const move = useCallback((direction: Direction) => {
    if (gameOver) return

    setPreviousState({ board: board.map(row => [...row]), score })

    let newBoard = board.map(row => [...row])
    let totalScoreIncrease = 0
    let moved = false

    if (direction === 'left') {
      for (let i = 0; i < GRID_SIZE; i++) {
        const { newArr, scoreIncrease } = slideArray(newBoard[i])
        if (JSON.stringify(newArr) !== JSON.stringify(newBoard[i])) {
          moved = true
        }
        newBoard[i] = newArr
        totalScoreIncrease += scoreIncrease
      }
    } else if (direction === 'right') {
      for (let i = 0; i < GRID_SIZE; i++) {
        const reversed = [...newBoard[i]].reverse()
        const { newArr, scoreIncrease } = slideArray(reversed)
        if (JSON.stringify(newArr.reverse()) !== JSON.stringify(newBoard[i])) {
          moved = true
        }
        newBoard[i] = newArr.reverse()
        totalScoreIncrease += scoreIncrease
      }
    } else if (direction === 'up') {
      for (let j = 0; j < GRID_SIZE; j++) {
        const column = []
        for (let i = 0; i < GRID_SIZE; i++) {
          column.push(newBoard[i][j])
        }
        const { newArr, scoreIncrease } = slideArray(column)
        if (JSON.stringify(newArr) !== JSON.stringify(column)) {
          moved = true
        }
        for (let i = 0; i < GRID_SIZE; i++) {
          newBoard[i][j] = newArr[i]
        }
        totalScoreIncrease += scoreIncrease
      }
    } else if (direction === 'down') {
      for (let j = 0; j < GRID_SIZE; j++) {
        const column = []
        for (let i = 0; i < GRID_SIZE; i++) {
          column.push(newBoard[i][j])
        }
        const reversed = [...column].reverse()
        const { newArr, scoreIncrease } = slideArray(reversed)
        if (JSON.stringify(newArr.reverse()) !== JSON.stringify(column)) {
          moved = true
        }
        const finalColumn = newArr.reverse()
        for (let i = 0; i < GRID_SIZE; i++) {
          newBoard[i][j] = finalColumn[i]
        }
        totalScoreIncrease += scoreIncrease
      }
    }

    if (moved) {
      newBoard = addRandomTile(newBoard)
      setBoard(newBoard)
      setScore(prev => prev + totalScoreIncrease)

      // Check for 2048 tile
      if (!won && newBoard.some(row => row.some(cell => cell === 2048))) {
        setWon(true)
        toast.success('Congratulations! You reached 2048!')
      }

      // Check for game over
      const hasEmptyCell = newBoard.some(row => row.some(cell => cell === 0))
      const canMove = hasEmptyCell || canMakeMove(newBoard)
      
      if (!canMove) {
        setGameOver(true)
        const finalScore = score + totalScoreIncrease
        addScore({ gameId: '2048', score: finalScore, timestamp: Date.now() })
        updateStats('2048', finalScore)
        if (finalScore > highScore) {
          toast.success(`New High Score: ${finalScore}!`)
        }
      }
    }
  }, [board, score, gameOver, won, addRandomTile, slideArray, addScore, updateStats, highScore])

  const canMakeMove = useCallback((board: Board): boolean => {
    // Check for possible horizontal moves
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE - 1; j++) {
        if (board[i][j] === board[i][j + 1]) {
          return true
        }
      }
    }

    // Check for possible vertical moves
    for (let i = 0; i < GRID_SIZE - 1; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (board[i][j] === board[i + 1][j]) {
          return true
        }
      }
    }

    return false
  }, [])

  const undo = useCallback(() => {
    if (previousState) {
      setBoard(previousState.board)
      setScore(previousState.score)
      setPreviousState(null)
      setGameOver(false)
    }
  }, [previousState])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        move('up')
        break
      case 'ArrowDown':
        e.preventDefault()
        move('down')
        break
      case 'ArrowLeft':
        e.preventDefault()
        move('left')
        break
      case 'ArrowRight':
        e.preventDefault()
        move('right')
        break
    }
  }, [move])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  return (
    <div className="flex flex-col items-center space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{score}</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-3xl font-bold text-yellow-500">{highScore}</span>
            </div>
            <div className="text-sm text-muted-foreground">Best</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="grid grid-cols-4 gap-2 p-4 bg-gray-400 rounded-lg">
          <AnimatePresence>
            {board.map((row, i) =>
              row.map((cell, j) => (
                <motion.div
                  key={`${i}-${j}-${cell}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`w-16 h-16 rounded flex items-center justify-center text-lg font-bold ${
                    cell === 0 ? 'bg-gray-300' : TILE_COLORS[cell] || 'bg-purple-500 text-white'
                  }`}
                >
                  {cell !== 0 && cell}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center"
          >
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
              <p className="text-lg mb-4">Final Score: {score}</p>
              <Button onClick={initializeGame} className="bg-primary hover:bg-primary/90">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="flex items-center space-x-4">
        <Button onClick={initializeGame} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          New Game
        </Button>
        
        <Button 
          onClick={undo} 
          variant="outline" 
          disabled={!previousState}
        >
          <Undo className="h-4 w-4 mr-2" />
          Undo
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p className="mb-2">Use arrow keys to move tiles</p>
        <p>Combine tiles with the same number to reach 2048!</p>
      </div>

      {/* Touch controls for mobile */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <div></div>
        <Button onClick={() => move('up')} variant="outline" size="sm">↑</Button>
        <div></div>
        <Button onClick={() => move('left')} variant="outline" size="sm">←</Button>
        <div></div>
        <Button onClick={() => move('right')} variant="outline" size="sm">→</Button>
        <div></div>
        <Button onClick={() => move('down')} variant="outline" size="sm">↓</Button>
        <div></div>
      </div>
    </div>
  )
}