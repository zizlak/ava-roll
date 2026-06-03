import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { GameState } from './BoardGame';
import playerMale from '@/assets/player-male.png';
import playerFemale from '@/assets/player-female.png';

interface GameBoardProps {
  gameState: GameState;
  shortcuts: { [key: number]: number };
}

type TokenStyle = {
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
};

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, shortcuts }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [p1Style, setP1Style] = useState<TokenStyle | null>(null);
  const [p2Style, setP2Style] = useState<TokenStyle | null>(null);

  const getZoneClass = (cellNumber: number) => {
    if (cellNumber <= 10) return 'bg-gradient-zone-1';
    if (cellNumber <= 21) return 'bg-gradient-zone-2';
    return 'bg-gradient-zone-3';
  };

  const hasShortcut = (cellNumber: number) => shortcuts[cellNumber] !== undefined;

  const computeStyle = (pos: number): TokenStyle | null => {
    const cont = containerRef.current;
    if (!cont) return null;
    if (pos < 1) {
      // Park tokens at cell 1 but invisible (so first move animates from cell 1)
      const el = cellRefs.current[0];
      if (!el) return null;
      const cRect = cont.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        left: r.left - cRect.left,
        top: r.top - cRect.top,
        width: r.width,
        height: r.height,
        opacity: 0,
      };
    }
    const el = cellRefs.current[pos - 1];
    if (!el) return null;
    const cRect = cont.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      left: r.left - cRect.left,
      top: r.top - cRect.top,
      width: r.width,
      height: r.height,
      opacity: 1,
    };
  };

  useLayoutEffect(() => {
    const update = () => {
      setP1Style(computeStyle(gameState.player1Position));
      setP2Style(computeStyle(gameState.player2Position));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [gameState.player1Position, gameState.player2Position]);

  const renderCell = (cellNumber: number) => {
    const isShortcut = hasShortcut(cellNumber);
    const isCurrentP1 =
      gameState.currentPlayer === 1 && gameState.player1Position === cellNumber;
    const isCurrentP2 =
      gameState.currentPlayer === 2 && gameState.player2Position === cellNumber;
    const isCurrent = isCurrentP1 || isCurrentP2;

    return (
      <div
        key={cellNumber}
        ref={(el) => (cellRefs.current[cellNumber - 1] = el)}
        className={cn(
          'relative aspect-square rounded-lg border-2 border-border flex flex-col items-center justify-center text-center p-2 transition-all duration-300',
          getZoneClass(cellNumber),
          isCurrent && 'ring-4 ring-yellow-300 animate-glow-pulse scale-105 z-10'
        )}
      >
        <div className="text-sm font-bold text-white mb-1">{cellNumber}</div>

        {isShortcut && (
          <div className="text-xs text-yellow-300 font-semibold">
            ↗ {shortcuts[cellNumber]}
          </div>
        )}

        {cellNumber === 32 && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-yellow-300">
            🏁 FINISH
          </div>
        )}
      </div>
    );
  };

  const rows = [];
  for (let row = 0; row < 4; row++) {
    const cells = [];
    for (let col = 0; col < 8; col++) {
      const cellNumber = row * 8 + col + 1;
      if (cellNumber <= 32) cells.push(renderCell(cellNumber));
    }
    rows.push(
      <div key={row} className="grid grid-cols-8 gap-2">
        {cells}
      </div>
    );
  }

  const renderToken = (
    player: 1 | 2,
    style: TokenStyle | null,
    img: string
  ) => {
    if (!style) return null;
    const isCurrent =
      gameState.currentPlayer === player && !gameState.isMoving && !gameState.gameWinner;
    return (
      <div
        className="pointer-events-none absolute"
        style={{
          left: style.left,
          top: style.top,
          width: style.width,
          height: style.height,
          opacity: style.opacity,
          transition: 'left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
          zIndex: 20,
        }}
      >
        <div
          className={cn(
            'w-full h-full flex items-end justify-center',
            isCurrent && 'animate-char-bounce'
          )}
        >
          <img
            src={img}
            alt={`Player ${player}`}
            width={128}
            height={128}
            className={cn(
              'w-[85%] h-[85%] object-contain drop-shadow-lg',
              player === 1
                ? '-translate-x-1 drop-shadow-[0_4px_6px_hsl(var(--player-1)/0.6)]'
                : 'translate-x-1 drop-shadow-[0_4px_6px_hsl(var(--player-2)/0.6)]'
            )}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Player Legend */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <img src={playerMale} alt="Player 1" className="w-8 h-8 object-contain" />
          <span className="text-sm text-muted-foreground">Player 1</span>
        </div>
        <div className="flex items-center gap-2">
          <img src={playerFemale} alt="Player 2" className="w-8 h-8 object-contain" />
          <span className="text-sm text-muted-foreground">Player 2</span>
        </div>
      </div>

      {/* Game Board */}
      <div ref={containerRef} className="relative space-y-2">
        {rows}
        {renderToken(1, p1Style, playerMale)}
        {renderToken(2, p2Style, playerFemale)}
      </div>
    </div>
  );
};
