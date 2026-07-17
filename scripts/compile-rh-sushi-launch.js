// Compile the automatic Robinhood/Sushi launch contracts into a production artifact.
// Production loads the committed artifact; Render never compiles Solidity at runtime.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, "..", "contracts", "SlimeSushiLaunchRH.sol");
const outputPath = path.join(here, "..", "src", "lib", "rh-sushi-launch.json");
const source = fs.readFileSync(sourcePath, "utf8");
const input = {
  language: "Solidity",
  sources: { "SlimeSushiLaunchRH.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 500 },
    viaIR: true,
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } }
  }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
for (const warning of (output.errors || []).filter((row) => row.severity === "warning")) {
  console.warn(warning.formattedMessage);
}
const errors = (output.errors || []).filter((row) => row.severity === "error");
if (errors.length) {
  console.error(errors.map((row) => row.formattedMessage).join("\n"));
  process.exit(1);
}
const contracts = output.contracts["SlimeSushiLaunchRH.sol"];
const artifact = { solcVersion: solc.version(), contracts: {} };
for (const name of ["SlimeSushiTokenRH", "SlimeSushiPositionLockerRH", "SlimeSushiLaunchFactoryRH"]) {
  const contract = contracts[name];
  artifact.contracts[name] = {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    deployedBytecode: `0x${contract.evm.deployedBytecode.object}`
  };
}
fs.writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Wrote ${outputPath} (${artifact.solcVersion})`);
