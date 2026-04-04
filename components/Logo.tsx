
import React from 'react';
import logoImage from '../imagens/Logo colorido PP.png';
import logoBrancoImage from '../imagens/logo-branco.png';

interface LogoProps {
  className?: string;
  color?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-12", color = "currentColor" }) => {
  const normalizedColor = color.replace(/\s+/g, '').toLowerCase();
  const useWhiteLogo =
    normalizedColor === '#fff' ||
    normalizedColor === '#ffffff' ||
    normalizedColor === 'white' ||
    normalizedColor === 'rgb(255,255,255)';

  return (
    <div className={`inline-flex w-fit shrink-0 items-center ${className}`}>
      <img
        src={useWhiteLogo ? logoBrancoImage : logoImage}
        alt="PINTOR PRO"
        className="block h-full w-auto max-w-none shrink-0 object-contain"
      />
    </div>
  );
};
