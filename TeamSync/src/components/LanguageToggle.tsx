import { LanguageSelector } from "@/components/LanguageSelector";

type LanguageToggleProps = {
  compact?: boolean;
};

export function LanguageToggle({ compact = false }: LanguageToggleProps) {
  return <LanguageSelector compact={compact} />;
}
