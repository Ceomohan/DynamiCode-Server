# DynamiCode Backend

Node.js + Express + MongoDB backend for DynamiCode.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` file based on `.env.example`.
3. Start the server:
   ```bash
   npm run dev
   ```

## Code Execution (Piston)

This backend executes code via the Piston API. The public mirror previously used (`emkc.org`) became whitelist-only on **2026-02-15**, so you should self-host Piston (recommended) and configure:

- `PISTON_BASE_URL=http://<your-piston-host>:<port>`

Optional overrides:
- `PISTON_EXECUTE_URL` and `PISTON_RUNTIMES_URL` (if your instance uses custom routes)
- `PISTON_LANGUAGE_VERSIONS` (JSON) to pin runtime versions
