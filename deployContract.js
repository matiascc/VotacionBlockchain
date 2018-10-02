const Web3 = require("web3");
const fs = require("fs");
const solc = require("solc");

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
//Selecciona archivo de solidity
const contractToCompile = "Voting"; 
const listOfCandidates = ["Agustin", "Carlos", "Emanuel"];
const contractDetailsOutputFile = `${ __dirname }/client/votingContractData.js`;
let contractAccount; 

//Lista los dni para votar
web3.eth.getAccounts().then((accountsList) => {

	//Vincula dni a los hash disponibles para votar
	console.log(`Linking DNI to hash...`);
	var dniList = {};
	for (i = 0; i < accountsList.length; i++) {
		dniList[i] = {hash: accountsList[i], dni: 1000+i} ;
	} 

	console.log(`Available dni \r`); 
	for(var key in dniList) {
		console.log(`${dniList[key].dni} \r`);
	}
	contractAccount = accountsList[0];

	compile(contractToCompile, dniList);
});


//Compila contrato con la lista de dni
function compile (contractName, dniList) {

	console.log(`Compiling ${ contractName }.sol...`);

	const contractCode = fs.readFileSync(`${ contractName }.sol`).toString();
	const compiledCode = solc.compile(contractCode);
	const abiDefinition = JSON.parse(compiledCode.contracts[`:${ contractName }`].interface);
	const contract = new web3.eth.Contract(abiDefinition);

	deploy(contractName, contract, compiledCode, abiDefinition, dniList);

}

function deploy (contractName, contract, compiledCode, abiDefinition, dniList) {

	console.log(`Preparing ${ contractName } contract to be deployed...`);

	const preparedContract = contract.deploy({
		data: compiledCode.contracts[`:${ contractName }`].bytecode,
		gas: 4700000,
		arguments: [
			listOfCandidates.map(name => web3.utils.asciiToHex(name))
		]
	}, (err) => err && console.error(err));

	preparedContract.estimateGas().then((gas) => {

		console.log(`Gas estimation for deploying this contract: ${ gas }`);

		preparedContract.send({
			from: contractAccount,
			gas: gas + 100000
		}).then((deployedContract) => {

			console.log(
				`Contract successfully deployed, contract address: ${ 
				deployedContract.options.address }`
			);

			fs.writeFile( // guardar contrato en un archivo para acceder desde el cliente
				contractDetailsOutputFile,
				`window.contractAddress="${ deployedContract.options.address }";\n`
				+ `window.contractABI=${ JSON.stringify(abiDefinition) };\n`
				+ `window.candidates=${ JSON.stringify(listOfCandidates) };\n`
				+ `window.dictionary=${ JSON.stringify(dniList, null, 4) };\n`
				+ `window.testAccount="${ contractAccount }";`
			);

			
			
		});

	});

}
