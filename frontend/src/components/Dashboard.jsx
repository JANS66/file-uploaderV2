import { Container, Title, Text, Stack, Group, Button } from "@mantine/core";
import { CreateFolderModal } from "./CreateFolderModal";
import { IconFolderPlus } from "@tabler/icons-react";
import { RootDirectory } from "./RootDirectory";
import { FileUploader } from "./FileUploader";
import { useState } from "react";

export function Dashboard() {
  const [uploading, setUploading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  // Mock initial state for files and folders
  const [folders, setFolders] = useState([
    { id: "f1", name: "Documents", folderId: null },
    { id: "f2", name: "Invoices", folderId: null },
  ]);

  const [files, setFiles] = useState([
    {
      id: "file1",
      originalName: "resume.pdf",
      mimeType: "application/pdf",
      size: 2450000,
      folderId: null,
    },
    {
      id: "file2",
      originalName: "photo.png",
      mimeType: "image/png",
      size: 1048576,
      folderId: "f1", // Lives inside "Documents", wont show in Root Directory
    },
  ]);

  const handleUploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    setUploading(true);
    try {
      const res = await fetch("http://localhost:5000/api/files/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      console.log("Uploaded successfully");
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Mock API handler for folder creation
  const handleCreateFolder = async (folderData) => {
    const response = await fetch("http://localhost:5000/api/folders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Send httpOnly JWT cookie for authentication
      body: JSON.stringify(folderData), // Sends { name: "My Folder" }
    });

    const data = await response.json();
    if (!response.ok) {
      // Throw error so handleSubmit in modal catches it and sets form error message
      throw new Error(data.message || "Failed to create folder");
    }

    console.log("Folder created on server");
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
            onClick={() => setModalOpened(true)}
          >
            New Folder
          </Button>
        </Group>

        {/* Upload Component */}
        <FileUploader onUpload={handleUploadFiles} isUploading={uploading} />

        {/* Root Directory Component */}
        <RootDirectory
          folders={folders}
          files={files}
          onOpenFolder={(folder) =>
            console.log("Navigating to folder:", folder.name)
          }
          onDeleteFolder={(id) =>
            setFolders((prev) => prev.filter((f) => f.id !== id))
          }
          onDeleteFile={(id) =>
            setFiles((prev) => prev.filter((f) => f.id !== id))
          }
        />

        {/* Create Folder Modal */}
        <CreateFolderModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onCreateFolder={handleCreateFolder}
        />
        {/* Future components like <FileList /> or <StorageStats /> go here */}
      </Stack>
    </Container>
  );
}
