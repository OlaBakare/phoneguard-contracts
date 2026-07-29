const PhoneGuardWeb3 = (function () {
  let provider, signer, contract;
  let account = null;
  const CONTRACT_ADDRESS_KEY = "phoneguard_contract_address";

  async function init(contractAddress) {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();

    const addr = contractAddress || localStorage.getItem(CONTRACT_ADDRESS_KEY);
    if (!addr) {
      throw new Error("No contract address configured");
    }

    const abi = [
      "function registerDevice(bytes32 imeiHash, string calldata metadataURI) external",
      "function reportStolen(bytes32 imeiHash) external",
      "function checkDevice(bytes32 imeiHash) external view returns (bool exists, address owner, bool isStolen, uint256 registrationTime, uint256 stolenReportTime, string memory metadataURI)",
      "function transferOwnership(bytes32 imeiHash, address newOwner) external",
      "function clearStolenStatus(bytes32 imeiHash) external",
      "function isRegistered(bytes32) external view returns (bool)",
      "event DeviceRegistered(bytes32 indexed imeiHash, address indexed owner, uint256 timestamp)",
      "event DeviceMarkedStolen(bytes32 indexed imeiHash, address indexed reporter, uint256 timestamp)"
    ];
    contract = new ethers.Contract(addr, abi, signer);
    localStorage.setItem(CONTRACT_ADDRESS_KEY, addr);
    return account;
  }

  function hashIMEI(imei) {
    return ethers.keccak256(ethers.toUtf8Bytes(imei.trim()));
  }

  async function connect() {
    if (typeof window.ethereum === "undefined") {
      window.open("https://metamask.io/download", "_blank");
      return null;
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    window.ethereum.on("accountsChanged", (accts) => {
      account = accts[0] || null;
      document.dispatchEvent(new CustomEvent("phoneguard-account-changed", { detail: { account } }));
    });
    return account;
  }

  async function getAccount() {
    if (!account) return null;
    return account;
  }

  function isConnected() {
    return account !== null;
  }

  async function registerDevice(imei, metadataURI) {
    const hash = hashIMEI(imei);
    const tx = await contract.registerDevice(hash, metadataURI || "");
    const receipt = await tx.wait();
    return { hash, txHash: receipt.hash };
  }

  async function reportStolen(imei) {
    const hash = hashIMEI(imei);
    const tx = await contract.reportStolen(hash);
    const receipt = await tx.wait();
    return { hash, txHash: receipt.hash };
  }

  async function checkDevice(imei) {
    const hash = hashIMEI(imei);
    return await contract.checkDevice(hash);
  }

  async function transferOwnership(imei, newOwner) {
    const hash = hashIMEI(imei);
    const tx = await contract.transferOwnership(hash, newOwner);
    return await tx.wait();
  }

  async function clearStolenStatus(imei) {
    const hash = hashIMEI(imei);
    const tx = await contract.clearStolenStatus(hash);
    return await tx.wait();
  }

  function shortenAddr(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  return {
    init,
    connect,
    getAccount,
    isConnected,
    registerDevice,
    reportStolen,
    checkDevice,
    transferOwnership,
    clearStolenStatus,
    hashIMEI,
    shortenAddr,
  };
})();
