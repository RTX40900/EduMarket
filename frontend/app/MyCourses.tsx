import React, { useState, useEffect } from "react";
import { useWallet } from "./WalletContext";
import contractJson from "@/contracts/CourseStorage.sol/CourseStorage.json";
import { Contracts } from "@/types";
import { CourseStorageContractAddress } from "@/app/constants";

interface Course {
  id: number;
  title: string;
  description: string;
  price: string;
}

const MyCourses: React.FC = () => {
  const { web3, accountAddress, isConnected } = useWallet();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (web3 && isConnected) {
      const CourseStorage = new web3.eth.Contract(
        contractJson.abi,
        CourseStorageContractAddress
      ) as Contracts;
      CourseStorage.methods
        .getOwnedCourses(accountAddress)
        .call()
        .then((courseIds: number[]) => {
          const fetchedCourses: Course[] = [];
          courseIds.forEach((courseId) => {
            CourseStorage.methods
              .getCourse(courseId)
              .call()
              .then((course: any) => {
                fetchedCourses.push({
                  id: courseId,
                  title: course.title,
                  description: course.description,
                  price: web3.utils.fromWei(course.price, "ether"),
                });
                if (fetchedCourses.length === courseIds.length) {
                  setCourses(fetchedCourses);
                }
              });
          });
        });
    }
  }, [web3, accountAddress, isConnected]);

  return (
    <div>
      <h2>My Courses</h2>
      {courses.map((course) => (
        <div key={course.id}>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <p>Price: {course.price} ETH</p>
        </div>
      ))}
    </div>
  );
};

export default MyCourses;