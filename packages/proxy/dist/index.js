import { execa } from 'execa';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs'; // Use standard fs module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Helper function to determine if we are inside the Docker container
function isInDocker() {
    try {
        // Check for a common Docker indicator file
        fs.statSync('/.dockerenv');
        return true;
    }
    catch (err) {
        // Ignore errors (file not found)
    }
    // Check environment variable typically set by Docker
    // Using process.env.NODE_ENV as a proxy, assuming it's set to 'production' in Dockerfile
    // A more robust check might involve custom env vars.
    return process.env.NODE_ENV === 'production';
}
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Error: No command provided.');
        console.error('Usage: node dist/index.js <command> [args...]');
        console.error('Example: node dist/index.js npx cowsay "Hello from container"');
        process.exit(1);
    }
    const command = args[0];
    const commandArgs = args.slice(1);
    console.log(`Executing: ${command} ${commandArgs.join(' ')}`);
    // Determine the working directory
    // Inside Docker, use /app as the base working directory
    // Outside Docker (local dev), use the project root relative to this script
    const workDir = isInDocker() ? '/app' : path.resolve(__dirname, '../../../');
    console.log(`Working Directory: ${workDir}`);
    try {
        // Use original execa approach without shell: true
        await execa(command, commandArgs, {
            cwd: workDir, // Run command in the appropriate directory
            stdio: 'inherit', // Pipe input/output/error streams
            env: { ...process.env }, // Pass environment variables
        });
    }
    catch (error) {
        // Type assertion for error object
        const execaError = error;
        console.error(`Error executing command: ${execaError.message}`);
        // Propagate the exit code of the failed command
        process.exit(execaError.exitCode ?? 1);
    }
}
main().catch(err => {
    // General catch for errors outside execa
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map