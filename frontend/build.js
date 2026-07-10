import { build } from 'vite';

async function run() {
    try {
        await build();
        console.log('Build successful!');
    } catch (err) {
        console.error('Vite Build Error:\n', err);
    }
}

run();
