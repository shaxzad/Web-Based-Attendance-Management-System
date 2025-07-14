import { Container, Heading, Tabs, Box, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

import Appearance from "@/components/UserSettings/Appearance"
import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
import useAuth from "@/hooks/useAuth"

const tabsConfig = [
  { value: "my-profile", title: "My profile", component: UserInformation },
  { value: "password", title: "Password", component: ChangePassword },
  { value: "appearance", title: "Appearance", component: Appearance },
  { value: "danger-zone", title: "Danger zone", component: DeleteAccount },
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const { user: currentUser } = useAuth()
  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 3)
    : tabsConfig

  if (!currentUser) {
    return null
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12} mb={2}>
        User Settings
      </Heading>
      <Text color="gray.500" fontSize="md" mb={8} textAlign={{ base: "center", md: "left" }}>
        Manage your profile, password, appearance, and account settings
      </Text>
      <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: 'lg', transform: 'translateY(-2px) scale(1.01)' }} p={6} maxW="2xl" mx="auto">
        <Tabs.Root defaultValue="my-profile" variant="subtle">
          <Tabs.List>
            {finalTabs.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                {tab.title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {finalTabs.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value}>
              <tab.component />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </Box>
    </Container>
  )
}
