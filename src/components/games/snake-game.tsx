'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/game-store'
import toast from 'react-hot-toast'

interface Position {
  x: number
  y: number
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

const GRID_SIZE = 20
const CANVAS_SIZE = 400
const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }]
const INITIAL_FOOD: Position = { x: 15, y: 15 }

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Position>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [speed, setSpeed] = useState(150)

  const { addScore, updateStats, getHighScore } = useGameStore()
  const highScore = getHighScore('snake')

  const generateFood = useCallback((): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [snake])

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection('RIGHT')
    setScore(0)
    setGameOver(false)
    setSpeed(150)
  }, [])

  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying) return

    setSnake(currentSnake => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }

      switch (direction) {
        case 'UP':
          head.y -= 1
          break
        case 'DOWN':
          head.y += 1
          break
        case 'LEFT':
          head.x -= 1
          break
        case 'RIGHT':
          head.x += 1
          break
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true)
        setIsPlaying(false)
        const finalScore = score
        addScore({ gameId: 'snake', score: finalScore, timestamp: Date.now() })
        updateStats('snake', finalScore)
        if (finalScore > highScore) {
          toast.success(`New High Score: ${finalScore}!`)
        }
        return currentSnake
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true)
        setIsPlaying(false)
        const finalScore = score
        addScore({ gameId: 'snake', score: finalScore, timestamp: Date.now() })
        updateStats('snake', finalScore)
        if (finalScore > highScore) {
          toast.success(`New High Score: ${finalScore}!`)
        }
        return currentSnake
      }

      newSnake.unshift(head)

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10)
        setFood(generateFood())
        setSpeed(prev => Math.max(80, prev - 2)) // Increase speed
        toast.success('+10 points!')
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [direction, food, gameOver, isPlaying, score, generateFood, addScore, updateStats, highScore])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver) return

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (direction !== 'DOWN') setDirection('UP')
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        if (direction !== 'UP') setDirection('DOWN')
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (direction !== 'RIGHT') setDirection('LEFT')
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (direction !== 'LEFT') setDirection('RIGHT')
        break
      case ' ':
        e.preventDefault()
        setIsPlaying(prev => !prev)
        break
    }
  }, [direction, gameOver])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = window.setInterval(moveSnake, speed)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [isPlaying, gameOver, moveSnake, speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = (i * CANVAS_SIZE) / GRID_SIZE
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, CANVAS_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(CANVAS_SIZE, pos)
      ctx.stroke()
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const x = (segment.x * CANVAS_SIZE) / GRID_SIZE
      const y = (segment.y * CANVAS_SIZE) / GRID_SIZE
      const size = CANVAS_SIZE / GRID_SIZE

      ctx.fillStyle = index === 0 ? '#22c55e' : '#16a34a'
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2)
      
      if (index === 0) {
        // Draw eyes
        ctx.fillStyle = '#000'
        ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.15, size * 0.15)
        ctx.fillRect(x + size * 0.65, y + size * 0.2, size * 0.15, size * 0.15)
      }
    })

    // Draw food
    const foodX = (food.x * CANVAS_SIZE) / GRID_SIZE
    const foodY = (food.y * CANVAS_SIZE) / GRID_SIZE
    const foodSize = CANVAS_SIZE / GRID_SIZE

    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(foodX + foodSize / 2, foodY + foodSize / 2, foodSize / 3, 0, 2 * Math.PI)
    ctx.fill()
  }, [snake, food])

  return (
    <div className="flex flex-col items-center space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{score}</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{highScore}</span>
            </div>
            <div className="text-sm text-muted-foreground">Best</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{snake.length}</div>
            <div className="text-sm text-muted-foreground">Length</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border-2 border-primary/20 rounded-lg shadow-2xl"
        />
        
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center"
          >
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
              <p className="text-lg mb-4">Score: {score}</p>
              <Button onClick={resetGame} className="bg-primary hover:bg-primary/90">
                <RotateCcw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="flex items-center space-x-4">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={gameOver}
          className="bg-primary hover:bg-primary/90"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {gameOver ? 'Game Over' : 'Play'}
            </>
          )}
        </Button>
        
        <Button onClick={resetGame} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p className="mb-2">Use arrow keys or WASD to control the snake</p>
        <p>Press spacebar to pause/resume</p>
      </div>
    </div>
  )
}