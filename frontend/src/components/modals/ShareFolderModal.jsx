import { useState } from "react";
import {
  Modal,
  Select,
  Button,
  Group,
  TextInput,
  ActionIcon,
  CopyButton,
  Tooltip,
  Text,
  Stack,
} from "@mantine/core";
import { IconCopy, IconCheck, IconLink } from "@tabler/icons-react";

const DURATION_OPTIONS = [
  { value: "1h", label: "1 Hour" },
  { value: "24h", label: "1 Day" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "never", label: "Never (Permanent)" },
];

export function ShareFolderModal({
  opened,
  onClose,
  folderId,
  onGenerateLink,
}) {
  const [duration, setDuration] = useState("24h");
  const [shareLink, setShareLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Call endpoint passed from Dashboard
      const link = await onGenerateLink(folderId, duration);
      setShareLink(link);
    } catch (err) {
      console.error("Failed to generate share link:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShareLink("");
    setDuration("24h");
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={600}>Share Folder</Text>}
      centered
    >
      <Stack spacing="md">
        {!shareLink ? (
          <>
            <Select
              label="Link Expiration"
              description="How long should this share link remain valid?"
              value={duration}
              onChange={setDuration}
              data={DURATION_OPTIONS}
            />

            <Group position="right" mt="md">
              <Button variant="subtle" color="gray" onClick={handleClose}>
                Cancel
              </Button>
              <Button loading={loading} onClick={handleGenerate}>
                Generate Link
              </Button>
            </Group>
          </>
        ) : (
          <>
            <Text size="sm" color="dimmed">
              Anyone with this link can view and download files inside this
              folder.
            </Text>

            <TextInput
              readOnly
              value={shareLink}
              leftSection={<IconLink size={16} />}
              rightSection={
                <CopyButton value={shareLink} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied!" : "Copy link"} withArrow>
                      <ActionIcon
                        color={copied ? "teal" : "gray"}
                        variant="subtle"
                        onClick={copy}
                      >
                        {copied ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconCopy size={16} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              }
            />

            <Group position="right" mt="md">
              <Button onClick={handleClose}>Done</Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
