import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Stack,
  Loader,
  Center,
  Alert,
  Paper,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { DirectoryView } from "../components/files/DirectoryView";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export function SharedFolderPage() {
  const { shareToken } = useParams();

  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // SUbfolder navigation within shared view
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([
    { id: null, name: "Shared Folder" },
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadSharedContents() {
      try {
        setLoading(true);
        setError(null);

        // Fetch shared contents
        const url = currentFolderId
          ? `${API_BASE_URL}/api/shares/${shareToken}?folderId=${currentFolderId}`
          : `${API_BASE_URL}/api/shares/${shareToken}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Invalid or expired share link.");
        }

        if (isMounted) {
          setFolderName(data.folderName || "Shared Folder");
          setFolders(data.folders || []);
          setFiles(data.files || []);

          // Set initial root breadcrumb name to actual folder name once loaded
          if (!currentFolderId) {
            setBreadcrumbs([{ id: null, name: data.folderName }]);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSharedContents();

    return () => {
      isMounted = false;
    };
  }, [shareToken, currentFolderId]);

  // Public File Download Handler
  const handleDownloadFile = (fileId) => {
    // Uses public download endpoint with shareToken for authentication
    const downloadUrl = `${API_BASE_URL}/api/shares/${shareToken}/files/${fileId}/download`;
    window.open(downloadUrl, "_blank");
  };

  const handleOpenFolder = (folder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index) => {
    const targetCrumb = breadcrumbs[index];
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setCurrentFolderId(targetCrumb.id);
  };

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Link Unavailable"
          color="red"
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Header Banner */}
        <Paper p="md" withBorder radius="md">
          <Title order={3}>{folderName}</Title>
          <Text size="sm" c="dimmed">
            Shared folder (Read-Only)
          </Text>
        </Paper>

        <DirectoryView
          readOnly
          folders={folders}
          files={files}
          breadcrumbs={breadcrumbs}
          onNavigateBreadcrumb={handleNavigateBreadcrumb}
          onOpenFolder={handleOpenFolder}
          onDownloadFile={handleDownloadFile}
        />
      </Stack>
    </Container>
  );
}
