import https from 'https';
https.get('https://wishlabs.ai', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const urls = data.match(/https?:\/\/[^"'\s]+\.(jpg|jpeg|png|webp|avif|mp4|webm)/gi);
        if (urls) {
            console.log([...new Set(urls)].join('\n'));
        } else {
            console.log("No images found");
        }
    });
});
