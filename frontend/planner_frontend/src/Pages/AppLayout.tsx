import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AppSidebar from "../components/AppSidebar";
import GroupModal from "./Profile/GroupModal";
import type { GroupData } from "../types";
import "./Profile/UserProfile.css";

export interface AppLayoutOutletContext {
  groups: GroupData[];
  selectedGroupId: string;
  onOpenGroupModal: () => void;
}

export default function AppLayout() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const navigate = useNavigate();

  /* ── Data fetching ── */

  const fetchGroups = async () => {
    try {
      const response = await fetch("http://localhost:8081/user/me/groups", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const fetchedGroups: GroupData[] = data.map((g: any) => ({
          id: g.id || g.name,
          name: g.name,
          iconType: g.iconType || "admin",
        }));
        setGroups(fetchedGroups);
      }
    } catch (e) {
      console.error("Error fetching groups:", e);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  /* ── Group actions ── */

  const createNewGroup = async (groupName: string) => {
    try {
      const response = await fetch("http://localhost:8081/groups", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName }),
      });
      if (!response.ok) throw new Error("Failed to create group");
      const newGroup = await response.json();

      const userId = localStorage.getItem("user_id");
      if (userId && newGroup.id) {
        await fetch(`http://localhost:8081/groups/${newGroup.id}/users`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      }
      await fetchGroups();
    } catch (e) {
      console.error("Error creating group:", e);
    } finally {
      setIsGroupModalOpen(false);
    }
  };

  const joinGroup = async (inviteCode: string) => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;
      const response = await fetch("http://localhost:8081/groups/users/join", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, inviteCode }),
      });
      if (!response.ok) throw new Error("Failed to join group");
      await fetchGroups();
    } catch (e) {
      console.error("Error joining group:", e);
    } finally {
      setIsGroupModalOpen(false);
    }
  };

  /* ── Render ── */

  return (
    <div className="profile-page-container">
      {/* Group modal (create / join) */}
      {isGroupModalOpen && (
        <GroupModal
          onSave={(name) => createNewGroup(name)}
          onJoin={(code) => joinGroup(code)}
          onClose={() => setIsGroupModalOpen(false)}
        />
      )}

      {/* Left sidebar — always visible regardless of which child route is active */}
      <AppSidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(id) => setSelectedGroupId(id)}
        onCreateGroupClick={() => setIsGroupModalOpen(true)}
      />

      {/* Right content area — child route renders here via Outlet */}
      <Outlet
        context={
          {
            groups,
            selectedGroupId,
            onOpenGroupModal: () => setIsGroupModalOpen(true),
          } satisfies AppLayoutOutletContext
        }
      />
    </div>
  );
}
