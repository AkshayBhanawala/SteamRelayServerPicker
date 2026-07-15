export async function GET_MOCK_GAME_META_DATA(appId: string) {
	await waitForMs(getRandomInt(50, 400));
	return {
		[appId]: {
			success: true,
			data: {
				name:
					appId === '730'
						? 'Counter-Strike 2'
						: appId === '1422450'
							? 'Deadlock'
							: `App ID: ${appId}`,
				short_description: 'Web Demo Mock Data',
				header_image: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
			}
		}
	};
}

export async function GET_MOCK_SDR_DATA() {
	const generateRandomIP = (octetsCount = 4) => Array(octetsCount).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');

	await waitForMs(getRandomInt(50, 400));

	const addedServers = new Set<string>();
	const locations: any = {};
	const noOfServersToAdd = getRandomInt(5, 15);
	for (let i = 0; i < noOfServersToAdd; i++) {
		const locIndex = getRandomInt(0, STEAM_SERVER_LOCATIONS.length - 1);
		const loc = STEAM_SERVER_LOCATIONS[locIndex];
		if (addedServers.has(loc.locId)) {
			i--;
			continue;
		}
		const ipFirst3Octets = generateRandomIP(3);
		const ipLastOctet = parseInt(generateRandomIP(1));

		locations[loc.locId] = {
			...loc.locData,
			relays: Array(getRandomInt(0, 5)).fill(0)
				.map((_, i) => ({ ipv4: `${ipFirst3Octets}.${ipLastOctet + i}` })),
		};
	}
	console.log('generated mock data:', locations);
	return { pops: locations };
}

export async function GET_RANDOM_PING() {
	const pingValue = getRandomInt();
	await waitForMs(pingValue > 500 ? pingValue - 200 : pingValue);
	return pingValue;
};

export function getRandomInt(min = 2, max = 700) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function waitForMs(ms = 100) {
	return await new Promise((r) => setTimeout(r, ms));
}

