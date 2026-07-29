// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract PhoneGuardRegistry {
    // ── Device Registry ──
    struct Device {
        bytes32 imeiHash;
        address owner;
        bool isStolen;
        uint256 registrationTime;
        uint256 stolenReportTime;
        string metadataURI;
    }

    // ── Wallet ──
    mapping(address => uint256) public balances;

    // ── Marketplace Listings ──
    enum ListingStatus { Active, Sold, Cancelled }

    struct Listing {
        uint256 id;
        bytes32 imeiHash;
        address seller;
        uint256 price;
        ListingStatus status;
        uint256 createdAt;
        string description;
    }

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;

    // ── Repair Requests ──
    enum RepairStatus { Requested, InProgress, Completed, Cancelled }

    struct RepairRequest {
        uint256 id;
        bytes32 imeiHash;
        address customer;
        address shop;
        uint256 fee;
        RepairStatus status;
        uint256 createdAt;
        string description;
    }

    uint256 public repairCount;
    mapping(uint256 => RepairRequest) public repairs;

    // ── Events ──
    event DeviceRegistered(bytes32 indexed imeiHash, address indexed owner, uint256 timestamp);
    event DeviceMarkedStolen(bytes32 indexed imeiHash, address indexed reporter, uint256 timestamp);
    event DeviceCleared(bytes32 indexed imeiHash);
    event OwnershipTransferred(bytes32 indexed imeiHash, address indexed from, address indexed to);
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event ListingCreated(uint256 indexed id, bytes32 imeiHash, address indexed seller, uint256 price);
    event ListingSold(uint256 indexed id, address indexed buyer, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed id);
    event RepairRequested(uint256 indexed id, bytes32 imeiHash, address indexed customer, address indexed shop);
    event RepairCompleted(uint256 indexed id);

    // ── Device Registry ──
    mapping(bytes32 => Device) public devices;
    mapping(bytes32 => bool) public isRegistered;

    function registerDevice(bytes32 imeiHash, string calldata metadataURI) external {
        require(!isRegistered[imeiHash], "already registered");
        devices[imeiHash] = Device(imeiHash, msg.sender, false, block.timestamp, 0, metadataURI);
        isRegistered[imeiHash] = true;
        emit DeviceRegistered(imeiHash, msg.sender, block.timestamp);
    }

    function reportStolen(bytes32 imeiHash) external {
        require(isRegistered[imeiHash], "not registered");
        require(devices[imeiHash].owner == msg.sender, "not owner");
        devices[imeiHash].isStolen = true;
        devices[imeiHash].stolenReportTime = block.timestamp;
        emit DeviceMarkedStolen(imeiHash, msg.sender, block.timestamp);
    }

    function checkDevice(bytes32 imeiHash) external view returns (bool exists, address owner, bool isStolen, uint256 registrationTime, uint256 stolenReportTime, string memory metadataURI) {
        if (!isRegistered[imeiHash]) return (false, address(0), false, 0, 0, "");
        Device storage d = devices[imeiHash];
        return (true, d.owner, d.isStolen, d.registrationTime, d.stolenReportTime, d.metadataURI);
    }

    function transferOwnership(bytes32 imeiHash, address newOwner) external {
        require(isRegistered[imeiHash], "not registered");
        require(devices[imeiHash].owner == msg.sender, "not owner");
        require(newOwner != address(0), "invalid address");
        address prev = devices[imeiHash].owner;
        devices[imeiHash].owner = newOwner;
        emit OwnershipTransferred(imeiHash, prev, newOwner);
    }

    function clearStolenStatus(bytes32 imeiHash) external {
        require(isRegistered[imeiHash], "not registered");
        require(devices[imeiHash].owner == msg.sender, "not owner");
        devices[imeiHash].isStolen = false;
        devices[imeiHash].stolenReportTime = 0;
        emit DeviceCleared(imeiHash);
    }

    // ── Wallet ──
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getBalance() external view returns (uint256) {
        return balances[msg.sender];
    }

    // ── Marketplace ──
    function createListing(bytes32 imeiHash, uint256 price, string calldata description) external {
        require(isRegistered[imeiHash], "device not registered");
        require(devices[imeiHash].owner == msg.sender, "not owner");
        require(price > 0, "price must be > 0");
        listingCount++;
        listings[listingCount] = Listing(listingCount, imeiHash, msg.sender, price, ListingStatus.Active, block.timestamp, description);
        emit ListingCreated(listingCount, imeiHash, msg.sender, price);
    }

    function buyListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "not active");
        require(listing.seller != msg.sender, "cannot buy own");
        require(balances[msg.sender] >= listing.price, "insufficient balance");

        balances[msg.sender] -= listing.price;
        balances[listing.seller] += listing.price;

        address prevOwner = devices[listing.imeiHash].owner;
        devices[listing.imeiHash].owner = msg.sender;

        listing.status = ListingStatus.Sold;
        emit ListingSold(listingId, msg.sender, listing.seller, listing.price);
        emit OwnershipTransferred(listing.imeiHash, prevOwner, msg.sender);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "not seller");
        require(listing.status == ListingStatus.Active, "not active");
        listing.status = ListingStatus.Cancelled;
        emit ListingCancelled(listingId);
    }

    function getActiveListings() external view returns (Listing[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].status == ListingStatus.Active) count++;
        }
        Listing[] memory active = new Listing[](count);
        uint256 idx;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].status == ListingStatus.Active) {
                active[idx] = listings[i];
                idx++;
            }
        }
        return active;
    }

    // ── Repair Shop ──
    function requestRepair(bytes32 imeiHash, address shop, uint256 fee, string calldata description) external {
        require(isRegistered[imeiHash], "device not registered");
        require(devices[imeiHash].owner == msg.sender, "not owner");
        require(balances[msg.sender] >= fee, "insufficient balance");
        repairCount++;
        repairs[repairCount] = RepairRequest(repairCount, imeiHash, msg.sender, shop, fee, RepairStatus.Requested, block.timestamp, description);
        emit RepairRequested(repairCount, imeiHash, msg.sender, shop);
    }

    function completeRepair(uint256 repairId) external {
        RepairRequest storage r = repairs[repairId];
        require(r.shop == msg.sender, "not the shop");
        require(r.status == RepairStatus.Requested, "not requested");
        r.status = RepairStatus.Completed;

        balances[r.customer] -= r.fee;
        balances[r.shop] += r.fee;

        emit RepairCompleted(repairId);
    }

    function getRepairsForCustomer() external view returns (RepairRequest[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= repairCount; i++) {
            if (repairs[i].customer == msg.sender) count++;
        }
        RepairRequest[] memory result = new RepairRequest[](count);
        uint256 idx;
        for (uint256 i = 1; i <= repairCount; i++) {
            if (repairs[i].customer == msg.sender) {
                result[idx] = repairs[i];
                idx++;
            }
        }
        return result;
    }

    function getRepairsForShop() external view returns (RepairRequest[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= repairCount; i++) {
            if (repairs[i].shop == msg.sender) count++;
        }
        RepairRequest[] memory result = new RepairRequest[](count);
        uint256 idx;
        for (uint256 i = 1; i <= repairCount; i++) {
            if (repairs[i].shop == msg.sender) {
                result[idx] = repairs[i];
                idx++;
            }
        }
        return result;
    }
}
