const https = require('https');
const fs = require('fs');

const logoUrl = 'https://neoformula.com.br/cdn/shop/files/Logotipo-NeoFormula-Manipulacao-Homeopatia_76b2fa98-5ffa-4cc3-ac0a-6d41e1bc8810.png?height=200&v=1677088468';
const logoPath = 'neoformula-logo.png';

https.get(logoUrl, (response) => {
    const chunks = [];

    response.on('data', (chunk) => {
        chunks.push(chunk);
    });

    response.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // Save PNG file
        fs.writeFileSync(logoPath, buffer);
        console.log(`✅ Logo salvo: ${logoPath}`);

        // Convert to base64
        const base64 = buffer.toString('base64');
        const dataUri = `data:image/png;base64,${base64}`;

        // Save base64 to file
        fs.writeFileSync('logo-base64.txt', dataUri);
        console.log(`✅ Base64 salvo: logo-base64.txt`);
        console.log(`📊 Tamanho: ${(base64.length / 1024).toFixed(2)} KB`);
    });
}).on('error', (err) => {
    console.error('❌ Erro ao baixar logo:', err.message);
});
