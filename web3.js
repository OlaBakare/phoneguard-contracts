const PhoneGuardWeb3 = (function () {
  let provider, signer, contract;
  let account = null;
  const CONTRACT_ADDRESS_KEY = "phoneguard_contract_address";

  const ABI = [
    "function registerDevice(bytes32 imeiHash, string calldata metadataURI) external",
    "function reportStolen(bytes32 imeiHash) external",
    "function checkDevice(bytes32 imeiHash) external view returns (bool exists, address owner, bool isStolen, uint256 registrationTime, uint256 stolenReportTime, string memory metadataURI)",
    "function transferOwnership(bytes32 imeiHash, address newOwner) external",
    "function clearStolenStatus(bytes32 imeiHash) external",
    "function isRegistered(bytes32) external view returns (bool)",
    "function deposit() external payable",
    "function withdraw(uint256 amount) external",
    "function getBalance() external view returns (uint256)",
    "function balances(address) external view returns (uint256)",
    "function createListing(bytes32 imeiHash, uint256 price, string calldata description) external",
    "function buyListing(uint256 listingId) external",
    "function cancelListing(uint256 listingId) external",
    "function getActiveListings() external view returns (tuple(uint256 id, bytes32 imeiHash, address seller, uint256 price, uint8 status, uint256 createdAt, string description)[])",
    "function listingCount() external view returns (uint256)",
    "function listings(uint256) external view returns (uint256 id, bytes32 imeiHash, address seller, uint256 price, uint8 status, uint256 createdAt, string description)",
    "function requestRepair(bytes32 imeiHash, address shop, uint256 fee, string calldata description) external",
    "function completeRepair(uint256 repairId) external",
    "function getRepairsForCustomer() external view returns (tuple(uint256 id, bytes32 imeiHash, address customer, address shop, uint256 fee, uint8 status, uint256 createdAt, string description)[])",
    "function getRepairsForShop() external view returns (tuple(uint256 id, bytes32 imeiHash, address customer, address shop, uint256 fee, uint8 status, uint256 createdAt, string description)[])",
    "event DeviceRegistered(bytes32 indexed imeiHash, address indexed owner, uint256 timestamp)",
    "event DeviceMarkedStolen(bytes32 indexed imeiHash, address indexed reporter, uint256 timestamp)",
    "event ListingCreated(uint256 indexed id, bytes32 imeiHash, address indexed seller, uint256 price)",
    "event ListingSold(uint256 indexed id, address indexed buyer, address indexed seller, uint256 price)",
    "event RepairRequested(uint256 indexed id, bytes32 imeiHash, address indexed customer, address indexed shop)",
    "event Deposited(address indexed user, uint256 amount)",
    "event Withdrawn(address indexed user, uint256 amount)"
  ];

  async function init(contractAddress) {
    if (typeof window.ethereum === "undefined") throw new Error("MetaMask not installed");
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    const addr = contractAddress || localStorage.getItem(CONTRACT_ADDRESS_KEY);
    if (!addr) throw new Error("No contract address");
    contract = new ethers.Contract(addr, ABI, signer);
    localStorage.setItem(CONTRACT_ADDRESS_KEY, addr);
    return account;
  }

  function hashIMEI(imei) { return ethers.keccak256(ethers.toUtf8Bytes(imei.trim())); }

  async function connect() {
    if (typeof window.ethereum === "undefined") { window.open("https://metamask.io/download", "_blank"); return null; }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    window.ethereum.on("accountsChanged", (accts) => {
      account = accts[0] || null;
      document.dispatchEvent(new CustomEvent("phoneguard-account-changed", { detail: { account } }));
    });
    return account;
  }

  async function getAccount() { return account; }
  function isConnected() { return account !== null; }

  async function registerDevice(imei, metadataURI) {
    const hash = hashIMEI(imei);
    const tx = await contract.registerDevice(hash, metadataURI || "");
    return { hash, txHash: (await tx.wait()).hash };
  }

  async function reportStolen(imei) {
    const hash = hashIMEI(imei);
    return { hash, txHash: (await (await contract.reportStolen(hash)).wait()).hash };
  }

  async function checkDevice(imei) { return await contract.checkDevice(hashIMEI(imei)); }

  async function deposit(amountWei) {
    return await (await contract.deposit({ value: amountWei })).wait();
  }

  async function withdraw(amountWei) {
    return await (await contract.withdraw(amountWei)).wait();
  }

  async function getBalance() {
    if (!contract) return "0";
    return await contract.getBalance();
  }

  async function createListing(imei, priceWei, description) {
    const hash = hashIMEI(imei);
    return await (await contract.createListing(hash, priceWei, description)).wait();
  }

  async function buyListing(listingId) {
    return await (await contract.buyListing(listingId)).wait();
  }

  async function getActiveListings() {
    return await contract.getActiveListings();
  }

  async function requestRepair(imei, shopAddress, feeWei, description) {
    const hash = hashIMEI(imei);
    return await (await contract.requestRepair(hash, shopAddress, feeWei, description)).wait();
  }

  function shortenAddr(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  function formatUnits(wei) {
    return ethers.formatEther(wei || "0");
  }

  function parseUnits(amount) {
    return ethers.parseEther(amount.toString());
  }

  return {
    init, connect, getAccount, isConnected,
    registerDevice, reportStolen, checkDevice,
    deposit, withdraw, getBalance,
    createListing, buyListing, getActiveListings,
    requestRepair,
    hashIMEI, shortenAddr, formatUnits, parseUnits
  };
})();
