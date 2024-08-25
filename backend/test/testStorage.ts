import { expect } from "chai";
import { ethers } from "hardhat";

describe("CourseStorage contract", function () {
  let CourseStorage;
  let courseStorage;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    CourseStorage = await ethers.getContractFactory("CourseStorage");
    [owner, addr1, addr2] = await ethers.getSigners();
    courseStorage = await CourseStorage.deploy();
  });

  it("should add a course", async function () {
    await courseStorage.addCourse("Test Course", "Test Description", "# Test Content", ethers.parseEther("1"));
    
    const course = await courseStorage.getCourse(0);
    expect(course.title).to.equal("Test Course");
    expect(course.description).to.equal("Test Description");
    expect(course.markdownContent).to.equal("# Test Content");
    expect(course.author).to.equal(owner.address);
    expect(course.price).to.equal(ethers.parseEther("1"));
  });

  it("should allow purchasing a course", async function () {
    await courseStorage.addCourse("Test Course", "Test Description", "# Test Content", ethers.parseEther("1"));
    
    await courseStorage.connect(addr1).purchaseCourse(0, { value: ethers.parseEther("1") });
    
    expect(await courseStorage.ownsCourse(addr1.address, 0)).to.be.true;
  });

  it("should not allow purchasing an already owned course", async function () {
    await courseStorage.addCourse("Test Course", "Test Description", "# Test Content", ethers.parseEther("1"));
    
    await courseStorage.connect(addr1).purchaseCourse(0, { value: ethers.parseEther("1") });
    
    await expect(
      courseStorage.connect(addr1).purchaseCourse(0, { value: ethers.parseEther("1") })
    ).to.be.revertedWith("You already own this course");
  });

  it("should allow gifting a course", async function () {
    await courseStorage.addCourse("Test Course", "Test Description", "# Test Content", ethers.parseEther("1"));
    
    await courseStorage.connect(addr1).giftCourse(0, addr2.address, { value: ethers.parseEther("1") });
    
    expect(await courseStorage.ownsCourse(addr2.address, 0)).to.be.true;
  });

  it("should not allow gifting an already owned course", async function () {
    await courseStorage.addCourse("Test Course", "Test Description", "# Test Content", ethers.parseEther("1"));
    
    await courseStorage.connect(addr1).giftCourse(0, addr2.address, { value: ethers.parseEther("1") });
    
    await expect(
      courseStorage.connect(addr1).giftCourse(0, addr2.address, { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Recipient already owns this course");
  });

  it("should return owned courses", async function () {
    await courseStorage.addCourse("Course 1", "Description 1", "# Content 1", ethers.parseEther("1"));
    await courseStorage.addCourse("Course 2", "Description 2", "# Content 2", ethers.parseEther("2"));
    
    await courseStorage.connect(addr1).purchaseCourse(0, { value: ethers.parseEther("1") });
    await courseStorage.connect(addr1).purchaseCourse(1, { value: ethers.parseEther("2") });
    
    const ownedCourses = await courseStorage.getOwnedCourses(addr1.address);
    expect(ownedCourses.length).to.equal(2);
    expect(ownedCourses[0]).to.equal(0);
    expect(ownedCourses[1]).to.equal(1);
  });
});