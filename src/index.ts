#!/usr/bin/env node

import { createRootCommand } from './cli/root.js'

async function main() {
  const program = await createRootCommand()
  await program.parseAsync(process.argv)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
