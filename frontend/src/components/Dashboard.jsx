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
import { RootDirectory } from "./RootDirectory";
import { FileUploader } from "./FileUploader";
import { useState, useEffect } from "react";

export function Dashboard() {
  const [uploading, setUploading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  // /api/contents state
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial load: Fetch root directory contents ONCE on mount
  useEffect(() => {
    let isMounted = true;

    async function loadContents() {
      try {
        const res = await fetch("http://localhost:5000/api/contents", {
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
  }, []);

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

    // Append newly created folder returned by backend
    if (data.folder) {
      setFolders((prev) => [...prev, data.folder]);
    }
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

        {/* Directory with Loading State */}
        {loading ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : (
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
        )}

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
