import { Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "../hooks/useTranslation"

const languages = [
  {
    code: "fr",
    name: "Français",
    shortName: "FR",
  },
  {
    code: "en",
    name: "English",
    shortName: "EN",
  },
  {
    code: "ro",
    name: "Română",
    shortName: "RO",
  },
]

export default function LanguageToggle() {
  const { language, setLanguage } = useTranslation()

  const currentLanguage = languages.find((l) => l.code === language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <Globe className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">{currentLanguage.shortName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`text-sm cursor-pointer ${language === lang.code ? "bg-accent" : ""}`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[24px]">{lang.shortName}</span>
                <span className="text-muted-foreground text-xs">{lang.name}</span>
              </div>
              {language === lang.code && <Check className="h-3 w-3 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


