// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CourseStorage {
    struct Course {
        string title;
        string description;
        string markdownContent;
        address author;
        uint256 price;
    }

    mapping(uint256 => Course) public courses;
    uint256 public courseCount;

    mapping(address => mapping(uint256 => bool)) public ownedCourses;

    event CourseAdded(uint256 indexed courseId, string title, address author, uint256 price);
    event CoursePurchased(uint256 indexed courseId, address buyer);
    event CourseGifted(uint256 indexed courseId, address from, address to);

    function addCourse(
        string memory _title,
        string memory _description,
        string memory _markdownContent,
        uint256 _price
    ) public {
        courses[courseCount] = Course(_title, _description, _markdownContent, msg.sender, _price);
        ownedCourses[msg.sender][courseCount] = true;
        emit CourseAdded(courseCount, _title, msg.sender, _price);
        courseCount++;
    }

    function getCourse(uint256 _id) public view returns (Course memory) {
        return courses[_id];
    }

    function ownsCourse(address _owner, uint256 _courseId) public view returns (bool) {
        return ownedCourses[_owner][_courseId];
    }

    function getOwnedCourses(address _owner) public view returns (uint256[] memory) {
        uint256[] memory ownedCourseIds = new uint256[](courseCount);
        uint256 ownedCount = 0;

        for (uint256 i = 0; i < courseCount; i++) {
            if (ownedCourses[_owner][i]) {
                ownedCourseIds[ownedCount] = i;
                ownedCount++;
            }
        }

        assembly {
            mstore(ownedCourseIds, ownedCount)
        }

        return ownedCourseIds;
    }

    function purchaseCourse(uint256 _courseId) public payable {
        require(_courseId < courseCount, "Course does not exist");
        require(!ownedCourses[msg.sender][_courseId], "You already own this course");
        require(msg.value >= courses[_courseId].price, "Insufficient payment");

        ownedCourses[msg.sender][_courseId] = true;
        payable(courses[_courseId].author).transfer(msg.value);

        emit CoursePurchased(_courseId, msg.sender);
    }

    function giftCourse(uint256 _courseId, address _recipient) public payable {
        require(_courseId < courseCount, "Course does not exist");
        require(!ownedCourses[_recipient][_courseId], "Recipient already owns this course");
        require(msg.value >= courses[_courseId].price, "Insufficient payment");

        ownedCourses[_recipient][_courseId] = true;
        payable(courses[_courseId].author).transfer(msg.value);

        emit CourseGifted(_courseId, msg.sender, _recipient);
    }
}