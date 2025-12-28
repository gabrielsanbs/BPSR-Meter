const { exec } = require('child_process');
const cap = require('cap');

// Filter virtual adapters (excluindo TAP para permitir VPNs de jogos)
const VIRTUAL_KEYWORDS = ['zerotier', 'vmware', 'hyper-v', 'virtual', 'loopback', 'bluetooth', 'wan miniport'];

// VPNs de jogos permitidas (usam TAP/TUN adapters)
const GAMING_VPN_KEYWORDS = [
    'exitlag',
    'noping',
    'wtfast',
    'mudfish',
    'pingzapper',
    'pingenhancer',
    'haste',
    'outfox',
    'battleping',
    'wintun',
    'gamestc'
];

function isVirtual(name) {
    const lower = name.toLowerCase();

    // Permitir VPNs de jogos explicitamente (mesmo com TAP)
    if (GAMING_VPN_KEYWORDS.some(vpn => lower.includes(vpn))) {
        return false;
    }

    // PERMITIR TAP adapters por padrão (para compatibilidade com VPNs de jogos)
    // Apenas bloquear se for TAP + outros keywords virtuais
    if (lower.includes('tap')) {
        // Se é TAP mas também tem keywords virtuais óbvios, bloquear
        const isObviousVirtual = ['vmware', 'hyper-v', 'virtualbox', 'zerotier'].some(k => lower.includes(k));
        return isObviousVirtual; // Permitir TAP a menos que seja claramente virtual
    }

    return VIRTUAL_KEYWORDS.some((keyword) => lower.includes(keyword));
}

// Detect TCP traffic for 3 seconds
function detectTraffic(deviceIndex, devices) {
    return new Promise((resolve) => {
        let count = 0;
        try {
            const c = new cap.Cap();
            const buffer = Buffer.alloc(65535);

            const cleanup = () => {
                try {
                    c.close();
                } catch (e) { }
            };

            setTimeout(() => {
                cleanup();
                resolve(count);
            }, 3000);

            const linkType = c.open(devices[deviceIndex].name, 'ip and tcp', 1024 * 1024, buffer);

            // Aceitar ETHERNET e RAW (alguns adaptadores TUN retornam RAW)
            if (linkType === 'ETHERNET' || linkType === 'RAW') {
                c.setMinBytes && c.setMinBytes(0);
                c.on('packet', () => count++);
            } else {
                cleanup();
                resolve(0);
            }
        } catch (e) {
            resolve(0);
        }
    });
}

async function findByRoute(devices) {
    try {
        const stdout = await new Promise((resolve, reject) => {
            exec('route print 0.0.0.0', (error, stdout) => {
                if (error) reject(error);
                else resolve(stdout);
            });
        });

        const defaultInterface = stdout
            .split('\n')
            .find((line) => line.trim().startsWith('0.0.0.0'))
            ?.trim()
            .split(/\s+/)[3];

        if (!defaultInterface) return undefined;

        const targetInterface = Object.entries(devices).find(([, device]) =>
            device.addresses.find((address) => address.addr === defaultInterface),
        )?.[0];

        return parseInt(targetInterface);
    } catch (error) {
        return undefined;
    }
}

async function findDefaultNetworkDevice(devices) {
    try {
        // Get physical adapters
        const physical = Object.entries(devices).filter(([, device]) => {
            const name = device.description || device.name || '';
            return !isVirtual(name) && device.addresses && device.addresses.length > 0;
        });

        if (physical.length === 0) {
            return await findByRoute(devices);
        }

        // Detect traffic on physical adapters
        console.log('Detecting network traffic... (3s)');
        const results = await Promise.all(
            physical.map(async ([index]) => ({
                index: parseInt(index),
                packets: await detectTraffic(parseInt(index), devices),
            })),
        );

        // Check for gaming VPN with valid IP (prioritize if connected)
        const gamingVpnAdapter = physical.find(([, device]) => {
            const name = (device.description || device.name || '').toLowerCase();
            const hasValidIp = device.addresses?.some(addr =>
                addr.addr && !addr.addr.startsWith('169.254') && !addr.addr.startsWith('fe80')
            );
            const isGamingVpn = GAMING_VPN_KEYWORDS.some(vpn => name.includes(vpn));
            return isGamingVpn && hasValidIp;
        });

        if (gamingVpnAdapter) {
            const vpnIndex = parseInt(gamingVpnAdapter[0]);
            const vpnResult = results.find(r => r.index === vpnIndex);
            // Use gaming VPN if it has ANY traffic or if it has a valid IP
            if (vpnResult && vpnResult.packets >= 0) {
                return vpnIndex;
            }
        }

        // Select adapter with most traffic (fallback)
        const best = results.filter((r) => r.packets > 0).sort((a, b) => b.packets - a.packets)[0];

        if (best) {
            return best.index;
        }

        // Fallback to route table
        const routeIndex = await findByRoute(devices);
        if (routeIndex !== undefined && devices[routeIndex] && isVirtual(devices[routeIndex].description || '')) {
            return parseInt(physical[0][0]);
        }

        return routeIndex;
    } catch (error) {
        return undefined;
    }
}

module.exports = findDefaultNetworkDevice;
