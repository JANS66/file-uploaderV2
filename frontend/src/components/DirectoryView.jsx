import {
  Table,
  Group,
  Text,
  Paper,
  Stack,
  ThemeIcon,
  Badge,
  ActionIcon,
  Menu,
  Breadcrumbs,
  Anchor,
} from "@mantine/core";
import {
  IconFolder,
  IconFile,
  IconDotsVertical,
  IconTrash,
  IconEdit,
  IconFolderOpen,
  IconDownload,
  IconChevronRight,
} from "@tabler/icons-react";

// Helper to format raw byte sizes into human readable strings
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export function DirectoryView({
  folders = [],
  files = [],
  breadcrumbs = [],
  onNavigateBreadcrumb,
  onOpenFolder,
  onEditFolder,
  onDeleteFolder,
  onDeleteFile,
}) {
  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <Paper radius="md" withBorder p="md">
      {/* ALWAYS render the breadcrumbs bar at the top */}
      <Group justify="space-between" mb="md">
        <Breadcrumbs separator={<IconChevronRight size={14} />}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Text key={crumb.id || "root"} fw={600} size="sm">
                {crumb.name}
              </Text>
            ) : (
              <Anchor
                key={crumb.id || "root"}
                size="sm"
                underline="hover"
                onClick={() => onNavigateBreadcrumb(index)}
              >
                {crumb.name}
              </Anchor>
            );
          })}
        </Breadcrumbs>
      </Group>

      {/* Conditionally render either the Empty State OR the Table */}
      {isEmpty ? (
        <Paper p="xl" radius="md" style={{ textAlign: "center" }}>
          <Stack align="center" gap="xs">
            <ThemeIcon size={48} radius="xl" variant="light" color="gray">
              <IconFolderOpen size={24} />
            </ThemeIcon>
            <Text fw={500} size="lg">
              This folder is empty
            </Text>
            <Text c="dimmed" size="sm">
              Upload a file or create a subfolder above to get started.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Size</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {/* Render Folders */}
            {folders.map((folder) => (
              <Table.Tr
                key={`folder-${folder.id}`}
                style={{ cursor: "pointer" }}
                onClick={() => onOpenFolder(folder)}
              >
                <Table.Td>
                  <Group gap="sm">
                    <ThemeIcon color="blue" variant="light" size="md">
                      <IconFolder size={18} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>
                      {folder.name}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge color="blue" variant="dot">
                    Folder
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    -
                  </Text>
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {/* Edit Menu Item */}
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditFolder(folder);
                        }}
                      >
                        Edit
                      </Menu.Item>
                      {/* Delete Menu Item */}
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}

            {/* Render Files */}
            {files.map((file) => (
              <Table.Tr key={`file-${file.id}`}>
                <Table.Td>
                  <Group gap="sm">
                    <ThemeIcon color="teal" variant="light" size="md">
                      <IconFile size={18} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>
                      {file.originalName}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge color="teal" variant="light">
                    {file.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {formatFileSize(file.size)}
                  </Text>
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconDownload size={14} />}
                        component="a"
                        href={`http://localhost:5000/uploads/${file.storedName}`}
                        target="_blank"
                        download
                      >
                        Download
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => onDeleteFile(file.id)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}
