// One-time compiler for contracts/SlimeTokenRH.sol -> src/lib/rh-erc20.json (abi + bytecode).
// Run locally (`node scripts/compile-rh-token.js`) whenever the contract changes; the artifact is
// committed so production never needs solc. Optimizer on (200 runs), solc pinned in devDependencies.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import solc from "solc";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(here, "..", "contracts", "SlimeTokenRH.sol");
const outPath = path.join(here, "..", "src", "lib", "rh-erc20.json");
const source = fs.readFileSync(srcPath, "utf8");

const input = {
  language: "Solidity",
  sources: { "SlimeTokenRH.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors || []).filter((e) => e.severity === "error");
if (errors.length) {
  console.error(errors.map((e) => e.formattedMessage).join("\n"));
  process.exit(1);
}
const contract = output.contracts["SlimeTokenRH.sol"].SlimeTokenRH;
const artifact = {
  contractName: "SlimeTokenRH",
  solcVersion: solc.version(),
  abi: contract.abi,
  bytecode: "0x" + contract.evm.bytecode.object
};
fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2));
console.log(`Wrote ${outPath} (bytecode ${artifact.bytecode.length / 2 - 1} bytes, ${artifact.solcVersion})`);
