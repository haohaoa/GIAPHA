import React, { useState, useEffect } from 'react';
import { FamilyTree, Person, AuthUser, AdminCredentials } from './types/family';
import { INITIAL_FAMILY_TREE } from './data/sampleTree';
import { DEFAULT_ADMIN_CREDENTIALS } from './utils/backup';
import { Header } from './components/Header';
import { TreeVisualizer } from './components/TreeVisualizer';
import { GenerationListView } from './components/GenerationListView';
import { MemberDrawer } from './components/MemberDrawer';
import { MemberFormModal, AddMode } from './components/MemberFormModal';
import { KinshipModal } from './components/KinshipModal';
import { BackupModal } from './components/BackupModal';
import { DeathAnniversariesModal } from './components/DeathAnniversariesModal';
import { AuthModal } from './components/AuthModal';
import { MobileBottomBar } from './components/MobileBottomBar';
import { ConfirmModal } from './components/ConfirmModal';
import confetti from 'canvas-confetti';

const STORAGE_KEY_TREE = 'genealogy_family_tree_v1';
const STORAGE_KEY_USER = 'genealogy_auth_user_v1';
const STORAGE_KEY_ADMIN_CREDS = 'genealogy_admin_credentials_v1';

/**
 * Sanitizes and cleans up all dangling references in the family tree
 * to guarantee no deleted member ever remains in references, excel exports, or state.
 */
function sanitizeFamilyTree(rawTree: FamilyTree): FamilyTree {
  if (!rawTree || !rawTree.members || typeof rawTree.members !== 'object') {
    return INITIAL_FAMILY_TREE;
  }

  const memberKeys = Object.keys(rawTree.members).filter((k) => {
    const m = rawTree.members[k];
    return Boolean(m && m.id && m.fullName);
  });

  if (memberKeys.length === 0) {
    return {
      id: rawTree.id || `tree_${Date.now()}`,
      name: rawTree.name || 'Gia Phả Dòng Họ',
      branchName: rawTree.branchName || 'Chi Trưởng',
      origin: rawTree.origin || '',
      createdDate: rawTree.createdDate || new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      rootPersonId: '',
      members: {},
    };
  }

  const validIdSet = new Set(memberKeys);
  const cleanMembers: Record<string, Person> = {};

  memberKeys.forEach((id) => {
    const m = rawTree.members[id];
    cleanMembers[id] = {
      ...m,
      id,
      fatherId: m.fatherId && validIdSet.has(m.fatherId) ? m.fatherId : null,
      motherId: m.motherId && validIdSet.has(m.motherId) ? m.motherId : null,
      spouseIds: (Array.isArray(m.spouseIds) ? m.spouseIds : []).filter((sId) => validIdSet.has(sId) && sId !== id),
      childrenIds: (Array.isArray(m.childrenIds) ? m.childrenIds : []).filter((cId) => validIdSet.has(cId) && cId !== id),
      generation: Number(m.generation) || 1,
      birthOrder: Number(m.birthOrder) || 1,
    };
  });

  let rootPersonId = rawTree.rootPersonId;
  if (!validIdSet.has(rootPersonId)) {
    const gen1 = Object.values(cleanMembers).find((m) => m.generation === 1);
    rootPersonId = gen1 ? gen1.id : memberKeys[0];
  }

  return {
    ...rawTree,
    id: rawTree.id || `tree_${Date.now()}`,
    rootPersonId,
    members: cleanMembers,
    updatedDate: new Date().toISOString(),
  };
}

