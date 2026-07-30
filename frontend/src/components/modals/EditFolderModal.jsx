import { Modal, TextInput, Button, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { sanitizeFolderName } from "../../utils/utils";

export function EditFolderModal({ opened, onClose, folder, onRenameFolder }) {
  // Initialize Mantine form with validation rules
  const form = useForm({
    initialValues: {
      name: "",
    },
    validate: {
      name: (value) => {
        const clean = sanitizeFolderName(value);
        if (!clean) return "Folder name cannot be empty";
        if (clean.length < 2)
          return "Folder name must be at least 2 characters long";
        if (/[/\\?%*:|"<>]/g.test(value)) {
          return 'Folder name cannot contain characters like / \\ ? * : | " < >';
        }
        return null;
      },
    },
  });

  // Destructure stable helper methods
  const { setInitialValues, setValues, clearErrors } = form;

  // Sync initial form values
  useEffect(() => {
    if (folder) {
      setInitialValues({ name: folder.name || "" });
      setValues({ name: folder.name || "" });
      clearErrors();
    }
  }, [folder, setInitialValues, setValues, clearErrors]);

  const handleSubmit = async (values) => {
    const sanitizedName = values.name.trim();

    // No API call needed if name hasnt changed
    if (sanitizedName === folder?.name) {
      onClose();
      return;
    }

    try {
      await onRenameFolder(folder.id, sanitizedName);
      onClose();
    } catch (err) {
      // Set server returned validation errors directly onto the form field
      form.setFieldError("name", err.message || "Failed to rename folder");
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Rename Folder" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Folder Name"
            placeholder="Enter new folder name"
            {...form.getInputProps("name")}
            disabled={form.submitting}
            data-autofocus
          />

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={form.submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={form.submitting}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
