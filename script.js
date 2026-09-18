const DISCORD_APP_ID = process.env.DISCORD_APPLICATION_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID; 

const OSU_CLIENT_ID = process.env.OSU_CLIENT_ID;
const OSU_CLIENT_SECRET = process.env.OSU_CLIENT_SECRET;
const OSU_USER_ID = process.env.OSU_USER_ID;

async function ejecutarFlujo() {
    try {
        // 1. PEDIR TOKEN A OSU!
        console.log("Solicitando Access Token a osu!...");
        const paramsOsuAuth = new URLSearchParams({
            client_id: OSU_CLIENT_ID,
            client_secret: OSU_CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'public'
        });

        const resAuth = await fetch('https://osu.ppy.sh/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: paramsOsuAuth
        });

        if (!resAuth.ok) throw new Error("No se pudo obtener el token de osu!");
        const dataAuth = await resAuth.json();
        const osuToken = dataAuth.access_token;

        // 2. OBTENER DATOS DE MANIA
        console.log(`Obteniendo datos de osu!mania para el usuario: ${OSU_USER_ID}...`);
        const resUserData = await fetch(`https://osu.ppy.sh/api/v2/users/${OSU_USER_ID}/mania`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${osuToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!resUserData.ok) throw new Error("No se pudieron obtener los datos de osu!");
        const userData = await resUserData.json();

        const ssActualesMania = userData.statistics.grade_counts.ss; 
        const rankGlobalNumero = userData.statistics.global_rank;
        const rankGlobalMania = `#${rankGlobalNumero}`; 
        const objetivoFijo = 10000;

        // 3. ARMAR JSON
        const payloadDiscord = {
            data: {
                dynamic: [
                    { type: 2, name: "actual", value: ssActualesMania },
                    { type: 2, name: "objetivo", value: objetivoFijo },
                    { type: 1, name: "rank", value: rankGlobalMania }
                ]
            }
        };

        // 4. ENVIAR A DISCORD
        console.log("Enviando actualización a Discord...");
        const urlDiscord = `https://discord.com/api/v9/applications/${DISCORD_APP_ID}/users/${DISCORD_USER_ID}/identities/0/profile`;

        const respuestaDiscord = await fetch(urlDiscord, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${BOT_TOKEN}`,
                'User-Agent': 'DiscordBot (https://github.com/discord/discord-api-docs, 1.0.0)',
            },
            body: JSON.stringify(payloadDiscord),
        });

        if (respuestaDiscord.ok) {
            console.log(`✅ ¡Éxito! SS: ${ssActualesMania} | Rank: ${rankGlobalMania} enviado.`);
        } else {
            const errorTexto = await respuestaDiscord.text();
            console.error(`❌ Error Discord (${respuestaDiscord.status}):`, errorTexto);
        }

    } catch (error) {
        console.error("❌ Ocurrió un error:", error.message);
    }
}

ejecutarFlujo();