import React from 'react';

export const FooterNote: React.FC = () => {
  return (
    <footer className="w-full py-8 pb-24 text-center border-t border-linen-deep/60 mt-12">
      <div className="max-w-md mx-auto px-4">
        <p className="text-xs font-medium text-black-cherry/60 tracking-wide">
          Play coins only. No real money. Just bragging rights.
        </p>
        <p className="text-[11px] text-black-cherry/40 mt-1">
          Hawa &bull; Campus Prediction Market &bull; IST
        </p>
      </div>
    </footer>
  );
};
