"use client"

import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "../hooks/useTranslation"
import { useToast } from "../hooks/useToast"
import { getUsers, createTeamViaUserAPI } from "../utils/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Loader2, Search, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export default function CreateTeamModal({ open, onClose, onTeamCreated, currentUser }) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [members, setMembers] = useState([])
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      const userId = currentUser.id || currentUser._id
      if (userId) setMembers([userId])
      loadUsers()
    }
  }, [open, currentUser])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const fetchedUsers = await getUsers()
      setUsers(fetchedUsers)
    } catch (err) {
      console.error("Error loading users:", err)
      showToast({
        title: t("error"),
        description: t("errorLoadingUsers"),
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleMemberToggle = (userId) => {
    const leaderId = currentUser.id || currentUser._id
    if (userId === leaderId) return
    setMembers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const filteredUsers = users.filter((user) => {
    const searchTerm = searchQuery.toLowerCase()
    return (
      (user.username && user.username.toLowerCase().includes(searchTerm)) ||
      user.email.toLowerCase().includes(searchTerm)
    )
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast({
        title: t("error"),
        description: t("teamNameRequired"),
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const teamData = {
        name: name.trim(),
        description: description.trim(),
        leader: currentUser.id || currentUser._id,
        members: members.length > 0 ? members : [currentUser.id || currentUser._id],
        tasks: [], // Initialize with empty tasks array to prevent undefined error
      }
      const createdTeam = await createTeamViaUserAPI(teamData)
      onTeamCreated(createdTeam)
      showToast({
        title: t("success"),
        description: t("teamCreated"),
      })
      onClose()
    } catch (error) {
      console.error("Error creating team:", error)
      showToast({
        title: t("error"),
        description: error.message || t("cannotCreateTeam"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("createTeam")}
          </DialogTitle>
          <DialogDescription>{t("createTeamDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">{t("teamName")}</Label>
              <Input
                id="teamName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("enterTeamName")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamDescription">{t("teamDescription")}</Label>
              <Textarea
                id="teamDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("enterTeamDescription")}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("teamMembers")}</Label>
                <Badge variant="secondary" className="ml-2">
                  {members.length} {t("selected")}
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchMembers")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Card className="overflow-hidden">
                <ScrollArea className="h-[280px] rounded-md">
                  {loadingUsers ? (
                    <div className="flex h-full items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredUsers.map((user) => {
                        const isLeader = (user.id || user._id) === (currentUser.id || currentUser._id)
                        const isSelected = members.includes(user.id || user._id)
                        return (
                          <div
                            key={user.id || user._id}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                              isLeader ? "bg-muted cursor-not-allowed" : "hover:bg-accent cursor-pointer",
                              isSelected && !isLeader && "bg-accent",
                            )}
                            onClick={() => !isLeader && handleMemberToggle(user.id || user._id)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">{user.username || user.email}</p>
                              {user.username && <p className="text-xs text-muted-foreground">{user.email}</p>}
                            </div>
                            {isLeader && (
                              <Badge variant="secondary" className="ml-auto">
                                {t("leader")}
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("createTeam")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

CreateTeamModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onTeamCreated: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
}

