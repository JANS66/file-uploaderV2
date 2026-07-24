import { Modal, TextInput, Button, Group, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconFolderPlus } from "@tabler/icons-react";

// Helper to sanitize folder names
const sanitizeFolderName = (name) => {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "_") // Replace dangerous special chars with "_"
    .substring(0, 50); // Cap at 50 chars
};

export function CreateFolderModal({ opened, onClose, onCreateFolder }) {
  const form = useForm({
    initialValues: {
      folderName: "",
    },

    // Validation rules
    validate: {
      folderName: (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return "Folder name is required";
        }
        if (trimmed.length < 2) {
          return "Folder name must be at least 2 characters long";
        }
        if (trimmed.length > 50) {
          return "Folder name cannot exceed 50 characters";
        }
        if (/[/\\?%*:|"<>]/g.test(trimmed)) {
          return 'Folder name cannot contain special characters like / \\ ? * : | " < >';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (value) => {
    const cleanName = sanitizeFolderName(value.folderName);

    console.log("Mock API Call: Creating folder ->", { name: cleanName });

    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconFolderPlus size={20} color="var(--mantine-color-blue-6)" />
          <Text fw={600}>Create New Folder</Text>
        </Group>
      }
      centered
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Folder Name"
            placeholder="e.g. Invoices, Personal, Project Docs"
            data-autofocus
            {...form.getInputProps("folderName")}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" color="gray" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              leftSection={<IconFolderPlus size={16} />}
              loading={form.submitting}
            >
              Create Folder
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
