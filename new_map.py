code = """import React, { useState, useRef, useEffect } from 'react';
import { Building2, Lock, Target, Plus, Minus, Move, Star, Cloud, Sun, Map as MapIcon, Compass } from 'lucide-react';
import { cn } from '../lib/utils';
import { getCumulativeCoinsNeeded } from '../lib/campusEconomy';

interface CampusCityMapProps {
  colleges: any[];
  unlockedRank: number;
}

// Helper to render a 3D block
const IsoBlock = ({ w, h, d, colorTop, colorLeft, colorRight, x, y, z = 0, className = '' }: any) => {
  return (
    <div 
      className={cn("absolute", className)}
      style={{
        width: w,
        height: h,
        left: x,
        top: y,
        transform: `translateZ(${z}px)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Top Face */}
      <div 
        className="absolute w-full h-full"
        style={{
          backgroundColor: colorTop,
          transform: `translateZ(${d}px)`,
        }}
      />
      {/* Front/Right Face */}
      <div 
        className="absolute border-l border-black/10"
        style={{
          width: w,
          height: d,
          backgroundColor: colorRight,
          transformOrigin: 'top left',
          transform: `translateY(${h}px) rotateX(-90deg)`,
        }}
      />
      {/* Left/Side Face */}
      <div 
        className="absolute border-t border-black/10"
        style={{
          width: d,
          height: h,
          backgroundColor: colorLeft,
          transformOrigin: 'top left',
          transform: `rotateY(90deg) rotateZ(-90deg) translateX(-${d}px)`,
        }}
      />
    </div>
  );
};

export default function CampusCityMap({ colleges, unlockedRank }: CampusCityMapProps) {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const startPanRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setZoom(0.6);
      } else if (window.innerWidth < 1024) {
        setZoom(0.8);
      } else {
        setZoom(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.3));

  // Handle panning
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    if (containerRef.current) {
        containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (containerRef.current) {
        containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-[#7dd3fc] via-[#bae6fd] to-[#f0f9ff] rounded-3xl border border-sky-200 shadow-xl overflow-hidden flex flex-col h-[600px] md:h-[800px]">
      
      {/* Scenic Background Elements */}
      <Sun className="absolute top-10 right-10 w-24 h-24 text-yellow-400 opacity-80" fill="currentColor" />
      <Cloud className="absolute top-20 left-[20%] w-32 h-32 text-white/60 animate-[pulse_10s_ease-in-out_infinite]" fill="currentColor" />
      <Cloud className="absolute top-40 right-[30%] w-24 h-24 text-white/50 animate-[pulse_8s_ease-in-out_infinite_1s]" fill="currentColor" />
      
      {/* Controls */}
      <div className="absolute top-6 left-6 z-30 flex flex-col gap-2">
        <div className="bg-white/80 backdrop-blur border border-sky-100 rounded-xl p-1 flex flex-col shadow-lg">
          <button onClick={handleZoomIn} className="p-2 hover:bg-sky-50 rounded-lg text-sky-700 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
          <div className="w-full h-px bg-sky-100 my-1"></div>
          <button onClick={handleZoomOut} className="p-2 hover:bg-sky-50 rounded-lg text-sky-700 transition-colors">
            <Minus className="w-5 h-5" />
          </button>
        </div>
        <button 
            className="bg-white/80 backdrop-blur border border-sky-100 shadow-lg rounded-xl p-2 text-sky-700 flex items-center justify-center hover:bg-sky-50 transition-colors" 
            title="Reset Pan"
            onClick={() => setPan({x: 0, y: 0})}
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute top-6 right-6 z-30 text-right pointer-events-none bg-white/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-sm">
        <h3 className="text-xl md:text-2xl font-black text-sky-900 tracking-wide drop-shadow-sm flex items-center gap-2 justify-end">
            <MapIcon className="w-6 h-6 text-sky-500" />
            Campus Valley
        </h3>
        <p className="text-sky-700/80 text-xs md:text-sm font-bold mt-0.5 uppercase tracking-widest">
          {unlockedRank} / {colleges.length} Campuses Built
        </p>
      </div>

      {/* 3D Map Viewport */}
      <div 
        ref={containerRef}
        className={cn(
            "relative w-full h-full flex justify-center items-center overflow-hidden z-10 select-none touch-none",
            isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ perspective: '1500px' }}
      >
        {/* The World Wrapper */}
        <div 
          className="absolute transition-transform duration-75 ease-linear"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
            {/* The Rotated Base Plane */}
            <div 
            className="relative"
            style={{ 
                transform: `rotateX(60deg) rotateZ(-45deg)`, 
                transformStyle: 'preserve-3d',
                width: '600px',
                height: '800px',
            }}
            >
                {/* Floating Island Base */}
                <div 
                    className="absolute inset-0 bg-[#86efac] rounded-3xl shadow-[0_0_50px_rgba(74,222,128,0.5)] border-4 border-[#4ade80]"
                    style={{ transform: 'translateZ(-20px)' }}
                >
                    <div className="absolute w-full h-full inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
                </div>
                {/* Island Earth/Dirt below */}
                <div 
                    className="absolute inset-0 bg-[#78350f] rounded-3xl shadow-2xl"
                    style={{ transform: 'translateZ(-40px)' }}
                ></div>

                {/* College Plots Grid */}
                <div className="absolute inset-4 grid grid-cols-5 md:grid-cols-6 gap-6 place-items-center" style={{transformStyle: 'preserve-3d'}}>
                    {colleges.map((college, idx) => {
                        const isUnlocked = idx < unlockedRank;
                        const isNext = idx === unlockedRank;
                        const isIIT = college.type === 'IIT';
                        
                        return (
                            <div 
                                key={college.id}
                                className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center group"
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Plot Base */}
                                <div 
                                    className={cn(
                                        "absolute inset-0 rounded-xl border-2 shadow-inner transition-colors duration-500",
                                        isUnlocked ? "bg-[#bbf7d0] border-[#86efac]" : 
                                        isNext ? "bg-yellow-200/50 border-yellow-400 animate-pulse" : 
                                        "bg-[#dcfce3]/40 border-[#bbf7d0]"
                                    )}
                                />

                                {/* 3D Building */}
                                {isUnlocked && (
                                    <div className="absolute inset-0 pointer-events-none drop-shadow-2xl" style={{transformStyle: 'preserve-3d'}}>
                                        {isIIT ? (
                                            // IIT Building (Grand, taller, purplish-gold)
                                            <>
                                                {/* Main Tower */}
                                                <IsoBlock w="60%" h="60%" d={60} colorTop="#e879f9" colorLeft="#c026d3" colorRight="#a21caf" x="20%" y="20%" z={0} />
                                                {/* Roof Accent */}
                                                <IsoBlock w="40%" h="40%" d={20} colorTop="#fef08a" colorLeft="#eab308" colorRight="#ca8a04" x="30%" y="30%" z={60} />
                                                <div className="absolute left-1/2 top-1/2 w-[80px] h-[80px] -translate-x-1/2 -translate-y-1/2 bg-purple-400/20 rounded-full blur-xl" style={{transform: 'translateZ(10px)'}}></div>
                                            </>
                                        ) : (
                                            // NIT Building (Modern, wider, bluish)
                                            <>
                                                <IsoBlock w="80%" h="40%" d={30} colorTop="#7dd3fc" colorLeft="#0ea5e9" colorRight="#0284c7" x="10%" y="10%" z={0} />
                                                <IsoBlock w="40%" h="40%" d={45} colorTop="#38bdf8" colorLeft="#0284c7" colorRight="#0369a1" x="50%" y="40%" z={0} />
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Floating Tag for Unlocked or Next */}
                                {(isUnlocked || isNext) && (
                                    <div 
                                        className="absolute pointer-events-none flex flex-col items-center"
                                        style={{
                                            transform: `rotateZ(45deg) rotateX(-60deg) translateZ(${isUnlocked ? (isIIT ? '100px' : '70px') : '40px'})`,
                                            transformOrigin: 'bottom center',
                                            transformStyle: 'preserve-3d'
                                        }}
                                    >
                                        {isNext && (
                                            <Target className="w-10 h-10 text-yellow-500 drop-shadow-md animate-bounce mb-2" />
                                        )}
                                        <div className="bg-white/95 text-slate-800 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border-b-4 border-slate-200 flex flex-col items-center">
                                            <span className={cn("text-[9px] uppercase tracking-widest font-black", isIIT ? "text-purple-600" : "text-sky-600")}>
                                                {college.type} #{college.id}
                                            </span>
                                            <span>{college.name.replace('National Institute of Technology', 'NIT').replace('Indian Institute of Technology', 'IIT')}</span>
                                            {!isUnlocked && (
                                                <span className="text-yellow-600 text-[10px] mt-0.5 bg-yellow-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                    <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" /> {getCumulativeCoinsNeeded(college.id).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Lock icon for locked */}
                                {!isUnlocked && !isNext && (
                                    <div 
                                        className="absolute"
                                        style={{
                                            transform: `rotateZ(45deg) rotateX(-60deg) translateZ(10px)`,
                                            transformOrigin: 'bottom center',
                                        }}
                                    >
                                        <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-white">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
      </div>
      
    </div>
  );
}
"""

with open("src/components/CampusCityMap.tsx", "w") as f:
    f.write(code)
