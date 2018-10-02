//tabla
const e = (e, p, c) => {
	const el = document.createElement(e);
	if (p instanceof Array || typeof p === "string" || !p) {
		c = p;
		p = {};
	}
	for (let prop in p)
		if (p.hasOwnProperty(prop))
			el.setAttribute(prop, p[prop]);
	if (c) {
		if (typeof c === "string")
			el.textContent = c;
		else if (c instanceof Array) {
			for (let elem of c)
				el.appendChild(elem);
		}
	}
	return el;
};

let web3, contract;

function init () {

	const table = document.getElementById("table");

	if (!window.contractAddress || !window.contractABI || !window.candidates)
		return table.appendChild(
			e("tr", [
				e(
					"td",
					{ colspan: 3 },
					"No contract address present, please, run contract deployment first"
				)
			])
		);

	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	contract = new web3.eth.Contract(window.contractABI, window.contractAddress);
	const votesElements = [];
	const votesButtons = [];

	while (table.firstChild)
		table.removeChild(table.firstChild);
	for (let i = 0; i < window.candidates.length; ++i) {
		table.appendChild(e("tr", [
			e("td", window.candidates[i]),
			votesElements[i] = e("td", "?"),
			e("td", [votesButtons[i] = e("button", "Votar")])
		]));
	}

	
	votesElements.forEach((element, i) => {

		updateVotesForCandidate(window.candidates[i], element);

		//Al precionar el boton de votar
		votesButtons[i].addEventListener("click", () => {
			voteForCandidate(window.candidates[i], document.getElementById("from").value, (tx) => {
				console.log(tx);
				log(`Transaction ${ tx.transactionHash }, gas used: ${ tx.gasUsed }`);
				updateVotesForCandidate(window.candidates[i], element);
			});
		});

	});

}

function log (txt) {
	document.getElementById("log").appendChild(e("div", txt));
}

//Actualizar votos candidatos
function updateVotesForCandidate (candidate, element) {

	return contract.methods["totalVotesFor"](
		web3.utils.asciiToHex(candidate)
	).call().then((votes) => {
		return element.textContent = votes;
	});

}

//Votar a un candidato
function voteForCandidate (candidate, dniBox, callback) {

	try {
		var hash, dato;

		for (var i = 0; i < 10; i++) {
			dato = window.dictionary[i];

			if (dato.dni == dniBox){
				hash = dato.hash;
			}   
			
		}

		return contract.methods["voteForCandidate"](
			web3.utils.asciiToHex(candidate)
		).send({
			from: hash
		}).then(callback);
	} catch (e) {
		log(e.toString());
	}

}