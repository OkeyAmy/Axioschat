
"use client"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"

const Header = () => {
  const { theme, setTheme } = useTheme()
  const { isConnected } = useAccount()

  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            NovachatV2
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <ConnectButton showBalance={false} />
        </div>
      </div>
    </header>
  )
}

export default Header
