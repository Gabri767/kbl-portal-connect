import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 10;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) score += 15;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) score += 15;
    
    // Contains numbers
    if (/\d/.test(password)) score += 15;
    
    // Contains special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
    
    // Determine label and color
    if (score < 40) {
      return { score, label: 'Fraca', color: 'bg-destructive' };
    } else if (score < 70) {
      return { score, label: 'Média', color: 'bg-yellow-500' };
    } else if (score < 90) {
      return { score, label: 'Boa', color: 'bg-blue-500' };
    } else {
      return { score, label: 'Forte', color: 'bg-green-500' };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Força da senha:</span>
        <span className={`font-medium ${
          strength.score < 40 ? 'text-destructive' :
          strength.score < 70 ? 'text-yellow-500' :
          strength.score < 90 ? 'text-blue-500' :
          'text-green-500'
        }`}>
          {strength.label}
        </span>
      </div>
      <ul className="text-xs text-muted-foreground space-y-1">
        <li className={password.length >= 8 ? 'text-green-500' : ''}>
          ✓ Mínimo 8 caracteres
        </li>
        <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-500' : ''}>
          ✓ Letras maiúsculas e minúsculas
        </li>
        <li className={/\d/.test(password) ? 'text-green-500' : ''}>
          ✓ Números
        </li>
        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : ''}>
          ✓ Caracteres especiais (!@#$%)
        </li>
      </ul>
    </div>
  );
}
