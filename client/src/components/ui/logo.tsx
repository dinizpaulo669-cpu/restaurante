import logoImage from "@assets/Imagem do WhatsApp de 2025-09-26 à(s) 10.19.46_ce8f09fa_1758939040739.jpg";

interface LogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({ className = "h-8 w-auto", showText = true, textClassName = "text-2xl font-bold text-primary" }: LogoProps) {
  return (
    <div className="flex items-center">
      <img 
        src={logoImage}
        alt="GoFood" 
        className={className}
        data-testid="logo-image"
      />
      {showText && (
        <h1 className={`ml-3 ${textClassName}`} data-testid="logo-text">
          GoFood
        </h1>
      )}
    </div>
  );
}