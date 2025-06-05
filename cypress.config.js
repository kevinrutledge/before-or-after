// cypress.config.js
import { defineConfig } from "cypress";
import dotenv from "dotenv";

// Load your .env from ./dir1/.env (adjust the path if needed)
dotenv.config({ path: "./packages/express-backend/.env" });

export default defineConfig({
  projectId: "isr2u8",

  e2e: {
    // Copy whatever vars you need into Cypress.env
    env: {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      // …add more keys as needed
    },

    setupNodeEvents(on, config) {
      // any other node-event listeners you might have
    },
  },
});
