import {
  Group,
  Text,
  Menu,
  UnstyledButton,
  Paper,
  Container,
} from "@mantine/core";
import { IconLogout, IconChevronDown } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <Paper shadow="xs" p="md" radius={0}>
      <Container size="lg">
        <Group justify="space-between" align="center">
          <Text
            size="xl"
            fw={700}
            variant="gradient"
            gradient={{ from: "blue", to: "cyan" }}
          >
            FileUploader
          </Text>

          {user ? (
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <div>
                      <Text size="sm" fw={500}>
                        {user.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user.email}
                      </Text>
                    </div>
                    <IconChevronDown size={14} stroke={1.5} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={logout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Text size="sm" c="dimmed">
              Not logged in
            </Text>
          )}
        </Group>
      </Container>
    </Paper>
  );
}
