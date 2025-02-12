"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "../hooks/useToast";
import { updateTeam } from "../utils/api";
import { Loader2 } from "lucide-react";

export default function EditTeamModal({ open, onClose, team, onTeamUpdated }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && team) {
      setName(team.name || "");
      setDescription(team.description || "");
    }
  }, [open, team]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: t("error"),
        description: t("teamNameRequired"),
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);
      const updatedTeam = await updateTeam(team._id, {
        name: name.trim(),
        description: description.trim(),
      });
      toast({
        title: t("success"),
        description: t("teamUpdated"),
      });
      if (onTeamUpdated) {
        onTeamUpdated(updatedTeam);
      }
      onClose();
    } catch (error) {
      console.error("Error updating team:", error);
      toast({
        title: t("error"),
        description: error.message || t("cannotUpdateTeam"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("editTeam")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("saveChanges")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

EditTeamModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  team: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  onTeamUpdated: PropTypes.func.isRequired,
};
