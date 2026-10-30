import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coin3D } from '../components/three/Coin3D';
import { AirSwirlMotif } from '../components/AirSwirlMotif';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
      <AirSwirlMotif opacity={0.5} />

      <div className="w-24 h-24 mb-4 flex items-center justify-center">
        <Coin3D isFlipping={true} size={64} />
      </div>

      <span className="text-xs font-bold px-3 py-1 rounded-pill bg-baby-pink text-black-cherry uppercase tracking-wider mb-2">
        Error 404
      </span>

      <h1 className="font-display font-black text-3xl sm:text-4xl text-black-cherry">
        Hawa mein ud gaya.
      </h1>

      <p className="text-xs sm:text-sm text-black-cherry/70 max-w-sm mt-1 mb-6">
        This market or page doesn't exist on campus anymore.
      </p>

      <button
        onClick={() => navigate('/feed')}
        className="px-5 py-2.5 rounded-pill bg-tangerine text-black-cherry font-display font-black text-xs hover:brightness-105 active:scale-95 transition-all shadow-subtle flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4 stroke-[3]" />
        <span>Back to Market Feed</span>
      </button>
    </div>
  );
};

export default NotFoundPage;
