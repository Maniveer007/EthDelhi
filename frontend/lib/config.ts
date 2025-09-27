// FLOW Testnet
export  const delegationAddress = "0xA2889d18e386a35Ae708972533B475a7B47Ae8cc"
export const delegationStorage = "0xd41923bF117045b50e4589799F14Cb67A06090E1"
export  const sponsorAddress = "0x478645622A0371921184Bbe0267f4ECbA536fD8C"

// Hedera Testnet
export const HEDERA_AMU_RELAYER="0xB4442628ACFCD4257A573FfeA25A98f99c87A32b"
export const HEDRA_PYTH_ID = "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"
// sepolia 
export const ARBITRUM_SEPOLIA_AMU_RELAYER="0x462be78d6dfaCEF20C460edBa701F66935082ca8"
export const PYUSD_PYTH_ID = "0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692"

export const PYTH_ETH_PRICE_FEED_ID="0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"




export const DELEGATION_CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "storageAddress",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "ECDSAInvalidSignature",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "length",
				"type": "uint256"
			}
		],
		"name": "ECDSAInvalidSignatureLength",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "ECDSAInvalidSignatureS",
		"type": "error"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "bytes",
						"name": "data",
						"type": "bytes"
					},
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "value",
						"type": "uint256"
					}
				],
				"internalType": "struct DelegationContract.Call",
				"name": "userCall",
				"type": "tuple"
			},
			{
				"internalType": "address",
				"name": "sponsor",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "nonce",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "signature",
				"type": "bytes"
			}
		],
		"name": "execute",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "ExternalCallFailed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientETHBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidSigner",
		"type": "error"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "storageContract",
		"outputs": [
			{
				"internalType": "contract DelegationStorage",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]