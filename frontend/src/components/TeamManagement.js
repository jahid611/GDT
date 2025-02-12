"use client"

import { useState, useEffect } from "react"
import { fetchUserTeams } from "../utils/api"
import { useAuth } from "../contexts/AuthContext"
import { useTranslation } from "../hooks/useTranslation"
import { useToast } from "@/hooks/useToast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Layout,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Users,
} from "lucide-react"
import CreateTeamModal from "./CreateTeamModal"
import TeamDetails from "./TeamDetails"

// Helper function to generate team avatars
const getTeamAvatar = (name) => {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-green-500", "bg-yellow-500"]
  const color = colors[Math.floor(Math.random() * colors.length)]
  return {
    letter: name.charAt(0).toUpperCase(),
    color,
  }
}

// Helper function to initialize team stats
const initializeTeamStats = (team) => ({
  ...team,
  avatar: getTeamAvatar(team.name),
  stats: {
    tasks: team.tasks?.length || 0, // Use actual tasks length instead of random number
    members: team.members?.length || 0,
    activity: Math.floor(Math.random() * 100),
  },
})

export default function TeamManagement() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [view, setView] = useState("grid")

  useEffect(() => {
    if (user) {
      const loadTeams = async () => {
        setLoading(true)
        try {
          const data = await fetchUserTeams(user.id || user._id)
          setTeams(data.map(initializeTeamStats))
        } catch (error) {
          toast({
            title: t("error"),
            description: t("errorLoadingTeams"),
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
      loadTeams()
    }
  }, [user, toast, t])

  const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleTeamCreated = (newTeam) => {
    const teamWithStats = initializeTeamStats(newTeam)
    setTeams((prevTeams) => [...prevTeams, teamWithStats])
    setIsModalOpen(false)
    toast({
      title: t("success"),
      description: t("teamCreated"),
    })
  }

  if (selectedTeam) {
    return <TeamDetails team={selectedTeam} onBack={() => setSelectedTeam(null)} />
  }

  const renderTeamCard = (team) => (
    <Card
      key={team._id}
      className="group cursor-pointer transition-all hover:shadow-lg"
      onClick={() => setSelectedTeam(team)}
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className={`h-9 w-9 ${team.avatar?.color || "bg-primary"}`}>
          <AvatarFallback>{team.avatar?.letter || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-base">{team.name}</CardTitle>
          <CardDescription className="line-clamp-1">{team.description || t("noDescription")}</CardDescription>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{team.stats?.tasks || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{team.stats?.members || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{team.stats?.activity || 0}%</span>
          </div>
          {team.leader === (user.id || user._id) && (
            <Badge variant="secondary" className="ml-auto">
              {t("leader")}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <h1 className="text-xl font-semibold">{t("spaces")}</h1>
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t("createSpace")}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchSpaces")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={view} onValueChange={setView} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">
                <Layout className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <MessageSquare className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center flex-col gap-2 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{searchQuery ? t("noSpacesFound") : t("noSpaces")}</p>
              <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">
                {t("createYourFirstSpace")}
              </Button>
            </div>
          ) : (
            <Tabs defaultValue={view} className="w-full">
              <TabsContent value="grid" className="mt-0">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredTeams.map(renderTeamCard)}</div>
              </TabsContent>
              <TabsContent value="list" className="mt-0">
                <div className="space-y-2">{filteredTeams.map(renderTeamCard)}</div>
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>
      </div>

      <CreateTeamModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTeamCreated={handleTeamCreated}
        currentUser={user}
      />
    </div>
  )
}

