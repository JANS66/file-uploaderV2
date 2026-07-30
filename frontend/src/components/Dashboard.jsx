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
import { CreateFolderModal } from "./CreateFolderModal";
import { IconFolderPlus } from "@tabler/icons-react";
import { DirectoryView } from "./DirectoryView";
import { FileUploader } from "./FileUploader";
import { useState, useEffect } from "react";
import { EditFolderModal } from "./EditFolderModal";
import { ShareFolderModal } from "./ShareFolderModal";

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
        const url = currentFolder
          ? `${API_BASE_URL}/api/contents?folderId=${currentFolder.id}`
          : `${API_BASE_URL}/api/contents`;

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load contents");

        const data = await res.json();
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
    if (currentFolder?.id) {
      formData.append("folderId", currentFolder.id);
    }

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error("Upload failed");

      // Append newly uploaded files returned by backend
      if (data.files && Array.isArray(data.files)) {
        setFiles((prev) => [...prev, ...data.files]);
      }
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

    const response = await fetch(`${API_BASE_URL}/api/folders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Send httpOnly JWT cookie for authentication
      body: JSON.stringify(payload), // Sends { name: "My Folder" }
    });

    const data = await response.json();
    if (!response.ok) {
      // Throw error so handleSubmit in modal catches it and sets form error message
      throw new Error(data.message || "Failed to create folder");
    }

    // Append newly created folder returned by backend
    if (data.folder) {
      setFolders((prev) => [...prev, data.folder]);
    }
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
      const res = await fetch(`${API_BASE_URL}/api/folders/${folderId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete folder");
      }

      // Remove deleted folder from local state
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    } catch (err) {
      console.error("Error deleting folder:", err);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete file");
      }

      // Remove deleted file from local state
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleEditFolder = async (folderId, newName) => {
    const response = await fetch(`${API_BASE_URL}/api/folders/${folderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ name: newName }),
    });

    const data = await response.json();
    if (!response.ok) {
      // Throw so EditFolderModal catches it and displays form.setFieldError
      throw new Error(data.message || "Failed to rename folder");
    }

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
    const downloadUrl = `http://localhost:5000/api/files/${fileId}/download`;
    window.open(downloadUrl, "_blank");
  };

  // API Call to generate share token
  const handleGenerateShareLink = async (folderId, expiresIn) => {
    const response = await fetch(
      `${API_BASE_URL}/api/folders/${folderId}/share`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ expiresIn }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create share link");
    }

    const data = await response.json();
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