export default function App() {
  // 1. Family Tree State
  const [tree, setTree] = useState<FamilyTree>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TREE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.members && Object.keys(parsed.members).length > 0) {
          return sanitizeFamilyTree(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading saved tree:', e);
    }
    return INITIAL_FAMILY_TREE;
  });

  // Admin Credentials State (Username & Password)
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_CREDS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return DEFAULT_ADMIN_CREDENTIALS;
  });

  // 2. User Authentication State
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    // Default administrator account
    return {
      id: 'admin_primary',
      email: 'haohao051103@gmail.com',
      name: 'Hảo Hảo (Quản Trị Viên)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      provider: 'password',
      role: 'admin',
      isAdmin: true,
    };
  });

  // Admin status evaluation
  const isAdmin = Boolean(
    user && (user.isAdmin || user.role === 'admin' || user.email === adminCreds.email || user.email === 'haohao051103@gmail.com')
  );

  // Persist tree (always sanitized)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TREE, JSON.stringify(tree));
    } catch (e) {
      console.error('Error persisting tree:', e);
    }
  }, [tree]);

  // Persist admin credentials
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_CREDS, JSON.stringify(adminCreds));
    } catch (e) {}
  }, [adminCreds]);

  // Persist user
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {}
  }, [user]);

  // 3. Selection & Modal States
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);

  // Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<AddMode>('root');
  const [formTargetPerson, setFormTargetPerson] = useState<Person | null>(null);

  const [isKinshipOpen, setIsKinshipOpen] = useState(false);
  const [kinshipP1Id, setKinshipP1Id] = useState<string | null>(null);
  const [kinshipP2Id, setKinshipP2Id] = useState<string | null>(null);

  const [isAnniversariesOpen, setIsAnniversariesOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);

  // === HANDLERS ===

  // Select a person to open Detail Drawer
  const handleSelectPerson = (person: Person) => {
    // Look up fresh member from tree
    const freshPerson = tree.members[person.id] || person;
    setSelectedPerson(freshPerson);
    setIsDrawerOpen(true);
  };

  // Add child (Only if Admin)
  const handleAddChild = (parent: Person) => {
    if (!isAdmin) {
      setIsAuthOpen(true);
      return;
    }
    setFormTargetPerson(parent);
    setFormMode('child');
    setIsFormModalOpen(true);
  };

  // Add spouse (Only if Admin)
  const handleAddSpouse = (person: Person) => {
    if (!isAdmin) {
      setIsAuthOpen(true);
      return;
    }
    setFormTargetPerson(person);
    setFormMode('spouse');
    setIsFormModalOpen(true);
  };

  // Add parent (Only if Admin)
  const handleAddParent = (person: Person) => {
    if (!isAdmin) {
      setIsAuthOpen(true);
      return;
    }
    setFormTargetPerson(person);
    setFormMode('parent');
    setIsFormModalOpen(true);
  };

  // Add root ancestor (Only if Admin)
  const handleAddRootAncestor = () => {
    if (!isAdmin) {
      setIsAuthOpen(true);
      return;
    }
    setFormTargetPerson(null);
    setFormMode('root');
    setIsFormModalOpen(true);
  };

  // Quick Kinship Lookup
  const handleQuickKinship = (person: Person) => {
    setKinshipP1Id(person.id);
    setKinshipP2Id(tree.rootPersonId || Object.keys(tree.members)[0]);
    setIsKinshipOpen(true);
  };

  // Save/Update member details
  const handleSavePerson = (updatedPerson: Person) => {
    setTree((prev) => {
      const nextMembers = {
        ...prev.members,
        [updatedPerson.id]: updatedPerson,
      };
      return sanitizeFamilyTree({
        ...prev,
        members: nextMembers,
      });
    });
    setSelectedPerson(updatedPerson);
  };

  // Request delete member (checks rules and asks for confirmation)
  const handleDeletePerson = (personId: string) => {
    if (!isAdmin) {
      setIsAuthOpen(true);
      return;
    }

    const target = tree.members[personId];
    if (!target) return;

    // Rule: Cannot delete if has children (must delete bottom-up from children first)
    if ((target.childrenIds || []).length > 0) {
      const childrenNames = (target.childrenIds || [])
        .map((cid) => tree.members[cid]?.fullName)
        .filter(Boolean)
        .join(', ');

      setDeleteBlockedReason(
        `Không thể xóa tiền nhân "${target.fullName}" vì thành viên này hiện có ${target.childrenIds.length} người con (${childrenNames}). Theo quy tắc phả hệ, bạn cần xóa từ các đời con cháu dưới cùng lên trước, hoặc dùng nút "Sửa" để thay đổi thông tin.`
      );
      return;
    }

    // Open confirmation dialog
    setPersonToDelete(target);
  };

  // Perform actual member deletion upon confirmation
  const handleExecuteDeletePerson = () => {
    if (!personToDelete) return;
    const personId = personToDelete.id;

    setTree((prev) => {
      const nextMembers = { ...prev.members };
      delete nextMembers[personId];

      // Clean up references in all remaining members
      (Object.values(nextMembers) as Person[]).forEach((m) => {
        if (m.fatherId === personId) m.fatherId = null;
        if (m.motherId === personId) m.motherId = null;
        m.spouseIds = (m.spouseIds || []).filter((id) => id !== personId);
        m.childrenIds = (m.childrenIds || []).filter((id) => id !== personId);
      });

      // Update root if root was deleted
      let newRoot = prev.rootPersonId;
      if (prev.rootPersonId === personId) {
        newRoot = Object.keys(nextMembers)[0] || '';
      }

      return sanitizeFamilyTree({
        ...prev,
        rootPersonId: newRoot,
        members: nextMembers,
      });
    });

    if (selectedPerson?.id === personId) {
      setSelectedPerson(null);
      setIsDrawerOpen(false);
    }

    setPersonToDelete(null);
  };

  // Handle Form Submit (Add child/spouse/parent/root)
  const handleFormSubmit = (newPerson: Person, mode: AddMode, targetPersonId?: string) => {
    setTree((prev) => {
      const nextMembers = { ...prev.members, [newPerson.id]: newPerson };
      let newRoot = prev.rootPersonId;

      if (mode === 'child' && targetPersonId && nextMembers[targetPersonId]) {
        const parent = nextMembers[targetPersonId];
        if (!parent.childrenIds.includes(newPerson.id)) {
          parent.childrenIds = [...parent.childrenIds, newPerson.id];
        }

        // If parent has a spouse, also link to spouse
        (parent.spouseIds || []).forEach((sId) => {
          const spouse = nextMembers[sId];
          if (spouse && !spouse.childrenIds.includes(newPerson.id)) {
            spouse.childrenIds = [...spouse.childrenIds, newPerson.id];
          }
          if (parent.gender === 'male' && !newPerson.motherId) {
            newPerson.motherId = sId;
          } else if (parent.gender === 'female' && !newPerson.fatherId) {
            newPerson.fatherId = sId;
          }
        });
      } else if (mode === 'spouse' && targetPersonId && nextMembers[targetPersonId]) {
        const target = nextMembers[targetPersonId];
        if (!target.spouseIds.includes(newPerson.id)) {
          target.spouseIds = [...target.spouseIds, newPerson.id];
        }
      } else if (mode === 'parent' && targetPersonId && nextMembers[targetPersonId]) {
        const target = nextMembers[targetPersonId];
        if (!newPerson.childrenIds.includes(target.id)) {
          newPerson.childrenIds = [...newPerson.childrenIds, target.id];
        }
        if (newPerson.gender === 'male') {
          target.fatherId = newPerson.id;
        } else {
          target.motherId = newPerson.id;
        }
      } else if (mode === 'root') {
        if (!newRoot || Object.keys(prev.members).length === 0) {
          newRoot = newPerson.id;
        }
      }

      return sanitizeFamilyTree({
        ...prev,
        rootPersonId: newRoot,
        members: nextMembers,
      });
    });

    try {
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
    } catch {}

    // Auto select new person
    setSelectedPerson(newPerson);
    setHighlightedPersonId(newPerson.id);
    setTimeout(() => setHighlightedPersonId(null), 3000);
  };

  // Import tree from Excel or JSON (Sanitizing immediately)
  const handleImportTree = (importedTree: FamilyTree) => {
    const sanitized = sanitizeFamilyTree(importedTree);
    setTree(sanitized);
    setSelectedPerson(null);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  // Reset to default sample
  const handleResetSample = () => {
    setTree(INITIAL_FAMILY_TREE);
    setSelectedPerson(null);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Header Toolbar */}
      <Header
        tree={tree}
        user={user}
        isAdmin={isAdmin}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenKinship={() => {
          setKinshipP1Id(null);
          setKinshipP2Id(null);
          setIsKinshipOpen(true);
        }}
        onOpenAnniversaries={() => setIsAnniversariesOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onAddRootAncestor={handleAddRootAncestor}
      />

      {/* 2. Main Interactive View: Tree or Generational List */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'tree' ? (
          <TreeVisualizer
            tree={tree}
            selectedPersonId={selectedPerson?.id || null}
            highlightedPersonId={highlightedPersonId}
            isAdmin={isAdmin}
            onSelectPerson={handleSelectPerson}
            onAddSpouse={handleAddSpouse}
            onAddChild={handleAddChild}
            onAddRootAncestor={handleAddRootAncestor}
            onQuickKinship={handleQuickKinship}
            onDeletePerson={(p) => handleDeletePerson(p.id)}
          />
        ) : (
          <GenerationListView
            tree={tree}
            selectedPersonId={selectedPerson?.id || null}
            highlightedPersonId={highlightedPersonId}
            isAdmin={isAdmin}
            onSelectPerson={handleSelectPerson}
            onAddSpouse={handleAddSpouse}
            onAddChild={handleAddChild}
            onAddRootAncestor={handleAddRootAncestor}
            onQuickKinship={handleQuickKinship}
            onDeletePerson={(p) => handleDeletePerson(p.id)}
          />
        )}
      </main>

      {/* 3. Mobile Thumb Bottom Bar */}
      <MobileBottomBar
        isAdmin={isAdmin}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenKinship={() => setIsKinshipOpen(true)}
        onOpenAnniversaries={() => setIsAnniversariesOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onAddMember={handleAddRootAncestor}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* 4. Modals & Drawers */}

      {/* Member Details & Edit Drawer */}
      <MemberDrawer
        person={selectedPerson}
        tree={tree}
        isOpen={isDrawerOpen}
        isAdmin={isAdmin}
        onClose={() => setIsDrawerOpen(false)}
        onSavePerson={handleSavePerson}
        onDeletePerson={handleDeletePerson}
        onAddChild={handleAddChild}
        onAddSpouse={handleAddSpouse}
        onAddParent={handleAddParent}
        onOpenKinshipLookup={handleQuickKinship}
      />

      {/* Add Member Form Modal */}
      <MemberFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        targetPerson={formTargetPerson}
        tree={tree}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Kinship Relationship Calculator Modal */}
      <KinshipModal
        isOpen={isKinshipOpen}
        tree={tree}
        initialPerson1Id={kinshipP1Id}
        initialPerson2Id={kinshipP2Id}
        onClose={() => setIsKinshipOpen(false)}
      />

      {/* Death Anniversaries Calendar Modal */}
      <DeathAnniversariesModal
        isOpen={isAnniversariesOpen}
        tree={tree}
        onClose={() => setIsAnniversariesOpen(false)}
        onSelectPerson={(p) => {
          setSelectedPerson(p);
          setIsDrawerOpen(true);
        }}
      />

      {/* Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        tree={tree}
        isAdmin={isAdmin}
        adminCreds={adminCreds}
        onClose={() => setIsBackupOpen(false)}
        onImportTree={handleImportTree}
        onResetSample={handleResetSample}
        onRequireAdminLogin={() => setIsAuthOpen(true)}
      />

      {/* Admin Username & Password Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        user={user}
        adminCreds={adminCreds}
        onClose={() => setIsAuthOpen(false)}
        onLogin={(loggedInUser) => setUser(loggedInUser)}
        onLogout={() => setUser(null)}
        onUpdateAdminCreds={(creds) => setAdminCreds(creds)}
      />

      {/* Global Confirm Modal for Deleting Member */}
      {personToDelete && (
        <ConfirmModal
          isOpen={Boolean(personToDelete)}
          type="danger"
          title="Xác Nhận Xóa Thành Viên"
          confirmText="Xác Nhận Xóa"
          cancelText="Hủy Bỏ"
          message={
            <div className="space-y-2.5 text-left bg-slate-950/80 p-3.5 rounded-2xl border border-red-900/40 text-xs">
              <p className="text-red-200 font-semibold">
                Bạn có chắc chắn muốn xóa thành viên này khỏi cây gia phả không?
              </p>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Họ và tên:</span>
                  <span className="font-bold text-amber-300">{personToDelete.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Thế hệ (Đời):</span>
                  <span className="font-semibold text-blue-300">Đời thứ {personToDelete.generation || 1}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Chi họ:</span>
                  <span>{personToDelete.branch || 'Chi họ'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Danh xưng:</span>
                  <span>{personToDelete.birthOrderTitle || (personToDelete.gender === 'male' ? 'Nam' : 'Nữ')}</span>
                </div>
              </div>
              <p className="text-red-400/90 text-[11px] pt-1 border-t border-slate-800">
                ⚠️ Hành động này sẽ xóa hoàn toàn hồ sơ thành viên và gỡ bỏ liên kết trong phả đồ.
              </p>
            </div>
          }
          onConfirm={handleExecuteDeletePerson}
          onCancel={() => setPersonToDelete(null)}
        />
      )}

      {/* Info Modal for Deletion Rule Explanation */}
      {deleteBlockedReason && (
        <ConfirmModal
          isOpen={Boolean(deleteBlockedReason)}
          type="warning"
          title="Quy Tắc Gia Phả"
          confirmText="Đã Hiểu"
          cancelText="Đóng"
          message={
            <div className="text-left bg-amber-950/30 p-3.5 rounded-2xl border border-amber-800/50 text-xs space-y-2">
              <p className="text-amber-200 leading-relaxed">{deleteBlockedReason}</p>
            </div>
          }
          onConfirm={() => setDeleteBlockedReason(null)}
          onCancel={() => setDeleteBlockedReason(null)}
        />
      )}
    </div>
  );
}
