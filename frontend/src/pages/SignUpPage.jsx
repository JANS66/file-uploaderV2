import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { useAuth } from "../context/useAuth";
import { Link } from "react-router-dom";
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
  Alert,
} from "@mantine/core";
import { apiFetch } from "../api/client";

export function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();
  const { handleAuthSuccess } = useAuth(); // Consume Auth Context

  // Initialize Mantine Form with state and validation rules
  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },

    validate: {
      name: (value) =>
        value.trim().length < 2
          ? "Name must be at least 2 characters long"
          : null,
      email: (value) =>
        /^\S+@\S+$/.test(value.trim()) ? null : "Invalid email address",
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters long" : null,
    },
  });

  // Handle API submission (only runs if validation passes)
  const handleSubmit = async (values) => {
    setLoading(true);
    setServerError("");

    try {
      // Basic sanitization: Trim inputs before sending
      const payload = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };

      const data = await apiFetch.post("/api/signup", payload);

      // Lift state up to global Auth Context
      handleAuthSuccess(data.user);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
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

        {serverError && (
          <Alert color="red" mb="md" title="Error">
            {serverError}
          </Alert>
        )}

        {/* Wrap in form.onSubmit to catch errors and execute handler */}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Jane"
              {...form.getInputProps("name")}
            />

            <TextInput
              label="Email"
              placeholder="jane@example.com"
              {...form.getInputProps("email")}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              {...form.getInputProps("password")}
            />

            <Button type="submit" fullWidth mt="md" loading={loading}>
              Sign Up
            </Button>
          </Stack>
        </form>

        <Text ta="center" size="sm" mt="md">
          Already have an account?{" "}
          <Anchor component={Link} to="/login" size="sm">
            Log in
          </Anchor>
        </Text>
      </Card>
    </Container>
  );
}
