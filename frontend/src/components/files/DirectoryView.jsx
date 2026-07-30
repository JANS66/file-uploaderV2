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
  IconShare,
} from "@tabler/icons-react";
import { formatFileSize } from "../../utils/utils";

export function DirectoryView({
  folders = [],
  files = [],
  breadcrumbs = [],
  onNavigateBreadcrumb,
  onOpenFolder,
  onEditFolder,
  onDeleteFolder,
  onDeleteFile,
  onDownloadFile,
  onShareFolder,
  readOnly = false,
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
        /* ScrollContainer ensures the table wont overflow screen bounds vertically */
        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                {/* Hide 'Type' on mobile screen sizes */}
                <Table.Th visibleFrom="sm">Type</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th style={{ textAlign: "right", width: 60 }}>
                  Actions
                </Table.Th>
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
                  <Table.Td style={{ maxWidth: 200 }}>
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon
                        color="blue"
                        variant="light"
                        size="md"
                        style={{ flexShrink: 0 }}
                      >
                        <IconFolder size={18} />
                      </ThemeIcon>
                      <Text size="sm" fw={500} truncate="end">
                        {folder.name}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td visibleFrom="sm">
                    <Badge color="blue" variant="dot">
                      Folder
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: "nowrap" }}>
                    <Text size="sm" c="dimmed">
                      -
                    </Text>
                  </Table.Td>
                  <Table.Td
                    style={{ textAlign: "right", whiteSpace: "nowrap" }}
                  >
                    {!readOnly && (
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
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditFolder(folder);
                            }}
                          >
                            Edit
                          </Menu.Item>
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
                          <Menu.Item
                            leftSection={<IconShare size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareFolder(folder);
                            }}
                          >
                            Share Folder
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}

              {/* Render Files */}
              {files.map((file) => (
                <Table.Tr key={`file-${file.id}`}>
                  <Table.Td style={{ maxWidth: 200 }}>
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon
                        color="teal"
                        variant="light"
                        size="md"
                        style={{ flexShrink: 0 }}
                      >
                        <IconFile size={18} />
                      </ThemeIcon>
                      <Text size="sm" fw={500} truncate="end">
                        {file.originalName}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td visibleFrom="sm">
                    <Badge color="teal" variant="light">
                      {file.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: "nowrap" }}>
                    <Text size="sm" c="dimmed">
                      {formatFileSize(file.size)}
                    </Text>
                  </Table.Td>
                  <Table.Td
                    style={{ textAlign: "right", whiteSpace: "nowrap" }}
                  >
                    <Menu position="bottom-end" shadow="md">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconDownload size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadFile(file.id);
                          }}
                        >
                          Download
                        </Menu.Item>
                        {!readOnly && (
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFile(file.id);
                            }}
                          >
                            Delete
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Paper>
  );
}
