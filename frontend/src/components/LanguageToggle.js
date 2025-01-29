import { Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslation } from "../hooks/useTranslation"

const languages = [
  {
    code: "fr",
    name: "Français",
    flag: "🇫🇷",
    mobileFlag: "FR", // Fallback pour l'application mobile
  },
  {
    code: "en",
    name: "English",
    flag: "🇬🇧",
    mobileFlag: "GB", // Fallback pour l'application mobile
  },
  {
    code: "ro",
    name: "Română",
    flag: "🇷🇴",
    mobileFlag: "RO", // Fallback pour l'application mobile
  },
]

export default function LanguageToggle() {
  const { language, setLanguage } = useTranslation()

  const currentLanguage = languages.find((l) => l.code === language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <Globe className="h-4 w-4" />
          <span className="text-base">{currentLanguage.flag}</span>
          <span className="text-base">{currentLanguage.mobileFlag}</span>
          <span className="font-medium">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)} className="cursor-pointer">
            <span className="mr-2">{lang.flag}</span>
            <span className="mr-2">{lang.mobileFlag}</span>
            <span className="flex-1">{lang.name}</span>
            {language === lang.code && <Check className="h-4 w-4 ml-2 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

