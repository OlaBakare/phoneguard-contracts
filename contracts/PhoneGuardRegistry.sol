// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract PhoneGuardRegistry {
    struct Device {
        bytes32 imeiHash;
        address owner;
        bool isStolen;
        uint256 registrationTime;
        uint256 stolenReportTime;
        string metadataURI;
    }

    event DeviceRegistered(bytes32 indexed imeiHash, address indexed owner, uint256 timestamp);
    event DeviceMarkedStolen(bytes32 indexed imeiHash, address indexed reporter, uint256 timestamp);
    event DeviceCleared(bytes32 indexed imeiHash);
    event OwnershipTransferred(bytes32 indexed imeiHash, address indexed from, address indexed to);

    mapping(bytes32 => Device) public devices;
    mapping(bytes32 => bool) public isRegistered;

    function registerDevice(bytes32 imeiHash, string calldata metadataURI) external {
        require(!isRegistered[imeiHash], "already registered");
        devices[imeiHash] = Device({
            imeiHash: imeiHash,
            owner: msg.sender,
            isStolen: false,
            registrationTime: block.timestamp,
            stolenReportTime: 0,
            metadataURI: metadataURI
        });
        isRegistered[imeiHash] = true;
        emit DeviceRegistered(imeiHash, msg.sender, block.timestamp);
    }

    function reportStolen(bytes32 imeiHash) external {
        require(isRegistered[imeiHash], "not registered");
        Device storage device = devices[imeiHash];
        require(device.owner == msg.sender, "not owner");
        device.isStolen = true;
        device.stolenReportTime = block.timestamp;
        emit DeviceMarkedStolen(imeiHash, msg.sender, block.timestamp);
    }

    function checkDevice(bytes32 imeiHash) external view returns (bool exists, address owner, bool isStolen, uint256 registrationTime, uint256 stolenReportTime, string memory metadataURI) {
        if (!isRegistered[imeiHash]) {
            return (false, address(0), false, 0, 0, "");
        }
        Device storage device = devices[imeiHash];
        return (true, device.owner, device.isStolen, device.registrationTime, device.stolenReportTime, device.metadataURI);
    }

    function transferOwnership(bytes32 imeiHash, address newOwner) external {
        require(isRegistered[imeiHash], "not registered");
        Device storage device = devices[imeiHash];
        require(device.owner == msg.sender, "not owner");
        require(newOwner != address(0), "invalid address");
        address prevOwner = device.owner;
        device.owner = newOwner;
        emit OwnershipTransferred(imeiHash, prevOwner, newOwner);
    }

    function clearStolenStatus(bytes32 imeiHash) external {
        require(isRegistered[imeiHash], "not registered");
        Device storage device = devices[imeiHash];
        require(device.owner == msg.sender, "not owner");
        device.isStolen = false;
        device.stolenReportTime = 0;
        emit DeviceCleared(imeiHash);
    }
}
