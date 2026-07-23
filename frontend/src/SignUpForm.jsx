import { useState } from "react";
import {
  Card,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Anchor,
  Container,
} from "@mantine/core";

export function SignUpForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted:", formData);
    // API call here
  };

  return (
    <Container size="xs" my={40}>
      <Card withBorder shadow="sm" padding="lg" radius="md">
        <Title order={2} ta="center" mb="xs">
          Create an Account
        </Title>
        <Text color="dimmed" size="sm" ta="center" mb="xl">
          Enter your details below to get started
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Full Name"
              placeholder="Jane Doe"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <TextInput
              label="Email"
              placeholder="jane@example.com"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Button type="submit" fullWidth mt="md">
              Sign Up
            </Button>
          </Stack>
        </form>

        <Text ta="center" size="sm" mt="md">
          Already have an account?{" "}
          <Anchor href="/login" size="sm">
            Log in
          </Anchor>
        </Text>
      </Card>
    </Container>
  );
}
