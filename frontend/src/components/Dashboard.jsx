import { Container, Title, Text, Stack, Group, Button } from "@mantine/core";
import { CreateFolderModal } from "./CreateFolderModal";
import { IconFolderPlus } from "@tabler/icons-react";
import { FileUploader } from "./FileUploader";
import { useState } from "react";

export function Dashboard() {
  const [uploading, setUploading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

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
    console.log("Folder created", folderData);
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
