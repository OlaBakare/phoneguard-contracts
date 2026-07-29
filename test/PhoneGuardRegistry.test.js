const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PhoneGuardRegistry", function () {
  let registry, owner, addr1, addr2;
  const imeiHash = ethers.keccak256(ethers.toUtf8Bytes("123456789012345"));
  const metadataURI = "ipfs://QmTest";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("PhoneGuardRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  describe("Device Registry", function () {
    it("should register a device", async function () {
      await expect(registry.registerDevice(imeiHash, metadataURI))
        .to.emit(registry, "DeviceRegistered");
      expect(await registry.isRegistered(imeiHash)).to.be.true;
    });

    it("should reject duplicate registration", async function () {
      await registry.registerDevice(imeiHash, metadataURI);
      await expect(registry.registerDevice(imeiHash, metadataURI))
        .to.be.revertedWith("already registered");
    });

    it("should check device status", async function () {
      await registry.registerDevice(imeiHash, metadataURI);
      const r = await registry.checkDevice(imeiHash);
      expect(r[0]).to.be.true;
      expect(r[1]).to.equal(owner.address);
    });
  });

  describe("Wallet", function () {
    it("should accept deposits", async function () {
      await registry.deposit({ value: ethers.parseEther("1") });
      expect(await registry.getBalance()).to.equal(ethers.parseEther("1"));
    });

    it("should allow withdrawals", async function () {
      await registry.deposit({ value: ethers.parseEther("1") });
      await registry.withdraw(ethers.parseEther("0.5"));
      expect(await registry.getBalance()).to.equal(ethers.parseEther("0.5"));
    });
  });

  describe("Marketplace", function () {
    beforeEach(async function () {
      await registry.registerDevice(imeiHash, metadataURI);
    });

    it("should create a listing", async function () {
      await expect(registry.createListing(imeiHash, ethers.parseEther("1"), "Good phone"))
        .to.emit(registry, "ListingCreated");
      const listing = await registry.listings(1);
      expect(listing.status).to.equal(0);
    });

    it("should allow buying with wallet balance", async function () {
      await registry.createListing(imeiHash, ethers.parseEther("1"), "Good phone");
      await registry.connect(addr1).deposit({ value: ethers.parseEther("2") });
      await expect(registry.connect(addr1).buyListing(1))
        .to.emit(registry, "ListingSold");
      const device = await registry.checkDevice(imeiHash);
      expect(device[1]).to.equal(addr1.address);
    });
  });

  describe("Repair Shop", function () {
    beforeEach(async function () {
      await registry.registerDevice(imeiHash, metadataURI);
      await registry.deposit({ value: ethers.parseEther("1") });
    });

    it("should request a repair", async function () {
      await expect(registry.requestRepair(imeiHash, addr1.address, ethers.parseEther("0.1"), "Fix screen"))
        .to.emit(registry, "RepairRequested");
      const r = await registry.repairs(1);
      expect(r.status).to.equal(0);
    });
  });
});
