import { defineConfig } from "cypress";

export default defineConfig({
  projectId: 'isr2u8',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
