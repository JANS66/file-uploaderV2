import { Container, Title, Text, Stack } from "@mantine/core";
import { FileUploader } from "./FileUploader";

export function Dashboard() {
  const handleUploadFiles = (files) => {
    console.log("Files passed to Dashboard for upload:", files);
    // Next step: Send these raw File objects to backend via FormData
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
        <FileUploader onUpload={handleUploadFiles} />

        {/* Future components like <FileList /> or <StorageStats /> go here */}
      </Stack>
    </Container>
  );
}
