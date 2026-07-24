import { Container, Title, Text, Stack } from "@mantine/core";
import { FileUploader } from "./FileUploader";
import { useState } from "react";

export function Dashboard() {
  const [uploading, setUploading] = useState(false);

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

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Header Section */}
        <div>
          <Title order={2}>File Manager</Title>
          <Text c="dimmed" size="sm">
            Upload and manage your documents securely.
          </Text>
        </div>

        {/* Upload Component */}
        <FileUploader onUpload={handleUploadFiles} isUploading={uploading} />

        {/* Future components like <FileList /> or <StorageStats /> go here */}
      </Stack>
    </Container>
  );
}
