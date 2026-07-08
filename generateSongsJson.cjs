const fs = require('fs');
const path = require('path');

const songsDir = path.join(__dirname, 'songs');

function walkAndWrite(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    const mp3s = items
        .filter(i => i.isFile() && i.name.toLowerCase().endsWith('.mp3'))
        .map(i => i.name);

    if (mp3s.length > 0) {
        const outPath = path.join(dir, 'files.json');
        fs.writeFileSync(outPath, JSON.stringify(mp3s, null, 2), 'utf8');
        console.log('Wrote', outPath);
    }

    items.filter(i => i.isDirectory()).forEach(d => walkAndWrite(path.join(dir, d.name)));
}

if (!fs.existsSync(songsDir)) {
    console.error('songs directory not found:', songsDir);
    process.exit(1);
}

walkAndWrite(songsDir);
console.log('Done.');
