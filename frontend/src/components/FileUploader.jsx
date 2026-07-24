import { useState } from "react";
import {
  Paper,
  Group,
  Text,
  Button,
  Stack,
  Card,
  ActionIcon,
  Alert,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import {
  IconUpload,
  IconX,
  IconFile,
  IconTrash,
  IconCloudUpload,
  IconAlertCircle,
} from "@tabler/icons-react";

// Config
const MAX_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_SIZE_MB * 1024 * 1024; // 10MB in bytes
const ALLOWED_TYPES = [
  MIME_TYPES.png,
  MIME_TYPES.jpeg,
  MIME_TYPES.pdf,
  "application/zip",
];

// Helper to sanitize filenames for safe UI display
const sanitizeFilename = (name) => {
  return name
    .replace(/[^a-zA-Z0-9.\-_]/g, "_") // Replace dangerous chars with "_"
    .substring(0, 80); // Cap max length to 80 chars
};

export function FileUploader({ onUpload, isUploading }) {
  const [stagedFiles, setStagedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle successful file drops (already passed Mantine checks)
  const handleDrop = (acceptedFiles) => {
    setErrorMessage(""); // Clear previous errors

    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      name: sanitizeFilename(file.name),
      rawName: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
      type: file.type || "Unknown",
    }));

    setStagedFiles((prev) => [...prev, ...newFiles]);
  };

  // Handle rejected files (failed size or type checks)
  const handleReject = (fileRejections) => {
    const firstError = fileRejections[0]?.errors[0];
    if (firstError?.code === "file-too-large") {
      setErrorMessage(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
    } else if (firstError?.code === "file-invalid-type") {
      setErrorMessage(
        "Invalid file type. Only PNG, JPEG, PDF, and ZIP are allowed.",
      );
    } else {
      setErrorMessage(
        "File validation failed. Please check the file and try again.",
      );
    }
  };

  const handleRemoveFile = (id) => {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadClick = async () => {
    if (stagedFiles.length === 0) return;

    // Pass raw file objects up to parent
    await onUpload(stagedFiles.map((item) => item.file));
    setStagedFiles([]);
  };

  return (
    <Stack gap="lg">
      {/* Error Alert */}
      {errorMessage && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Validation Error"
          color="red"
          withCloseButton
          onClose={() => setErrorMessage("")}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Dropzone with built in validation rules and loading state */}
      <Paper withBorder radius="md" p="xl" shadow="sm">
        <Dropzone
          onDrop={handleDrop}
          onReject={handleReject}
          maxSize={MAX_FILE_SIZE}
          accept={ALLOWED_TYPES}
          radius="md"
          loading={isUploading} // Dims dropzone and shows overlay spinner during upload
          disabled={isUploading}
        >
          <Group
            justify="center"
            gap="xl"
            style={{ minHeight: 140, pointerEvents: "none" }}
          >
            <Dropzone.Accept>
              <IconUpload
                size={50}
                stroke={1.5}
                color="var(--mantine-color-blue-6)"
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                size={50}
                stroke={1.5}
                color="var(--mantine-color-red-6)"
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload size={50} stroke={1.5} />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline ta="center" fw={500}>
                Drag & drop files here, or click to select
              </Text>
              <Text size="sm" c="dimmed" inline mt={7} ta="center">
                Supports PNG, JPEG, PDF, ZIP (Up to {MAX_SIZE_MB}MB each)
              </Text>
            </div>
          </Group>
        </Dropzone>
      </Paper>

      {/* Staged files preview */}
      {stagedFiles.length > 0 && (
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" mb="md">
            <Text fw={600} size="sm">
              Ready to upload ({stagedFiles.length})
            </Text>
            <Button
              size="xs"
              variant="filled"
              leftSection={<IconUpload size={14} />}
              onClick={handleUploadClick}
              loading={isUploading} // Disables button and turns leftSection into a spinner
            >
              Upload Files
            </Button>
          </Group>

          <Stack gap="xs">
            {stagedFiles.map((item) => (
              <Card key={item.id} withBorder p="sm" radius="sm">
                <Group justify="space-between">
                  <Group gap="sm">
                    <IconFile size={24} color="var(--mantine-color-blue-6)" />
                    <div>
                      <Text size="sm" fw={500}>
                        {item.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.size} MB
                      </Text>
                    </div>
                  </Group>

                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => handleRemoveFile(item.id)}
                    disabled={isUploading} // Prevents deleting item while upload fetch is active
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
