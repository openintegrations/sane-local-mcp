#!/usr/bin/env node
// cli.ts - A CLI tool to manage Docker containers with persistent I/O
import { spawn, execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Image names
const DEV_IMAGE_NAME = 'openint-mcp-dev';
const PROD_IMAGE_NAME = 'openint/openint-mcp:latest'; // Official production image
// --- Function to attempt pulling the PROD image ---
function attemptPullProdImage() {
    const imageName = PROD_IMAGE_NAME;
    console.log(`Attempting to pull production image: ${imageName}...`);
    try {
        execSync(`docker pull ${imageName}`, { stdio: 'inherit' });
        console.log(`Successfully pulled ${imageName}. Please re-run your command.`);
        return true;
    }
    catch (pullError) {
        console.error(`Failed to pull image ${imageName}.`);
        if (pullError instanceof Error && 'stderr' in pullError) {
            console.error(pullError.stderr?.toString());
        }
        else {
            console.error(pullError);
        }
        console.error(`Please ensure Docker is running and you have internet access, or pull the image manually.`);
        return false;
    }
}
// --- Function to ensure the DEV image exists/build it ---
function ensureDevImageExists() {
    const imageName = DEV_IMAGE_NAME;
    // Construct path relative to the *built* cli.js file in dist/, assuming it's run from the root
    // This relies on the CLI being run via pnpm script from the workspace root
    const projectRoot = path.resolve(__dirname, '../../..'); // Adjust based on actual built file location
    const dockerfilePath = path.join(projectRoot, 'packages/docker/dev/Dockerfile');
    const contextPath = projectRoot; // Build context is the project root
    console.log(`Checking for local development image: ${imageName}`);
    try {
        const imageCheck = execSync(`docker images -q ${imageName}`).toString().trim();
        if (!imageCheck || process.env.FORCE_DOCKER_BUILD === 'true') {
            if (!imageCheck) {
                console.log(`Development image ${imageName} not found.`);
            }
            else {
                console.log(`FORCE_DOCKER_BUILD is true.`);
            }
            console.log(`Building development image from ${dockerfilePath}...`);
            // Use '.' for context only if running from root, otherwise specify context path
            execSync(`docker build -t ${imageName} -f "${dockerfilePath}" "${contextPath}"`, { stdio: 'inherit' });
            console.log(`Development image ${imageName} built successfully.`);
            return true; // Indicate build happened
        }
        else {
            console.log(`Using existing development image: ${imageName}`);
            return true; // Image exists
        }
    }
    catch (error) {
        console.error(`Error building development Docker image from ${dockerfilePath}:`, error);
        if (error instanceof Error && 'stderr' in error) {
            console.error(error.stderr?.toString());
        }
        return false;
    }
}
// --- End ensureDevImageExists ---
function runCommandInDocker(args, useDevImage) {
    let imageName;
    let imageReady = false;
    if (useDevImage) {
        imageName = DEV_IMAGE_NAME;
        imageReady = ensureDevImageExists(); // Check/build dev image
    }
    else {
        imageName = PROD_IMAGE_NAME;
        imageReady = true; // Assume ready, will attempt pull on error
    }
    if (!imageReady && useDevImage) {
        console.error(`Failed to ensure development image ${imageName} is available. Exiting.`);
        process.exit(1);
    }
    const dockerArgs = [
        'run',
        '-i',
        '--rm',
        imageName,
        ...args
    ];
    console.log(`Using image: ${imageName}`);
    console.log(`Running in container: docker ${dockerArgs.join(' ')}`);
    try {
        const container = spawn('docker', dockerArgs, {
            stdio: 'inherit'
        });
        container.on('exit', (code) => {
            if (code !== null && code !== 0) {
                console.log(`Container exited with code ${code}`);
            }
            process.exit(code ?? 1);
        });
        container.on('error', (err) => {
            const isImageNotFoundError = err.message.includes('No such image') || err.message.includes('not found');
            // If NOT using dev image (i.e., using prod) and image not found, try pulling
            if (!useDevImage && isImageNotFoundError) {
                console.error(`Production image ${imageName} not found locally.`);
                if (attemptPullProdImage()) {
                    process.exit(0); // Exit cleanly after pull, user needs to re-run
                }
                else {
                    process.exit(1); // Exit with error if pull fails
                }
            }
            else {
                // Handle other spawn errors (or dev image errors after build attempt failed)
                console.error(`Failed to start container for image ${imageName}: ${err.message}`);
                if (useDevImage) {
                    console.error(`Attempted to build the dev image but failed or it's still unavailable.`);
                }
                else {
                    console.error(`Please ensure the image "${imageName}" is available.`);
                }
                process.exit(1);
            }
        });
    }
    catch (error) {
        console.error(`Error running docker command for image ${imageName}:`, error);
        process.exit(1);
    }
}
function main() {
    let args = process.argv.slice(2);
    let useDevImage = false; // Default to Production
    // Check for --dev flag
    const devFlagIndex = args.indexOf('--dev');
    if (devFlagIndex !== -1) {
        useDevImage = true;
        args.splice(devFlagIndex, 1); // Remove the flag
    }
    if (args.length === 0) {
        // --- Updated Usage Message ---
        console.log(`Usage: mcp-cli [--dev] <command> [args...]`);
        console.log(`Runs the specified command inside a Docker container.`);
        console.log(`  --dev : Use the local development image (${DEV_IMAGE_NAME}), building it if necessary.`);
        console.log(`          (Default: use official production image ${PROD_IMAGE_NAME}, pulling if necessary)`);
        console.log(`\nExamples:`);
        console.log(`  mcp-cli npx cowsay "Hello Prod"  (Uses production image)`);
        console.log(`  mcp-cli --dev npx cowsay "Hello Dev" (Uses development image)`);
        console.log(`\nImage Handling:`);
        console.log(`  - Production image (${PROD_IMAGE_NAME}) will be pulled automatically if not found locally (default).`);
        console.log(`  - Development image (${DEV_IMAGE_NAME}) will be built automatically if not found locally (when using --dev).`);
        // --- End Updated Usage Message ---
        return;
    }
    runCommandInDocker(args, useDevImage);
}
main();
//# sourceMappingURL=index.js.map