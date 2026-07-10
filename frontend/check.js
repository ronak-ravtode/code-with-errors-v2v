import { execSync } from 'child_process';
try {
    let out = execSync('npx vite build 2>&1', { encoding: 'utf-8' });
    console.log("OUT:\n", out);
} catch (e) {
    console.log("ERR-OUT-START:\n");
    console.log(e.stdout || e.message);
    console.log("ERR-OUT-END\n");
}
