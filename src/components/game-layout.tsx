'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Settings, Trophy, Users } from 'lucide-react'
import { Game } from '@/types/game'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/game-store'

interface GameLayoutProps {
  game: Game
  children: React.ReactNode
}

export function GameLayout({ game, children }: GameLayoutProps) {
  const [showSettings, setShowSettings] = useState(false)
  const { getHighScore } = useGameStore()
  const highScore = getHighScore(game.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{game.emoji}</span>
              <div>
                <h1 className="text-lg font-semibold">{game.title}</h1>
                <p className="text-xs text-muted-foreground">{game.category} • {game.difficulty}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>{highScore}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{game.players}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="h-9 w-9"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}