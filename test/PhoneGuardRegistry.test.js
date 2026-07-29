const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PhoneGuardRegistry", function () {
  let registry, owner, addr1, addr2;
  const imeiHash = ethers.keccak256(ethers.toUtf8Bytes("123456789012345"));
  const imeiHash2 = ethers.keccak256(ethers.toUtf8Bytes("987654321098765"));
  const metadataURI = "ipfs://QmTest";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("PhoneGuardRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  describe("Registration", function () {
    it("should register a device", async function () {
      await expect(registry.registerDevice(imeiHash, metadataURI))
        .to.emit(registry, "DeviceRegistered")
        .withArgs(imeiHash, owner.address, anyValue);
      expect(await registry.isRegistered(imeiHash)).to.be.true;
    });

    it("should reject duplicate registration", async function () {
      await registry.registerDevice(imeiHash, metadataURI);
      await expect(registry.registerDevice(imeiHash, metadataURI))
        .to.be.revertedWith("already registered");
    });
  });

  describe("Device checking", function () {
    it("should return empty for unregistered device", async function () {
      const result = await registry.checkDevice(imeiHash);
      expect(result[0]).to.be.false;
    });

    it("should return correct data for registered device", async function () {
      await registry.connect(owner).registerDevice(imeiHash, metadataURI);
      const result = await registry.checkDevice(imeiHash);
      expect(result[0]).to.be.true;
      expect(result[1]).to.equal(owner.address);
      expect(result[2]).to.be.false;
      expect(result[5]).to.equal(metadataURI);
    });
  });

  describe("Stolen reporting", function () {
    it("should mark device as stolen", async function () {
      await registry.registerDevice(imeiHash, metadataURI);
      await expect(registry.reportStolen(imeiHash))
        .to.emit(registry, "DeviceMarkedStolen")
        .withArgs(imeiHash, owner.address, anyValue);
      const result = await registry.checkDevice(imeiHash);
      expect(result[2]).to.be.true;
    });

    it("should reject report from non-owner", async function () {
      await registry.registerDevice(imeiHash, metadataURI);
      await expect(registry.connect(addr1).reportStolen(imeiHash))
        .to.be.revertedWith("not owner");
    });

    it("should clear stolen status", async function () {
      await registry.registerDevice(imeiHash, metadataURI);
      await registry.reportStolen(imeiHash);
      await expect(registry.clearStolenStatus(imeiHash))
        .to.emit(registry, "DeviceCleared");
      const result = await registry.checkDevice(imeiHash);
      expect(result[2]).to.be.false;
    });
  });

  describe("Ownership transfer", function () {
    it("should transfer ownership", async function () {
      await registry.registerDevice(imeiHash, metadataURI);
      await expect(registry.transferOwnership(imeiHash, addr1.address))
        .to.emit(registry, "OwnershipTransferred")
        .withArgs(imeiHash, owner.address, addr1.address);
      const result = await registry.checkDevice(imeiHash);
      expect(result[1]).to.equal(addr1.address);
    });

    it("should reject transfer from non-owner", async function () {
      await registry.registerDevice(imeiHash, metadataURI);
      await expect(registry.connect(addr1).transferOwnership(imeiHash, addr2.address))
        .to.be.revertedWith("not owner");
    });
  });
});

const anyValue = undefined;
