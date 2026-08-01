import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Loader,
  Center,
} from "@mantine/core";
import { CreateFolderModal } from "../components/modals/CreateFolderModal";
import { IconFolderPlus } from "@tabler/icons-react";
import { DirectoryView } from "../components/files/DirectoryView";
import { FileUploader } from "../components/files/FileUploader";
import { useState, useEffect } from "react";
import { EditFolderModal } from "../components/modals/EditFolderModal";
import { ShareFolderModal } from "../components/modals/ShareFolderModal";
import { apiFetch } from "../api/client";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export function Dashboard() {
  const [uploading, setUploading] = useState(false);
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null); // Tracks folder selected for edit

  // Folder navigation state
  const [currentFolder, setCurrentFolder] = useState(null); // null = Root
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: "Home" }]);

  // /api/contents state
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Share Modal state
  const [sharingFolder, setSharingFolder] = useState(null); // null = modal closed, object = open

  // Fetch directory contents whenever currentFolder changes
  useEffect(() => {
    let isMounted = true;

    async function loadContents() {
      try {
        const query = currentFolder ? `?folderId=${currentFolder.id}` : "";
        const data = await apiFetch.get(`/api/contents${query}`);

        if (isMounted) {
          setFolders(data.folders || []);
          setFiles(data.files || []);
        }
      } catch (err) {
        console.error("Error loading contents:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadContents();

    return () => {
      isMounted = false;
    };
  }, [currentFolder]);

  const handleUploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    // If viewing a subfolder, attach folderId to the FormData payload
    if (currentFolder?.id) formData.append("folderId", currentFolder.id);

    setUploading(true);
    try {
      const data = await apiFetch.post("/api/files/upload", formData);
      // Append newly uploaded files returned by backend
      if (data.files) setFiles((prev) => [...prev, ...data.files]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Handle Folder Creation (Appends newly created folder to state)
  const handleCreateFolder = async (folderData) => {
    const payload = {
      ...folderData, // { name: "New Folder" }
      folderId: currentFolder?.id || null, // Attach parent folderId context
    };

    const data = await apiFetch.post("/api/folders", payload);
    // Append newly created folder returned by backend
    if (data.folder) setFolders((prev) => [...prev, data.folder]);
  };

  // Navigation handlers
  const handleOpenFolder = (folder) => {
    setLoading(true);
    setCurrentFolder(folder);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index) => {
    setLoading(true);
    const targetCrumb = breadcrumbs[index];
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setCurrentFolder(
      targetCrumb.id ? { id: targetCrumb.id, name: targetCrumb.name } : null,
    );
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await apiFetch.delete(`/api/folders/${folderId}`);
      // Remove deleted folder from local state
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    } catch (err) {
      console.error("Error deleting folder:", err);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await apiFetch.delete(`/api/files/${fileId}`);
      // Remove deleted file from local state
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleEditFolder = async (folderId, newName) => {
    const data = await apiFetch.put(`/api/folders/${folderId}`, {
      name: newName,
    });
    // Update local state directly with the servers sanitized response
    if (data.folder) {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === folderId ? { ...f, name: data.folder.name } : f,
        ),
      );
    }
  };

  const handleDownloadFile = (fileId) => {
    const downloadUrl = `${API_BASE_URL}/api/files/${fileId}/download`;
    window.open(downloadUrl, "_blank");
  };

  // API Call to generate share token
  const handleGenerateShareLink = async (folderId, expiresIn) => {
    const data = await apiFetch.post(`/api/folders/${folderId}/share`, {
      expiresIn,
    });

    // Return full shareable URL
    return `${window.location.origin}/share/${data.shareToken}`;
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Header Section */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>File Manager</Title>
            <Text c="dimmed" size="sm">
              Upload and manage your documents securely.
            </Text>
          </div>

          {/* Action Trigger Button */}
          <Button
            variant="light"
            leftSection={<IconFolderPlus size={18} />}
            onClick={() => setCreateFolderModal(true)}
          >
            New Folder
          </Button>
        </Group>

        {/* Upload Component */}
        <FileUploader onUpload={handleUploadFiles} isUploading={uploading} />

        {/* Directory with Loading State */}
        {loading ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : (
          <DirectoryView
            folders={folders}
            files={files}
            breadcrumbs={breadcrumbs}
            onNavigateBreadcrumb={handleNavigateBreadcrumb}
            onOpenFolder={handleOpenFolder}
            onEditFolder={(folder) => setEditingFolder(folder)} // Open edit modal
            onDeleteFolder={handleDeleteFolder}
            onDeleteFile={handleDeleteFile}
            onDownloadFile={handleDownloadFile}
            onShareFolder={(folder) => setSharingFolder(folder)}
          />
        )}

        {/* Create Folder Modal */}
        <CreateFolderModal
          opened={createFolderModal}
          onClose={() => setCreateFolderModal(false)}
          onCreateFolder={handleCreateFolder}
        />

        {/* Edit Folder Modal */}
        <EditFolderModal
          opened={Boolean(editingFolder)}
          onClose={() => setEditingFolder(null)}
          folder={editingFolder}
          onRenameFolder={handleEditFolder}
        />

        <ShareFolderModal
          opened={Boolean(sharingFolder)}
          onClose={() => setSharingFolder(null)}
          folderId={sharingFolder?.id}
          onGenerateLink={handleGenerateShareLink}
        />
      </Stack>
    </Container>
  );
}
