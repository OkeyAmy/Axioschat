"use client"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun, Rocket, MessageSquare, Zap, Lightbulb, Sparkles, Menu } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { ConnectButton, useActiveAccount } from "thirdweb/react"
import { thirdwebClient } from "@/components/ThirdwebProviderWrapper"
import { Link, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useState } from "react"

const Header = () => {
  const { theme, setTheme } = useTheme()
  // Thirdweb wallet connection
  const account = useActiveAccount()
  const isConnected = !!account
  const address = account?.address
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10 shadow-md animate-in fade-in-10 h-16">
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 transition-colors hover:opacity-90 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-all">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-extrabold text-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:from-indigo-400 group-hover:via-purple-400 group-hover:to-pink-400 transition-all">
              AxiosChat
            </h1>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/" && "bg-accent text-accent-foreground font-medium",
                      "rounded-full px-4"
                    )}
                  >
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/chat">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/chat" && "bg-accent text-accent-foreground font-medium",
                      "flex items-center gap-1 rounded-full px-4"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Chat
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/functions">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/functions" && "bg-accent text-accent-foreground font-medium",
                      "flex items-center gap-1 rounded-full px-4"
                    )}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Functions
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/web3-intro">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/web3-intro" && "bg-accent text-accent-foreground font-medium",
                      "flex items-center gap-1 rounded-full px-4"
                    )}
                  >
                    <Rocket className="w-4 h-4 mr-1" />
                    Learn
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted p-1.5 px-3 rounded-full transition-colors shadow-sm">
            {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
              className="data-[state=checked]:bg-indigo-500"
            />
          </div>

          {/* Thirdweb Wallet Connect Button */}
          <ConnectButton
            client={thirdwebClient}
            connectButton={{
              label: "Connect Wallet",
              className: "!bg-gradient-to-r !from-indigo-500 !to-purple-500 !text-white !rounded-full !px-4 !py-2 !text-sm !font-medium hover:!opacity-90 !transition-opacity !shadow-md",
            }}
            detailsButton={{
              className: "!bg-gradient-to-r !from-indigo-500/10 !to-purple-500/10 !rounded-full !px-3 !py-2",
            }}
          />

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px] bg-background/95 backdrop-blur-xl">
              <div className="flex flex-col gap-6 mt-8">
                <Link to="/" className="flex items-center gap-2 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="font-extrabold text-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    AxiosChat
                  </h1>
                </Link>

                <div className="flex flex-col gap-2 mt-4">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={location.pathname === "/" ? "default" : "ghost"} className="w-full justify-start text-left">
                      Home
                    </Button>
                  </Link>
                  <Link to="/chat" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={location.pathname === "/chat" ? "default" : "ghost"} className="w-full justify-start text-left">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </Link>
                  <Link to="/functions" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={location.pathname === "/functions" ? "default" : "ghost"} className="w-full justify-start text-left">
                      <Zap className="w-4 h-4 mr-2" />
                      Functions
                    </Button>
                  </Link>
                  <Link to="/web3-intro" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={location.pathname === "/web3-intro" ? "default" : "ghost"} className="w-full justify-start text-left">
                      <Rocket className="w-4 h-4 mr-2" />
                      Learn
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header;
