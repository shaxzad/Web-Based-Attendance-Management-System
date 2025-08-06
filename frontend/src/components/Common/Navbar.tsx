import { Flex, Text, useBreakpointValue } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

import UserMenu from "./UserMenu"

function Navbar() {
  const display = useBreakpointValue({ base: "none", md: "flex" })

  return (
    <Flex
      display={display}
      justify="space-between"
      position="sticky"
      color="white"
      align="center"
      bg="brand.primary"
      w="100%"
      top={0}
      p={4}
    >
      <Link to="/">
        <Flex align="center" gap={2}>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Attendance System
          </Text>
        </Flex>
      </Link>
      <Flex gap={2} alignItems="center">
        <UserMenu />
      </Flex>
    </Flex>
  )
}

export default Navbar
