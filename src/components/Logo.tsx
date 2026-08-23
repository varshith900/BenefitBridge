import { cn } from '../lib/utils';


interface LogoProps {
  className?: string;
  iconClassName?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-md", className)}>
      <img src="/favicon.jpg" alt="BenefitBridge Logo" className="w-full h-full object-cover" />
    </div>
  );
}


