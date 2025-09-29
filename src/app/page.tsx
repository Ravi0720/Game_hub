'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GameCard } from '../components/game-card'
import { Header } from '../components/header'
import { Footer } from '../components/footer'
import { LoginModal } from '../components/login-modal'
import { useAuthStore } from '../store/auth-store'
import { games } from '../data/games'

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
      <Header onLoginClick={() => setShowLoginModal(true)} />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-4">
            🎮 Mini Game Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing games built with modern web technologies.
            Play, compete, and have fun!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GameCard game={game} />
            </motion.div>
          ))}
        </motion.div>
      </main>

      <Footer />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}