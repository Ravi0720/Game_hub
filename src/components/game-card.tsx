'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play, Star, Users } from 'lucide-react'
import { Game } from '@/types/game'

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="game-card group"
    >
      <Link href={`/games/${game.id}`} className="block h-full">
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">{game.emoji}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-current text-yellow-500" />
              <span>{game.rating}</span>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
            {game.title}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4 flex-grow">
            {game.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{game.players}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-xs font-medium text-primary">
              <Play className="h-3 w-3" />
              <span>Play Now</span>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-1">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}