const STEAM_SERVER_LOCATIONS = [
	{
		"locId": "ams",
		"locData": {
			"desc": "Amsterdam (Netherlands)",
			"geo": [
				4.9,
				52.37
			]
		}
	},
	{
		"locId": "atl",
		"locData": {
			"desc": "Atlanta (Georgia)",
			"geo": [
				-84.39,
				33.76
			]
		}
	},
	{
		"locId": "ctu",
		"locData": {
			"desc": "Alibaba Cloud Chengdu (China)",
			"geo": [
				103.7,
				30.7
			]
		}
	},
	{
		"locId": "dfw",
		"locData": {
			"desc": "Dallas (Texas)",
			"geo": [
				-96.8,
				32.77
			]
		}
	},
	{
		"locId": "dxb",
		"locData": {
			"desc": "Dubai (United Arab Emirates)",
			"geo": [
				55.3,
				25.25
			]
		}
	},
	{
		"locId": "eat",
		"locData": {
			"desc": "Wenatchee (Washington)",
			"geo": [
				-120.32,
				47.47
			]
		}
	},
	{
		"locId": "eze",
		"locData": {
			"desc": "Buenos Aires (Argentina)",
			"geo": [
				-58.38,
				-34.6
			]
		}
	},
	{
		"locId": "fra",
		"locData": {
			"desc": "Frankfurt (Germany)",
			"geo": [
				8.68,
				50.12
			]
		}
	},
	{
		"locId": "fsn",
		"locData": {
			"desc": "Falkenstein (Germany)",
			"geo": [
				12.37,
				50.48
			]
		}
	},
	{
		"locId": "gru",
		"locData": {
			"desc": "Sao Paulo (Brazil)",
			"geo": [
				-46.64,
				-23.53
			]
		}
	},
	{
		"locId": "hel",
		"locData": {
			"desc": "Helsinki (Finland)",
			"geo": [
				24.85,
				60.11
			]
		}
	},
	{
		"locId": "hkg",
		"locData": {
			"desc": "Hong Kong",
			"geo": [
				113.92,
				22.31
			]
		}
	},
	{
		"locId": "iad",
		"locData": {
			"desc": "Sterling (Virginia)",
			"geo": [
				-77.43,
				39.01
			]
		}
	},
	{
		"locId": "jnb",
		"locData": {
			"desc": "Johannesburg (South Africa)",
			"geo": [
				28,
				-26.2
			]
		}
	},
	{
		"locId": "lax",
		"locData": {
			"desc": "Los Angeles (California)",
			"geo": [
				-118.25,
				34.05
			]
		}
	},
	{
		"locId": "lhr",
		"locData": {
			"desc": "London (England)",
			"geo": [
				-0.13,
				51.51
			]
		}
	},
	{
		"locId": "lim",
		"locData": {
			"desc": "Lima (Peru)",
			"geo": [
				-77.05,
				-12.06
			]
		}
	},
	{
		"locId": "mad",
		"locData": {
			"desc": "Madrid (Spain)",
			"geo": [
				3.34,
				40.23
			]
		}
	},
	{
		"locId": "ord",
		"locData": {
			"desc": "Chicago (Illinois)",
			"geo": [
				-87.69,
				41.84
			]
		}
	},
	{
		"locId": "par",
		"locData": {
			"desc": "Paris (France)",
			"geo": [
				2.35,
				48.86
			]
		}
	},
	{
		"locId": "pek",
		"locData": {
			"desc": "Alibaba Cloud Beijing (China)",
			"geo": [
				116.38,
				39.91
			]
		}
	},
	{
		"locId": "scl",
		"locData": {
			"desc": "Santiago (Chile)",
			"geo": [
				-70.47,
				-33.23
			]
		}
	},
	{
		"locId": "sea",
		"locData": {
			"desc": "Seattle (Washington)",
			"geo": [
				-122.33,
				47.61
			]
		}
	},
	{
		"locId": "seo",
		"locData": {
			"desc": "Seoul (South Korea)",
			"geo": [
				126.99,
				37.56
			]
		}
	},
	{
		"locId": "sgp",
		"locData": {
			"desc": "Singapore",
			"geo": [
				103.83,
				1.28
			]
		}
	},
	{
		"locId": "sto",
		"locData": {
			"desc": "Stockholm - Kista (Sweden)",
			"geo": [
				17.9,
				59.4
			]
		}
	},
	{
		"locId": "syd",
		"locData": {
			"desc": "Sydney (Australia)",
			"geo": [
				151.21,
				-33.86
			]
		}
	},
	{
		"locId": "tgd",
		"locData": {
			"desc": "Tencent Guangzhou (China)",
			"geo": [
				113.3,
				23.1
			]
		}
	},
	{
		"locId": "tyo",
		"locData": {
			"desc": "Tokyo Koto City (Japan)",
			"geo": [
				139.68,
				35.68
			]
		}
	},
	{
		"locId": "vie",
		"locData": {
			"desc": "Vienna (Austria)",
			"geo": [
				16.22,
				48.12
			]
		}
	},
	{
		"locId": "waw",
		"locData": {
			"desc": "Warsaw (Poland)",
			"geo": [
				21,
				52.22
			]
		}
	},
	{
		"locId": "bom2",
		"locData": {
			"desc": "Mumbai (India)",
			"geo": [
				72.99,
				19.18
			]
		}
	},
	{
		"locId": "maa2",
		"locData": {
			"desc": "Chennai - Ambattur (India)",
			"geo": [
				80.15,
				13.11
			]
		}
	},
	{
		"locId": "sto2",
		"locData": {
			"desc": "Stockholm - Bromma (Sweden)",
			"geo": [
				17.87,
				59.34
			]
		}
	},
	{
		"locId": "ctum",
		"locData": {
			"desc": "Alibaba Cloud Chengdu - Mobile (China)",
			"geo": [
				103.7,
				30.7
			]
		}
	},
	{
		"locId": "pekm",
		"locData": {
			"desc": "Alibaba Cloud Beijing - Mobile (China)",
			"geo": [
				116.38,
				39.91
			]
		}
	},
	{
		"locId": "tgdm",
		"locData": {
			"desc": "Tencent Guangzhou - Mobile (China)",
			"geo": [
				113.3,
				23.1
			]
		}
	},
	{
		"locId": "ctut",
		"locData": {
			"desc": "Alibaba Cloud Chengdu - Telecom (China)",
			"geo": [
				103.7,
				30.7
			]
		}
	},
	{
		"locId": "pekt",
		"locData": {
			"desc": "Alibaba Cloud Beijing - Telecom (China)",
			"geo": [
				116.38,
				39.91
			]
		}
	},
	{
		"locId": "tgdt",
		"locData": {
			"desc": "Tencent Guangzhou - Telecom (China)",
			"geo": [
				113.3,
				23.1
			]
		}
	},
	{
		"locId": "ctuu",
		"locData": {
			"desc": "Alibaba Cloud Chengdu - Unicom (China)",
			"geo": [
				103.7,
				30.7
			]
		}
	},
	{
		"locId": "peku",
		"locData": {
			"desc": "Alibaba Cloud Beijing - Unicom (China)",
			"geo": [
				116.38,
				39.91
			]
		}
	},
	{
		"locId": "tgdu",
		"locData": {
			"desc": "Tencent Guangzhou - Unicom (China)",
			"geo": [
				113.3,
				23.1
			]
		}
	}
];